// ============================================================
// Database Types
// ============================================================

export interface EmployeeType {
  id: string;
  name: string;
  max_weekly_hours: number;
  is_active: boolean;
  created_at: string;
}

export interface Employee {
  id: string;
  name: string;
  employee_type_id: string | null;
  created_at: string;
  // Joined fields
  employee_types?: EmployeeType | null;
}

export interface Shift {
  id: string;
  name: string;
  day_of_week: number; // 0=Monday … 6=Sunday
  start_time: string;  // "HH:MM"
  end_time: string;    // "HH:MM"
  min_workers: number;
  max_workers: number;
  created_at: string;
  // Computed
  duration_hours?: number;
}

export interface ScheduleAssignment {
  id: string;
  shift_id: string;
  employee_id: string;
  week_start_date: string; // ISO date "YYYY-MM-DD"
  created_at: string;
  // Joined fields
  employees?: Employee | null;
  shifts?: Shift | null;
}

// ============================================================
// App-level computed types
// ============================================================

export interface EmployeeWithHours extends Employee {
  scheduled_hours: number;
  remaining_hours: number;
  max_hours: number;
  usage_percent: number;
}

export interface ShiftWithAssignments extends Shift {
  assignments: ScheduleAssignment[];
  worker_count: number;
  is_full: boolean;
  is_nearly_full: boolean;
  duration_hours: number;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
}
