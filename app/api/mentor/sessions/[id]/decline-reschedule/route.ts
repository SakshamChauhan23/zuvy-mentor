import { createClient, createServiceClient } from "@/lib/supabase/server";
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

  // Verify ownership and status (also fetch student_id for notification)
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, status, student_id")
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

  // ── Notify learner that reschedule was declined ───────────────────────────
  try {
    const serviceSupabase = await createServiceClient();
    const { data: mentorProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();
    const mentorName = mentorProfile?.name ?? "Your mentor";
    const studentId = (booking as { student_id: string }).student_id;
    await serviceSupabase.from("notifications").insert({
      user_id: studentId,
      type: "RESCHEDULE_DECLINED",
      title: "Reschedule declined",
      message: `${mentorName} has declined your reschedule request. Your original session time is kept.`,
      reference_id: id,
      reference_type: "booking",
    });
  } catch (notifErr) {
    console.error("[decline-reschedule] Notification insert error (non-fatal):", notifErr);
  }

  return NextResponse.json({ success: true });
}
