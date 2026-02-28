import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function mapStatus(
  dbStatus: string
): "upcoming" | "completed" | "cancelled" | "reschedule-pending" {
  switch (dbStatus) {
    case "SCHEDULED":
    case "IN_PROGRESS":
      return "upcoming";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
    case "MISSED":
      return "cancelled";
    case "RESCHEDULE_PENDING":
      return "reschedule-pending";
    default:
      return "upcoming";
  }
}

/**
 * GET /api/mentor/sessions
 * Returns all bookings where the authenticated user is the mentor.
 * Each session includes learner info, slot times (ISO), reschedule slot (ISO),
 * attendance timestamps (ISO), and feedback.
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
      student_id,
      status,
      booked_at,
      cancel_reason,
      reschedule_reason,
      reschedule_new_slot_id,
      joined_at,
      left_at,
      completed_at,
      feedback,
      rating,
      mentor_slots!bookings_slot_id_fkey (slot_start, slot_end, duration_minutes),
      profiles!bookings_student_id_fkey (name, email)
    `)
    .eq("mentor_id", user.id)
    .order("booked_at", { ascending: false });

  if (error) {
    console.error("Mentor sessions fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Batch-fetch reschedule slots for RESCHEDULE_PENDING bookings
  const rescheduleSlotIds = (data ?? [])
    .filter((b) => b.reschedule_new_slot_id)
    .map((b) => b.reschedule_new_slot_id as string);

  const rescheduleSlotMap: Record<
    string,
    { slot_start: string; slot_end: string; duration_minutes: number }
  > = {};

  if (rescheduleSlotIds.length > 0) {
    const { data: rSlots } = await supabase
      .from("mentor_slots")
      .select("id, slot_start, slot_end, duration_minutes")
      .in("id", rescheduleSlotIds);
    for (const rs of rSlots ?? []) {
      rescheduleSlotMap[rs.id] = rs;
    }
  }

  const sessions = (data ?? []).map((b) => {
    const slot = b.mentor_slots as {
      slot_start: string;
      slot_end: string;
      duration_minutes: number;
    } | null;
    const learner = b.profiles as { name: string | null; email: string | null } | null;
    const rSlot = b.reschedule_new_slot_id
      ? rescheduleSlotMap[b.reschedule_new_slot_id]
      : null;
    const fb = b.feedback as { notes?: string; areasOfImprovement?: string } | null;

    return {
      id: b.id,
      studentId: b.student_id,
      learnerName: learner?.name ?? learner?.email ?? "Unknown Learner",
      learnerEmail: learner?.email ?? "",
      slotStart: slot?.slot_start ?? "",
      slotEnd: slot?.slot_end ?? "",
      durationMinutes: slot?.duration_minutes ?? 0,
      status: mapStatus(b.status),
      bookedAt: b.booked_at,
      cancelReason: b.cancel_reason,
      rescheduleReason: b.reschedule_reason,
      rescheduleNewSlotId: b.reschedule_new_slot_id,
      rescheduleNewSlot: rSlot
        ? {
            slotStart: rSlot.slot_start,
            slotEnd: rSlot.slot_end,
            durationMinutes: rSlot.duration_minutes,
          }
        : null,
      joinedAt: b.joined_at,
      leftAt: b.left_at,
      completedAt: b.completed_at,
      feedback: fb && (fb.notes || fb.areasOfImprovement) ? fb : null,
      rating: b.rating,
    };
  });

  return NextResponse.json(sessions);
}
