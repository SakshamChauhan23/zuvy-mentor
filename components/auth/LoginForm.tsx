"use client";

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success the browser is redirected to Google — nothing more to do here
  };

  return (
    <div className="w-full max-w-[400px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Welcome to Zuvy</h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Sign in to continue to your dashboard.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive-light px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Google sign-in button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className={cn(
          "w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3",
          "text-sm font-medium text-text-primary",
          "hover:bg-muted hover:border-grey transition-colors",
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          /* Google logo */
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        {loading ? "Redirecting to Google…" : "Continue with Google"}
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-text-muted">
            Zuvy uses Google for secure sign-in
          </span>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="space-y-3">
        {[
          "One-click sign in — no password to remember",
          "Your Google profile photo and name are used automatically",
          "You'll choose your role (Learner or Mentor) on your first sign-in",
        ].map((text) => (
          <div key={text} className="flex items-start gap-2.5">
            <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <p className="text-xs text-text-muted leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      {/* Terms */}
      <p className="mt-8 text-center text-xs text-text-muted leading-relaxed">
        By continuing you agree to our{" "}
        <a href="/terms" className="underline hover:text-text-secondary transition-colors">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline hover:text-text-secondary transition-colors">
          Privacy Policy
        </a>.
      </p>
    </div>
  );
}
