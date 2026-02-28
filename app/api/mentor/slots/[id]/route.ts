import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * DELETE /api/mentor/slots/[id]
 * Deletes an open (unbooked) availability slot owned by the authenticated mentor.
 */
export async function DELETE(
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

  // Look up the mentor profile
  const { data: mp, error: mpError } = await supabase
    .from("mentor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (mpError || !mp) {
    return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
  }

  // Verify slot exists and belongs to this mentor
  const { data: slot, error: fetchError } = await supabase
    .from("mentor_slots")
    .select("id, current_booked_count")
    .eq("id", id)
    .eq("mentor_id", mp.id)
    .single();

  if (fetchError || !slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  if (slot.current_booked_count > 0) {
    return NextResponse.json(
      { error: "Cannot delete a booked slot" },
      { status: 409 }
    );
  }

  const { error: deleteError } = await supabase
    .from("mentor_slots")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Delete slot error:", deleteError);
    return NextResponse.json({ error: "Failed to delete slot" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
