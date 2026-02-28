import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

/**
 * Server-side Supabase client.
 * Use this in Route Handlers, Server Components, and Server Actions.
 * Reads the session from cookies automatically.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // In Server Components, cookies can't be set (read-only context).
            // This is safe to ignore — the middleware handles session refresh.
          }
        },
      },
    }
  );
}

/**
 * Service-role Supabase client (bypasses RLS).
 * Use this ONLY in Route Handlers for privileged operations
 * (e.g. creating notifications, locking feedback).
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */
export async function createServiceClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in read-only server contexts
          }
        },
      },
    }
  );
}
