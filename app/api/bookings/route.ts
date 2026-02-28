import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/bookings
 * Creates a booking for the authenticated learner.
 * Body: { slotId: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slotId } = body as { slotId?: string };

  if (!slotId) {
    return NextResponse.json({ error: "slotId is required" }, { status: 400 });
  }

  // Load slot + mentor profile (to get mentor's profiles.id)
  const { data: slot, error: slotError } = await supabase
    .from("mentor_slots")
    .select(`
      id,
      mentor_id,
      current_booked_count,
      max_capacity,
      status,
      slot_start,
      mentor_profiles!mentor_slots_mentor_id_fkey (
        user_id
      )
    `)
    .eq("id", slotId)
    .single();

  if (slotError || !slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  if (slot.status !== "available" || slot.current_booked_count >= slot.max_capacity) {
    return NextResponse.json({ error: "Slot is no longer available" }, { status: 409 });
  }

  if (new Date(slot.slot_start) <= new Date()) {
    return NextResponse.json({ error: "Slot has already passed" }, { status: 409 });
  }

  // Prevent double-booking this slot
  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("slot_id", slotId)
    .eq("student_id", user.id)
    .neq("status", "CANCELLED")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You have already booked this slot" }, { status: 409 });
  }

  const mentorProfiles = slot.mentor_profiles as { user_id: string } | null;
  const mentorUserId = mentorProfiles?.user_id;
  if (!mentorUserId) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      slot_id: slotId,
      student_id: user.id,
      mentor_id: mentorUserId,
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    console.error("Booking insert error:", bookingError);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }

  // Increment booked count
  await supabase
    .from("mentor_slots")
    .update({ current_booked_count: slot.current_booked_count + 1 })
    .eq("id", slotId);

  return NextResponse.json({ bookingId: booking.id }, { status: 201 });
}
