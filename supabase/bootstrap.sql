-- Run AFTER creating/inviting the founder in Supabase Auth, with SQL Editor privileges.
-- Replace ONLY this UUID with Authentication > Users > founder's user ID.
-- Idempotent for this initial workspace. Never put privileged keys in the browser.
begin;
do $$
declare founder uuid := '00000000-0000-0000-0000-000000000000';
org uuid := '11111111-1111-4111-8111-111111111111';
begin
 if not exists(select 1 from auth.users where id=founder) then raise exception 'Replace founder UUID with an existing Auth user'; end if;
 insert into public.profiles(id,full_name,created_by) values(founder,'',founder) on conflict(id) do nothing;
 insert into public.organizations(id,name,created_by) values(org,'Willis Empire Group',founder) on conflict(id) do nothing;
 insert into public.organization_members(organization_id,user_id,role,created_by) values(org,founder,'owner',founder) on conflict do nothing;
 -- Empty owner workspace: portfolio and task inventory are imported separately after review.
 insert into public.company_profiles(organization_id,created_by) values(org,founder) on conflict(organization_id) do nothing;
end $$;
commit;
