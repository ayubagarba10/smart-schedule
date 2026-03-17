'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getHoursColor, formatTime } from '@/lib/utils/schedule';
import type { EmployeeWithHours, Shift, ScheduleAssignment } from '@/types';

interface AssignDialogProps {
  open: boolean;
  onClose: () => void;
  onAssigned: (assignment: ScheduleAssignment) => void;
  shift: Shift;
  employees: EmployeeWithHours[];
  existingAssignments: ScheduleAssignment[];
}

export function AssignDialog({
  open,
  onClose,
  onAssigned,
  shift,
  employees,
  existingAssignments,
}: AssignDialogProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const assignedEmployeeIds = new Set(existingAssignments.map((a) => a.employee_id));
  const shiftDuration = shift.duration_hours ?? 0;

  // Filter out already-assigned employees
  const availableEmployees = employees.filter((e) => !assignedEmployeeIds.has(e.id));

  const selectedEmployee = availableEmployees.find((e) => e.id === selectedEmployeeId);
  const wouldExceed =
    selectedEmployee && selectedEmployee.remaining_hours < shiftDuration;

  const handleEmployeeChange = (id: string) => {
    setSelectedEmployeeId(id);
    setValidationError('');
  };

  const handleAssign = async () => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee.');
      return;
    }

    setLoading(true);
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
      onClose();
    } catch {
      toast.error('Failed to assign employee. Please try again.');
    } finally {
      setLoading(false);
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
          <DialogTitle>Assign Employee</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{shift.name}</span> — {' '}
            {formatTime(shift.start_time)} to {formatTime(shift.end_time)}{' '}
            ({shiftDuration}h)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current assignments */}
          {existingAssignments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Currently assigned:</p>
              <div className="flex flex-wrap gap-1.5">
                {existingAssignments.map((a) => (
                  <Badge key={a.id} variant="secondary">
                    {(a as any).employees?.name ?? 'Unknown'}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Employee selector */}
          {availableEmployees.length === 0 ? (
            <Alert>
              <AlertDescription>
                All employees are already assigned to this shift or none are available.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <Select value={selectedEmployeeId} onValueChange={handleEmployeeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.map((emp) => {
                    const colors = getHoursColor(emp.usage_percent);
                    const wouldExceedThis = emp.remaining_hours < shiftDuration;
                    return (
                      <SelectItem
                        key={emp.id}
                        value={emp.id}
                        disabled={wouldExceedThis}
                      >
                        <div className="flex items-center justify-between gap-4 w-full">
                          <span className={wouldExceedThis ? 'text-gray-400' : ''}>
                            {emp.name}
                          </span>
                          <span className={`text-xs font-mono ${wouldExceedThis ? 'text-red-400' : colors.text}`}>
                            {emp.remaining_hours}h left
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Per-employee warning */}
              {selectedEmployee && wouldExceed && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 text-sm">
                    This shift ({shiftDuration}h) exceeds {selectedEmployee.name}&apos;s remaining hours ({selectedEmployee.remaining_hours}h).
                  </AlertDescription>
                </Alert>
              )}

              {/* Server validation error */}
              {validationError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 text-sm">
                    {validationError}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={
              loading ||
              !selectedEmployeeId ||
              availableEmployees.length === 0
            }
          >
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
