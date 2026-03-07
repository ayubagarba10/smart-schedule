import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAssignment } from '@/lib/utils/hours';
import { getWeekStartISO } from '@/lib/utils/schedule';

// GET /api/assignments — list all assignments for the current week
export async function GET() {
  try {
    const supabase = await createClient();
    const weekStart = getWeekStartISO();

    const { data, error } = await supabase
      .from('schedule_assignments')
      .select(`
        id, shift_id, employee_id, week_start_date, created_at,
        employees ( id, name, employee_type_id, employee_types(name) ),
        shifts ( id, name, day_of_week, start_time, end_time, min_workers, max_workers )
      `)
      .eq('week_start_date', weekStart)
      .order('created_at');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database connection failed.';
    console.error('[assignments GET]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/assignments — assign an employee to a shift
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { shift_id, employee_id } = body;

    if (!shift_id || !employee_id) {
      return NextResponse.json(
        { error: 'shift_id and employee_id are required.' },
        { status: 400 }
      );
    }

    const weekStart = getWeekStartISO();

    // Run validation (hour limit + capacity check)
    const validation = await validateAssignment(shift_id, employee_id, weekStart);
    if (!validation.allowed) {
      return NextResponse.json({ error: validation.reason }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('schedule_assignments')
      .insert({ shift_id, employee_id, week_start_date: weekStart })
      .select(`
        id, shift_id, employee_id, week_start_date, created_at,
        employees ( id, name, employee_type_id, employee_types(name) ),
        shifts ( id, name, day_of_week, start_time, end_time, min_workers, max_workers )
      `)
      .single();

    if (error) {
      // Handle unique constraint violation (duplicate assignment)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This employee is already assigned to this shift.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create assignment.';
    console.error('[assignments POST]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/assignments — remove an assignment
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('schedule_assignments')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove assignment.';
    console.error('[assignments DELETE]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
