import { createClient } from '@/lib/supabase/server';
import { getWeekStartISO, calcDurationHours } from './schedule';
import type { ValidationResult } from '@/types';

// ============================================================
// Core Hour Calculation & Validation Logic
// ============================================================

/**
 * Returns the total scheduled hours for an employee in the given week.
 */
export async function calcWeeklyHours(
  employeeId: string,
  weekStart?: string
): Promise<number> {
  const supabase = await createClient();
  const weekStartDate = weekStart ?? getWeekStartISO();

  const { data, error } = await supabase
    .from('schedule_assignments')
    .select('shifts(start_time, end_time)')
    .eq('employee_id', employeeId)
    .eq('week_start_date', weekStartDate);

  if (error || !data) return 0;

  return data.reduce((total, row: any) => {
    const shift = row.shifts;
    if (!shift) return total;
    return total + calcDurationHours(shift.start_time, shift.end_time);
  }, 0);
}

/**
 * Validates whether an assignment is allowed.
 * Checks:
 *   1. Employee weekly hours won't exceed their type limit
 *   2. Shift capacity won't be exceeded
 */
export async function validateAssignment(
  shiftId: string,
  employeeId: string,
  weekStart?: string
): Promise<ValidationResult> {
  const supabase = await createClient();
  const weekStartDate = weekStart ?? getWeekStartISO();

  // Fetch the shift details
  const { data: shift, error: shiftError } = await supabase
    .from('shifts')
    .select('start_time, end_time, max_workers')
    .eq('id', shiftId)
    .single();

  if (shiftError || !shift) {
    return { allowed: false, reason: 'Shift not found.' };
  }

  const shiftDuration = calcDurationHours(shift.start_time, shift.end_time);

  // Fetch current worker count for this shift this week
  const { count: workerCount } = await supabase
    .from('schedule_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('shift_id', shiftId)
    .eq('week_start_date', weekStartDate);

  if ((workerCount ?? 0) >= shift.max_workers) {
    return {
      allowed: false,
      reason: `This shift is full (${workerCount}/${shift.max_workers} workers).`,
    };
  }

  // Fetch employee's max allowed hours
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('employee_types(max_weekly_hours)')
    .eq('id', employeeId)
    .single();

  if (empError || !employee) {
    return { allowed: false, reason: 'Employee not found.' };
  }

  const maxHours = (employee as any).employee_types?.max_weekly_hours ?? 0;

  // Calculate current weekly hours
  const currentHours = await calcWeeklyHours(employeeId, weekStartDate);
  const newTotal = currentHours + shiftDuration;

  if (newTotal > maxHours) {
    return {
      allowed: false,
      reason: `This shift would bring ${employee ? 'the employee' : 'them'} to ${newTotal}h, exceeding their ${maxHours}h weekly limit.`,
    };
  }

  return { allowed: true };
}
