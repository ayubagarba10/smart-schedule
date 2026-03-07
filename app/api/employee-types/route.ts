import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_TYPES = [
  { name: 'Permanent', max_weekly_hours: 40, is_active: true },
  { name: 'Part-Time', max_weekly_hours: 20, is_active: true },
  { name: 'Federal Work Study', max_weekly_hours: 20, is_active: true },
];

// GET /api/employee-types — list all employee types, seeding defaults on first access
export async function GET() {
  try {
    const supabase = await createClient();

    let { data, error } = await supabase
      .from('employee_types')
      .select('*')
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Seed default types if the table is empty
    if (!data || data.length === 0) {
      const { data: seeded, error: seedError } = await supabase
        .from('employee_types')
        .insert(DEFAULT_TYPES)
        .select('*');

      if (!seedError) {
        data = seeded ?? [];
      }
    }

    return NextResponse.json(data ?? []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database connection failed.';
    console.error('[employee-types GET]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/employee-types — create a new employee type
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { name, max_weekly_hours, is_active = true } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required.' }, { status: 400 });
    }
    if (!max_weekly_hours || Number(max_weekly_hours) <= 0) {
      return NextResponse.json({ error: 'max_weekly_hours must be greater than 0.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('employee_types')
      .insert({ name: name.trim(), max_weekly_hours: Number(max_weekly_hours), is_active })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create employee type.';
    console.error('[employee-types POST]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/employee-types — update an employee type (name, max_weekly_hours, is_active)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, name, max_weekly_hours, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (max_weekly_hours !== undefined) updates.max_weekly_hours = Number(max_weekly_hours);
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from('employee_types')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update employee type.';
    console.error('[employee-types PUT]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/employee-types — delete an employee type
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
    }

    const { error } = await supabase.from('employee_types').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete employee type.';
    console.error('[employee-types DELETE]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
