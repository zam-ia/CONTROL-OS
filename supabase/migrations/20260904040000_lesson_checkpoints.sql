-- CONTROL OS · Binary lesson checkpoints
-- Replaces user-entered playback percentages with a clear completion check.

alter table public.lesson_progress
add column if not exists video_completed boolean not null default false;

do $migration$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lesson_progress'
      and column_name = 'playback_percent'
  ) then
    execute 'update public.lesson_progress
      set video_completed = playback_percent >= 90
      where playback_percent is not null';
    execute 'alter table public.lesson_progress drop column playback_percent';
  end if;
end
$migration$;

comment on column public.lesson_progress.video_completed is
  'User checkpoint confirming that the assigned class video was viewed.';
