import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/onboarding/mentor/profile
 * Upserts the authenticated mentor's profile during onboarding.
 * Body: { title: string, bio: string, expertise: string[] }
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, bio, expertise } = body as {
    title?: string;
    bio?: string;
    expertise?: string[];
  };

  if (!title?.trim() || !bio?.trim()) {
    return NextResponse.json(
      { error: "title and bio are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("mentor_profiles")
    .upsert(
      {
        user_id: user.id,
        title: title.trim(),
        bio: bio.trim(),
        expertise: expertise ?? [],
        status: "active",
      },
      { onConflict: "user_id" }
    )
    .select("id, title, bio, expertise")
    .single();

  if (error) {
    console.error("Mentor profile upsert error:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }

  return NextResponse.json(data);
}
