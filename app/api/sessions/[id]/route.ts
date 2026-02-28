import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { SessionStatus } from "@/lib/types/session";

function mapStatus(dbStatus: string): SessionStatus {
  switch (dbStatus) {
    case "SCHEDULED":
    case "IN_PROGRESS":
      return "upcoming";
    case "COMPLETED":
    case "MISSED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    case "RESCHEDULE_PENDING":
      return "rescheduled";
    default:
      return "upcoming";
  }
}

/**
 * GET /api/sessions/[id]
 * Returns a single booking for the authenticated learner.
 */
export async function GET(
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

  const { data: b, error } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      booked_at,
      cancel_reason,
      reschedule_reason,
      reschedule_new_slot_id,
      mentor_slots!bookings_slot_id_fkey (
        slot_start,
        slot_end,
        duration_minutes
      ),
      profiles!bookings_mentor_id_fkey (
        name,
        mentor_profiles!mentor_profiles_user_id_fkey (
          id,
          title,
          is_verified
        )
      )
    `)
    .eq("id", id)
    .eq("student_id", user.id)
    .single();

  if (error || !b) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const slot = b.mentor_slots as {
    slot_start: string;
    slot_end: string;
    duration_minutes: number;
  } | null;
  const profile = b.profiles as {
    name: string | null;
    mentor_profiles: { id: string; title: string | null; is_verified: boolean } | null;
  } | null;
  const mp = profile?.mentor_profiles;

  return NextResponse.json({
    id: b.id,
    status: mapStatus(b.status),
    bookedAt: b.booked_at,
    cancelReason: b.cancel_reason,
    rescheduleReason: b.reschedule_reason,
    rescheduleNewSlotId: b.reschedule_new_slot_id,
    slotStart: slot?.slot_start ?? "",
    slotEnd: slot?.slot_end ?? "",
    durationMinutes: slot?.duration_minutes ?? 0,
    mentorProfileId: mp?.id ?? "",
    mentorName: profile?.name ?? "Unknown Mentor",
    mentorTitle: mp?.title ?? "",
    isVerified: mp?.is_verified ?? false,
  });
}
