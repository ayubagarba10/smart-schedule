'use client';

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { getHoursColor, formatTime, calcDurationHours } from '@/lib/utils/schedule';
import { getEmployeeColor, getTextColor } from '@/lib/utils/colors';
import type { EmployeeWithHours, Shift, ScheduleAssignment } from '@/types';
import type { UserRole } from '@/lib/context/RoleContext';

interface CellEditModalProps {
  open: boolean;
  onClose: () => void;
  shift: Shift;
  assignments: ScheduleAssignment[];
  employees: EmployeeWithHours[];
  onAssigned: (assignment: ScheduleAssignment) => void;
  onRemoved: (assignmentId: string) => void;
  onShiftUpdated: (shift: Shift) => void;
  userRole: UserRole;
  currentEmployeeId: string | null;
}

export function CellEditModal({
  open,
  onClose,
  shift,
  assignments,
  employees,
  onAssigned,
  onRemoved,
  onShiftUpdated,
  userRole,
  currentEmployeeId,
}: CellEditModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');

  // Shift editing state (manager only)
  const [editingShift, setEditingShift] = useState(false);
  const [shiftDraft, setShiftDraft] = useState({
    start_time: shift.start_time,
    end_time: shift.end_time,
    min_workers: shift.min_workers,
    max_workers: shift.max_workers,
  });
  const [savingShift, setSavingShift] = useState(false);

  // Reset draft when modal opens or shift changes
  useEffect(() => {
    setShiftDraft({
      start_time: shift.start_time,
      end_time: shift.end_time,
      min_workers: shift.min_workers,
      max_workers: shift.max_workers,
    });
    setEditingShift(false);
  }, [shift.id, open]);

  const isManager = userRole === 'manager';
  const assignedEmployeeIds = new Set(assignments.map((a) => a.employee_id));
  const shiftDuration = shift.duration_hours ?? 0;
  const availableEmployees = employees.filter((e) => !assignedEmployeeIds.has(e.id));
  const selectedEmployee = availableEmployees.find((e) => e.id === selectedEmployeeId);
  const wouldExceed = selectedEmployee && selectedEmployee.remaining_hours < shiftDuration;
  const isFull = assignments.length >= shift.max_workers;

  // Current user's assignment (for employee role)
  const myAssignment = currentEmployeeId
    ? assignments.find((a) => a.employee_id === currentEmployeeId)
    : null;
  const meInEmployeeList = employees.find((e) => e.id === currentEmployeeId);
  const myHoursWouldExceed = meInEmployeeList
    ? meInEmployeeList.remaining_hours < shiftDuration
    : false;

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

  const handleAssignSelf = async () => {
    if (!currentEmployeeId) return;
    setAssigning(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shift_id: shift.id, employee_id: currentEmployeeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Could not assign yourself.');
        return;
      }
      toast.success(`You've been assigned to ${shift.name}.`);
      onAssigned(data);
    } catch {
      toast.error('Failed to assign yourself.');
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

  const handleSaveShift = async () => {
    if (shiftDraft.start_time >= shiftDraft.end_time) {
      toast.error('End time must be after start time.');
      return;
    }
    if (Number(shiftDraft.min_workers) > Number(shiftDraft.max_workers)) {
      toast.error('Min workers cannot exceed max workers.');
      return;
    }
    setSavingShift(true);
    try {
      const res = await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: shift.id,
          name: shift.name,
          day_of_week: shift.day_of_week,
          ...shiftDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to update shift.');
        return;
      }
      toast.success('Shift updated.');
      onShiftUpdated({ ...data, duration_hours: calcDurationHours(data.start_time, data.end_time) });
      setEditingShift(false);
    } catch {
      toast.error('Failed to update shift.');
    } finally {
      setSavingShift(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployeeId('');
    setValidationError('');
    setEditingShift(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{shift.name}</DialogTitle>
          <p className="text-sm text-gray-500">
            {formatTime(shift.start_time)} – {formatTime(shift.end_time)} &nbsp;·&nbsp;{' '}
            {shiftDuration}h &nbsp;·&nbsp; {assignments.length}/{shift.max_workers} workers
          </p>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* ── MANAGER VIEW ── */}
          {isManager && (
            <>
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
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
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
                          <AlertDescription className="text-red-700 text-sm">{validationError}</AlertDescription>
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

              {isFull && <p className="text-xs text-gray-400 italic">Shift is at full capacity.</p>}

              {/* Edit shift times */}
              <div className="border-t pt-3">
                {!editingShift ? (
                  <button
                    onClick={() => setEditingShift(true)}
                    className="text-xs text-indigo-600 hover:underline font-medium"
                  >
                    ✎ Edit shift times &amp; capacity
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-gray-500">Edit shift</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Start time</label>
                        <Input
                          type="time"
                          value={shiftDraft.start_time}
                          onChange={(e) => setShiftDraft((d) => ({ ...d, start_time: e.target.value }))}
                          className="text-sm h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">End time</label>
                        <Input
                          type="time"
                          value={shiftDraft.end_time}
                          onChange={(e) => setShiftDraft((d) => ({ ...d, end_time: e.target.value }))}
                          className="text-sm h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Min workers</label>
                        <Input
                          type="number"
                          min={0}
                          value={shiftDraft.min_workers}
                          onChange={(e) => setShiftDraft((d) => ({ ...d, min_workers: Number(e.target.value) }))}
                          className="text-sm h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Max workers</label>
                        <Input
                          type="number"
                          min={1}
                          value={shiftDraft.max_workers}
                          onChange={(e) => setShiftDraft((d) => ({ ...d, max_workers: Number(e.target.value) }))}
                          className="text-sm h-8"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveShift} disabled={savingShift} className="flex-1">
                        {savingShift ? 'Saving...' : 'Save'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingShift(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── EMPLOYEE VIEW ── */}
          {!isManager && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                {assignments.length}/{shift.max_workers} workers assigned
              </p>

              {myAssignment ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleRemove(myAssignment.id, meInEmployeeList?.name ?? 'You')}
                  disabled={removingId === myAssignment.id}
                >
                  {removingId === myAssignment.id ? 'Removing...' : 'Remove Me from this shift'}
                </Button>
              ) : isFull ? (
                <p className="text-xs text-gray-400 italic">Shift is at full capacity.</p>
              ) : myHoursWouldExceed ? (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 text-sm">
                    This shift ({shiftDuration}h) would exceed your remaining hours ({meInEmployeeList?.remaining_hours ?? 0}h).
                  </AlertDescription>
                </Alert>
              ) : currentEmployeeId ? (
                <Button size="sm" className="w-full" onClick={handleAssignSelf} disabled={assigning}>
                  {assigning ? 'Adding...' : 'Add Me to this shift'}
                </Button>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Your employee profile is not linked to your account.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
