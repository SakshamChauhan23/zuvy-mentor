import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/sessions/[id]/reschedule
 * Submits a reschedule request for the authenticated learner's booking.
 * Body: { newSlotId: string, reason: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { newSlotId, reason } = body as { newSlotId?: string; reason?: string };

  if (!newSlotId) {
    return NextResponse.json({ error: "newSlotId is required" }, { status: 400 });
  }
  if (!reason || reason.trim().length < 10) {
    return NextResponse.json({ error: "Reason must be at least 10 characters" }, { status: 400 });
  }

  // Verify ownership and status (also fetch mentor_id for notification)
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, status, mentor_id")
    .eq("id", id)
    .eq("student_id", user.id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (booking.status !== "SCHEDULED" && booking.status !== "RESCHEDULE_PENDING") {
    return NextResponse.json({ error: "This session cannot be rescheduled" }, { status: 409 });
  }

  // Verify the new slot exists and is available
  const { data: newSlot, error: slotError } = await supabase
    .from("mentor_slots")
    .select("id, status, current_booked_count, max_capacity, slot_start")
    .eq("id", newSlotId)
    .single();

  if (slotError || !newSlot) {
    return NextResponse.json({ error: "New slot not found" }, { status: 404 });
  }

  if (newSlot.status !== "available" || newSlot.current_booked_count >= newSlot.max_capacity) {
    return NextResponse.json({ error: "New slot is no longer available" }, { status: 409 });
  }

  if (new Date(newSlot.slot_start) <= new Date()) {
    return NextResponse.json({ error: "New slot has already passed" }, { status: 409 });
  }

  // Update booking to RESCHEDULE_PENDING
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "RESCHEDULE_PENDING",
      reschedule_new_slot_id: newSlotId,
      reschedule_reason: reason.trim(),
    })
    .eq("id", id);

  if (updateError) {
    console.error("Reschedule update error:", updateError);
    return NextResponse.json({ error: "Failed to submit reschedule request" }, { status: 500 });
  }

  // ── Notify mentor of reschedule request ──────────────────────────────────
  try {
    const serviceSupabase = await createServiceClient();
    const { data: learnerProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();
    const learnerName = learnerProfile?.name ?? "A learner";
    await serviceSupabase.from("notifications").insert({
      user_id: booking.mentor_id,
      type: "RESCHEDULE_PROPOSED",
      title: "Reschedule requested",
      message: `${learnerName} has requested to reschedule their session with you.`,
      reference_id: id,
      reference_type: "booking",
    });
  } catch (notifErr) {
    console.error("[reschedule] Notification insert error (non-fatal):", notifErr);
  }

  return NextResponse.json({ success: true });
}
