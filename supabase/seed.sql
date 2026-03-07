-- Smart Shift Scheduling App - Seed Data

-- ============================================================
-- Employee Types
-- ============================================================
insert into employee_types (id, name, max_weekly_hours, is_active) values
  ('a1000000-0000-0000-0000-000000000001', 'Permanent',          40, true),
  ('a1000000-0000-0000-0000-000000000002', 'Part-Time',          20, true),
  ('a1000000-0000-0000-0000-000000000003', 'Federal Work Study', 20, true);

-- ============================================================
-- Shifts: Weekdays (Mon=0 through Fri=4)
-- Morning:   8:00 AM – 12:00 PM (4h)
-- Afternoon: 3:00 PM –  5:00 PM (2h)
-- Evening:   5:00 PM –  9:00 PM (4h)
-- ============================================================
do $$
declare
  day int;
begin
  for day in 0..4 loop
    insert into shifts (name, day_of_week, start_time, end_time, min_workers, max_workers) values
      ('Morning',   day, '08:00', '12:00', 1, 2),
      ('Afternoon', day, '15:00', '17:00', 1, 2),
      ('Evening',   day, '17:00', '21:00', 1, 2);
  end loop;
end $$;

-- ============================================================
-- Shifts: Weekends (Sat=5, Sun=6)
-- Morning:   10:00 AM –  1:00 PM (3h)
-- Afternoon:  1:00 PM –  8:00 PM (7h)
-- ============================================================
do $$
declare
  day int;
begin
  for day in 5..6 loop
    insert into shifts (name, day_of_week, start_time, end_time, min_workers, max_workers) values
      ('Morning',   day, '10:00', '13:00', 1, 2),
      ('Afternoon', day, '13:00', '20:00', 1, 2);
  end loop;
end $$;

-- ============================================================
-- Sample Employees
-- ============================================================
insert into employees (name, employee_type_id) values
  ('Ayuba',    'a1000000-0000-0000-0000-000000000001'),
  ('Ansoya',   'a1000000-0000-0000-0000-000000000002'),
  ('Brylle',   'a1000000-0000-0000-0000-000000000003'),
  ('Morgan',   'a1000000-0000-0000-0000-000000000001');
