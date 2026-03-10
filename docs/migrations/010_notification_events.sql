-- Notification delivery reliability and dedupe log

create table if not exists notification_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  dedupe_key text not null unique,
  status text not null check (status in ('processing', 'sent', 'skipped', 'failed')),
  attempts smallint not null default 0 check (attempts >= 0 and attempts <= 10),
  provider_status smallint,
  error_code text,
  payload jsonb,
  scheduled_for timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notification_events_user_created
  on notification_events(user_id, created_at desc);

create index if not exists idx_notification_events_type_created
  on notification_events(event_type, created_at desc);

alter table notification_events enable row level security;

drop policy if exists "Users can read own notification events" on notification_events;
create policy "Users can read own notification events"
  on notification_events
  for select
  using (auth.uid() = user_id);

create or replace function set_notification_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notification_events_updated_at on notification_events;
create trigger trg_notification_events_updated_at
before update on notification_events
for each row execute function set_notification_events_updated_at();

alter table notification_preferences
  add column if not exists quiet_hours_enabled boolean not null default false,
  add column if not exists quiet_hours_start_local smallint not null default 22 check (quiet_hours_start_local between 0 and 23),
  add column if not exists quiet_hours_end_local smallint not null default 7 check (quiet_hours_end_local between 0 and 23);
