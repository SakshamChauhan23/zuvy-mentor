"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDown,
  BadgeCheck,
  CalendarDays,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  CalendarX,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getSessionById, rescheduleSession } from "@/lib/mock/sessions";
import { generateSlotsForMentor, groupSlotsByDate, formatTime, formatDuration } from "@/lib/mock/slots";
import SlotCard from "@/components/availability/SlotCard";
import { cn } from "@/lib/utils";
import type { BookedSession } from "@/lib/types/session";
import type { TimeSlot, SlotsByDate } from "@/lib/types/slot";

// ─── Constants ────────────────────────────────────────────────────────────────

const REASON_MIN = 10;
const REASON_MAX = 500;

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState = "loading" | "pick-slot" | "confirm" | "submitting" | "success" | "error" | "invalid";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLongDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-4">
      <div className="h-4 w-28 rounded bg-muted" />
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-32 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted" />
          </div>
        </div>
        <div className="h-px bg-muted" />
        <div className="flex gap-4">
          <div className="h-3.5 w-36 rounded bg-muted" />
          <div className="h-3.5 w-36 rounded bg-muted" />
        </div>
      </div>
      <div className="h-5 w-40 rounded bg-muted mt-2" />
      <div className="grid grid-cols-1 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}

// ─── Current session mini card ────────────────────────────────────────────────

