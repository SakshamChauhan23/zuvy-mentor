import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";

/**
 * OAuth callback handler.
 * Supabase redirects here after Google authentication.
 *
 * Uses request/response cookie pattern (required for Route Handlers —
 * the cookies() helper is read-only and can't persist the session).
 *
 * Flow:
 *  1. Exchange the one-time code for a session
 *  2. New user (created < 2 min ago)  → /onboarding (role selection)
 *  3. Returning user                  → role-appropriate dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // Build the response early so we can write cookies onto it
  const response = NextResponse.next();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write auth cookies onto both the request (for this handler)
          // and the response (so the browser receives them)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[auth/callback] Session exchange failed:", error?.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // ── New user detection ─────────────────────────────────────────────────────
  const createdAt = new Date(data.user.created_at).getTime();
  const isNewUser = Date.now() - createdAt < 2 * 60 * 1000;

  if (isNewUser) {
    const res = NextResponse.redirect(`${origin}/onboarding`);
    // Copy auth cookies onto the redirect response
    response.cookies.getAll().forEach(({ name, value }) => {
      res.cookies.set(name, value, { path: "/" });
    });
    return res;
  }

  // ── Returning user — redirect by role ─────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role ?? "learner";
  const destination =
    role === "mentor"
      ? "/mentor/dashboard"
      : role === "admin"
      ? "/admin/dashboard"
      : "/dashboard";

  const res = NextResponse.redirect(`${origin}${destination}`);
  // Copy auth cookies onto the redirect response
  response.cookies.getAll().forEach(({ name, value }) => {
    res.cookies.set(name, value, { path: "/" });
  });
  return res;
}
