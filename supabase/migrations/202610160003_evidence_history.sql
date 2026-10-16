-- Additive history only. No backfill: NULL means values were not captured.
-- Existing owner RLS, grants, trigger identity and SECURITY DEFINER scope stay unchanged.
alter table public.task_events
  add column evidence_before jsonb,
  add column evidence_after jsonb;

create or replace function private.record_task_event() returns trigger
language plpgsql security definer set search_path='' as $$
declare
  changed text[];
  prior_evidence jsonb;
  next_evidence jsonb;
  evidence_keys text[] := array['source_system','source_id','source_revision','source_url',
    'source_record','source_evidence','last_verified_at','uncertainty',
    'approval_status','approval_scope','approval_evidence',
    'completion_summary','completion_url','completion_verified_at','completed_at'];
begin
  if TG_OP='UPDATE' then
    select array_agg(k order by k) into changed from jsonb_object_keys(to_jsonb(new)) k
      where k not in ('updated_at','version','completion_verified_at','completed_at')
      and (to_jsonb(new)->k) is distinct from (to_jsonb(old)->k);
    if changed is null then return new; end if;
    select jsonb_object_agg(key,value) into prior_evidence
      from jsonb_each(to_jsonb(old)) where key=any(evidence_keys);
  end if;
  select jsonb_object_agg(key,value) into next_evidence
    from jsonb_each(to_jsonb(new)) where key=any(evidence_keys);
  insert into public.task_events(organization_id,task_id,owner_id,created_by,
    action,from_status,to_status,changed_fields,evidence_before,evidence_after)
  values(new.organization_id,new.id,new.owner_id,auth.uid(),
    case when TG_OP='INSERT' then 'Created' else 'Updated' end,
    case when TG_OP='UPDATE' then old.status else null end,
    new.status,coalesce(changed,array['created']),prior_evidence,next_evidence);
  return new;
end $$;
