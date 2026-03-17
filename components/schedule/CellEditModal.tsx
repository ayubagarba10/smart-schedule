'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { getHoursColor, formatTime } from '@/lib/utils/schedule';
import { getEmployeeColor, getTextColor } from '@/lib/utils/colors';
import type { EmployeeWithHours, Shift, ScheduleAssignment } from '@/types';

interface CellEditModalProps {
  open: boolean;
  onClose: () => void;
  shift: Shift;
  assignments: ScheduleAssignment[];
  employees: EmployeeWithHours[];
  onAssigned: (assignment: ScheduleAssignment) => void;
  onRemoved: (assignmentId: string) => void;
}

export function CellEditModal({
  open,
  onClose,
  shift,
  assignments,
  employees,
  onAssigned,
  onRemoved,
}: CellEditModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');

  const assignedEmployeeIds = new Set(assignments.map((a) => a.employee_id));
  const shiftDuration = shift.duration_hours ?? 0;
  const availableEmployees = employees.filter((e) => !assignedEmployeeIds.has(e.id));
  const selectedEmployee = availableEmployees.find((e) => e.id === selectedEmployeeId);
  const wouldExceed = selectedEmployee && selectedEmployee.remaining_hours < shiftDuration;
  const isFull = assignments.length >= shift.max_workers;

  const handleAssign = async () => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee.');
      return;
    }
    setAssigning(true);
    setValidationError('');
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shift_id: shift.id, employee_id: selectedEmployeeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setValidationError(data.error ?? 'Could not assign employee.');
        return;
      }
      toast.success(`${selectedEmployee?.name ?? 'Employee'} assigned to ${shift.name}.`);
      onAssigned(data);
      setSelectedEmployeeId('');
    } catch {
      toast.error('Failed to assign employee.');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (assignmentId: string, empName: string) => {
    setRemovingId(assignmentId);
    try {
      const res = await fetch('/api/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignmentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to remove.');
      }
      toast.success(`${empName} removed from shift.`);
      onRemoved(assignmentId);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  const handleClose = () => {
    setSelectedEmployeeId('');
    setValidationError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {shift.name}
          </DialogTitle>
          <p className="text-sm text-gray-500">
            {formatTime(shift.start_time)} – {formatTime(shift.end_time)} &nbsp;·&nbsp;{' '}
            {shiftDuration}h &nbsp;·&nbsp; {assignments.length}/{shift.max_workers} workers
          </p>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Assigned employees */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Assigned</p>
            {assignments.length === 0 ? (
              <p className="text-xs text-gray-400">No one assigned yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {assignments.map((a) => {
                  const empName = (a as any).employees?.name ?? 'Unknown';
                  const bg = getEmployeeColor(a.employee_id);
                  const fg = getTextColor(bg);
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: bg, color: fg }}
                    >
                      <span>{empName}</span>
                      <button
                        onClick={() => handleRemove(a.id, empName)}
                        disabled={removingId === a.id}
                        className="ml-0.5 rounded-full w-3.5 h-3.5 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
                        title={`Remove ${empName}`}
                      >
                        {removingId === a.id ? '…' : '✕'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add employee */}
          {!isFull && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Add employee</p>
              {availableEmployees.length === 0 ? (
                <Alert>
                  <AlertDescription className="text-sm">
                    All employees are already assigned or unavailable.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Select
                    value={selectedEmployeeId}
                    onValueChange={(v) => { setSelectedEmployeeId(v); setValidationError(''); }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEmployees.map((emp) => {
                        const colors = getHoursColor(emp.usage_percent);
                        const wouldExceedThis = emp.remaining_hours < shiftDuration;
                        const dot = getEmployeeColor(emp.id);
                        return (
                          <SelectItem key={emp.id} value={emp.id} disabled={wouldExceedThis}>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: dot }}
                              />
                              <span className={wouldExceedThis ? 'text-gray-400' : ''}>{emp.name}</span>
                              <span className={`text-xs font-mono ml-auto ${wouldExceedThis ? 'text-red-400' : colors.text}`}>
                                {emp.remaining_hours}h left
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {selectedEmployee && wouldExceed && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700 text-sm">
                        This shift ({shiftDuration}h) exceeds {selectedEmployee.name}&apos;s remaining hours ({selectedEmployee.remaining_hours}h).
                      </AlertDescription>
                    </Alert>
                  )}

                  {validationError && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700 text-sm">
                        {validationError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleAssign}
                    disabled={assigning || !selectedEmployeeId}
                    size="sm"
                    className="w-full"
                  >
                    {assigning ? 'Assigning...' : 'Assign'}
                  </Button>
                </>
              )}
            </div>
          )}

          {isFull && (
            <p className="text-xs text-gray-400 italic">Shift is at full capacity.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
