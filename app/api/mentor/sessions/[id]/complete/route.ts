import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/mentor/sessions/[id]/complete
 * Marks the session as COMPLETED. Requires attendance to have been recorded first.
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

  // Verify ownership, status, and that attendance is recorded
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, status, joined_at")
    .eq("id", id)
    .eq("mentor_id", user.id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (booking.status !== "SCHEDULED" && booking.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Only upcoming sessions can be completed" },
      { status: 409 }
    );
  }

  if (!booking.joined_at) {
    return NextResponse.json(
      { error: "Record attendance before completing the session" },
      { status: 422 }
    );
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "COMPLETED", completed_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    console.error("Complete session error:", updateError);
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
