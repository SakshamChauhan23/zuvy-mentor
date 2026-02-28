import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/mentor/sessions/[id]/feedback
 * Submits mentor feedback for a completed session.
 * Body: { rating: number (1-5), notes: string, improvements: string }
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
  const { rating, notes, improvements } = body as {
    rating?: number;
    notes?: string;
    improvements?: string;
  };

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  // Verify ownership, status, and feedback not already locked
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, status, feedback_locked")
    .eq("id", id)
    .eq("mentor_id", user.id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (booking.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Feedback can only be submitted for completed sessions" },
      { status: 409 }
    );
  }

  if (booking.feedback_locked) {
    return NextResponse.json(
      { error: "Feedback has already been submitted" },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      rating,
      feedback: {
        notes: notes?.trim() ?? "",
        areasOfImprovement: improvements?.trim() ?? "",
      },
      feedback_locked: true,
      feedback_locked_at: now,
    })
    .eq("id", id);

  if (updateError) {
    console.error("Submit feedback error:", updateError);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
