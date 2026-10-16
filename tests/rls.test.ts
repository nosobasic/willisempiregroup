import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  outsider = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  viewer = "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  operator = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const org = "11111111-1111-4111-8111-111111111111",
  other = "33333333-3333-4333-8333-333333333333",
  opp = "44444444-4444-4444-8444-444444444444",
  business = "22222222-2222-4222-8222-222222222222";
async function as(user: string, aal = "aal1") {
  await db.exec(
    `reset role; set role authenticated; select set_config('request.jwt.claims','${JSON.stringify({ sub: user, aal })}',false);`,
  );
}
async function root() {
  await db.exec("reset role");
}
async function count(table: string) {
  const r = await db.query<{ count: number }>(
    `select count(*)::int as count from public.${table}`,
  );
  return r.rows[0].count;
}
before(async () => {
  await db.exec(
    `create role anon nologin; create role authenticated nologin; create schema auth; create table auth.users(id uuid primary key); create table auth.mfa_factors(id uuid primary key default gen_random_uuid(),user_id uuid,status text); create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$; create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$; grant usage on schema public,auth to authenticated,anon; grant execute on function auth.uid(),auth.jwt() to authenticated,anon;`,
  );
  await db.exec(
    readFileSync("supabase/migrations/202609230001_weg_os.sql", "utf8"),
  );
  await db.exec(
    `insert into auth.users(id) values ('${owner}'),('${outsider}'),('${viewer}'),('${operator}');`,
  );
  await db.exec(
    readFileSync("supabase/bootstrap.sql", "utf8").replace(
      "00000000-0000-0000-0000-000000000000",
      owner,
    ),
  );
  // Bootstrap can be re-run without duplicating the empty owner workspace.
  await db.exec(
    readFileSync("supabase/bootstrap.sql", "utf8").replace(
      "00000000-0000-0000-0000-000000000000",
      owner,
    ),
  );
  await db.exec(
    `insert into public.organizations(id,name) values('${other}','Other organization'); insert into public.organization_members(organization_id,user_id,role) values('${other}','${outsider}','owner'),('${org}','${viewer}','viewer'),('${org}','${operator}','operator');`,
  );
  await as(owner);
  await db.exec(
    `insert into public.businesses(id,organization_id,name) values('${business}','${org}','Synthetic portfolio fixture')`,
  );
  await db.exec(
    `insert into public.opportunities(id,organization_id,business_id,name,category) values('${opp}','${org}','${business}','TEST FIXTURE — funding program','Grant'); insert into public.tasks(organization_id,title,opportunity_id) values('${org}','TEST FIXTURE — prepare','${opp}'); insert into public.mentors(organization_id,name) values('${org}','TEST FIXTURE — mentor'); insert into public.application_answers(organization_id,opportunity_id,question) values('${org}','${opp}','TEST FIXTURE — question');`,
  );
});
after(async () => {
  await db.close();
});
test("all sensitive tables have RLS enabled", async () => {
  await root();
  const r = await db.query<{ relrowsecurity: boolean }>(
    "select relrowsecurity from pg_class where relnamespace='public'::regnamespace and relkind='r'",
  );
  assert.equal(r.rows.length, 9);
  assert.ok(r.rows.every((r) => r.relrowsecurity));
});
test("owner can access owned workspace and only its initial portfolio", async () => {
  await as(owner);
  assert.equal(await count("businesses"), 1);
  assert.equal(await count("organizations"), 1);
  assert.equal(await count("opportunities"), 1);
});
test("outsider cannot read or mutate any operational data", async () => {
  await as(outsider);
  for (const t of [
    "businesses",
    "opportunities",
    "tasks",
    "mentors",
    "application_answers",
    "company_profiles",
    "profiles",
  ])
    assert.equal(await count(t), 0, t);
  const r = await db.query(
    `update public.opportunities set name='intrusion' where id='${opp}' returning id`,
  );
  assert.equal(r.rows.length, 0);
  await assert.rejects(
    db.exec(
      `insert into public.tasks(organization_id,title) values('${org}','intrusion')`,
    ),
    /row-level security/,
  );
});
test("anonymous and expired/invalid identity cannot access private records", async () => {
  await root();
  await db.exec("set role anon");
  await assert.rejects(
    db.query("select * from public.opportunities"),
    /permission denied/,
  );
  await as("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee");
  assert.equal(await count("opportunities"), 0);
  await db.exec(`select set_config('request.jwt.claims','{}',false)`);
  assert.equal(await count("opportunities"), 0);
});
test("viewer can read but cannot insert, update, or delete", async () => {
  await as(viewer);
  assert.equal(await count("opportunities"), 1);
  await assert.rejects(
    db.exec(
      `insert into public.opportunities(organization_id,name,category) values('${org}','intrusion','Grant')`,
    ),
    /row-level security/,
  );
  assert.equal(
    (
      await db.query(
        `update public.opportunities set name='changed' returning id`,
      )
    ).rows.length,
    0,
  );
  assert.equal(
    (await db.query("delete from public.opportunities returning id")).rows
      .length,
    0,
  );
});
test("operator can write but cannot delete or promote themselves", async () => {
  await as(operator);
  assert.equal(
    (
      await db.query(
        `update public.opportunities set priority='High' where id='${opp}' returning id`,
      )
    ).rows.length,
    1,
  );
  assert.equal(
    (
      await db.query(
        `delete from public.opportunities where id='${opp}' returning id`,
      )
    ).rows.length,
    0,
  );
  await assert.rejects(
    db.exec(
      `update public.organization_members set role='owner' where user_id='${operator}'`,
    ),
    /permission denied/,
  );
});
test("relationships cannot cross organization boundaries even with memberships in both", async () => {
  await root();
  await db.exec(
    `insert into public.organization_members(organization_id,user_id,role) values('${other}','${owner}','owner')`,
  );
  await as(owner);
  await assert.rejects(
    db.exec(
      `insert into public.tasks(organization_id,title,opportunity_id) values('${other}','bad link','${opp}')`,
    ),
    /foreign key/,
  );
  await assert.rejects(
    db.exec(
      `insert into public.opportunities(organization_id,name,category,business_id) values('${other}','bad business','Grant','${business}')`,
    ),
    /foreign key/,
  );
  await assert.rejects(
    db.exec(
      `update public.opportunities set organization_id='${other}',business_id=null where id='${opp}'`,
    ),
    /Organization cannot be changed/,
  );
  await root();
  await db.exec(
    `delete from public.organization_members where organization_id='${other}' and user_id='${owner}'`,
  );
});
test("audit fields cannot be forged and task completion is managed in database", async () => {
  await as(owner);
  const first = await db.query<{
    created_by: string;
    created_at: string;
    updated_at: string;
  }>(
    `select created_by,created_at,updated_at from public.opportunities where id='${opp}'`,
  );
  await db.exec(
    `update public.opportunities set created_by='${outsider}',created_at='2000-01-01',updated_at='2000-01-01' where id='${opp}'`,
  );
  const next = await db.query<{
    created_by: string;
    created_at: string;
    updated_at: string;
  }>(
    `select created_by,created_at,updated_at from public.opportunities where id='${opp}'`,
  );
  assert.equal(next.rows[0].created_by, owner);
  assert.deepEqual(next.rows[0].created_at, first.rows[0].created_at);
  assert.notEqual(next.rows[0].updated_at, "2000-01-01");
  const done = await db.query<{ completed_at: string }>(
    `update public.tasks set status='Done' returning completed_at`,
  );
  assert.ok(done.rows[0].completed_at);
  const open = await db.query<{ completed_at: string | null }>(
    `update public.tasks set status='Open' returning completed_at`,
  );
  assert.equal(open.rows[0].completed_at, null);
});
test("scores require explanations and funding bounds are enforced", async () => {
  await as(owner);
  await assert.rejects(
    db.exec(`update public.opportunities set fit_score=80,fit_reason=null`),
    /check constraint/,
  );
  await assert.rejects(
    db.exec(`update public.opportunities set fit_score=101,fit_reason='test'`),
    /check constraint/,
  );
  await assert.rejects(
    db.exec(`update public.opportunities set funding_min=100,funding_max=50`),
    /check constraint/,
  );
  await assert.rejects(
    db.exec(`update public.opportunities set website='javascript:alert(1)'`),
    /check constraint/,
  );
});
test("MFA enrollment blocks aal1 API reads and writes; aal2 restores authorized access", async () => {
  await root();
  await db.exec(
    `insert into auth.mfa_factors(user_id,status) values('${owner}','verified')`,
  );
  await as(owner, "aal1");
  assert.equal(await count("opportunities"), 0);
  assert.equal(await count("organization_members"), 0);
  await assert.rejects(
    db.exec(
      `insert into public.tasks(organization_id,title) values('${org}','blocked without MFA')`,
    ),
    /row-level security/,
  );
  await as(owner, "aal2");
  assert.equal(await count("opportunities"), 1);
  await root();
  await db.exec("delete from auth.mfa_factors");
});
test("profile cannot be read or modified by another user", async () => {
  await as(viewer);
  assert.equal(await count("profiles"), 0);
  await assert.rejects(
    db.exec(
      `insert into public.profiles(id,full_name) values('${outsider}','forged')`,
    ),
    /row-level security/,
  );
  await as(owner);
  assert.equal(await count("profiles"), 1);
});
