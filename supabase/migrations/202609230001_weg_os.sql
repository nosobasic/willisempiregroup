-- WEG OS: tenancy is explicit; parent organizations do not imply membership.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '', created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), created_by uuid references auth.users(id) default auth.uid()
);
create table public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name)) > 0),
 parent_organization_id uuid references public.organizations(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id) default auth.uid()
);
create table public.organization_members (
 organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('owner','admin','operator','viewer')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id) default auth.uid(), primary key (organization_id,user_id)
);
-- Database-side MFA gate: enrolled users must present an aal2 JWT even for direct REST access.
create function private.mfa_ok() returns boolean language sql stable security definer set search_path = '' as $$
 select coalesce(auth.jwt()->>'aal','aal1') = 'aal2' or not exists (
  select 1 from auth.mfa_factors where user_id = auth.uid() and status = 'verified'
 );
$$;
create function private.has_role(org uuid, roles text[] default array['owner','admin','operator','viewer'])
returns boolean language sql stable security definer set search_path = '' as $$
 select private.mfa_ok() and exists(select 1 from public.organization_members m where m.organization_id=org and m.user_id=auth.uid() and m.role=any(roles));
$$;
revoke all on function private.mfa_ok() from public;
revoke all on function private.has_role(uuid,text[]) from public;
grant execute on function private.mfa_ok(), private.has_role(uuid,text[]) to authenticated;

create table public.businesses (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 name text not null check (length(trim(name)) > 0), description text not null default '', website text,
 status text not null default 'Active' check (status in ('Active','Planning','Paused','Archived')), industry text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) default auth.uid(),
 unique (organization_id,id), check (website is null or website ~* '^https?://')
);
create table public.opportunities (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), business_id uuid,
 name text not null check (length(trim(name)) > 0), organization text not null default '',
 category text not null check (category in ('Grant','Non-dilutive funding','Accelerator','Mentorship','Founder program','Procurement','Supplier program','Certification','Pitch competition','Cloud/startup credits','Strategic partnership','Financing')),
 description text, website text, application_url text, funding_min numeric check(funding_min>=0), funding_max numeric check(funding_max>=0), equity_required boolean,
 deadline date, rolling_deadline boolean not null default false, geography text, eligibility text, requirements text, documents_required text, contact_name text, contact_email text,
 status text not null default 'Discovered' check (status in ('Discovered','Researching','Eligible','Not Eligible','Preparing','Ready','Applied','Follow Up','Interview','Awarded','Rejected','Expired')),
 priority text not null default 'Medium' check(priority in ('Low','Medium','High','Urgent')),
 fit_score integer check(fit_score between 0 and 100), fit_reason text, score_source text not null default 'manual' check(score_source in ('manual','evidence','ai')),
 score_evidence jsonb not null default '[]', next_action text, next_action_date date, notes text, source_url text,
 date_discovered date not null default current_date, date_last_verified date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) default auth.uid(),
 unique(organization_id,id), foreign key(organization_id,business_id) references public.businesses(organization_id,id),
 check(funding_min is null or funding_max is null or funding_max>=funding_min),
 check(fit_score is null or length(trim(coalesce(fit_reason,'')))>0),
 check(not rolling_deadline or deadline is null),
 check(website is null or website ~* '^https?://'), check(application_url is null or application_url ~* '^https?://'), check(source_url is null or source_url ~* '^https?://')
);
create table public.mentors (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 name text not null check(length(trim(name))>0), organization text not null default '', title text, expertise text not null default '', email text, website text, linkedin_url text, program text,
 relationship_status text not null default 'Prospect' check(relationship_status in ('Prospect','Contacted','Active','Paused','Closed')),
 last_interaction date, next_follow_up date, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) default auth.uid(),
 check(website is null or website ~* '^https?://'), check(linkedin_url is null or linkedin_url ~* '^https?://')
);
create table public.tasks (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), business_id uuid, opportunity_id uuid,
 title text not null check(length(trim(title))>0), description text,
 priority text not null default 'Medium' check(priority in ('Low','Medium','High','Urgent')),
 status text not null default 'Open' check(status in ('Open','In progress','Done','Cancelled')), due_date date, completed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) default auth.uid(),
 foreign key(organization_id,business_id) references public.businesses(organization_id,id),
 foreign key(organization_id,opportunity_id) references public.opportunities(organization_id,id)
);
create table public.company_profiles (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null unique references public.organizations(id),
 content jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) default auth.uid()
);
create table public.application_answers (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), opportunity_id uuid not null,
 question text not null check(length(trim(question))>0), draft_answer text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) default auth.uid(),
 foreign key(organization_id,opportunity_id) references public.opportunities(organization_id,id) on delete cascade
);

create function private.stamp_record() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' then
   if auth.uid() is not null then new.created_by=auth.uid(); end if;
   new.created_at=now();
 else
   new.created_by=old.created_by; new.created_at=old.created_at;
   if to_jsonb(new)->>'organization_id' is distinct from to_jsonb(old)->>'organization_id' then raise exception 'Organization cannot be changed'; end if;
 end if;
 new.updated_at=now(); return new;
end $$;
create function private.complete_task() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status='Done' then
   if TG_OP='INSERT' then new.completed_at=now();
   elsif old.status<>'Done' then new.completed_at=now(); else new.completed_at=old.completed_at; end if;
 else new.completed_at=null; end if;
 return new;
end $$;
create trigger complete_task before insert or update on public.tasks for each row execute function private.complete_task();

do $$ declare t text; begin
 foreach t in array array['profiles','organizations','organization_members','businesses','opportunities','mentors','tasks','company_profiles','application_answers'] loop
  execute format('alter table public.%I enable row level security', t);
  execute format('create trigger stamp_record before insert or update on public.%I for each row execute function private.stamp_record()',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
 end loop;
 foreach t in array array['businesses','opportunities','mentors','tasks','company_profiles','application_answers'] loop
  execute format('grant select, insert, update, delete on public.%I to authenticated',t);
  execute format('create policy member_read on public.%I for select to authenticated using (private.has_role(organization_id))',t);
  execute format('create policy editor_insert on public.%I for insert to authenticated with check (private.has_role(organization_id, array[''owner'',''admin'',''operator'']))',t);
  execute format('create policy editor_update on public.%I for update to authenticated using (private.has_role(organization_id, array[''owner'',''admin'',''operator''])) with check (private.has_role(organization_id, array[''owner'',''admin'',''operator'']))',t);
  execute format('create policy admin_delete on public.%I for delete to authenticated using (private.has_role(organization_id, array[''owner'',''admin'']))',t);
  execute format('create index on public.%I(organization_id)',t);
 end loop;
end $$;
-- Membership changes are administrative SQL/server operations; no browser self-promotion.
grant select on public.organizations,public.organization_members to authenticated;
create policy organization_read on public.organizations for select to authenticated using(private.has_role(id));
create policy membership_read on public.organization_members for select to authenticated using(private.has_role(organization_id));
grant select,insert,update on public.profiles to authenticated;
create policy own_profile_read on public.profiles for select to authenticated using(id=auth.uid() and private.mfa_ok());
create policy own_profile_insert on public.profiles for insert to authenticated with check(id=auth.uid() and private.mfa_ok());
create policy own_profile_update on public.profiles for update to authenticated using(id=auth.uid() and private.mfa_ok()) with check(id=auth.uid() and private.mfa_ok());
create index on public.organization_members(user_id);
create index on public.opportunities(organization_id,status,deadline);
create index on public.tasks(organization_id,status,due_date);
create index on public.mentors(organization_id,next_follow_up);
create index on public.application_answers(organization_id,opportunity_id);
