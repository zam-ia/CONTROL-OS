-- CONTROL OS · Usernames and goal checkpoints
-- The UI authenticates with a public username. Email remains an internal Supabase Auth identity.

alter table public.profiles
add column if not exists username text;

update public.profiles p
set username = case
  when lower(u.email) = 'admin@crisdalcompany.com' then 'admin'
  else 'usuario_' || replace(left(p.id::text, 12), '-', '')
end
from auth.users u
where u.id = p.id
  and p.username is null;

update public.profiles
set username = 'usuario_' || replace(left(id::text, 12), '-', '')
where username is null;

alter table public.profiles
alter column username set not null;

create unique index if not exists profiles_username_ci_unique
on public.profiles (lower(username));

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_username_format_check
    check (username ~ '^[a-z0-9._-]{3,40}$');
  end if;
end
$migration$;

create or replace function app_private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare requested_username text;
begin
  requested_username := lower(new.raw_user_meta_data ->> 'username');
  if requested_username is null
     or requested_username !~ '^[a-z0-9._-]{3,40}$' then
    requested_username := 'usuario_' || replace(left(new.id::text, 12), '-', '');
  end if;

  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', requested_username),
    requested_username
  );
  return new;
end;
$$;

create or replace function app_private.protect_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (
    new.global_role is distinct from old.global_role
    or new.status is distinct from old.status
    or new.username is distinct from old.username
  ) and not app_private.is_staff() then
    raise exception 'Only active staff can change roles, usernames or account status';
  end if;
  return new;
end;
$$;

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  baseline numeric not null,
  target numeric not null,
  unit text not null,
  due_on date not null,
  status public.record_status not null default 'ACTIVE',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_checkpoints (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  position smallint not null check (position between 1 and 20),
  title text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (goal_id, position)
);

create index if not exists goals_org_status_idx
on public.goals(organization_id, status, due_on);

create index if not exists goal_checkpoints_goal_idx
on public.goal_checkpoints(goal_id, position);

do $migration$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'touch_goals_updated_at'
      and tgrelid = 'public.goals'::regclass
  ) then
    create trigger touch_goals_updated_at
    before update on public.goals
    for each row execute function app_private.touch_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'touch_goal_checkpoints_updated_at'
      and tgrelid = 'public.goal_checkpoints'::regclass
  ) then
    create trigger touch_goal_checkpoints_updated_at
    before update on public.goal_checkpoints
    for each row execute function app_private.touch_updated_at();
  end if;
end
$migration$;

alter table public.goals enable row level security;
alter table public.goal_checkpoints enable row level security;

do $migration$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'goals_read') then
    create policy goals_read on public.goals for select to authenticated
    using (app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'goals_manage') then
    create policy goals_manage on public.goals for all to authenticated
    using (app_private.can_manage(organization_id))
    with check (app_private.can_manage(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'goal_checkpoints_read') then
    create policy goal_checkpoints_read on public.goal_checkpoints for select to authenticated
    using (exists (
      select 1 from public.goals g
      where g.id = goal_id and app_private.belongs_to(g.organization_id)
    ));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'goal_checkpoints_update') then
    create policy goal_checkpoints_update on public.goal_checkpoints for update to authenticated
    using (exists (
      select 1 from public.goals g
      where g.id = goal_id and app_private.belongs_to(g.organization_id)
    ))
    with check (exists (
      select 1 from public.goals g
      where g.id = goal_id and app_private.belongs_to(g.organization_id)
    ));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'goal_checkpoints_manage') then
    create policy goal_checkpoints_manage on public.goal_checkpoints for all to authenticated
    using (exists (
      select 1 from public.goals g
      where g.id = goal_id and app_private.can_manage(g.organization_id)
    ))
    with check (exists (
      select 1 from public.goals g
      where g.id = goal_id and app_private.can_manage(g.organization_id)
    ));
  end if;
end
$migration$;

grant select, insert, update, delete on public.goals, public.goal_checkpoints to authenticated;

comment on column public.profiles.username is
  'Public login identifier shown by CONTROL OS; may contain a DNI, RUC or internal alias.';
comment on table public.goal_checkpoints is
  'Binary milestones used to calculate goal progress without manual percentages.';
