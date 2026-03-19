'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CellEditModal } from './CellEditModal';
import { DAY_LABELS, formatTime, calcDurationHours, getCapacityColor } from '@/lib/utils/schedule';
import { getEmployeeColor, getTextColor } from '@/lib/utils/colors';
import type { EmployeeWithHours, Shift, ScheduleAssignment } from '@/types';
import type { UserRole } from '@/lib/context/RoleContext';

interface MobileDayViewProps {
  selectedDay: number;
  onSelectDay: (day: number) => void;
  shifts: Shift[];
  assignments: ScheduleAssignment[];
  employees: EmployeeWithHours[];
  onAssigned: (assignment: ScheduleAssignment) => void;
  onRemoved: (assignmentId: string) => void;
  onShiftUpdated: (shift: Shift) => void;
  userRole: UserRole;
  currentEmployeeId: string | null;
}

function isToday(dayIdx: number): boolean {
  const today = new Date().getDay();
  const todayAdjusted = today === 0 ? 6 : today - 1;
  return dayIdx === todayAdjusted;
}

export function MobileDayView({
  selectedDay,
  onSelectDay,
  shifts,
  assignments,
  employees,
  onAssigned,
  onRemoved,
  onShiftUpdated,
  userRole,
  currentEmployeeId,
}: MobileDayViewProps) {
  const [openShiftId, setOpenShiftId] = useState<string | null>(null);

  const dayShifts = shifts.filter((s) => s.day_of_week === selectedDay);

  return (
    <div>
      {/* Day tab bar */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-white">
        {DAY_LABELS.map((label, idx) => {
          const active = idx === selectedDay;
          const today = isToday(idx);
          return (
            <button
              key={idx}
              onClick={() => onSelectDay(idx)}
              className={`flex-shrink-0 flex flex-col items-center justify-center px-3 py-2.5 min-w-[48px] border-b-2 transition-colors ${
                active
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <span className="text-xs font-semibold">{label.slice(0, 3)}</span>
              {today && (
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
              )}
            </button>
          );
        })}
      </div>

      {/* Shift cards */}
      <div className="p-3 space-y-3">
        {dayShifts.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">No shifts on this day.</p>
        ) : (
          dayShifts.map((shift) => {
            const shiftWithDuration: Shift = {
              ...shift,
              duration_hours: calcDurationHours(shift.start_time, shift.end_time),
            };
            const cellAssignments = assignments.filter((a) => a.shift_id === shift.id);
            const workerCount = cellAssignments.length;
            const capacityClass = getCapacityColor(workerCount, shift.max_workers);

            return (
              <div key={shift.id}>
                <button
                  onClick={() => setOpenShiftId(shift.id)}
                  className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 space-y-3 active:bg-gray-50 transition-colors"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-base">{shift.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
                        {' · '}{shiftWithDuration.duration_hours}h
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${capacityClass}`}
                    >
                      {workerCount}/{shift.max_workers}
                    </Badge>
                  </div>

                  {/* Assigned employee chips */}
                  {cellAssignments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {cellAssignments.map((a) => {
                        const empName = (a as any).employees?.name ?? 'Unknown';
                        const bg = getEmployeeColor(a.employee_id);
                        const fg = getTextColor(bg);
                        return (
                          <span
                            key={a.id}
                            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: bg, color: fg }}
                          >
                            {empName}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {cellAssignments.length === 0 && (
                    <p className="text-xs text-gray-400">No one assigned yet</p>
                  )}
                </button>

                <CellEditModal
                  open={openShiftId === shift.id}
                  onClose={() => setOpenShiftId(null)}
                  shift={shiftWithDuration}
                  assignments={cellAssignments}
                  employees={employees}
                  onAssigned={onAssigned}
                  onRemoved={onRemoved}
                  onShiftUpdated={onShiftUpdated}
                  userRole={userRole}
                  currentEmployeeId={currentEmployeeId}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
