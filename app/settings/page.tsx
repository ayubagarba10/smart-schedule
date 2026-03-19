'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { DAY_LABELS, formatTime, calcDurationHours } from '@/lib/utils/schedule';
import type { EmployeeType, Shift } from '@/types';

export default function SettingsPage() {
  const [types, setTypes] = useState<EmployeeType[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  // New employment type form
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeHours, setNewTypeHours] = useState('');

  // Inline shift editing
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Shift & { day_of_week: number }>>({});

  const handleEditShift = (s: Shift) => {
    setEditingShiftId(s.id);
    setEditDraft({ ...s });
  };

  const handleSaveShift = async () => {
    if (!editingShiftId) return;
    try {
      const res = await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingShiftId,
          name: editDraft.name,
          day_of_week: Number(editDraft.day_of_week),
          start_time: editDraft.start_time,
          end_time: editDraft.end_time,
          min_workers: Number(editDraft.min_workers),
          max_workers: Number(editDraft.max_workers),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update shift.');
      setShifts((prev) => prev.map((s) => (s.id === editingShiftId ? data : s)));
      toast.success('Shift updated.');
      setEditingShiftId(null);
      setEditDraft({});
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update shift.');
    }
  };

  const handleCancelEdit = () => {
    setEditingShiftId(null);
    setEditDraft({});
  };

  // New shift form
  const [newShift, setNewShift] = useState({
    name: '',
    day_of_week: '0',
    start_time: '',
    end_time: '',
    min_workers: '1',
    max_workers: '2',
  });

  const fetchData = async () => {
    try {
      const [typesRes, shiftsRes] = await Promise.all([
        fetch('/api/employee-types'),
        fetch('/api/shifts'),
      ]);
      const typesData = await typesRes.json();
      const shiftsData = await shiftsRes.json();
      setTypes(Array.isArray(typesData) ? typesData : []);
      setShifts(Array.isArray(shiftsData) ? shiftsData : []);
    } catch {
      toast.error('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Employee Types ---
  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim() || !newTypeHours) {
      toast.error('Type name and max hours are required.');
      return;
    }
    try {
      const res = await fetch('/api/employee-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTypeName,
          max_weekly_hours: Number(newTypeHours),
          is_active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add type.');
      toast.success('Employment type added.');
      setNewTypeName('');
      setNewTypeHours('');
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add type.');
    }
  };

  const handleToggleType = async (t: EmployeeType) => {
    try {
      const res = await fetch('/api/employee-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, is_active: !t.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update type.');
      toast.success(`"${t.name}" ${!t.is_active ? 'activated' : 'deactivated'}.`);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update type.');
    }
  };

  const handleDeleteType = async (id: string, name: string) => {
    if (!confirm(`Delete type "${name}"? Employees with this type will lose their type.`)) return;
    try {
      const res = await fetch('/api/employee-types', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete type.');
      toast.success(`"${name}" deleted.`);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete type.');
    }
  };

  // --- Shifts ---
  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.name || !newShift.start_time || !newShift.end_time) {
      toast.error('Shift name, start time, and end time are required.');
      return;
    }
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newShift,
          day_of_week: Number(newShift.day_of_week),
          min_workers: Number(newShift.min_workers),
          max_workers: Number(newShift.max_workers),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add shift.');
      toast.success('Shift added.');
      setNewShift({ name: '', day_of_week: '0', start_time: '', end_time: '', min_workers: '1', max_workers: '2' });
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add shift.');
    }
  };

  const handleDeleteShift = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" shift? All assignments for this shift will also be removed.`)) return;
    try {
      const res = await fetch('/api/shifts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete shift.');
      toast.success(`"${name}" shift deleted.`);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete shift.');
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-10">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* ── Employment Types ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Employment Types</h2>
          <p className="text-sm text-gray-500">Configure the weekly hour limits for each employment category.</p>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden space-y-3">
          {types.length === 0 ? (
            <p className="text-center text-gray-400 py-8 bg-white border rounded-xl text-sm">
              No employment types configured yet. Add one below.
            </p>
          ) : (
            types.map((t) => (
              <div key={t.id} className={`bg-white border rounded-xl p-4 space-y-3 ${!t.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.max_weekly_hours}h / week</p>
                  </div>
                  <Badge variant={t.is_active ? 'default' : 'outline'}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-10"
                    onClick={() => handleToggleType(t)}
                  >
                    {t.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-10 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleDeleteType(t.id, t.name)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block bg-white border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type Name</TableHead>
                <TableHead>Max Weekly Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                    No employment types configured yet. Add one below.
                  </TableCell>
                </TableRow>
              ) : (
                types.map((t) => (
                  <TableRow key={t.id} className={!t.is_active ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.max_weekly_hours}h / week</TableCell>
                    <TableCell>
                      <Badge variant={t.is_active ? 'default' : 'outline'}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleType(t)}
                        >
                          {t.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteType(t.id, t.name)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add type form */}
        <form onSubmit={handleAddType} className="flex flex-col gap-3 sm:flex-row sm:items-end bg-white border rounded-xl p-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="type-name">Type Name</Label>
            <Input
              id="type-name"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="e.g. Part-Time"
            />
          </div>
          <div className="sm:w-40 space-y-1">
            <Label htmlFor="type-hours">Max Hours / Week</Label>
            <Input
              id="type-hours"
              type="number"
              min="1"
              max="168"
              value={newTypeHours}
              onChange={(e) => setNewTypeHours(e.target.value)}
              placeholder="20"
            />
          </div>
          <Button type="submit" className="h-10 sm:h-9">Add Type</Button>
        </form>
      </section>

      <Separator />

      {/* ── Shifts ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Shift Definitions</h2>
          <p className="text-sm text-gray-500">Define the predefined shift time blocks for each day of the week.</p>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden space-y-3">
          {shifts.length === 0 ? (
            <p className="text-center text-gray-400 py-8 bg-white border rounded-xl text-sm">
              No shifts configured yet. Add shifts using the form below.
            </p>
          ) : (
            shifts.map((s) => {
              const isEditing = editingShiftId === s.id;
              return (
                <div key={s.id} className={`bg-white border rounded-xl p-4 space-y-3 ${isEditing ? 'border-indigo-300' : ''}`}>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Day</label>
                          <select
                            className="w-full border rounded-md px-2 py-2 text-sm"
                            value={editDraft.day_of_week}
                            onChange={(e) => setEditDraft((d) => ({ ...d, day_of_week: Number(e.target.value) }))}
                          >
                            {DAY_LABELS.map((label, idx) => (
                              <option key={idx} value={idx}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Shift Name</label>
                          <Input
                            value={editDraft.name ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Start Time</label>
                          <input
                            type="time"
                            className="w-full border rounded-md px-2 py-2 text-sm"
                            value={editDraft.start_time ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, start_time: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">End Time</label>
                          <input
                            type="time"
                            className="w-full border rounded-md px-2 py-2 text-sm"
                            value={editDraft.end_time ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, end_time: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Min Workers</label>
                          <input
                            type="number"
                            min={0}
                            className="w-full border rounded-md px-2 py-2 text-sm"
                            value={editDraft.min_workers ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, min_workers: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Max Workers</label>
                          <input
                            type="number"
                            min={1}
                            className="w-full border rounded-md px-2 py-2 text-sm"
                            value={editDraft.max_workers ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, max_workers: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1 h-11" onClick={handleSaveShift}>Save</Button>
                        <Button className="flex-1 h-11" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900">{s.name}</p>
                          <p className="text-sm text-gray-500">{DAY_LABELS[s.day_of_week]}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono text-gray-700">{formatTime(s.start_time)}–{formatTime(s.end_time)}</p>
                          <p className="text-xs text-gray-500">{calcDurationHours(s.start_time, s.end_time)}h · {s.min_workers}–{s.max_workers} workers</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-10"
                          onClick={() => handleEditShift(s)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-10 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDeleteShift(s.id, `${DAY_LABELS[s.day_of_week]} ${s.name}`)}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block bg-white border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Workers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    No shifts configured yet. Add shifts using the form below.
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((s) => {
                  const isEditing = editingShiftId === s.id;
                  return (
                  <TableRow
                    key={s.id}
                    className={isEditing ? 'bg-indigo-50' : 'cursor-pointer hover:bg-gray-50'}
                    onClick={() => { if (!isEditing) handleEditShift(s); }}
                  >
                    {/* Day */}
                    <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                      {isEditing ? (
                        <select
                          className="border rounded px-1.5 py-1 text-sm"
                          value={editDraft.day_of_week}
                          onChange={(e) => setEditDraft((d) => ({ ...d, day_of_week: Number(e.target.value) }))}
                        >
                          {DAY_LABELS.map((label, idx) => (
                            <option key={idx} value={idx}>{label}</option>
                          ))}
                        </select>
                      ) : DAY_LABELS[s.day_of_week]}
                    </TableCell>
                    {/* Shift name */}
                    <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                      {isEditing ? (
                        <Input
                          className="h-7 text-sm w-28"
                          value={editDraft.name ?? ''}
                          onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                        />
                      ) : <span className="font-medium">{s.name}</span>}
                    </TableCell>
                    {/* Start time */}
                    <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                      {isEditing ? (
                        <input
                          type="time"
                          className="border rounded px-1.5 py-1 text-sm"
                          value={editDraft.start_time ?? ''}
                          onChange={(e) => setEditDraft((d) => ({ ...d, start_time: e.target.value }))}
                        />
                      ) : <span className="font-mono text-sm">{formatTime(s.start_time)}</span>}
                    </TableCell>
                    {/* End time */}
                    <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                      {isEditing ? (
                        <input
                          type="time"
                          className="border rounded px-1.5 py-1 text-sm"
                          value={editDraft.end_time ?? ''}
                          onChange={(e) => setEditDraft((d) => ({ ...d, end_time: e.target.value }))}
                        />
                      ) : <span className="font-mono text-sm">{formatTime(s.end_time)}</span>}
                    </TableCell>
                    {/* Duration (read-only) */}
                    <TableCell className="text-sm text-gray-600">
                      {isEditing && editDraft.start_time && editDraft.end_time
                        ? `${calcDurationHours(editDraft.start_time, editDraft.end_time)}h`
                        : `${calcDurationHours(s.start_time, s.end_time)}h`}
                    </TableCell>
                    {/* Workers */}
                    <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            className="border rounded px-1.5 py-1 text-sm w-14"
                            value={editDraft.min_workers ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, min_workers: Number(e.target.value) }))}
                          />
                          <span className="text-gray-400">–</span>
                          <input
                            type="number"
                            min={1}
                            className="border rounded px-1.5 py-1 text-sm w-14"
                            value={editDraft.max_workers ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, max_workers: Number(e.target.value) }))}
                          />
                        </div>
                      ) : <span className="text-sm">{s.min_workers}–{s.max_workers} workers</span>}
                    </TableCell>
                    {/* Actions */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" onClick={handleSaveShift}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteShift(s.id, `${DAY_LABELS[s.day_of_week]} ${s.name}`)}
                        >
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add shift form */}
        <div className="bg-white border rounded-xl p-4 space-y-4">
          <h3 className="font-medium text-sm text-gray-700">Add New Shift</h3>
          <form onSubmit={handleAddShift} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Shift Name</Label>
              <Input
                value={newShift.name}
                onChange={(e) => setNewShift((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Morning"
              />
            </div>
            <div className="space-y-1">
              <Label>Day of Week</Label>
              <Select
                value={newShift.day_of_week}
                onValueChange={(v) => setNewShift((p) => ({ ...p, day_of_week: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_LABELS.map((day, idx) => (
                    <SelectItem key={idx} value={String(idx)}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={newShift.start_time}
                onChange={(e) => setNewShift((p) => ({ ...p, start_time: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>End Time</Label>
              <Input
                type="time"
                value={newShift.end_time}
                onChange={(e) => setNewShift((p) => ({ ...p, end_time: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Min Workers</Label>
              <Input
                type="number"
                min="0"
                value={newShift.min_workers}
                onChange={(e) => setNewShift((p) => ({ ...p, min_workers: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Max Workers</Label>
              <Input
                type="number"
                min="1"
                value={newShift.max_workers}
                onChange={(e) => setNewShift((p) => ({ ...p, max_workers: e.target.value }))}
              />
            </div>
            {newShift.start_time && newShift.end_time && (
              <div className="sm:col-span-3 text-sm text-gray-500">
                Duration: <span className="font-medium text-gray-700">
                  {calcDurationHours(newShift.start_time, newShift.end_time)}h
                </span>
              </div>
            )}
            <div className="sm:col-span-3">
              <Button type="submit" className="w-full">Add Shift</Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
