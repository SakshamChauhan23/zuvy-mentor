"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Briefcase, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/database";

type SelectableRole = "learner" | "mentor";

const roles: {
  value: SelectableRole;
  label: string;
  description: string;
  icon: React.ElementType;
  destination: string;
}[] = [
  {
    value: "learner",
    label: "Learner",
    description: "Find expert mentors and book sessions to grow your skills.",
    icon: GraduationCap,
    destination: "/learner-onboarding",
  },
  {
    value: "mentor",
    label: "Mentor",
    description: "Share your expertise and guide learners on their journey.",
    icon: Briefcase,
    destination: "/mentor/onboarding",
  },
];

export default function OnboardingForm() {
  const router = useRouter();
  const [selected, setSelected] = useState<SelectableRole>("learner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    // Save the chosen role to the profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: selected as UserRole })
      .eq("id", user.id);

    if (updateError) {
      setError("Something went wrong saving your role. Please try again.");
      setLoading(false);
      return;
    }

    // If the user chose mentor, also create an empty mentor_profile row
    if (selected === "mentor") {
      await supabase
        .from("mentor_profiles")
        .insert({ user_id: user.id })
        .maybeSingle();
    }

    const destination = roles.find((r) => r.value === selected)?.destination ?? "/dashboard";
    router.push(destination);
  };

  return (
    <div className="w-full max-w-[460px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">One last step</h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          How do you want to use Zuvy? You can always change this later.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive-light px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Role cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {roles.map(({ value, label, description, icon: Icon }) => {
          const active = selected === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setSelected(value)}
              className={cn(
                "flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all",
                active
                  ? "border-primary bg-primary-light"
                  : "border-border bg-card hover:border-grey hover:bg-muted"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-text-tertiary"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    active ? "text-text-accent" : "text-text-primary"
                  )}
                >
                  {label}
                </p>
                <p className="text-xs text-text-muted leading-snug mt-1">
                  {description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Continue button */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={loading}
        className={cn(
          "w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3",
          "bg-primary text-primary-foreground text-sm font-semibold",
          "hover:bg-primary-dark transition-colors",
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading
          ? "Setting up your account…"
          : `Continue as ${selected === "learner" ? "Learner" : "Mentor"}`}
      </button>
    </div>
  );
}
