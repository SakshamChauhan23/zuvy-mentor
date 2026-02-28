import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/mentor/sessions/[id]/decline-reschedule
 * Declines the learner's reschedule request — keeps the original slot and
 * resets the booking back to SCHEDULED.
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
    .select("id, status")
    .eq("id", id)
    .eq("mentor_id", user.id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (booking.status !== "RESCHEDULE_PENDING") {
    return NextResponse.json(
      { error: "No pending reschedule to decline" },
      { status: 409 }
    );
  }

  // Reset to SCHEDULED, clear reschedule fields (keep original slot)
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "SCHEDULED",
      reschedule_new_slot_id: null,
      reschedule_reason: null,
    })
    .eq("id", id);

  if (updateError) {
    console.error("Decline reschedule error:", updateError);
    return NextResponse.json(
      { error: "Failed to decline reschedule" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
