-- Smart Shift Scheduling App - Initial Schema

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- Employee Types (Permanent, Part-Time, Federal Work Study)
-- ============================================================
create table employee_types (
  id               uuid primary key default gen_random_uuid(),
  name             text not null unique,
  max_weekly_hours int  not null check (max_weekly_hours > 0),
  is_active        boolean not null default true,
  created_at       timestamptz default now()
);

-- ============================================================
-- Employees
-- ============================================================
create table employees (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  employee_type_id uuid references employee_types(id) on delete set null,
  created_at       timestamptz default now()
);

-- ============================================================
-- Predefined Shifts
-- day_of_week: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday,
--              4=Friday, 5=Saturday, 6=Sunday
-- duration_hours is auto-calculated from start/end times
-- ============================================================
create table shifts (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  day_of_week    int  not null check (day_of_week between 0 and 6),
  start_time     time not null,
  end_time       time not null,
  min_workers    int  not null default 1 check (min_workers >= 0),
  max_workers    int  not null default 2 check (max_workers >= 1),
  created_at     timestamptz default now(),
  check (end_time > start_time),
  check (max_workers >= min_workers)
);

-- Computed column for duration (as a generated view, since Postgres supports it)
-- We'll use a function instead for compatibility
create or replace function shift_duration_hours(s shifts)
returns numeric as $$
  select round(
    extract(epoch from (s.end_time - s.start_time)) / 3600,
    2
  )::numeric;
$$ language sql stable;

-- ============================================================
-- Schedule Assignments (which employee works which shift this week)
-- week_start_date is always the Monday of the current week
-- ============================================================
create table schedule_assignments (
  id              uuid primary key default gen_random_uuid(),
  shift_id        uuid not null references shifts(id) on delete cascade,
  employee_id     uuid not null references employees(id) on delete cascade,
  week_start_date date not null,
  created_at      timestamptz default now(),
  -- Prevent duplicate assignments (same employee, same shift, same week)
  unique (shift_id, employee_id, week_start_date)
);

-- Index for fast weekly lookups
create index idx_assignments_week on schedule_assignments(week_start_date);
create index idx_assignments_employee on schedule_assignments(employee_id, week_start_date);
create index idx_assignments_shift on schedule_assignments(shift_id, week_start_date);

-- ============================================================
-- View: employee weekly hours (for current and any week)
-- ============================================================
create or replace view employee_weekly_hours as
select
  sa.employee_id,
  sa.week_start_date,
  round(
    sum(extract(epoch from (sh.end_time - sh.start_time)) / 3600),
    2
  ) as total_hours
from schedule_assignments sa
join shifts sh on sh.id = sa.shift_id
group by sa.employee_id, sa.week_start_date;
