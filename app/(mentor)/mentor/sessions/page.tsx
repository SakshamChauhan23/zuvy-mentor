"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import {
  getMentorSessions,
  acceptRescheduleRequest,
  declineRescheduleRequest,
} from "@/lib/mock/mentor-sessions";
import type { MentorSession, MentorSessionStatus } from "@/lib/types/mentor-session";
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ArrowDown,
  Loader2,
  RefreshCw,
  CalendarX,
  BookOpen,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  const isTomorrow =
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();

  if (isToday) return "Today";
  if (isTomorrow) return "Tomorrow";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<
  MentorSessionStatus,
  { label: string; chip: string; dot: string }
> = {
  upcoming: {
    label: "Upcoming",
    chip: "bg-primary-light text-text-accent",
    dot: "bg-primary",
  },
  "reschedule-pending": {
    label: "Reschedule Pending",
    chip: "bg-warning-light text-warning-dark",
    dot: "bg-warning",
  },
  completed: {
    label: "Completed",
    chip: "bg-accent-light text-accent-foreground",
    dot: "bg-accent",
  },
  cancelled: {
    label: "Cancelled",
    chip: "bg-muted text-text-muted",
    dot: "bg-text-muted",
  },
};

// ─── Tab config ───────────────────────────────────────────────────────────────

type Tab = "all" | "upcoming" | "reschedule-pending" | "completed" | "cancelled";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "reschedule-pending", label: "Reschedule Requests" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

// ─── Session list card ────────────────────────────────────────────────────────

function SessionListCard({
  session,
  selected,
  onClick,
}: {
  session: MentorSession;
  selected: boolean;
  onClick: () => void;
}) {
  const s = STATUS[session.status];
  const isPending = session.status === "reschedule-pending";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border transition-all duration-150",
        "hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected
          ? "border-primary bg-primary-light shadow-sm"
          : "border-border bg-card hover:border-primary/40"
      )}
    >
      {/* Reschedule pending accent bar */}
      {isPending && (
        <div className="h-1 w-full rounded-t-xl bg-warning" />
      )}

      <div className="p-4">
        {/* Avatar + name row */}
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-semibold">
            {initials(session.learnerName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary truncate">
              {session.learnerName}
            </p>
            <p className="text-xs text-text-muted truncate mt-0.5">
              {session.learnerRole}
            </p>
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 mt-0.5 transition-colors",
              selected ? "text-primary" : "text-text-muted"
            )}
          />
        </div>

        {/* Date / time row */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Calendar className="h-3.5 w-3.5 text-text-muted" />
            <span>{formatDate(session.date)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Clock className="h-3.5 w-3.5 text-text-muted" />
            <span>
              {formatTime(session.startTime)} – {formatTime(session.endTime)}
            </span>
          </div>
        </div>

        {/* Status chip */}
        <div className="mt-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
              s.chip
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
            {s.label}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: Tab }) {
  const config = {
    all: {
      icon: BookOpen,
      title: "No sessions yet",
      desc: "Sessions booked by learners will appear here.",
    },
    upcoming: {
      icon: Calendar,
      title: "No upcoming sessions",
      desc: "You have no sessions scheduled at the moment.",
    },
    "reschedule-pending": {
      icon: RefreshCw,
      title: "No pending requests",
      desc: "Learner reschedule requests will appear here when submitted.",
    },
    completed: {
      icon: CheckCircle2,
      title: "No completed sessions",
      desc: "Sessions you complete will be moved here.",
    },
    cancelled: {
      icon: CalendarX,
      title: "No cancelled sessions",
      desc: "Cancelled sessions will be listed here.",
    },
  };
  const { icon: Icon, title, desc } = config[tab];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-6 w-6 text-text-muted" />
      </div>
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <p className="text-xs text-text-muted mt-1 max-w-[220px]">{desc}</p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SessionCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-28 rounded bg-muted" />
          <div className="h-3 w-40 rounded bg-muted" />
        </div>
      </div>
      <div className="flex gap-4 mt-3">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-3 w-28 rounded bg-muted" />
      </div>
      <div className="mt-3 h-5 w-24 rounded-full bg-muted" />
    </div>
  );
}

// ─── Reschedule action row ────────────────────────────────────────────────────

type ActionState = "idle" | "accepting" | "declining" | "done-accept" | "done-decline";

