import Link from "next/link";
import { BadgeCheck, CalendarDays, Clock, Zap, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, formatDuration } from "@/lib/mock/slots";
import type { BookedSession, SessionStatus } from "@/lib/types/session";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; badgeClass: string; cardClass?: string }
> = {
  upcoming: {
    label: "Upcoming",
    badgeClass: "bg-info-light text-info",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-success-light text-success-dark",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-muted text-text-muted",
    cardClass: "opacity-70",
  },
  rescheduled: {
    label: "Rescheduled",
    badgeClass: "bg-secondary-light text-secondary-dark",
  },
  "reschedule-pending": {
    label: "Pending Approval",
    badgeClass: "bg-warning-light text-warning-dark",
  },
};

// ─── Date/time helpers ────────────────────────────────────────────────────────

function getDayContext(dateStr: string): { isToday: boolean; isTomorrow: boolean; diffDays: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sessionDate = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round((sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return { isToday: diffDays === 0, isTomorrow: diffDays === 1, diffDays };
}

function formatSessionDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: BookedSession;
}

export default function SessionCard({ session }: SessionCardProps) {
  const {
    id,
    mentorId,
    mentorName,
    mentorTitle,
    isVerified,
    date,
    startTime,
    endTime,
    durationMinutes,
    status,
    rescheduleRequest,
  } = session;

  const { label, badgeClass, cardClass } = STATUS_CONFIG[status];
  const { isToday, isTomorrow } = getDayContext(date);
  const isActionable = status === "upcoming" || status === "rescheduled";
  const isPending = status === "reschedule-pending";
  const isComingSoon = isToday || isTomorrow;

  const initials = mentorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "rounded-xl border bg-card transition-shadow",
        isActionable && isComingSoon
          ? "border-primary/40 shadow-md"
          : isPending
          ? "border-warning/40"
          : "border-border",
        cardClass
      )}
    >
      {/* "Today" / "Tomorrow" urgency banner */}
      {isActionable && isComingSoon && (
        <div className="flex items-center gap-2 rounded-t-xl bg-primary px-4 py-2">
          <Zap className="h-3.5 w-3.5 text-primary-foreground" />
          <span className="text-xs font-semibold text-primary-foreground">
            {isToday ? "Your session is today!" : "Session tomorrow"}
          </span>
        </div>
      )}

      {/* Pending reschedule banner */}
      {isPending && (
        <div className="flex items-center gap-2 rounded-t-xl bg-warning-light px-4 py-2 border-b border-warning/20">
          <Hourglass className="h-3.5 w-3.5 text-warning-dark" />
          <span className="text-xs font-semibold text-warning-dark">
            Reschedule request sent — awaiting mentor approval
          </span>
        </div>
      )}

      <div className="p-5">
        {/* ── Header row: mentor info + status badge ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold select-none">
              {initials}
            </div>
            {/* Name + title */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/mentors/${mentorId}`}
                  className="text-sm font-semibold text-text-primary hover:text-text-accent truncate transition-colors"
                >
                  {mentorName}
                </Link>
                {isVerified && (
                  <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />
                )}
              </div>
              <p className="text-xs text-text-secondary truncate mt-0.5">{mentorTitle}</p>
            </div>
          </div>

          {/* Status badge */}
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
              badgeClass
            )}
          >
            {label}
          </span>
        </div>

        {/* ── Session date + time ── */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className={cn("flex items-center gap-1.5 text-sm", isPending ? "text-text-muted line-through" : "text-text-secondary")}>
            <CalendarDays className="h-3.5 w-3.5 text-text-muted" />
            {formatSessionDate(date)}
          </span>
          <span className={cn("flex items-center gap-1.5 text-sm", isPending ? "text-text-muted line-through" : "text-text-secondary")}>
            <Clock className="h-3.5 w-3.5 text-text-muted" />
            {formatTime(startTime)} — {formatTime(endTime)}
            <span className="text-text-muted">· {formatDuration(durationMinutes)}</span>
          </span>
        </div>

        {/* ── Proposed new time (reschedule-pending only) ── */}
        {isPending && rescheduleRequest && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="flex items-center gap-1.5 text-sm text-warning-dark font-medium">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatSessionDate(rescheduleRequest.proposedDate)}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-warning-dark font-medium">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(rescheduleRequest.proposedStartTime)} — {formatTime(rescheduleRequest.proposedEndTime)}
              <span className="text-warning-dark/70">· {formatDuration(rescheduleRequest.proposedDurationMinutes)}</span>
            </span>
            <span className="text-xs text-text-muted italic">(proposed)</span>
          </div>
        )}

        {/* ── Guidance message ── */}
        {isActionable && (
          <p className="mt-3 text-xs text-text-muted">
            {isToday
              ? "Join your session at the scheduled time — your mentor will be ready."
              : isTomorrow
              ? "Reminder: your session is tomorrow. Make sure you're prepared."
              : "You're all set. We'll remind you before the session."}
          </p>
        )}
        {isPending && (
          <p className="mt-3 text-xs text-text-muted">
            Your original session stays active until your mentor responds. You'll be notified of their decision.
          </p>
        )}

        {/* ── Actions (upcoming / rescheduled only) ── */}
        {isActionable && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            <Link
              href={`/sessions/${id}/reschedule`}
              className={cn(
                "inline-flex items-center rounded-lg border border-border bg-card px-3 py-1.5",
                "text-xs font-medium text-text-secondary",
                "hover:border-primary/40 hover:text-text-primary transition-colors"
              )}
            >
              Reschedule
            </Link>
            <Link
              href={`/sessions/${id}/cancel`}
              className={cn(
                "inline-flex items-center rounded-lg border border-border bg-card px-3 py-1.5",
                "text-xs font-medium text-text-secondary",
                "hover:border-destructive/40 hover:text-destructive transition-colors"
              )}
            >
              Cancel
            </Link>
          </div>
        )}

        {/* ── Pending actions: only cancel remains available ── */}
        {isPending && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-warning/30 bg-warning-light px-3 py-1.5 text-xs font-medium text-warning-dark">
              <Hourglass className="h-3 w-3" />
              Reschedule pending
            </span>
            <Link
              href={`/sessions/${id}/cancel`}
              className={cn(
                "inline-flex items-center rounded-lg border border-border bg-card px-3 py-1.5",
                "text-xs font-medium text-text-secondary",
                "hover:border-destructive/40 hover:text-destructive transition-colors"
              )}
            >
              Cancel
            </Link>
          </div>
        )}

        {/* "Book Again" for cancelled sessions */}
        {status === "cancelled" && (
          <div className="mt-4 border-t border-border pt-4">
            <Link
              href={`/mentors/${mentorId}`}
              className="text-xs font-medium text-text-interactive hover:underline"
            >
              Book again with {mentorName.split(" ")[0]} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
