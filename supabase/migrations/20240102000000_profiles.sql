-- Profiles table: stores role and optional employee link per auth user
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null default 'employee' check (role in ('manager', 'employee')),
  employee_id   uuid references employees(id) on delete set null,
  created_at    timestamptz default now()
);

-- Auto-create a profile (as 'employee') whenever a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, role)
  values (new.id, 'employee')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- After running this migration:
-- 1. Sign up as the manager via the app login page
-- 2. In Supabase Table Editor > profiles, find your user row and set role = 'manager'
-- 3. To link an employee account, set employee_id to the employee's UUID from the employees table
