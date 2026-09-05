-- CONTROL OS · Implementation classes and progressive unlocks
-- Videos stay on YouTube; CONTROL OS stores links and learning progress only.

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  plan_version_id uuid references public.plan_versions(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete cascade,
  stage_number smallint not null check (stage_number between 0 and 20),
  week_number smallint not null check (week_number between 0 and 52),
  title text not null,
  description text not null,
  objective text not null,
  duration_seconds integer not null check (duration_seconds > 0),
  video_url text not null check (
    video_url ~ '^https://(www\.|m\.)?(youtube\.com|youtu\.be)/'
  ),
  thumbnail_url text check (thumbnail_url is null or thumbnail_url ~ '^https://'),
  learnings jsonb not null default '[]'::jsonb check (jsonb_typeof(learnings) = 'array'),
  action_text text not null check (length(trim(action_text)) > 0),
  activity_type text not null check (activity_type in (
    'CHECKLIST', 'FORM', 'FILE_UPLOAD', 'TEXT', 'KPI', 'TEMPLATE', 'URL', 'REVIEW_REQUEST'
  )),
  resource_type text not null check (resource_type in (
    'PDF', 'EXCEL', 'GOOGLE_SHEET', 'DOCX', 'TEMPLATE', 'CHECKLIST',
    'EXTERNAL_LINK', 'FORM', 'CALCULATOR', 'SOP', 'CANVAS', 'EXAMPLE'
  )),
  resource_url text check (resource_url is null or resource_url ~ '^https://'),
  deliverable text not null check (length(trim(deliverable)) > 0),
  points integer not null default 0 check (points between 0 and 1000),
  requires_review boolean not null default true,
  required_for_unlock boolean not null default true,
  status public.record_status not null default 'DRAFT',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (plan_version_id is null or organization_id is null)
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid references public.enrollments(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  playback_percent smallint not null default 0 check (playback_percent in (0, 25, 50, 75, 100)),
  activity_status text not null default 'NOT_STARTED' check (activity_status in (
    'NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED'
  )),
  response_text text,
  feedback_text text,
  evidence_id uuid references public.evidences(id) on delete set null,
  due_at timestamptz,
  manually_unlocked boolean not null default false,
  requirement_skipped boolean not null default false,
  completed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, lesson_id, user_id)
);

create index lessons_stage_week_idx on public.lessons(stage_number, week_number, status);
create index lessons_plan_idx on public.lessons(plan_version_id, status);
create index lessons_org_idx on public.lessons(organization_id, status);
create index lesson_progress_org_status_idx on public.lesson_progress(organization_id, activity_status, updated_at desc);
create index lesson_progress_user_idx on public.lesson_progress(user_id, lesson_id);

create trigger touch_lessons_updated_at before update on public.lessons
for each row execute function app_private.touch_updated_at();
create trigger touch_lesson_progress_updated_at before update on public.lesson_progress
for each row execute function app_private.touch_updated_at();

create or replace function app_private.protect_lesson_progress_review_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not app_private.is_staff() and (
    new.feedback_text is distinct from old.feedback_text
    or new.manually_unlocked is distinct from old.manually_unlocked
    or new.requirement_skipped is distinct from old.requirement_skipped
    or new.due_at is distinct from old.due_at
    or new.reviewed_by is distinct from old.reviewed_by
    or new.reviewed_at is distinct from old.reviewed_at
    or new.activity_status not in ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED')
  ) then
    raise exception 'Review, override and due-date fields are staff-managed';
  end if;
  return new;
end;
$$;

create trigger protect_lesson_progress_review_fields
before update on public.lesson_progress
for each row execute function app_private.protect_lesson_progress_review_fields();

alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;

create policy lessons_read on public.lessons for select to authenticated
using (
  app_private.is_active_user()
  and (
    app_private.is_staff()
    or (
      status = 'ACTIVE'
      and (
        (organization_id is not null and app_private.belongs_to(organization_id))
        or (
          organization_id is null
          and (
            plan_version_id is null
            or exists (
              select 1 from public.enrollments e
              where e.plan_version_id = lessons.plan_version_id
                and e.status = 'ACTIVE'
                and app_private.belongs_to(e.organization_id)
            )
          )
        )
      )
    )
  )
);
create policy lessons_manage on public.lessons for all to authenticated
using (app_private.is_staff()) with check (app_private.is_staff());

create policy lesson_progress_read on public.lesson_progress for select to authenticated
using (app_private.belongs_to(organization_id));
create policy lesson_progress_insert on public.lesson_progress for insert to authenticated
with check (
  user_id = auth.uid()
  and app_private.belongs_to(organization_id)
  and activity_status in ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED')
  and feedback_text is null
  and reviewed_by is null
  and reviewed_at is null
  and manually_unlocked = false
  and requirement_skipped = false
);
create policy lesson_progress_client_update on public.lesson_progress for update to authenticated
using (user_id = auth.uid() and app_private.belongs_to(organization_id))
with check (
  user_id = auth.uid()
  and app_private.belongs_to(organization_id)
  and activity_status in ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED')
);
create policy lesson_progress_staff_manage on public.lesson_progress for all to authenticated
using (app_private.is_staff()) with check (app_private.is_staff());

grant select, insert, update, delete on public.lessons, public.lesson_progress to authenticated;

comment on table public.lessons is
  'Implementation units. Every lesson requires an action and deliverable; video consumption alone never completes it.';
comment on column public.lessons.video_url is
  'YouTube reference rendered as an embedded player. Do not store video bytes in the application database.';
