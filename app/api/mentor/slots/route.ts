import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/mentor/slots
 * Returns all availability slots for the authenticated mentor.
 * Each slot's status is derived: "booked" if current_booked_count > 0, else "available".
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up the mentor profile
  const { data: mp, error: mpError } = await supabase
    .from("mentor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (mpError || !mp) {
    return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("mentor_slots")
    .select("id, slot_start, slot_end, duration_minutes, status, current_booked_count, created_at")
    .eq("mentor_id", mp.id)
    .order("slot_start", { ascending: true });

  if (error) {
    console.error("Mentor slots fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const slots = (data ?? []).map((s) => ({
    id: s.id,
    slotStart: s.slot_start,
    slotEnd: s.slot_end,
    durationMinutes: s.duration_minutes,
    status: s.current_booked_count > 0 ? "booked" : "open",
    createdAt: s.created_at,
  }));

  return NextResponse.json(slots);
}

/**
 * POST /api/mentor/slots
 * Creates a new availability slot for the authenticated mentor.
 * Body: { slotStart: string (ISO), slotEnd: string (ISO), durationMinutes: number }
 *
 * The client constructs ISO timestamps from local date + HH:MM inputs:
 *   slotStart = new Date(`${date}T${startTime}:00`).toISOString()
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slotStart, slotEnd, durationMinutes } = body as {
    slotStart?: string;
    slotEnd?: string;
    durationMinutes?: number;
  };

  if (!slotStart || !slotEnd || !durationMinutes) {
    return NextResponse.json(
      { error: "slotStart, slotEnd, and durationMinutes are required" },
      { status: 400 }
    );
  }

  const startDate = new Date(slotStart);
  const endDate = new Date(slotEnd);

  if (endDate <= startDate) {
    return NextResponse.json(
      { error: "slotEnd must be after slotStart" },
      { status: 400 }
    );
  }

  if (startDate <= new Date()) {
    return NextResponse.json(
      { error: "Slot must be in the future" },
      { status: 400 }
    );
  }

  // Look up the mentor profile
  const { data: mp, error: mpError } = await supabase
    .from("mentor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (mpError || !mp) {
    return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
  }

  // Check for time conflicts with existing slots
  const { data: conflicts } = await supabase
    .from("mentor_slots")
    .select("id, slot_start, slot_end")
    .eq("mentor_id", mp.id)
    .lt("slot_start", slotEnd)
    .gt("slot_end", slotStart);

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json(
      { error: "Slot conflicts with an existing availability slot" },
      { status: 409 }
    );
  }

  const { data: newSlot, error: insertError } = await supabase
    .from("mentor_slots")
    .insert({
      mentor_id: mp.id,
      slot_start: slotStart,
      slot_end: slotEnd,
      // duration_minutes is a GENERATED ALWAYS AS stored column — omit it from INSERT
      status: "available",
      max_capacity: 1,
    })
    .select("id, slot_start, slot_end, duration_minutes, created_at")
    .single();

  if (insertError) {
    console.error("Create slot error:", insertError);
    return NextResponse.json({ error: "Failed to create slot" }, { status: 500 });
  }

  return NextResponse.json({
    id: newSlot.id,
    slotStart: newSlot.slot_start,
    slotEnd: newSlot.slot_end,
    durationMinutes: newSlot.duration_minutes,
    status: "open",
    createdAt: newSlot.created_at,
  });
}
