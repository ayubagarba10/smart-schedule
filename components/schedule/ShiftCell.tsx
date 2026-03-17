'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CellEditModal } from './CellEditModal';
import { getCapacityColor } from '@/lib/utils/schedule';
import { getEmployeeColor, getTextColor } from '@/lib/utils/colors';
import type { EmployeeWithHours, Shift, ScheduleAssignment } from '@/types';

interface ShiftCellProps {
  shift: Shift;
  assignments: ScheduleAssignment[];
  employees: EmployeeWithHours[];
  onAssigned: (assignment: ScheduleAssignment) => void;
  onRemoved: (assignmentId: string) => void;
}

export function ShiftCell({
  shift,
  assignments,
  employees,
  onAssigned,
  onRemoved,
}: ShiftCellProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const workerCount = assignments.length;
  const capacityClass = getCapacityColor(workerCount, shift.max_workers);

  return (
    <>
      <div
        className="p-2 min-h-[80px] flex flex-col gap-1.5 cursor-pointer hover:bg-indigo-50/40 transition-colors"
        onClick={() => setModalOpen(true)}
        title="Click to edit shift"
      >
        {/* Employee chips */}
        <div className="flex flex-wrap gap-1">
          {assignments.map((assignment) => {
            const empName = (assignment as any).employees?.name ?? 'Unknown';
            const bg = getEmployeeColor(assignment.employee_id);
            const fg = getTextColor(bg);
            return (
              <div
                key={assignment.id}
                className="flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: bg, color: fg }}
              >
                {empName}
              </div>
            );
          })}
        </div>

        {/* Footer: capacity badge */}
        <div className="mt-auto">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${capacityClass}`}
          >
            {workerCount}/{shift.max_workers}
          </Badge>
        </div>
      </div>

      <CellEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        shift={shift}
        assignments={assignments}
        employees={employees}
        onAssigned={(assignment) => {
          onAssigned(assignment);
        }}
        onRemoved={(assignmentId) => {
          onRemoved(assignmentId);
        }}
      />
    </>
  );
}
