import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/mentors
 * Returns all active mentors joined with their profile (name, photo).
 * Public — no auth required.
 */
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mentor_profiles")
    .select(`
      id,
      title,
      expertise,
      is_verified,
      accepts_new_mentees,
      status,
      profiles!mentor_profiles_user_id_fkey (
        id,
        name,
        profile_picture
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Shape into the Mentor interface the frontend expects
  const mentors = (data ?? []).map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      id: m.id,
      name: profile?.name ?? "Unknown Mentor",
      title: m.title ?? "Mentor",
      avatar: profile?.profile_picture ?? null,
      expertise: m.expertise ?? [],
      isVerified: m.is_verified,
      isAvailable: m.accepts_new_mentees,
      // Rating and totalSessions will come from aggregates later — default for now
      rating: 0,
      totalSessions: 0,
    };
  });

  return NextResponse.json(mentors);
}
