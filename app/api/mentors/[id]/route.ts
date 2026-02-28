import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/mentors/[id]
 * Returns a single mentor profile by mentor_profile id.
 * Public — no auth required.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mentor_profiles")
    .select(`
      id,
      title,
      bio,
      expertise,
      timezone,
      buffer_minutes,
      is_verified,
      accepts_new_mentees,
      status,
      profiles!mentor_profiles_user_id_fkey (
        id,
        name,
        profile_picture
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

  return NextResponse.json({
    id: data.id,
    name: profile?.name ?? "Unknown Mentor",
    title: data.title ?? "Mentor",
    avatar: profile?.profile_picture ?? null,
    bio: data.bio ?? "",
    expertise: data.expertise ?? [],
    timezone: data.timezone,
    bufferMinutes: data.buffer_minutes,
    isVerified: data.is_verified,
    isAvailable: data.accepts_new_mentees,
    status: data.status,
    rating: 0,
    totalSessions: 0,
  });
}
