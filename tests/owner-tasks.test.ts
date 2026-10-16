import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { validateTask, freshness } from "../admin/src/taskModel";
const db = new PGlite();
const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  other = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  viewer = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const org = "11111111-1111-4111-8111-111111111111",
  org2 = "33333333-3333-4333-8333-333333333333";
let id = "";
async function as(user: string) {
  await db.exec(
    `reset role; set role authenticated; select set_config('request.jwt.claims','{"sub":"${user}","aal":"aal1"}',false);`,
  );
}
before(async () => {
  await db.exec(
    `create role anon nologin; create role authenticated nologin; create schema auth; create table auth.users(id uuid primary key); create table auth.mfa_factors(id uuid primary key default gen_random_uuid(),user_id uuid,status text); create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$; create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$; grant usage on schema public,auth to authenticated,anon; grant execute on function auth.uid(),auth.jwt() to authenticated,anon;`,
  );
  for (const f of ["202609230001_weg_os.sql", "202610160001_owner_tasks.sql", "202610160002_reviewed_inventory.sql"])
    await db.exec(readFileSync(`supabase/migrations/${f}`, "utf8"));
  await db.exec(
    `insert into auth.users values('${owner}'),('${other}'),('${viewer}');`,
  );
  await db.exec(
    readFileSync("supabase/bootstrap.sql", "utf8").replace(
      "00000000-0000-0000-0000-000000000000",
      owner,
    ),
  );
  await db.exec(
    `insert into public.organizations(id,name) values('${org2}','Synthetic other'); insert into public.organization_members(organization_id,user_id,role) values('${org}','${other}','owner'),('${org}','${viewer}','viewer'),('${org2}','${other}','owner');`,
  );
  await as(owner);
  const r = await db.query<{ id: string }>(
    `insert into public.tasks(organization_id,title,source_system,source_id) values('${org}','Synthetic task','fixture','one') returning id`,
  );
  id = r.rows[0].id;
});
after(() => db.close());
test("owner-private tasks: another owner in same org cannot read or modify", async () => {
  await as(other);
  assert.equal((await db.query("select * from public.tasks")).rows.length, 0);
  assert.equal(
    (
      await db.query(
        `update public.tasks set title='attempt' where id='${id}' returning id`,
      )
    ).rows.length,
    0,
  );
  assert.equal(
    (await db.query("select * from public.task_events")).rows.length,
    0,
  );
  await assert.rejects(
    db.exec(
      `insert into public.tasks(organization_id,owner_id,title) values('${org}','${owner}','attempt')`,
    ),
    /row-level security/,
  );
  await as(owner);
  await assert.rejects(
    db.exec(
      `insert into public.tasks(organization_id,title) values('${org2}','attempt')`,
    ),
    /row-level security/,
  );
});
test("viewer and anonymous cannot read task data; history cannot be forged", async () => {
  await as(viewer);
  assert.equal((await db.query("select * from public.tasks")).rows.length, 0);
  await db.exec("reset role; set role anon");
  await assert.rejects(
    db.query("select * from public.tasks"),
    /permission denied/,
  );
  await as(owner);
  await assert.rejects(
    db.exec(
      `insert into public.task_events(organization_id,task_id,owner_id,action,to_status) values('${org}','${id}','${owner}','forged','Done')`,
    ),
    /permission denied/,
  );
});
test("status prerequisites, decisions and completion evidence are enforced by database", async () => {
  await as(owner);
  for (const status of [
    "Done",
    "Blocked",
    "Waiting on response",
    "Needs approval",
  ])
    await assert.rejects(
      db.exec(`update public.tasks set status='${status}' where id='${id}'`),
      /check constraint/,
    );
  await assert.rejects(
    db.exec(
      `update public.tasks set approval_status='Approved' where id='${id}'`,
    ),
    /check constraint/,
  );
  await db.exec(
    `update public.tasks set status='Needs approval',approval_status='Pending',approval_scope='Synthetic review' where id='${id}'`,
  );
  await db.exec(
    `update public.tasks set status='In progress',approval_status='Approved',approval_evidence='https://example.com/decision' where id='${id}'`,
  );
  assert.equal(
    (
      await db.query<{ status: string }>(
        `select status from public.tasks where id='${id}'`,
      )
    ).rows[0].status,
    "In progress",
  );
  await db.exec(
    `update public.tasks set status='Done',completion_summary='Verified fixture outcome',completion_url='https://example.com/result' where id='${id}'`,
  );
  const r = await db.query<{
    completed_at: string;
    completion_verified_at: string;
  }>(
    `select completed_at,completion_verified_at from public.tasks where id='${id}'`,
  );
  assert.ok(r.rows[0].completed_at);
  assert.ok(r.rows[0].completion_verified_at);
  await assert.rejects(
    db.exec(`update public.tasks set completion_summary='' where id='${id}'`),
    /check constraint/,
  );
  await db.exec(`update public.tasks set status='Open' where id='${id}'`);
  assert.equal(
    (
      await db.query<{ completion_verified_at: null }>(
        `select completion_verified_at from public.tasks where id='${id}'`,
      )
    ).rows[0].completion_verified_at,
    null,
  );
  await assert.rejects(
    db.exec(`delete from public.tasks where id='${id}'`),
    /permission denied/,
  );
});
test("stable source identity, version conflicts, owner immutability and append-only history", async () => {
  await as(owner);
  await assert.rejects(
    db.exec(
      `insert into public.tasks(organization_id,title,source_system,source_id) values('${org}','duplicate','fixture','one')`,
    ),
    /unique constraint/,
  );
  const r = await db.query<{ version: number }>(
    `select version from public.tasks where id='${id}'`,
  );
  const v = r.rows[0].version;
  await db.exec(
    `update public.tasks set next_action='Synthetic update' where id='${id}' and version=${v}`,
  );
  assert.equal(
    (
      await db.query(
        `update public.tasks set next_action='stale' where id='${id}' and version=${v} returning id`,
      )
    ).rows.length,
    0,
  );
  await assert.rejects(
    db.exec(`update public.tasks set owner_id='${other}' where id='${id}'`),
    /owner cannot be changed/,
  );
  await assert.rejects(
    db.exec(
      `update public.tasks set last_verified_at=now()+interval '1 day' where id='${id}'`,
    ),
    /future/,
  );
  const events = await db.query<{ action: string }>(
    `select * from public.task_events where task_id='${id}'`,
  );
  assert.ok(events.rows.length >= 5);
  await assert.rejects(
    db.exec("delete from public.task_events"),
    /permission denied/,
  );
});
test("form checks and freshness never imply automated verification", () => {
  assert.match(validateTask({ status: "Done" })!, /evidence/);
  assert.equal(
    validateTask({
      status: "Done",
      completion_summary: "Checked",
      completion_url: "https://example.com",
    }),
    null,
  );
  assert.equal(freshness(null), "Not checked");
  assert.equal(
    freshness("2020-01-01", Date.parse("2026-01-01")),
    "Needs refresh",
  );
});

