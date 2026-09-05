-- CONTROL OS · Binary lesson checkpoints
-- Replaces user-entered playback percentages with a clear completion check.

alter table public.lesson_progress
add column if not exists video_completed boolean not null default false;

update public.lesson_progress
set video_completed = playback_percent >= 90
where playback_percent is not null;

alter table public.lesson_progress
drop column if exists playback_percent;

comment on column public.lesson_progress.video_completed is
  'User checkpoint confirming that the assigned class video was viewed.';
