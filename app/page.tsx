import { createClient } from '@/lib/supabase/server';
import { HourSummaryCard } from '@/components/employees/HourSummaryCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getWeekStartISO, calcDurationHours, getDayLabel } from '@/lib/utils/schedule';
import Link from 'next/link';
import type { EmployeeWithHours } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const weekStart = getWeekStartISO();

  const [employeesRes, assignmentsRes, shiftsRes] = await Promise.all([
    supabase
      .from('employees')
      .select('id, name, employee_type_id, created_at, employee_types(id, name, max_weekly_hours)')
      .order('name'),
    supabase
      .from('schedule_assignments')
      .select('employee_id, shift_id, shifts(start_time, end_time, day_of_week, name, max_workers)')
      .eq('week_start_date', weekStart),
    supabase
      .from('shifts')
      .select('id, name, day_of_week, max_workers')
      .order('day_of_week')
      .order('start_time'),
  ]);

  const rawEmployees = employeesRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];
  const shifts = shiftsRes.data ?? [];

  // Build hours map
  const hoursMap: Record<string, number> = {};
  for (const a of assignments) {
    const shift = (a as any).shifts;
    if (!shift) continue;
    const h = calcDurationHours(shift.start_time, shift.end_time);
    hoursMap[a.employee_id] = (hoursMap[a.employee_id] ?? 0) + h;
  }

  const employees: EmployeeWithHours[] = rawEmployees.map((emp: any) => {
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

  // Employees near or over their limit
  const warnings = employees.filter((e) => e.usage_percent >= 80);

  // Shifts that are understaffed today (worker count < min_workers)
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1; // 0=Monday

  // Build worker count per shift
  const workerCounts: Record<string, number> = {};
  for (const a of assignments) {
    workerCounts[a.shift_id] = (workerCounts[a.shift_id] ?? 0) + 1;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Week of {new Date(weekStart + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric'
            })}
          </p>
        </div>
        <Link
          href="/schedule"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors self-start sm:self-auto"
        >
          View Schedule →
        </Link>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Alerts
          </h2>
          {warnings.map((emp) => (
            <Alert
              key={emp.id}
              className={emp.usage_percent >= 100 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}
            >
              <AlertDescription className={emp.usage_percent >= 100 ? 'text-red-700' : 'text-yellow-700'}>
                {emp.usage_percent >= 100
                  ? `${emp.name} has reached their weekly hour limit (${emp.scheduled_hours}/${emp.max_hours}h).`
                  : `${emp.name} is approaching their weekly limit — ${emp.scheduled_hours}/${emp.max_hours}h scheduled (${emp.remaining_hours}h remaining).`}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{employees.length}</p>
          <p className="text-sm text-gray-500">Employees</p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{assignments.length}</p>
          <p className="text-sm text-gray-500">Shifts Filled This Week</p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">
            {employees.reduce((sum, e) => sum + e.scheduled_hours, 0)}h
          </p>
          <p className="text-sm text-gray-500">Total Hours Scheduled</p>
        </div>
      </div>

      {/* Employee hour summaries */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Employee Hours — Week Overview
          </h2>
          <Link href="/employees" className="text-xs text-indigo-600 hover:underline">
            Manage employees →
          </Link>
        </div>

        {employees.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-white border rounded-xl">
            No employees yet.{' '}
            <Link href="/employees" className="text-indigo-600 hover:underline">
              Add an employee
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {employees.map((emp) => (
              <HourSummaryCard key={emp.id} employee={emp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
