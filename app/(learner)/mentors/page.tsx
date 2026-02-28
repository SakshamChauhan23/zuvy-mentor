"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MentorGrid from "@/components/mentors/MentorGrid";
import type { Mentor } from "@/lib/types/mentor";

type PageState = "loading" | "error" | "empty" | "ready";

export default function MentorsPage() {
  const [state, setState] = useState<PageState>("loading");
  const [mentors, setMentors] = useState<Mentor[]>([]);

  const loadMentors = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/mentors");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Mentor[] = await res.json();
      setMentors(data);
      setState(data.length === 0 ? "empty" : "ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    loadMentors();
  }, []);

  const availableCount = mentors.filter((m) => m.isAvailable).length;

  return (
    <DashboardLayout
      role="learner"
      pageTitle="Find a Mentor"
      pageSubtitle={
        state === "ready"
          ? `${mentors.length} mentors · ${availableCount} accepting sessions`
          : "Browse and connect with expert mentors."
      }
      userName="Jane Doe"
      userTitle="Learner"
    >
      {/* ── Filter bar ─────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { label: "All mentors", value: "all" },
            { label: "Accepting sessions", value: "available" },
            { label: "Verified only", value: "verified" },
          ].map(({ label, value }) => (
            <button
              key={value}
              className={
                value === "all"
                  ? "inline-flex items-center rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground"
                  : "inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-text-secondary hover:border-primary/40 hover:text-text-primary transition-colors"
              }
            >
              {label}
            </button>
          ))}
        </div>

        {state === "ready" && (
          <p className="text-xs text-text-muted shrink-0">
            {mentors.length} results
          </p>
        )}
      </div>

      {/* ── Grid ───────────────────────────────────────────── */}
      <MentorGrid
        mentors={mentors}
        state={state}
        onRetry={loadMentors}
      />
    </DashboardLayout>
  );
}