function RescheduleActions({
  session,
  onAccept,
  onDecline,
}: {
  session: MentorSession;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [actionState, setActionState] = useState<ActionState>("idle");

  function handleAccept() {
    if (actionState !== "idle") return;
    setActionState("accepting");
    setTimeout(() => {
      const ok = acceptRescheduleRequest(session.id);
      if (ok) {
        setActionState("done-accept");
        onAccept();
      } else {
        setActionState("idle");
      }
    }, 800);
  }

  function handleDecline() {
    if (actionState !== "idle") return;
    setActionState("declining");
    setTimeout(() => {
      const ok = declineRescheduleRequest(session.id);
      if (ok) {
        setActionState("done-decline");
        onDecline();
      } else {
        setActionState("idle");
      }
    }, 800);
  }

  if (actionState === "done-accept") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-accent-light px-3 py-2.5 text-sm font-medium text-accent-foreground">
        <CheckCircle2 className="h-4 w-4" />
        Reschedule accepted — session updated
      </div>
    );
  }

  if (actionState === "done-decline") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium text-text-secondary">
        <XCircle className="h-4 w-4" />
        Request declined — original time kept
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <button
        onClick={handleAccept}
        disabled={actionState !== "idle"}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5",
          "text-sm font-semibold transition-colors",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {actionState === "accepting" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        Accept
      </button>
      <button
        onClick={handleDecline}
        disabled={actionState !== "idle"}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5",
          "text-sm font-semibold transition-colors",
          "border border-destructive text-destructive hover:bg-destructive-light",
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {actionState === "declining" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        Decline
      </button>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  session,
  onClose,
  onSessionUpdated,
}: {
  session: MentorSession;
  onClose: () => void;
  onSessionUpdated: () => void;
}) {
  const s = STATUS[session.status];
  const isPending = session.status === "reschedule-pending";
  const req = session.rescheduleRequest;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-semibold">
            {initials(session.learnerName)}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-text-primary truncate">
              {session.learnerName}
            </p>
            <p className="text-xs text-text-muted truncate">{session.learnerRole}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors text-sm lg:hidden"
        >
          ✕
        </button>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Status */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
              s.chip
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
            {s.label}
          </span>
        </div>

        {/* Session time block */}
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Scheduled Session
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">Date</span>
              <span className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-text-muted" />
                {formatDate(session.date)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">Duration</span>
              <span className="text-sm font-medium text-text-primary">
                {session.durationMinutes} min
              </span>
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <span className="text-xs text-text-muted">Time</span>
              <span className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-text-muted" />
                {formatTime(session.startTime)} – {formatTime(session.endTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Learner info */}
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Learner
          </p>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 shrink-0 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-semibold">
              {initials(session.learnerName)}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{session.learnerName}</p>
              <p className="text-xs text-text-muted">{session.learnerRole}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted pt-1">
            Booked {formatRelative(session.bookedAt)}
          </p>
        </div>

        {/* Reschedule request block */}
        {isPending && req && (
          <div className="rounded-xl border border-warning bg-warning-light p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning-dark shrink-0" />
              <p className="text-sm font-semibold text-warning-dark">
                Reschedule Request
              </p>
              <span className="ml-auto text-xs text-warning-dark/70">
                {formatRelative(req.requestedAt)}
              </span>
            </div>

            {/* Original → Proposed */}
            <div className="space-y-2">
              <div className="rounded-lg bg-card/80 border border-warning/30 p-3">
                <p className="text-xs text-text-muted mb-1">Original time</p>
                <p className="text-sm text-text-secondary line-through">
                  {formatDate(session.date)}, {formatTime(session.startTime)} – {formatTime(session.endTime)}
                </p>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="h-4 w-4 text-warning-dark" />
              </div>

              <div className="rounded-lg bg-card border border-warning p-3">
                <p className="text-xs text-text-muted mb-1">Proposed new time</p>
                <p className="text-sm font-semibold text-text-primary">
                  {formatDate(req.proposedDate)}, {formatTime(req.proposedStartTime)} – {formatTime(req.proposedEndTime)}
                </p>
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="text-xs text-text-muted mb-1">Reason from learner</p>
              <p className="text-sm text-text-secondary italic leading-relaxed">
                &ldquo;{req.reason}&rdquo;
              </p>
            </div>

            {/* Accept / Decline */}
            <RescheduleActions
              session={session}
              onAccept={onSessionUpdated}
              onDecline={onSessionUpdated}
            />
          </div>
        )}

        {/* Completed / Cancelled notes */}
        {session.status === "completed" && (
          <div className="rounded-xl border border-border bg-accent-light/30 p-4 text-center">
            <CheckCircle2 className="h-6 w-6 text-accent-foreground mx-auto mb-1.5" />
            <p className="text-sm font-medium text-text-primary">Session Completed</p>
            <p className="text-xs text-text-muted mt-0.5">This session has been successfully completed.</p>
          </div>
        )}

        {session.status === "cancelled" && (
          <div className="rounded-xl border border-border bg-muted p-4 text-center">
            <CalendarX className="h-6 w-6 text-text-muted mx-auto mb-1.5" />
            <p className="text-sm font-medium text-text-primary">Session Cancelled</p>
            <p className="text-xs text-text-muted mt-0.5">This session was cancelled and is no longer active.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── No selection placeholder ─────────────────────────────────────────────────

function NoSelectionPanel() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center h-full text-center px-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <User className="h-7 w-7 text-text-muted" />
      </div>
      <p className="text-sm font-semibold text-text-primary">Select a session</p>
      <p className="text-xs text-text-muted mt-1 max-w-[200px]">
        Click any session on the left to view its details here.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MentorSessionsPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetailMobile, setShowDetailMobile] = useState(false);

  // Simulate load
  useEffect(() => {
    const t = setTimeout(() => {
      setSessions(getMentorSessions());
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  // Refresh sessions from store (after accept/decline)
  function refreshSessions() {
    setSessions([...getMentorSessions()]);
  }

  // Filtered + sorted lists per tab
  const filtered = useMemo(() => {
    let list = [...sessions];
    if (activeTab === "upcoming") list = list.filter((s) => s.status === "upcoming");
    else if (activeTab === "reschedule-pending") list = list.filter((s) => s.status === "reschedule-pending");
    else if (activeTab === "completed") list = list.filter((s) => s.status === "completed");
    else if (activeTab === "cancelled") list = list.filter((s) => s.status === "cancelled");

    // Sort: upcoming/pending → asc by date; past → desc by date
    return list.sort((a, b) => {
      const isPastA = a.status === "completed" || a.status === "cancelled";
      const isPastB = b.status === "completed" || b.status === "cancelled";
      if (isPastA !== isPastB) return isPastA ? 1 : -1;
      const diff = a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
      return isPastA ? -diff : diff;
    });
  }, [sessions, activeTab]);

  // Tab counts
  const counts = useMemo(() => ({
    all: sessions.length,
    upcoming: sessions.filter((s) => s.status === "upcoming").length,
    "reschedule-pending": sessions.filter((s) => s.status === "reschedule-pending").length,
    completed: sessions.filter((s) => s.status === "completed").length,
    cancelled: sessions.filter((s) => s.status === "cancelled").length,
  }), [sessions]);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedId) ?? null,
    [sessions, selectedId]
  );

  function selectSession(id: string) {
    setSelectedId(id);
    setShowDetailMobile(true);
  }

  const pendingCount = counts["reschedule-pending"];

  return (
    <DashboardLayout
      role="mentor"
      pageTitle="Sessions"
      pageSubtitle="Manage your mentoring sessions and respond to learner requests"
      userName="Alex Johnson"
      userTitle="Senior Mentor"
      topbarActions={
        pendingCount > 0 ? (
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-warning-light border border-warning/30 px-3 py-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-warning-dark shrink-0" />
            <span className="text-xs font-semibold text-warning-dark">
              {pendingCount} pending request{pendingCount > 1 ? "s" : ""}
            </span>
          </div>
        ) : undefined
      }
    >
      {/* Master-detail card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden flex h-[calc(100vh-11rem)]">

        {/* ── Left panel: tabs + list ── */}
        <div
          className={cn(
            "flex flex-col border-r border-border shrink-0",
            "w-full lg:w-[360px]",
            showDetailMobile && selectedSession ? "hidden lg:flex" : "flex"
          )}
        >
          {/* Tab bar */}
          <div className="flex gap-0.5 overflow-x-auto px-3 pt-3 pb-0 shrink-0">
            {TABS.map((tab) => {
              const count = counts[tab.id];
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedId(null);
                  }}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors border-b-2",
                    activeTab === tab.id
                      ? "border-primary text-text-accent bg-primary-light"
                      : "border-transparent text-text-secondary hover:text-text-primary hover:bg-muted"
                  )}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground"
                          : tab.id === "reschedule-pending"
                          ? "bg-warning text-white"
                          : "bg-muted text-text-muted"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="h-px bg-border shrink-0" />

          {/* Session list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <SessionCardSkeleton key={i} />
              ))
            ) : filtered.length === 0 ? (
              <EmptyState tab={activeTab} />
            ) : (
              filtered.map((session) => (
                <SessionListCard
                  key={session.id}
                  session={session}
                  selected={selectedId === session.id}
                  onClick={() => selectSession(session.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right panel: detail ── */}
        <div
          className={cn(
            "flex-1 overflow-hidden bg-card",
            showDetailMobile && selectedSession
              ? "flex flex-col"
              : "hidden lg:flex lg:flex-col"
          )}
        >
          {/* Mobile back button */}
          {showDetailMobile && selectedSession && (
            <button
              onClick={() => setShowDetailMobile(false)}
              className="lg:hidden flex items-center gap-1.5 px-4 py-3 text-sm text-text-secondary hover:text-text-primary border-b border-border shrink-0"
            >
              ← Back to sessions
            </button>
          )}

          {selectedSession ? (
            <DetailPanel
              key={selectedSession.id}
              session={selectedSession}
              onClose={() => {
                setSelectedId(null);
                setShowDetailMobile(false);
              }}
              onSessionUpdated={() => {
                refreshSessions();
              }}
            />
          ) : (
            <NoSelectionPanel />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
