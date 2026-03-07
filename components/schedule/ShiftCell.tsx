'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AssignDialog } from './AssignDialog';
import { getCapacityColor, formatTime } from '@/lib/utils/schedule';
import { toast } from 'sonner';
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const workerCount = assignments.length;
  const isFull = workerCount >= shift.max_workers;
  const capacityClass = getCapacityColor(workerCount, shift.max_workers);

  const handleRemove = async (assignmentId: string, employeeName: string) => {
    setRemovingId(assignmentId);
    try {
      const res = await fetch('/api/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignmentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to remove assignment.');
      }

      toast.success(`${employeeName} removed from shift.`);
      onRemoved(assignmentId);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="p-2 min-h-[80px] flex flex-col gap-1.5">
      {/* Employee chips */}
      <div className="flex flex-wrap gap-1">
        {assignments.map((assignment) => {
          const empName = (assignment as any).employees?.name ?? 'Unknown';
          return (
            <div
              key={assignment.id}
              className="flex items-center gap-0.5 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5 text-xs font-medium text-indigo-800 group"
            >
              <span>{empName}</span>
              <button
                onClick={() => handleRemove(assignment.id, empName)}
                disabled={removingId === assignment.id}
                className="ml-1 rounded-full hover:bg-indigo-200 w-3.5 h-3.5 flex items-center justify-center text-indigo-500 hover:text-indigo-800 transition-colors"
                title={`Remove ${empName}`}
                aria-label={`Remove ${empName}`}
              >
                {removingId === assignment.id ? (
                  <span className="text-[8px]">...</span>
                ) : (
                  <span className="text-[10px] leading-none">✕</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer row: capacity badge + add button */}
      <div className="flex items-center justify-between mt-auto">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${capacityClass}`}
        >
          {workerCount}/{shift.max_workers}
        </Badge>

        {!isFull && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
            onClick={() => setDialogOpen(true)}
            title="Add employee to shift"
          >
            +
          </Button>
        )}
      </div>

      {/* Assignment dialog */}
      <AssignDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAssigned={(assignment) => {
          onAssigned(assignment);
          setDialogOpen(false);
        }}
        shift={shift}
        employees={employees}
        existingAssignments={assignments}
      />
    </div>
  );
}
