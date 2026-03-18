'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { toast } from 'sonner';
import { getHoursColor } from '@/lib/utils/schedule';
import { getEmployeeColor } from '@/lib/utils/colors';
import type { EmployeeWithHours, EmployeeType, Employee } from '@/types';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeWithHours[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);

  const fetchData = async () => {
    try {
      const [empRes, typesRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/employee-types'),
      ]);
      const emps = await empRes.json();
      const types = await typesRes.json();
      setEmployees(Array.isArray(emps) ? emps : []);
      setEmployeeTypes(Array.isArray(types) ? types : []);
    } catch {
      toast.error('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}? This will also remove all their shift assignments.`)) return;

    try {
      const res = await fetch('/api/employees', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success(`${name} removed.`);
      fetchData();
    } catch {
      toast.error('Failed to remove employee.');
    }
  };

  const handleEdit = (emp: EmployeeWithHours) => {
    setEditEmployee(emp as unknown as Employee);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditEmployee(null);
    setFormOpen(true);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500">{employees.length} employee{employees.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Button onClick={handleAdd}>+ Add Employee</Button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No employees yet. Click &quot;Add Employee&quot; to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Hours Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => {
                const colors = getHoursColor(emp.usage_percent);
                const typeName = (emp as any).employee_types?.name ?? '—';
                return (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: getEmployeeColor(emp.id) }}
                        />
                        {emp.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeName}</Badge>
                    </TableCell>
                    <TableCell className={`font-mono text-sm ${colors.text}`}>
                      {emp.scheduled_hours}h
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-600">
                      {emp.remaining_hours}h
                    </TableCell>
                    <TableCell className="w-40">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(emp.usage_percent, 100)}
                          className="h-2 flex-1"
                        />
                        <span className="text-xs text-gray-500 w-8 text-right">
                          {emp.usage_percent}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(emp)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(emp.id, emp.name)}
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {!loading && employeeTypes.filter((t) => t.is_active).length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No active employee types are configured.{' '}
          <a href="/settings" className="font-medium underline">
            Go to Settings
          </a>{' '}
          to add employee types before creating employees.
        </div>
      )}

      <EmployeeForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditEmployee(null);
        }}
        onSaved={fetchData}
        employee={editEmployee}
        employeeTypes={employeeTypes}
      />
    </div>
  );
}
