-- Auth brute-force controls for /api/signin

create table if not exists auth_login_attempts (
  email_hash text primary key,
  failed_attempts smallint not null default 0 check (failed_attempts >= 0 and failed_attempts <= 20),
  first_failed_at timestamptz,
  last_failed_at timestamptz,
  locked_until timestamptz,
  last_ip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_auth_login_attempts_locked_until
  on auth_login_attempts(locked_until);

alter table auth_login_attempts enable row level security;

create or replace function set_auth_login_attempts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_auth_login_attempts_updated_at on auth_login_attempts;
create trigger trg_auth_login_attempts_updated_at
before update on auth_login_attempts
for each row execute function set_auth_login_attempts_updated_at();
