import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWeekStartISO, calcDurationHours } from '@/lib/utils/schedule';

// GET /api/employees — list all employees with type info and weekly hours
export async function GET() {
  try {
    const supabase = await createClient();
    const weekStart = getWeekStartISO();

    const { data: employees, error } = await supabase
      .from('employees')
      .select(`
        id, name, employee_type_id, created_at,
        employee_types ( id, name, max_weekly_hours, is_active )
      `)
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch all assignments for the current week to compute hours
    const { data: assignments } = await supabase
      .from('schedule_assignments')
      .select('employee_id, shifts(start_time, end_time)')
      .eq('week_start_date', weekStart);

    // Build a map of employee_id → scheduled hours
    const hoursMap: Record<string, number> = {};
    for (const row of assignments ?? []) {
      const shift = (row as any).shifts;
      if (!shift) continue;
      const hours = calcDurationHours(shift.start_time, shift.end_time);
      hoursMap[row.employee_id] = (hoursMap[row.employee_id] ?? 0) + hours;
    }

    // Enrich employees with hour data
    const enriched = (employees ?? []).map((emp) => {
      const maxHours = (emp as any).employee_types?.max_weekly_hours ?? 0;
      const scheduledHours = hoursMap[emp.id] ?? 0;
      return {
        ...emp,
        scheduled_hours: scheduledHours,
        remaining_hours: Math.max(0, maxHours - scheduledHours),
        max_hours: maxHours,
        usage_percent: maxHours > 0 ? Math.round((scheduledHours / maxHours) * 100) : 0,
      };
    });

    return NextResponse.json(enriched);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database connection failed.';
    console.error('[employees GET]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/employees — create a new employee
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { name, employee_type_id } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('employees')
      .insert({ name: name.trim(), employee_type_id: employee_type_id ?? null })
      .select(`id, name, employee_type_id, created_at, employee_types(id, name, max_weekly_hours, is_active)`)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create employee.';
    console.error('[employees POST]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/employees — update an employee
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, name, employee_type_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('employees')
      .update({ name: name.trim(), employee_type_id: employee_type_id ?? null })
      .eq('id', id)
      .select(`id, name, employee_type_id, created_at, employee_types(id, name, max_weekly_hours, is_active)`)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update employee.';
    console.error('[employees PUT]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/employees — delete an employee
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
    }

    const { error } = await supabase.from('employees').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete employee.';
    console.error('[employees DELETE]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