test("owner extension denies same-org nonowners across every operational table", async () => {
  await as(viewer);
  for (const table of [
    "organizations",
    "organization_members",
    "businesses",
    "opportunities",
    "mentors",
    "tasks",
    "task_events",
    "company_profiles",
    "application_answers",
  ]) {
    assert.equal(
      (await db.query(`select * from public.${table}`)).rows.length,
      0,
      table,
    );
  }
  for (const table of ["businesses", "opportunities", "mentors", "tasks"]) {
    assert.equal(
      (
        await db.query(
          `update public.${table} set organization_id='${org}' returning id`,
        )
      ).rows.length,
      0,
    );
  }
});
test("owner task links cannot cross organizations, even when owner belongs to both", async () => {
  const biz = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
  const opp = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
  await db.exec(
    `reset role; insert into public.organization_members(organization_id,user_id,role) values('${org2}','${owner}','owner'); insert into public.businesses(id,organization_id,name) values('${biz}','${org2}','Other fixture'); insert into public.opportunities(id,organization_id,name,category) values('${opp}','${org2}','Other fixture','Grant');`,
  );
  await as(owner);
  await assert.rejects(
    db.exec(`update public.tasks set business_id='${biz}' where id='${id}'`),
    /foreign key/,
  );
  await assert.rejects(
    db.exec(`update public.tasks set opportunity_id='${opp}' where id='${id}'`),
    /foreign key/,
  );
  await assert.rejects(
    db.exec(
      `insert into public.tasks(organization_id,title,business_id) values('${org}','cross link','${biz}')`,
    ),
    /foreign key/,
  );
});

