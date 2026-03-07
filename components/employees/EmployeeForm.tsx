'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import type { Employee, EmployeeType } from '@/types';

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  employee?: Employee | null;
  employeeTypes: EmployeeType[];
}

export function EmployeeForm({
  open,
  onClose,
  onSaved,
  employee,
  employeeTypes,
}: EmployeeFormProps) {
  const isEdit = !!employee;
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Sync form state whenever the form opens or the employee changes
  useEffect(() => {
    if (open) {
      setName(employee?.name ?? '');
      setTypeId(employee?.employee_type_id ?? undefined);
    }
  }, [open, employee]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required.');
      return;
    }

    setLoading(true);
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit
        ? { id: employee!.id, name, employee_type_id: typeId ?? null }
        : { name, employee_type_id: typeId ?? null };

      const res = await fetch('/api/employees', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save employee.');
      }

      toast.success(isEdit ? 'Employee updated.' : 'Employee added.');
      onSaved();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save employee.');
    } finally {
      setLoading(false);
    }
  };

  // Only show active types in the dropdown
  const activeTypes = employeeTypes.filter((t) => t.is_active);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Employee' : 'Add Employee'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update the employee details below.'
              : 'Fill in the details to add a new employee.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="emp-name">Full Name</Label>
            <Input
              id="emp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ayuba Smith"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-type">Employment Type</Label>
            {activeTypes.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                No active employee types found. Go to{' '}
                <a href="/settings" className="underline font-medium">Settings</a>{' '}
                to add them first.
              </p>
            ) : (
              <Select value={typeId} onValueChange={setTypeId}>
                <SelectTrigger id="emp-type" className="w-full">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {activeTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.max_weekly_hours}h max)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : isEdit ? 'Update Employee' : 'Add Employee'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
