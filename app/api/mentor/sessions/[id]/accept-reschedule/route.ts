import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { updateCalendarEvent } from "@/lib/google/calendar";

/**
 * POST /api/mentor/sessions/[id]/accept-reschedule
 * Accepts the learner's reschedule request:
 *   1. Swaps the booking's slot to the proposed new slot.
 *   2. Adjusts booked counts on both slots.
 *   3. Resets status back to SCHEDULED.
 */
export async function POST(
  _request: Request,
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

  // Verify ownership and status
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, status, slot_id, reschedule_new_slot_id, calendar_event_id")
    .eq("id", id)
    .eq("mentor_id", user.id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (booking.status !== "RESCHEDULE_PENDING") {
    return NextResponse.json(
      { error: "No pending reschedule to accept" },
      { status: 409 }
    );
  }

  if (!booking.reschedule_new_slot_id) {
    return NextResponse.json(
      { error: "Reschedule slot not found" },
      { status: 422 }
    );
  }

  const oldSlotId = booking.slot_id;
  const newSlotId = booking.reschedule_new_slot_id;

  // Update booking: swap slot, reset status + reschedule fields
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "SCHEDULED",
      slot_id: newSlotId,
      reschedule_new_slot_id: null,
      reschedule_reason: null,
    })
    .eq("id", id);

  if (updateError) {
    console.error("Accept reschedule error:", updateError);
    return NextResponse.json(
      { error: "Failed to accept reschedule" },
      { status: 500 }
    );
  }

  // Decrement old slot count
  const { data: oldSlot } = await supabase
    .from("mentor_slots")
    .select("current_booked_count")
    .eq("id", oldSlotId)
    .single();
  if (oldSlot && oldSlot.current_booked_count > 0) {
    await supabase
      .from("mentor_slots")
      .update({ current_booked_count: oldSlot.current_booked_count - 1 })
      .eq("id", oldSlotId);
  }

  // Increment new slot count + fetch times for calendar update
  const { data: newSlot } = await supabase
    .from("mentor_slots")
    .select("current_booked_count, slot_start, slot_end")
    .eq("id", newSlotId)
    .single();
  if (newSlot) {
    await supabase
      .from("mentor_slots")
      .update({ current_booked_count: newSlot.current_booked_count + 1 })
      .eq("id", newSlotId);
  }

  // ── Update Google Calendar event with new times (non-fatal) ──────────────
  const calEventId = (booking as { calendar_event_id?: string | null }).calendar_event_id;
  if (calEventId && newSlot?.slot_start && newSlot?.slot_end) {
    try {
      await updateCalendarEvent(calEventId, newSlot.slot_start, newSlot.slot_end);
      console.log(`[accept-reschedule] Calendar event ${calEventId} updated`);
    } catch (calErr) {
      console.error("[accept-reschedule] Calendar update error (non-fatal):", calErr);
    }
  }

  return NextResponse.json({ success: true });
}