test("source identity trims whitespace and rejects incomplete or colliding import identities", async () => {
  await as(owner);
  await assert.rejects(
    db.exec(
      `insert into public.tasks(organization_id,title,source_system,source_id) values('${org}','duplicate padded',' fixture ',' one ')`,
    ),
    /unique constraint/,
  );
  await assert.rejects(
    db.exec(
      `insert into public.tasks(organization_id,title,source_system,source_id) values('${org}','incomplete','fixture','  ')`,
    ),
    /source_pair/,
  );
  await db.exec(
    `insert into public.tasks(organization_id,title,source_system,source_id) values('${org}','manual blank','  ','  ')`,
  );
  const rows = await db.query<{ source_system: null; source_id: null }>(
    `select source_system,source_id from public.tasks where title='manual blank'`,
  );
  assert.equal(rows.rows[0].source_system, null);
  assert.equal(rows.rows[0].source_id, null);
});

test("reviewed import is atomic, owner-private and repeat-safe without fabricated timestamps", async () => {
 await as(owner);
 const record={id:"synthetic-import",title:"Synthetic reported completion",status:"completed",function_bucket:"education",priority:"normal",completion_basis:"user_reported",evidence:["Sentinel_fixture"],last_verified_at:"2026-10-01",on_hold:false};
 const evidence=[{message_id:"Sentinel_fixture",recorded_at:"2026-10-01T12:00:00Z",author:"user"}];
 const args=[org,"a".repeat(64),JSON.stringify([record]),JSON.stringify(evidence)];
 const call=()=>db.query<{result:{inserted:number;unchanged:number}}>("select public.import_reviewed_inventory($1,$2,$3::jsonb,$4::jsonb) result",args);
 assert.deepEqual((await call()).rows[0].result,{inserted:1,unchanged:0});
 const row=(await db.query<{id:string;completed_at:null;completion_verified_at:null;last_verified_at:null}>("select * from public.tasks where source_id='synthetic-import'")).rows[0];
 assert.equal(row.completed_at,null);assert.equal(row.completion_verified_at,null);assert.equal(row.last_verified_at,null);
 await db.query("update public.tasks set title='Manual edit' where id=$1",[row.id]);
 assert.deepEqual((await call()).rows[0].result,{inserted:0,unchanged:1});
 assert.equal((await db.query<{title:string}>("select title from public.tasks where id=$1",[row.id])).rows[0].title,"Manual edit");
 await assert.rejects(db.query("select public.import_reviewed_inventory($1,$2,$3::jsonb,$4::jsonb)",[org,"a".repeat(64),JSON.stringify([{...record,id:"atomic-new"},{...record,title:"conflict"}]),JSON.stringify(evidence)]),/Source conflict/);
 assert.equal((await db.query("select id from public.tasks where source_id='atomic-new'")).rows.length,0);
 await as(viewer);await assert.rejects(call(),/Owner access required/);
 await as(other);assert.equal((await db.query("select id from public.tasks where source_id='synthetic-import'")).rows.length,0);
 await db.exec("reset role; set role anon");await assert.rejects(call(),/permission denied/);
});
