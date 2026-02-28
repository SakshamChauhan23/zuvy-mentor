import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/mentor/profile
 * Returns the authenticated mentor's name and title.
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .single();

  const { data: mp } = await supabase
    .from("mentor_profiles")
    .select("title")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    name: profile?.name ?? profile?.email ?? "Mentor",
    title: mp?.title ?? "",
  });
}
