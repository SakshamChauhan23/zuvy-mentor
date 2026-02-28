import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/mentor/sessions/[id]/attendance
 * Records actual join/leave times for the session.
 * Body: { joinedAt: string (ISO), leftAt: string (ISO) }
 *
 * The client constructs ISO timestamps from the local date + HH:MM time
 * inputs (e.g. new Date(`${date}T${hhmm}:00`).toISOString()).
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
  const { joinedAt, leftAt } = body as {
    joinedAt?: string;
    leftAt?: string;
  };

  if (!joinedAt || !leftAt) {
    return NextResponse.json(
      { error: "joinedAt and leftAt are required" },
      { status: 400 }
    );
  }

  if (new Date(leftAt) <= new Date(joinedAt)) {
    return NextResponse.json(
      { error: "leftAt must be after joinedAt" },
      { status: 400 }
    );
  }

  // Verify ownership (mentor_id = user.id) and that attendance isn't already recorded
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, status, joined_at")
    .eq("id", id)
    .eq("mentor_id", user.id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (booking.joined_at) {
    return NextResponse.json(
      { error: "Attendance already recorded" },
      { status: 409 }
    );
  }

  if (booking.status !== "SCHEDULED" && booking.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Attendance can only be recorded for upcoming sessions" },
      { status: 409 }
    );
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ joined_at: joinedAt, left_at: leftAt })
    .eq("id", id);

  if (updateError) {
    console.error("Attendance update error:", updateError);
    return NextResponse.json(
      { error: "Failed to record attendance" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