function CurrentSessionCard({ session }: { session: BookedSession }) {
  const initials = session.mentorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
        Session being rescheduled
      </p>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold select-none">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-text-primary truncate">{session.mentorName}</span>
            {session.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
          </div>
          <p className="text-xs text-text-secondary truncate">{session.mentorTitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          {formatShortDate(session.date)}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {formatTime(session.startTime)} — {formatTime(session.endTime)}
          <span>· {formatDuration(session.durationMinutes)}</span>
        </span>
      </div>
    </div>
  );
}

// ─── Slot groups (inline picker) ──────────────────────────────────────────────

function SlotGroups({
  groups,
  selectedSlot,
  onSelect,
}: {
  groups: SlotsByDate[];
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
}) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <CalendarX className="h-10 w-10 text-text-muted" />
        <div>
          <p className="text-sm font-semibold text-text-primary">No available slots</p>
          <p className="text-xs text-text-muted mt-0.5">
            {session?.mentorName.split(" ")[0]} has no open slots in the next 12 days.
          </p>
        </div>
        <Link
          href="/sessions"
          className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
        >
          Back to My Sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const available = group.slots.filter((s) => !s.isBooked);
        return (
          <div key={group.date}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-text-primary">{group.label}</h3>
              <span className="text-xs text-text-muted">
                {available.length} slot{available.length !== 1 ? "s" : ""} open
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {group.slots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  isSelected={selectedSlot?.id === slot.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Selected slot summary ─────────────────────────────────────────────────────

function SelectedSummary({ slot }: { slot: TimeSlot }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Selected slot</p>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
        <CalendarDays className="h-3.5 w-3.5 text-primary" />
        {formatShortDate(slot.date)}
      </div>
      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        <Clock className="h-3.5 w-3.5 text-primary" />
        {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
        <span className="text-text-muted">· {formatDuration(slot.durationMinutes)}</span>
      </div>
    </div>
  );
}

// ─── Dummy session reference for empty state (module-level hack) ──────────────
// SlotGroups needs session name for empty state — we pass it via closure.
let session: BookedSession | null = null;

// ─── Main component ────────────────────────────────────────────────────────────

export default function ReschedulePageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [currentSession, setCurrentSession] = useState<BookedSession | null>(null);
  const [slotGroups, setSlotGroups] = useState<SlotsByDate[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  // Load session + slots
  useEffect(() => {
    const timer = setTimeout(() => {
      const found = getSessionById(id);
      if (!found) { setPageState("invalid"); return; }
      if (found.status !== "upcoming" && found.status !== "rescheduled") {
        setPageState("invalid"); return;
      }

      // Generate available slots, exclude the current slot to avoid identical re-booking
      const rawSlots = generateSlotsForMentor(found.mentorId);
      const filtered = rawSlots.filter(
        (s) => !(s.date === found.date && s.startTime === found.startTime)
      );
      const groups = groupSlotsByDate(filtered);

      session = found; // for SlotGroups empty state closure
      setCurrentSession(found);
      setSlotGroups(groups);
      setPageState("pick-slot");
    }, 600);
    return () => clearTimeout(timer);
  }, [id]);

  // Reason validation
  const validateReason = (): boolean => {
    if (reason.trim().length < REASON_MIN) {
      setReasonError(`Please enter at least ${REASON_MIN} characters.`);
      return false;
    }
    setReasonError(null);
    return true;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateReason() || !selectedSlot) return;
    setPageState("submitting");

    await new Promise((r) => setTimeout(r, 1000));

    if (Math.random() < 0.1) {
      setPageState("error");
      return;
    }

    rescheduleSession(id, {
      proposedDate: selectedSlot.date,
      proposedStartTime: selectedSlot.startTime,
      proposedEndTime: selectedSlot.endTime,
      proposedDurationMinutes: selectedSlot.durationMinutes,
      reason,
    });
    setPageState("success");
  };

  const mentorFirstName = currentSession?.mentorName.split(" ")[0] ?? "";

  return (
    <DashboardLayout
      role="learner"
      pageTitle="Reschedule Session"
      pageSubtitle={currentSession ? `Session with ${currentSession.mentorName}` : undefined}
      userName="Jane Doe"
      userTitle="Learner"
    >
      <div className="mx-auto max-w-2xl">

        {/* ── Loading ───────────────────────────────────────────── */}
        {pageState === "loading" && <LoadingSkeleton />}

        {/* ── Invalid ───────────────────────────────────────────── */}
        {pageState === "invalid" && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-light">
              <AlertCircle className="h-6 w-6 text-warning-dark" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">This session can&apos;t be rescheduled</p>
              <p className="text-sm text-text-muted mt-1">
                It may already be cancelled, completed, or have a pending reschedule request.
              </p>
            </div>
            <Link
              href="/sessions"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
            >
              Back to My Sessions
            </Link>
          </div>
        )}

        {/* ── Pick Slot ─────────────────────────────────────────── */}
        {pageState === "pick-slot" && currentSession && (
          <>
            <Link
              href="/sessions"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Sessions
            </Link>

            <div className="lg:grid lg:grid-cols-3 lg:gap-6">
              {/* Left: session card + slot list */}
              <div className="lg:col-span-2 space-y-6">
                <CurrentSessionCard session={currentSession} />

                <div>
                  <h2 className="text-base font-bold text-text-primary mb-1">Select a new time</h2>
                  <p className="text-xs text-text-muted mb-4">All times shown in your local timezone.</p>
                  <SlotGroups
                    groups={slotGroups}
                    selectedSlot={selectedSlot}
                    onSelect={setSelectedSlot}
                  />
                </div>
              </div>

              {/* Right: sticky summary + continue (desktop) */}
              <div className="hidden lg:block">
                <div className="sticky top-6 space-y-4">
                  {selectedSlot ? (
                    <>
                      <SelectedSummary slot={selectedSlot} />
                      <button
                        onClick={() => setPageState("confirm")}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
                      >
                        Continue
                      </button>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-card p-4 text-center space-y-2">
                      <CalendarDays className="h-8 w-8 text-text-muted mx-auto" />
                      <p className="text-xs text-text-muted">Select a slot to continue</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile sticky bottom bar */}
            {selectedSlot && (
              <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-card border-t border-border px-4 py-3 z-20">
                <div className="flex items-center gap-3 max-w-2xl mx-auto">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{formatShortDate(selectedSlot.date)}</p>
                    <p className="text-xs text-text-muted">
                      {formatTime(selectedSlot.startTime)} · {formatDuration(selectedSlot.durationMinutes)}
                    </p>
                  </div>
                  <button
                    onClick={() => setPageState("confirm")}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Confirm ────────────────────────────────────────────── */}
        {(pageState === "confirm" || pageState === "submitting") && currentSession && selectedSlot && (
          <>
            <button
              onClick={() => setPageState("pick-slot")}
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Change slot
            </button>

            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Confirm Reschedule Request</h2>
                <p className="text-sm text-text-muted mt-0.5">
                  Review the time change and add a reason before sending.
                </p>
              </div>

              <div className="h-px bg-border" />

              {/* Original → Proposed comparison */}
              <div className="space-y-3">
                {/* Original (muted/strikethrough) */}
                <div className="rounded-lg bg-muted px-4 py-3 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Current time</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1.5 text-sm text-text-muted line-through">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      {formatLongDate(currentSession.date)}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-text-muted line-through">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {formatTime(currentSession.startTime)} — {formatTime(currentSession.endTime)}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                    <ArrowDown className="h-4 w-4 text-primary" />
                  </div>
                </div>

                {/* Proposed (highlighted) */}
                <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Proposed new time</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {formatLongDate(selectedSlot.date)}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {formatTime(selectedSlot.startTime)} — {formatTime(selectedSlot.endTime)}
                      <span className="font-normal text-text-muted">· {formatDuration(selectedSlot.durationMinutes)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Reason field */}
              <div className="space-y-2">
                <label htmlFor="reason" className="block text-sm font-medium text-text-primary">
                  Reason for rescheduling
                  <span className="text-destructive ml-1" aria-hidden>*</span>
                </label>
                <textarea
                  id="reason"
                  rows={4}
                  maxLength={REASON_MAX}
                  disabled={pageState === "submitting"}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (reasonError) setReasonError(null);
                  }}
                  placeholder="e.g. I have a conflicting meeting and need to shift the time."
                  className={cn(
                    "w-full resize-none rounded-lg border bg-card px-3.5 py-2.5 text-sm text-text-primary",
                    "placeholder:text-text-muted leading-relaxed",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    reasonError ? "border-destructive" : "border-border"
                  )}
                />
                <div className="flex items-center justify-between">
                  {reasonError ? (
                    <p className="text-xs text-destructive">{reasonError}</p>
                  ) : (
                    <p className="text-xs text-text-muted">
                      {reason.trim().length < REASON_MIN
                        ? `${REASON_MIN - reason.trim().length} more characters required`
                        : "Looks good"}
                    </p>
                  )}
                  <p className="text-xs text-text-muted shrink-0">{reason.length}/{REASON_MAX}</p>
                </div>
              </div>

              {/* Info banner */}
              <div className="flex items-start gap-2.5 rounded-lg bg-info-light px-4 py-3">
                <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
                <p className="text-xs text-info-dark leading-relaxed">
                  This is a request — your original session stays active until{" "}
                  <span className="font-semibold">{mentorFirstName}</span> accepts or declines.
                </p>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={pageState === "submitting"}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3",
                  "bg-primary text-primary-foreground text-sm font-semibold",
                  "hover:bg-primary-dark transition-colors",
                  "disabled:opacity-70 disabled:cursor-not-allowed"
                )}
              >
                {pageState === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending request…
                  </>
                ) : (
                  "Send Reschedule Request"
                )}
              </button>

              {pageState !== "submitting" && (
                <button
                  onClick={() => router.back()}
                  className="w-full text-center text-sm text-text-muted hover:text-text-secondary transition-colors"
                >
                  Keep my original session
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Error ─────────────────────────────────────────────── */}
        {pageState === "error" && currentSession && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-5 text-center">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive-light">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Request Failed</h2>
              <p className="text-sm text-text-muted mt-1.5 max-w-xs mx-auto">
                Something went wrong. Your original session is still active — please try again.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setPageState("confirm")}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/sessions"
                className="text-sm text-text-muted hover:text-text-secondary transition-colors py-1"
              >
                Back to My Sessions
              </Link>
            </div>
          </div>
        )}

        {/* ── Success ────────────────────────────────────────────── */}
        {pageState === "success" && currentSession && selectedSlot && (
          <div className="rounded-xl border border-border bg-card p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-text-primary">Request Sent</h2>
              <p className="text-sm text-text-muted mt-1.5">
                Your reschedule request has been sent to {mentorFirstName}.
              </p>
            </div>

            {/* Old → New time summary */}
            <div className="rounded-xl bg-muted px-6 py-4 space-y-3 text-left">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Original time</p>
                <p className="text-sm text-text-muted line-through">
                  {formatShortDate(currentSession.date)} · {formatTime(currentSession.startTime)}
                </p>
              </div>
              <div className="flex justify-start">
                <ArrowDown className="h-4 w-4 text-text-muted" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Proposed new time</p>
                <p className="text-sm font-semibold text-text-primary">
                  {formatShortDate(selectedSlot.date)} · {formatTime(selectedSlot.startTime)}
                </p>
              </div>
            </div>

            {/* What happens next */}
            <div className="rounded-lg bg-muted px-4 py-3 text-left text-xs text-text-secondary space-y-1">
              <p className="font-medium text-text-primary">What happens next</p>
              <p>• Your request has been sent to {mentorFirstName} for review</p>
              <p>• Your original session stays active until they respond</p>
              <p>• You&apos;ll be notified once they accept or decline</p>
              <p>• You can still cancel the session from My Sessions</p>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <Link
                href="/sessions"
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
              >
                <CalendarDays className="h-4 w-4" />
                Back to My Sessions
              </Link>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
