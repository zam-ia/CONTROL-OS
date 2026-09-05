-- CONTROL OS · Admin, modules, finance and follow-up
-- Safe to commit: this migration contains no credentials.

alter table public.profiles
add column if not exists status public.record_status not null default 'ACTIVE';

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  plan_version_id uuid references public.plan_versions(id) on delete set null,
  week_id uuid references public.weeks(id) on delete set null,
  title text not null,
  description text not null,
  status public.record_status not null default 'ACTIVE',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.module_files (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null check (mime_type in (
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )),
  size_bytes bigint not null check (size_bytes between 1 and 15728640),
  created_at timestamptz not null default now()
);

create table public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entry_type text not null check (entry_type in ('INCOME', 'EXPENSE')),
  category text not null,
  amount numeric(14,2) not null check (amount > 0),
  currency char(3) not null default 'PEN',
  occurred_on date not null,
  payment_status text not null check (payment_status in ('PAID', 'PENDING', 'OVERDUE')),
  notes text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid references public.enrollments(id) on delete cascade,
  summary text not null,
  owner_id uuid references public.profiles(id),
  due_on date not null,
  status public.record_status not null default 'ACTIVE',
  completed_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index modules_plan_week_idx on public.modules(plan_version_id, week_id, status);
create index finance_entries_org_date_idx on public.finance_entries(organization_id, occurred_on desc);
create index follow_ups_org_status_due_idx on public.follow_ups(organization_id, status, due_on);

create trigger touch_modules_updated_at before update on public.modules
for each row execute function app_private.touch_updated_at();
create trigger touch_finance_entries_updated_at before update on public.finance_entries
for each row execute function app_private.touch_updated_at();
create trigger touch_follow_ups_updated_at before update on public.follow_ups
for each row execute function app_private.touch_updated_at();

create or replace function app_private.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'ACTIVE'
      and p.global_role in ('COACH', 'OPERATOR', 'ADMIN', 'SUPER_ADMIN')
  );
$$;

create or replace function app_private.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'ACTIVE'
  );
$$;

create or replace function app_private.belongs_to(target_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_staff() or (
    app_private.is_active_user() and exists (
      select 1 from public.memberships m
      where m.organization_id = target_org
        and m.user_id = auth.uid()
        and m.status = 'ACTIVE'
    )
  );
$$;

create or replace function app_private.can_manage(target_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_staff() or (
    app_private.is_active_user() and exists (
      select 1 from public.memberships m
      where m.organization_id = target_org
        and m.user_id = auth.uid()
        and m.status = 'ACTIVE'
        and m.role in ('OWNER', 'MANAGER')
    )
  );
$$;

create or replace function app_private.protect_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.global_role is distinct from old.global_role or new.status is distinct from old.status)
     and not app_private.is_staff() then
    raise exception 'Only active staff can change roles or account status';
  end if;
  return new;
end;
$$;

alter table public.modules enable row level security;
alter table public.module_files enable row level security;
alter table public.finance_entries enable row level security;
alter table public.follow_ups enable row level security;

create policy modules_read on public.modules for select to authenticated
using (app_private.is_active_user() and (status = 'ACTIVE' or app_private.is_staff()));
create policy modules_manage on public.modules for all to authenticated
using (app_private.is_staff()) with check (app_private.is_staff());
create policy module_files_read on public.module_files for select to authenticated
using (app_private.is_active_user() and exists (select 1 from public.modules m where m.id = module_id and (m.status = 'ACTIVE' or app_private.is_staff())));
create policy module_files_manage on public.module_files for all to authenticated
using (app_private.is_staff()) with check (app_private.is_staff());
create policy finance_entries_staff on public.finance_entries for all to authenticated
using (app_private.is_staff()) with check (app_private.is_staff());
create policy follow_ups_staff on public.follow_ups for all to authenticated
using (app_private.is_staff()) with check (app_private.is_staff());

grant select, insert, update, delete on public.modules, public.module_files,
  public.finance_entries, public.follow_ups to authenticated;
grant execute on function app_private.is_active_user() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'control-os-modules',
  'control-os-modules',
  false,
  15728640,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy module_objects_read on storage.objects for select to authenticated
using (bucket_id = 'control-os-modules' and app_private.is_active_user());
create policy module_objects_manage on storage.objects for all to authenticated
using (bucket_id = 'control-os-modules' and app_private.is_staff())
with check (bucket_id = 'control-os-modules' and app_private.is_staff());
