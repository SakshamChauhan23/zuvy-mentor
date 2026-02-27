"use client";

import { CalendarX, RefreshCw, AlertCircle } from "lucide-react";
import SlotCard from "./SlotCard";
import { cn } from "@/lib/utils";
import type { TimeSlot, SlotsByDate } from "@/lib/types/slot";

type PickerState = "loading" | "error" | "empty" | "ready";

interface SlotPickerProps {
  groups: SlotsByDate[];
  state: PickerState;
  selectedSlotId: string | null;
  onSelect: (slot: TimeSlot) => void;
  onRetry?: () => void;
}

export default function SlotPicker({
  groups,
  state,
  selectedSlotId,
  onSelect,
  onRetry,
}: SlotPickerProps) {
  // ── Loading ─────────────────────────────────────────────────────────────────
  if (state === "loading") {
    return <SlotPickerSkeletonInline />;
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <StateShell>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive-light">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm font-semibold text-text-primary">
          Couldn&apos;t load availability
        </p>
        <p className="text-sm text-text-muted">Something went wrong. Please try again.</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </StateShell>
    );
  }

  // ── Empty ───────────────────────────────────────────────────────────────────
  if (state === "empty" || groups.length === 0) {
    return (
      <StateShell>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
          <CalendarX className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-semibold text-text-primary">
          No available slots right now
        </p>
        <p className="text-sm text-text-muted text-center max-w-xs">
          This mentor hasn&apos;t added upcoming availability yet.
          Check back soon or explore other mentors.
        </p>
      </StateShell>
    );
  }

  // ── Ready ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {groups.map(({ date, label, slots }) => (
        <div key={date}>
          {/* Date heading */}
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-muted">
              {slots.filter((s) => !s.isBooked).length} available
            </span>
          </div>

          {/* Slots grid */}
          <div className="grid gap-2 sm:grid-cols-2">
            {slots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                isSelected={slot.id === selectedSlotId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared shell for empty / error ──────────────────────────────────────────

function StateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card py-12">
      {children}
    </div>
  );
}

// ─── Inline skeleton (rendered inside SlotPicker to avoid extra import) ───────

function SlotPickerSkeletonInline() {
  return (
    <div className="animate-pulse space-y-8">
      {[3, 2, 3].map((count, groupIdx) => (
        <div key={groupIdx}>
          {/* Date heading skeleton */}
          <div className="mb-3 flex items-center gap-3">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-px flex-1 bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
          {/* Slot cards skeleton */}
          <div className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-20 rounded bg-muted" />
                    <div className="h-3 w-24 rounded bg-muted" />
                  </div>
                </div>
                <div className="h-6 w-14 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
