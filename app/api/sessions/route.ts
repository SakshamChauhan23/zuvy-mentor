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
 * GET /api/sessions
 * Returns all bookings for the authenticated learner.
 * Each item includes mentor info, slot times (ISO), and mapped status.
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

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      booked_at,
      cancel_reason,
      reschedule_reason,
      reschedule_new_slot_id,
      meet_link,
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
    .eq("student_id", user.id)
    .order("booked_at", { ascending: false });

  if (error) {
    console.error("Sessions fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sessions = (data ?? []).map((b) => {
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

    return {
      id: b.id,
      status: mapStatus(b.status),
      bookedAt: b.booked_at,
      cancelReason: b.cancel_reason,
      rescheduleReason: b.reschedule_reason,
      slotStart: slot?.slot_start ?? "",
      slotEnd: slot?.slot_end ?? "",
      durationMinutes: slot?.duration_minutes ?? 0,
      mentorProfileId: mp?.id ?? "",
      mentorName: profile?.name ?? "Unknown Mentor",
      mentorTitle: mp?.title ?? "",
      isVerified: mp?.is_verified ?? false,
      meetLink: (b as { meet_link?: string | null }).meet_link ?? null,
    };
  });

  return NextResponse.json(sessions);
}
