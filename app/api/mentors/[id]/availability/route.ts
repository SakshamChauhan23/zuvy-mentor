import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/mentors/[id]/availability
 * Returns future available (not full) slots for a mentor.
 * Public — no auth required.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("mentor_slots")
    .select(`
      id,
      slot_start,
      slot_end,
      duration_minutes,
      max_capacity,
      current_booked_count,
      topic,
      status
    `)
    .eq("mentor_id", id)
    .eq("status", "available")
    .eq("is_public", true)
    .gt("slot_start", now)
    .order("slot_start", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter out full slots
  const available = (data ?? []).filter(
    (s) => s.current_booked_count < s.max_capacity
  );

  return NextResponse.json(available);
}
