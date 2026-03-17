// ============================================================
// Schedule Utility Functions
// ============================================================

export const DAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const SHORT_DAY_LABELS = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
] as const;

/**
 * Returns the Monday of the current week as a Date object (local time, midnight).
 */
export function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sunday, 1=Monday, ...
  const diff = day === 0 ? -6 : 1 - day; // How many days back to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Returns the Monday of the current week as an ISO date string "YYYY-MM-DD".
 */
export function getWeekStartISO(): string {
  return toISODate(getWeekStart());
}

/**
 * Converts a Date to "YYYY-MM-DD" format using local time.
 */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns a human-readable label for a day index (0=Monday).
 */
export function getDayLabel(dayIndex: number): string {
  return DAY_LABELS[dayIndex] ?? 'Unknown';
}

/**
 * Formats a time string "HH:MM" to "h:MM AM/PM".
 */
export function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr ?? '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${ampm}`;
}

/**
 * Calculates the duration in hours between two "HH:MM" time strings.
 */
export function calcDurationHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return (endMinutes - startMinutes) / 60;
}

/**
 * Returns the dates (Mon–Sun) for the current week as ISO strings.
 */
export function getCurrentWeekDates(): string[] {
  const monday = getWeekStart();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toISODate(d);
  });
}

/**
 * Returns color class based on hours usage percentage.
 */
export function getHoursColor(usagePercent: number): {
  bar: string;
  text: string;
  badge: string;
} {
  if (usagePercent >= 100) {
    return { bar: 'bg-red-500', text: 'text-red-600', badge: 'bg-red-100 text-red-700' };
  }
  if (usagePercent >= 80) {
    return { bar: 'bg-yellow-400', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' };
  }
  return { bar: 'bg-green-500', text: 'text-green-600', badge: 'bg-green-100 text-green-700' };
}

/**
 * Returns color class for shift capacity status.
 */
export function getCapacityColor(workerCount: number, maxWorkers: number): string {
  if (workerCount >= maxWorkers) return 'bg-red-100 text-red-700 border-red-200';
  if (workerCount === maxWorkers - 1) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-green-100 text-green-700 border-green-200';
}
