import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calcDurationHours } from '@/lib/utils/schedule';

// GET /api/shifts — list all shifts with computed duration
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('day_of_week')
      .order('start_time');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Append computed duration_hours
    const enriched = (data ?? []).map((shift) => ({
      ...shift,
      duration_hours: calcDurationHours(shift.start_time, shift.end_time),
    }));

    return NextResponse.json(enriched);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database connection failed.';
    console.error('[shifts GET]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/shifts — create a new shift
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { name, day_of_week, start_time, end_time, min_workers, max_workers } = body;

    if (!name?.trim() || day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'name, day_of_week, start_time, and end_time are required.' },
        { status: 400 }
      );
    }

    if (start_time >= end_time) {
      return NextResponse.json(
        { error: 'end_time must be after start_time.' },
        { status: 400 }
      );
    }

    if (Number(min_workers) > Number(max_workers)) {
      return NextResponse.json(
        { error: 'min_workers cannot exceed max_workers.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('shifts')
      .insert({ name: name.trim(), day_of_week, start_time, end_time, min_workers, max_workers })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { ...data, duration_hours: calcDurationHours(data.start_time, data.end_time) },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create shift.';
    console.error('[shifts POST]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/shifts — update a shift
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, name, day_of_week, start_time, end_time, min_workers, max_workers } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('shifts')
      .update({ name, day_of_week, start_time, end_time, min_workers, max_workers })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ...data,
      duration_hours: calcDurationHours(data.start_time, data.end_time),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update shift.';
    console.error('[shifts PUT]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/shifts — delete a shift
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
    }

    const { error } = await supabase.from('shifts').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete shift.';
    console.error('[shifts DELETE]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
