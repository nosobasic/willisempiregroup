-- Apply only to the NEW WEG project, after the base migration. No external actions.
-- This extension intentionally narrows the entire WEG workspace to owners.
do $$ declare t text; begin
 foreach t in array array['businesses','opportunities','mentors','tasks','company_profiles','application_answers','organization_members'] loop
  execute format('create policy owner_only on public.%I as restrictive for all to authenticated using(private.has_role(organization_id,array[''owner''])) with check(private.has_role(organization_id,array[''owner'']))',t);
 end loop;
end $$;
create policy owner_only on public.organizations as restrictive for select to authenticated using(private.has_role(id,array['owner']));

alter table public.tasks drop constraint tasks_status_check;
alter table public.tasks add constraint tasks_status_check check(status in ('Open','In progress','Needs approval','Waiting on response','Blocked','Done','Cancelled'));
alter table public.tasks
 add column owner_id uuid references auth.users(id) not null default auth.uid(),
 add column project text,
 add column function_bucket text not null default 'Business admin' check(function_bucket in ('Product / engineering','Growth','Career','Education','Business admin','Personal admin')),
 add column next_action text,
 add column waiting_on text,
 add column blocked_reason text,
 add column dependencies text,
 add column uncertainty text,
 add column due_at timestamptz,
 add column follow_up_at timestamptz,
 add column last_verified_at timestamptz,
 add column source_url text check(source_url is null or source_url ~* '^https?://'),
 add column source_system text,
 add column source_id text,
 add column source_revision text,
 add column version integer not null default 1,
 add column approval_status text not null default 'Not needed' check(approval_status in ('Not needed','Pending','Approved','Declined')),
 add column approval_scope text,
 add column approval_evidence text check(approval_evidence is null or approval_evidence ~* '^https?://'),
 add column completion_summary text,
 add column completion_url text check(completion_url is null or completion_url ~* '^https?://'),
 add column completion_verified_at timestamptz,
 add constraint source_pair check ((nullif(trim(source_system),'') is null) = (nullif(trim(source_id),'') is null)),
 add constraint source_unique unique(organization_id,owner_id,source_system,source_id),
 add constraint wait_details check(status <> 'Waiting on response' or length(trim(coalesce(waiting_on,'')))>0),
 add constraint block_details check(status <> 'Blocked' or length(trim(coalesce(blocked_reason,'')))>0),
 add constraint approval_pending check(status <> 'Needs approval' or (approval_status='Pending' and length(trim(coalesce(approval_scope,'')))>0)),
 add constraint approval_decision check(approval_status not in ('Approved','Declined') or (length(trim(coalesce(approval_scope,'')))>0 and length(trim(coalesce(approval_evidence,'')))>0)),
 add constraint completion_evidence check(status <> 'Done' or (length(trim(coalesce(completion_summary,'')))>0 and length(trim(coalesce(completion_url,'')))>0));
-- Fresh project migration: existing rows without owners/evidence must be explicitly reviewed before migration, not silently transformed.
create policy personal_tasks on public.tasks as restrictive for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
-- Preserve history by cancelling tasks instead of deleting them.
revoke delete on public.tasks from authenticated;
create function private.guard_task() returns trigger language plpgsql set search_path='' as $$
begin
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
 return new;
end $$;
create trigger guard_task before insert or update on public.tasks for each row execute function private.guard_task();
create table public.task_events (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 task_id uuid not null references public.tasks(id), owner_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(), created_by uuid references auth.users(id),
 action text not null, from_status text, to_status text not null, changed_fields text[] not null default '{}'
);
alter table public.task_events enable row level security;
revoke all on public.task_events from anon,authenticated;
grant select on public.task_events to authenticated;
create policy owner_history on public.task_events for select to authenticated using(owner_id=auth.uid() and private.has_role(organization_id,array['owner']));
create index on public.task_events(organization_id,owner_id,task_id,created_at);
create function private.record_task_event() returns trigger language plpgsql security definer set search_path='' as $$
declare changed text[]; begin
 if TG_OP='UPDATE' then
  select array_agg(k order by k) into changed from jsonb_object_keys(to_jsonb(new)) k where k not in ('updated_at','version','completion_verified_at','completed_at') and (to_jsonb(new)->k) is distinct from (to_jsonb(old)->k);
  if changed is null then return new; end if;
 end if;
 insert into public.task_events(organization_id,task_id,owner_id,created_by,action,from_status,to_status,changed_fields)
 values(new.organization_id,new.id,new.owner_id,auth.uid(),case when TG_OP='INSERT' then 'Created' else 'Updated' end,case when TG_OP='UPDATE' then old.status else null end,new.status,coalesce(changed,array['created']));
 return new;
end $$;
revoke all on function private.record_task_event() from public;
create trigger record_task_event after insert or update on public.tasks for each row execute function private.record_task_event();
