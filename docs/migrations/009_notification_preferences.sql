-- Per-user push notification preferences and local delivery window
create table if not exists notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_enabled boolean not null default true,
  training_reminders_enabled boolean not null default true,
  missed_day_enabled boolean not null default true,
  community_enabled boolean not null default true,
  progress_enabled boolean not null default true,
  preferred_hour_local smallint not null default 18 check (preferred_hour_local between 0 and 23),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table notification_preferences enable row level security;

create policy if not exists "Users can read own notification preferences"
  on notification_preferences
  for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own notification preferences"
  on notification_preferences
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own notification preferences"
  on notification_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function set_notification_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notification_preferences_updated_at on notification_preferences;
create trigger trg_notification_preferences_updated_at
before update on notification_preferences
for each row execute function set_notification_preferences_updated_at();
