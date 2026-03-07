'use client';

import { useState, useCallback } from 'react';
import { ShiftCell } from './ShiftCell';
import { DAY_LABELS, formatTime, calcDurationHours } from '@/lib/utils/schedule';
import type { EmployeeWithHours, Shift, ScheduleAssignment } from '@/types';

interface WeeklyGridProps {
  initialShifts: Shift[];
  initialAssignments: ScheduleAssignment[];
  initialEmployees: EmployeeWithHours[];
}

// Group shifts by day_of_week, then by shift name (Morning/Afternoon/Evening)
function groupShifts(shifts: Shift[]) {
  const byDay: Record<number, Shift[]> = {};
  for (let d = 0; d <= 6; d++) byDay[d] = [];
  for (const shift of shifts) {
    byDay[shift.day_of_week]?.push(shift);
  }
  return byDay;
}

// Get unique shift names in order
function getShiftNames(shifts: Shift[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const s of shifts) {
    if (!seen.has(s.name)) {
      seen.add(s.name);
      result.push(s.name);
    }
  }
  return result;
}

export function WeeklyGrid({
  initialShifts,
  initialAssignments,
  initialEmployees,
}: WeeklyGridProps) {
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>(initialAssignments);
  const [employees, setEmployees] = useState<EmployeeWithHours[]>(initialEmployees);

  const shiftsByDay = groupShifts(initialShifts);
  const shiftNames = getShiftNames(initialShifts);

  // Recompute employee hours after a change
  const recomputeEmployeeHours = useCallback(
    (updatedAssignments: ScheduleAssignment[], shiftsMap: Map<string, Shift>) => {
      setEmployees((prev) =>
        prev.map((emp) => {
          const empAssignments = updatedAssignments.filter(
            (a) => a.employee_id === emp.id
          );
          const scheduledHours = empAssignments.reduce((total, a) => {
            const shift = shiftsMap.get(a.shift_id);
            if (!shift) return total;
            return total + calcDurationHours(shift.start_time, shift.end_time);
          }, 0);
          const maxHours = emp.max_hours;
          return {
            ...emp,
            scheduled_hours: scheduledHours,
            remaining_hours: Math.max(0, maxHours - scheduledHours),
            usage_percent: maxHours > 0 ? Math.round((scheduledHours / maxHours) * 100) : 0,
          };
        })
      );
    },
    []
  );

  const shiftsMap = new Map(initialShifts.map((s) => [s.id, s]));

  const handleAssigned = useCallback(
    (assignment: ScheduleAssignment) => {
      const updated = [...assignments, assignment];
      setAssignments(updated);
      recomputeEmployeeHours(updated, shiftsMap);
    },
    [assignments, shiftsMap, recomputeEmployeeHours]
  );

  const handleRemoved = useCallback(
    (assignmentId: string) => {
      const updated = assignments.filter((a) => a.id !== assignmentId);
      setAssignments(updated);
      recomputeEmployeeHours(updated, shiftsMap);
    },
    [assignments, shiftsMap, recomputeEmployeeHours]
  );

  if (initialShifts.length === 0) {
    return (
      <div className="text-center text-gray-500 py-16">
        No shifts configured. Go to Settings to add shifts.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {/* Shift name column header */}
            <th className="sticky left-0 bg-gray-50 border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 min-w-[100px] z-10">
              Shift
            </th>
            {/* Day headers */}
            {DAY_LABELS.map((day, idx) => (
              <th
                key={day}
                className="border border-gray-200 px-2 py-2 text-center font-semibold text-gray-700 min-w-[130px]"
              >
                <div>{day}</div>
                {/* Show if today */}
                {isToday(idx) && (
                  <div className="text-[10px] font-normal text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5 mt-0.5 inline-block">
                    Today
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shiftNames.map((shiftName) => (
            <tr key={shiftName} className="hover:bg-gray-50/50">
              {/* Row label: shift name + representative time */}
              <td className="sticky left-0 bg-white border border-gray-200 px-3 py-2 font-medium text-gray-800 z-10">
                <div className="font-semibold">{shiftName}</div>
                {/* Show time from Monday's shift of this name */}
                {(() => {
                  const refShift = shiftsByDay[0]?.find((s) => s.name === shiftName)
                    ?? shiftsByDay[5]?.find((s) => s.name === shiftName);
                  if (!refShift) return null;
                  return (
                    <div className="text-[10px] text-gray-400 font-normal">
                      {formatTime(refShift.start_time)}–{formatTime(refShift.end_time)}
                    </div>
                  );
                })()}
              </td>

              {/* Cells for each day */}
              {Array.from({ length: 7 }, (_, dayIdx) => {
                const shift = shiftsByDay[dayIdx]?.find((s) => s.name === shiftName);
                const cellAssignments = shift
                  ? assignments.filter((a) => a.shift_id === shift.id)
                  : [];

                return (
                  <td
                    key={dayIdx}
                    className="border border-gray-200 align-top p-0"
                  >
                    {shift ? (
                      <ShiftCell
                        shift={{
                          ...shift,
                          duration_hours: calcDurationHours(shift.start_time, shift.end_time),
                        }}
                        assignments={cellAssignments}
                        employees={employees}
                        onAssigned={handleAssigned}
                        onRemoved={handleRemoved}
                      />
                    ) : (
                      <div className="h-[80px] bg-gray-50/80 flex items-center justify-center">
                        <span className="text-xs text-gray-300">—</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Check if a day index (0=Monday) corresponds to today
function isToday(dayIdx: number): boolean {
  const today = new Date().getDay(); // 0=Sunday
  const todayAdjusted = today === 0 ? 6 : today - 1; // Convert to 0=Monday
  return dayIdx === todayAdjusted;
}
