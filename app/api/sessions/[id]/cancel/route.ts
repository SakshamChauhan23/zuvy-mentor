import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cancelCalendarEvent } from "@/lib/google/calendar";

/**
 * POST /api/sessions/[id]/cancel
 * Cancels a booking owned by the authenticated learner.
 * Body: { reason: string }
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
  const { reason } = body as { reason?: string };

  if (!reason || reason.trim().length < 10) {
    return NextResponse.json({ error: "Reason must be at least 10 characters" }, { status: 400 });
  }

  // Verify ownership and status
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, status, slot_id, calendar_event_id")
    .eq("id", id)
    .eq("student_id", user.id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (booking.status !== "SCHEDULED" && booking.status !== "RESCHEDULE_PENDING") {
    return NextResponse.json({ error: "This session cannot be cancelled" }, { status: 409 });
  }

  // Update booking to cancelled
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "CANCELLED",
      cancelled_by: "student",
      cancel_reason: reason.trim(),
    })
    .eq("id", id);

  if (updateError) {
    console.error("Cancel update error:", updateError);
    return NextResponse.json({ error: "Failed to cancel session" }, { status: 500 });
  }

  // Decrement the slot's booked count — use service client to bypass RLS
  const serviceSupabase = await createServiceClient();
  const { data: slot } = await serviceSupabase
    .from("mentor_slots")
    .select("current_booked_count")
    .eq("id", booking.slot_id)
    .single();

  if (slot && slot.current_booked_count > 0) {
    await serviceSupabase
      .from("mentor_slots")
      .update({ current_booked_count: slot.current_booked_count - 1 })
      .eq("id", booking.slot_id);
  }

  // ── Cancel Google Calendar event ─────────────────────────────────────────
  const calEventId = (booking as { calendar_event_id?: string | null }).calendar_event_id;
  if (calEventId) {
    try {
      await cancelCalendarEvent(calEventId);
    } catch (err) {
      console.error("[cancel] Google Calendar cancel error (non-fatal):", err);
    }
  }

  return NextResponse.json({ success: true });
}
