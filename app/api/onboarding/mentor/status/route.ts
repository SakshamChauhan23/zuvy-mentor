import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/onboarding/mentor/status
 * Returns the mentor's onboarding completion state.
 *
 * profileComplete = mentor_profiles row exists with title AND bio set
 * slotCount       = number of mentor_slots created
 *
 * Onboarding is considered complete when profileComplete && slotCount > 0.
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

  // Fetch mentor profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .single();

  const { data: mp } = await supabase
    .from("mentor_profiles")
    .select("id, title, bio")
    .eq("user_id", user.id)
    .single();

  if (!mp) {
    return NextResponse.json({
      profileComplete: false,
      slotCount: 0,
      mentorName: profile?.name ?? profile?.email ?? "Mentor",
    });
  }

  const profileComplete = !!(mp.title && mp.bio);

  // Count slots
  const { count } = await supabase
    .from("mentor_slots")
    .select("id", { count: "exact", head: true })
    .eq("mentor_id", mp.id);

  return NextResponse.json({
    profileComplete,
    slotCount: count ?? 0,
    mentorName: profile?.name ?? profile?.email ?? "Mentor",
  });
}
