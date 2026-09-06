-- CONTROL OS · Managed client credentials
-- Password values remain exclusively in Supabase Auth and are never stored here.

alter table public.profiles
add column if not exists must_change_password boolean not null default false,
add column if not exists password_changed_at timestamptz;

create or replace function app_private.protect_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (
    new.global_role is distinct from old.global_role
    or new.status is distinct from old.status
    or new.username is distinct from old.username
    or new.must_change_password is distinct from old.must_change_password
    or new.password_changed_at is distinct from old.password_changed_at
  )
  and coalesce(auth.role(), '') <> 'service_role'
  and not app_private.is_staff() then
    raise exception 'Only active staff or the server auth service can change managed credentials';
  end if;
  return new;
end;
$$;

do $migration$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_staff_update'
  ) then
    create policy profiles_staff_update on public.profiles
    for update to authenticated
    using (app_private.is_staff())
    with check (app_private.is_staff());
  end if;
end
$migration$;

comment on column public.profiles.must_change_password is
  'True after an administrator assigns a temporary password; cleared after the client replaces it.';
comment on column public.profiles.password_changed_at is
  'Timestamp only. Password material remains exclusively in Supabase Auth.';
