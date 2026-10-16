-- New additive migration only. Never replay the two installed migrations.
alter table public.tasks add column source_record jsonb,
 add column source_evidence jsonb not null default '[]'::jsonb;
alter table public.tasks drop constraint completion_evidence;
alter table public.tasks add constraint completion_evidence check(status <> 'Done' or (
 length(trim(coalesce(completion_summary,'')))>0 and
 (length(trim(coalesce(completion_url,'')))>0 or
 (source_record->>'completion_basis' is not null and jsonb_array_length(source_evidence)>0))));

create function public.import_reviewed_inventory(target_org uuid, revision text, items jsonb, evidence jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare item jsonb; existing public.tasks%rowtype; added integer:=0; skipped integer:=0; refs jsonb; state text; bucket text;
begin
 if auth.uid() is null or not private.has_role(target_org,array['owner']) then raise exception 'Owner access required'; end if;
 if revision !~ '^[a-f0-9]{64}$' or jsonb_typeof(items)<>'array' or jsonb_array_length(items) not between 1 and 100 or jsonb_typeof(evidence)<>'array' then raise exception 'Invalid inventory'; end if;
 for item in select value from jsonb_array_elements(items) loop
  if item->>'id' !~ '^[a-z0-9-]{1,100}$' or length(trim(coalesce(item->>'title','')))=0 or jsonb_typeof(item->'evidence')<>'array' then raise exception 'Invalid task'; end if;
  select coalesce(jsonb_agg(e.value),'[]'::jsonb) into refs from jsonb_array_elements(evidence) e where e.value->>'message_id' in(select jsonb_array_elements_text(item->'evidence'));
  if jsonb_array_length(refs) <> jsonb_array_length(item->'evidence') then raise exception 'Missing evidence references'; end if;
  select * into existing from public.tasks where organization_id=target_org and owner_id=auth.uid() and source_system='conversation-review' and source_id=item->>'id';
  if found then
   if existing.source_revision=revision and existing.source_record=item and existing.source_evidence=refs then skipped:=skipped+1; continue; end if;
   raise exception 'Source conflict for %. Review before updating.',item->>'id';
  end if;
  state:=case item->>'status' when 'open' then 'Open' when 'completed' then 'Done' when 'blocked' then 'Blocked' when 'awaiting_approval' then 'Needs approval' when 'waiting_external' then 'Waiting on response' end;
  bucket:=case item->>'function_bucket' when 'product_engineering' then 'Product / engineering' when 'growth' then 'Growth' when 'career' then 'Career' when 'education' then 'Education' when 'business_admin' then 'Business admin' when 'personal_admin' then 'Personal admin' end;
  if state is null or bucket is null then raise exception 'Unsupported status or function'; end if;
  insert into public.tasks(organization_id,title,description,status,priority,project,function_bucket,next_action,waiting_on,blocked_reason,dependencies,uncertainty,source_system,source_id,source_revision,source_url,source_record,source_evidence,approval_status,approval_scope,completion_summary)
  values(target_org,item->>'title','Imported reviewed conversation record. See source details for evidence and date precision.',state,
   case item->>'priority' when 'high' then 'High' when 'low' then 'Low' else 'Medium' end,item->>'project',bucket,item->>'next_action',item->>'waiting_on',
   case when state='Blocked' then coalesce(item->>'uncertainty',item->>'next_action') end,
   (select string_agg(value,', ') from jsonb_array_elements_text(coalesce(item->'depends_on','[]'::jsonb))),item->>'uncertainty',
   'conversation-review',item->>'id',revision,coalesce(item->>'source_url',item->'source_urls'->>0),item,refs,
   case when state='Needs approval' or item->>'approval_pending'='true' then 'Pending' else 'Not needed' end,
   case when state='Needs approval' or item->>'approval_pending'='true' then coalesce(item->>'approval_scope',item->>'next_action') end,
   case when state='Done' then 'Completion reported in conversation: ' || coalesce(item->>'completion_basis','unknown') || '. Original evidence and uncertainty retained; not a fresh service verification.' end);
  added:=added+1;
 end loop;
 return jsonb_build_object('inserted',added,'unchanged',skipped);
end $$;
revoke all on function public.import_reviewed_inventory(uuid,text,jsonb,jsonb) from public,anon;
grant execute on function public.import_reviewed_inventory(uuid,text,jsonb,jsonb) to authenticated;

create or replace function private.guard_task() returns trigger language plpgsql set search_path='' as $$
begin
 new.source_system=nullif(btrim(new.source_system),'');
 new.source_id=nullif(btrim(new.source_id),'');
 if TG_OP='UPDATE' then
  if new.owner_id<>old.owner_id then raise exception 'Task owner cannot be changed'; end if;
  new.version=old.version+1;
 else new.version=1; end if;
 if new.last_verified_at>now() then raise exception 'Last checked cannot be in the future'; end if;
 if new.status='Done' then
  if TG_OP='INSERT' then new.completion_verified_at=now();
  elsif old.status<>'Done' or new.completion_summary is distinct from old.completion_summary or new.completion_url is distinct from old.completion_url then new.completion_verified_at=now();
  else new.completion_verified_at=old.completion_verified_at; end if;
 else new.completion_verified_at=null; end if;
 if new.source_record is not null then new.completion_verified_at=null; new.completed_at=null; end if;
 return new;
end $$;
