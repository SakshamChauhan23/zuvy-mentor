"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatTime, formatDuration } from "@/lib/mock/slots";
import { cn } from "@/lib/utils";
import type { BookedSession } from "@/lib/types/session";

// ─── Constants ────────────────────────────────────────────────────────────────

const REASON_MIN = 10;
const REASON_MAX = 500;

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState = "loading" | "review" | "cancelling" | "success" | "error" | "invalid";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toHHMM(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toDateStr(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatSessionDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-lg animate-pulse space-y-4">
      <div className="h-4 w-28 rounded bg-muted" />
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-px bg-muted" />
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted" />
          </div>
        </div>
        <div className="h-px bg-muted" />
        <div className="space-y-2">
          <div className="h-3.5 w-48 rounded bg-muted" />
          <div className="h-3.5 w-40 rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-36 rounded bg-muted" />
          <div className="h-24 w-full rounded-lg bg-muted" />
        </div>
        <div className="h-10 w-full rounded-lg bg-muted" />
      </div>
    </div>
  );
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({ icon: Icon, value }: { icon: React.ElementType; value: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-text-secondary">
      <Icon className="h-3.5 w-3.5 shrink-0 text-text-muted" />
      {value}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CancelPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [session, setSession] = useState<BookedSession | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  // Load session from real API
  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then(async (res) => {
        if (res.status === 404) { setPageState("invalid"); return; }
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        if (data.status !== "upcoming" && data.status !== "rescheduled") {
          setPageState("invalid");
          return;
        }

        const s: BookedSession = {
          id: data.id,
          mentorId: data.mentorProfileId,
          mentorName: data.mentorName,
          mentorTitle: data.mentorTitle,
          isVerified: data.isVerified,
          date: toDateStr(data.slotStart),
          startTime: toHHMM(data.slotStart),
          endTime: toHHMM(data.slotEnd),
          durationMinutes: data.durationMinutes,
          status: data.status,
          bookedAt: data.bookedAt,
        };
        setSession(s);
        setPageState("review");
      })
      .catch(() => setPageState("invalid"));
  }, [id]);

  // Validate reason field
  const validateReason = (): boolean => {
    if (reason.trim().length < REASON_MIN) {
      setReasonError(`Please enter at least ${REASON_MIN} characters.`);
      return false;
    }
    setReasonError(null);
    return true;
  };

  // Submit cancellation
  const handleCancel = async () => {
    if (!validateReason()) return;
    setPageState("cancelling");

    try {
      const res = await fetch(`/api/sessions/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      if (!res.ok) {
        setPageState("error");
        return;
      }
      setPageState("success");
    } catch {
      setPageState("error");
    }
  };

  const initials = session?.mentorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "";

  return (
    <DashboardLayout
      role="learner"
      pageTitle="Cancel Session"
      pageSubtitle={session ? `Session with ${session.mentorName}` : undefined}
      userName="Jane Doe"
      userTitle="Learner"
    >
      <div className="mx-auto max-w-lg">

        {/* ── Loading ──────────────────────────────────────────── */}
        {pageState === "loading" && <LoadingSkeleton />}

        {/* ── Invalid ──────────────────────────────────────────── */}
        {pageState === "invalid" && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-light">
              <AlertCircle className="h-6 w-6 text-warning-dark" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">This session can&apos;t be cancelled</p>
              <p className="text-sm text-text-muted mt-1">
                It may have already been cancelled or completed.
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

        {/* ── Review + Reason form ─────────────────────────────── */}
        {(pageState === "review" || pageState === "cancelling") && session && (
          <>
            <Link
              href="/sessions"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Sessions
            </Link>

            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              {/* Heading */}
              <div>
                <h2 className="text-lg font-bold text-text-primary">Cancel your session</h2>
                <p className="text-sm text-text-muted mt-0.5">
                  Review the details below and provide a reason before confirming.
                </p>
              </div>

              <div className="h-px bg-border" />

              {/* Mentor */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold select-none">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-text-primary truncate">
                      {session.mentorName}
                    </span>
                    {session.isVerified && (
                      <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-text-secondary truncate">{session.mentorTitle}</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Session details */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Session being cancelled
                </p>
                <DetailRow
                  icon={CalendarDays}
                  value={formatSessionDate(session.date)}
                />
                <DetailRow
                  icon={Clock}
                  value={`${formatTime(session.startTime)} — ${formatTime(session.endTime)} · ${formatDuration(session.durationMinutes)}`}
                />
              </div>

              <div className="h-px bg-border" />

              {/* Reason field */}
              <div className="space-y-2">
                <label htmlFor="reason" className="block text-sm font-medium text-text-primary">
                  Reason for cancellation
                  <span className="text-destructive ml-1" aria-hidden>*</span>
                </label>
                <textarea
                  id="reason"
                  rows={4}
                  maxLength={REASON_MAX}
                  disabled={pageState === "cancelling"}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (reasonError) setReasonError(null);
                  }}
                  placeholder="e.g. I have a conflicting commitment and need to reschedule."
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
                  <p className="text-xs text-text-muted shrink-0">
                    {reason.length}/{REASON_MAX}
                  </p>
                </div>
              </div>

              {/* Warning banner */}
              <div className="flex items-start gap-2.5 rounded-lg bg-destructive-light px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive leading-relaxed">
                  This cannot be undone. Your reserved slot will be released and{" "}
                  <span className="font-semibold">{session.mentorName.split(" ")[0]}</span> will be notified.
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={handleCancel}
                disabled={pageState === "cancelling"}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3",
                  "bg-destructive text-destructive-foreground text-sm font-semibold",
                  "hover:bg-destructive-dark transition-colors",
                  "disabled:opacity-70 disabled:cursor-not-allowed"
                )}
              >
                {pageState === "cancelling" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling session…
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Confirm Cancellation
                  </>
                )}
              </button>

              {pageState !== "cancelling" && (
                <button
                  onClick={() => router.back()}
                  className="w-full text-center text-sm text-text-muted hover:text-text-secondary transition-colors"
                >
                  Keep my session
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Error ────────────────────────────────────────────── */}
        {pageState === "error" && session && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-5 text-center">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive-light">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Cancellation Failed</h2>
              <p className="text-sm text-text-muted mt-1.5 max-w-xs mx-auto">
                Something went wrong on our end. Your session is still active — please try again.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setPageState("review")}
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

        {/* ── Success ───────────────────────────────────────────── */}
        {pageState === "success" && session && (
          <div className="rounded-xl border border-border bg-card p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-text-primary">Session Cancelled</h2>
              <p className="text-sm text-text-muted mt-1.5">
                Your session has been cancelled successfully.
              </p>
            </div>

            <div className="inline-flex flex-col items-center gap-1 rounded-xl bg-muted px-6 py-4 text-center">
              <p className="text-sm font-semibold text-text-primary line-through text-text-muted">
                {session.mentorName}
              </p>
              <p className="text-xs text-text-muted">
                {new Date(session.date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                })}
                {" · "}
                {formatTime(session.startTime)}
              </p>
            </div>

            <div className="rounded-lg bg-muted px-4 py-3 text-left text-xs text-text-secondary space-y-1">
              <p className="font-medium text-text-primary">What happens next</p>
              <p>• The session has been removed from your upcoming schedule</p>
              <p>• You can view it in the Cancelled tab on your dashboard</p>
              <p>• You&apos;re free to book another session whenever you&apos;re ready</p>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <Link
                href="/sessions"
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
              >
                <CalendarDays className="h-4 w-4" />
                Back to My Sessions
              </Link>
              <Link
                href={`/mentors/${session.mentorId}`}
                className="text-sm text-text-muted hover:text-text-secondary transition-colors py-1"
              >
                Book another session with {session.mentorName.split(" ")[0]}
              </Link>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
