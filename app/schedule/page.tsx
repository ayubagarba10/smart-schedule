import { createClient } from '@/lib/supabase/server';
import { WeeklyGrid } from '@/components/schedule/WeeklyGrid';
import { getWeekStartISO, calcDurationHours } from '@/lib/utils/schedule';
import type { EmployeeWithHours, Shift, ScheduleAssignment } from '@/types';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  const supabase = await createClient();
  const weekStart = getWeekStartISO();

  // Fetch all shifts, assignments, and employees in parallel
  const [shiftsRes, assignmentsRes, employeesRes] = await Promise.all([
    supabase.from('shifts').select('*').order('day_of_week').order('start_time'),
    supabase
      .from('schedule_assignments')
      .select(`
        id, shift_id, employee_id, week_start_date, created_at,
        employees ( id, name, employee_type_id, employee_types(name) ),
        shifts ( id, name, day_of_week, start_time, end_time, min_workers, max_workers )
      `)
      .eq('week_start_date', weekStart),
    supabase
      .from('employees')
      .select(`id, name, employee_type_id, created_at, employee_types(id, name, max_weekly_hours)`)
      .order('name'),
  ]);

  const rawShifts = shiftsRes.data ?? [];
  const assignments = (assignmentsRes.data ?? []) as unknown as ScheduleAssignment[];

  // Enrich shifts with duration_hours
  const shifts: Shift[] = rawShifts.map((s) => ({
    ...s,
    duration_hours: calcDurationHours(s.start_time, s.end_time),
  }));

  // Build hours map for employees
  const hoursMap: Record<string, number> = {};
  for (const a of assignments) {
    const shift = (a as any).shifts;
    if (!shift) continue;
    const h = calcDurationHours(shift.start_time, shift.end_time);
    hoursMap[a.employee_id] = (hoursMap[a.employee_id] ?? 0) + h;
  }

  const employees: EmployeeWithHours[] = (employeesRes.data ?? []).map((emp: any) => {
    const maxHours = emp.employee_types?.max_weekly_hours ?? 0;
    const scheduledHours = hoursMap[emp.id] ?? 0;
    return {
      ...emp,
      scheduled_hours: scheduledHours,
      remaining_hours: Math.max(0, maxHours - scheduledHours),
      max_hours: maxHours,
      usage_percent: maxHours > 0 ? Math.round((scheduledHours / maxHours) * 100) : 0,
    };
  });

  // Week label for header
  const monday = new Date(weekStart + 'T00:00:00');
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekLabel = `${monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Weekly Schedule</h1>
        <p className="text-sm text-gray-500">{weekLabel}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <WeeklyGrid
          initialShifts={shifts}
          initialAssignments={assignments}
          initialEmployees={employees}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
          Available slots
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
          Nearly full
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
          Full
        </div>
        <div className="hidden sm:block sm:ml-auto text-gray-400">
          Tap a shift card to assign or remove employees
        </div>
      </div>
    </div>
  );
}
