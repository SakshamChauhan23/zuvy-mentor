export const runtime = "nodejs";

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { processBooking } from "@/lib/services/booking.service";

interface SlotWithMentor {
  id: string;
  slot_start: string;
  slot_end: string;
  duration_minutes: number;
  status: string;
  max_capacity: number;
  current_booked_count: number;
  mentor_profiles: {
    user_id: string;
    title: string | null;
  } | null;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slotId } = await request.json();

  if (!slotId) {
    return NextResponse.json({ error: "slotId is required" }, { status: 400 });
  }

  // Load slot
  const { data: slot, error: slotError } = await supabase
    .from("mentor_slots")
    .select(`
    id,
    slot_start,
    slot_end,
    duration_minutes,
    status,
    max_capacity,
    current_booked_count,
    mentor_profiles!mentor_slots_mentor_id_fkey (
      user_id,
      title
    )
  `)
    .eq("id", slotId)
    .single<SlotWithMentor>();

  if (slotError || !slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  if (slot.current_booked_count >= slot.max_capacity) {
    return NextResponse.json({
      "code": "SLOT_FULL",
      "message": "This session is already booked."
    }, { status: 409 });
  }

  if (!slot.mentor_profiles?.user_id) {
    return NextResponse.json(
      { error: "Mentor not found" },
      { status: 404 }
    );
  }

  const mentorUserId = slot.mentor_profiles.user_id;

  const [{ data: mentorProfile }, { data: learnerProfile }] =
    await Promise.all([
      supabase.from("profiles").select("email, name").eq("id", mentorUserId).single(),
      supabase.from("profiles").select("email, name").eq("id", user.id).single(),
    ]);

  try {
    const result = await processBooking({
      slot,
      userId: user.id,
      mentorUserId,
      learnerProfile,
      mentorProfile,
    });

    return NextResponse.json(result, { status: 201 });

  } catch (err: any) {
    const status = err?.statusCode ?? 500;

    return NextResponse.json(
      { error: err.message },
      { status }
    );
  }
}