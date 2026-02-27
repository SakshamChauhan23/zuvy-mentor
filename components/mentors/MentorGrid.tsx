"use client";

import { useState } from "react";
import { Users, RefreshCw, AlertCircle } from "lucide-react";
import MentorCard from "./MentorCard";
import MentorCardSkeleton from "./MentorCardSkeleton";
import { cn } from "@/lib/utils";
import type { Mentor } from "@/lib/types/mentor";

type GridState = "loading" | "error" | "empty" | "ready";

interface MentorGridProps {
  mentors: Mentor[];
  state: GridState;
  onRetry?: () => void;
}

// Number of skeletons shown while loading
const SKELETON_COUNT = 8;

export default function MentorGrid({ mentors, state, onRetry }: MentorGridProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    await onRetry();
    setRetrying(false);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div
        className={gridClass}
        aria-label="Loading mentors"
        aria-busy="true"
      >
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={i} className="relative">
            <MentorCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <StateShell>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive-light">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold text-text-primary">
            Couldn&apos;t load mentors
          </p>
          <p className="text-sm text-text-muted">
            Something went wrong. Please try again.
          </p>
        </div>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground",
            "hover:bg-primary-dark transition-colors",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          <RefreshCw className={cn("h-4 w-4", retrying && "animate-spin")} />
          {retrying ? "Retrying…" : "Try again"}
        </button>
      </StateShell>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (state === "empty" || mentors.length === 0) {
    return (
      <StateShell>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold text-text-primary">
            No mentors available yet
          </p>
          <p className="text-sm text-text-muted">
            Check back soon — new mentors join regularly.
          </p>
        </div>
      </StateShell>
    );
  }

  // ── Ready ─────────────────────────────────────────────────────────────────
  return (
    <div className={gridClass} aria-label={`${mentors.length} mentors available`}>
      {mentors.map((mentor) => (
        <MentorCard key={mentor.id} mentor={mentor} />
      ))}
    </div>
  );
}

// ── Shared classes ──────────────────────────────────────────────────────────

const gridClass =
  "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

function StateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card">
      {children}
    </div>
  );
}
