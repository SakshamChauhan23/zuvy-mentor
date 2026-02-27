"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Users,
  Star,
  Bell,
  CalendarX,
  ArrowRight,
  Hourglass,
  Check,
  X,
  Loader2,
  Clock,
  TrendingUp,
  BookOpen,
  BarChart2,
  Zap,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  getMentorSessions,
  getMentorNotifications,
  acceptRescheduleRequest,
  declineRescheduleRequest,
  markNotificationRead,
} from "@/lib/mock/mentor-sessions";
import { formatTime, formatDuration } from "@/lib/mock/slots";
import { cn } from "@/lib/utils";
import type { MentorSession, MentorNotification } from "@/lib/types/mentor-session";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatLongDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getDayContext(dateStr: string): "today" | "tomorrow" | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  return null;
}

// ─── Sparklines ───────────────────────────────────────────────────────────────

const SPARKLINES: Record<string, number[]> = {
  upcoming:   [2, 3, 4, 3, 5, 4, 6],
  completed:  [4, 5, 6, 7, 5, 8, 7],
  learners:   [1, 2, 3, 4, 4, 5, 6],
  rating:     [4, 5, 5, 4, 5, 5, 5],
};

function Sparkline({ bars, color }: { bars: number[]; color: string }) {
  const max = Math.max(...bars);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {bars.map((h, i) => (
        <div
          key={i}
          className={cn("w-1.5 rounded-sm", color)}
          style={{ height: `${(h / max) * 100}%`, opacity: 0.3 + (i / bars.length) * 0.7 }}
        />
      ))}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, iconBg, iconColor, sparkKey, sparkColor, href,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  sparkKey: keyof typeof SPARKLINES; sparkColor: string; href?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <Sparkline bars={SPARKLINES[sparkKey]} color={sparkColor} />
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary tabular-nums">{value}</p>
        <p className="text-xs text-text-muted mt-0.5">{label}</p>
      </div>
      <p className="text-xs text-text-secondary">{sub}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="flex items-end gap-0.5 h-8">
                {[...Array(7)].map((_, j) => (
                  <div key={j} className="w-1.5 rounded-sm bg-muted" style={{ height: `${30 + j * 10}%` }} />
                ))}
              </div>
            </div>
            <div className="h-7 w-12 rounded bg-muted" />
            <div className="h-3 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-72 rounded-xl border border-border bg-card" />
          <div className="h-48 rounded-xl border border-border bg-card" />
        </div>
        <div className="space-y-4">
          <div className="h-48 rounded-xl border border-border bg-card" />
          <div className="h-64 rounded-xl border border-border bg-card" />
        </div>
      </div>
    </div>
  );
}

// ─── Session row ──────────────────────────────────────────────────────────────

const SESSION_STATUS_CONFIG = {
  upcoming:           { label: "Upcoming",         badgeClass: "bg-info-light text-info" },
  completed:          { label: "Completed",         badgeClass: "bg-success-light text-success-dark" },
  cancelled:          { label: "Cancelled",         badgeClass: "bg-muted text-text-muted" },
  "reschedule-pending": { label: "Pending Approval", badgeClass: "bg-warning-light text-warning-dark" },
};

function UpcomingSessionRow({ session }: { session: MentorSession }) {
  const ctx = getDayContext(session.date);
  const { label, badgeClass } = SESSION_STATUS_CONFIG[session.status];

  return (
    <div className={cn(
      "flex items-center gap-3 py-3 border-b border-border last:border-0",
      session.status === "reschedule-pending" && "bg-warning-light/30 -mx-4 px-4 rounded-lg"
    )}>
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs select-none",
        session.status === "reschedule-pending"
          ? "bg-warning-light text-warning-dark"
          : "bg-secondary/10 text-secondary"
      )}>
        {getInitials(session.learnerName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-text-primary truncate">{session.learnerName}</p>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0", badgeClass)}>
            {label}
          </span>
        </div>
        <p className="text-xs text-text-muted truncate">{session.learnerRole}</p>
      </div>
      <div className="text-right shrink-0">
        {ctx ? (
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
            ctx === "today" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
          )}>
            <Zap className="h-2.5 w-2.5" />
            {ctx === "today" ? "Today" : "Tomorrow"}
          </span>
        ) : (
          <p className="text-xs text-text-muted">{formatShortDate(session.date)}</p>
        )}
        <p className="text-xs text-text-secondary mt-0.5">
          {formatTime(session.startTime)}
        </p>
      </div>
    </div>
  );
}

// ─── Reschedule request card ──────────────────────────────────────────────────

function RescheduleRequestCard({
  session,
  onAction,
}: {
  session: MentorSession;
  onAction: () => void;
}) {
  const [actionState, setActionState] = useState<"idle" | "accepting" | "declining">("idle");
  const req = session.rescheduleRequest!;

  const handleAccept = async () => {
    setActionState("accepting");
    await new Promise((r) => setTimeout(r, 800));
    acceptRescheduleRequest(session.id);
    onAction();
  };

  const handleDecline = async () => {
    setActionState("declining");
    await new Promise((r) => setTimeout(r, 800));
    declineRescheduleRequest(session.id);
    onAction();
  };

  return (
    <div className="rounded-xl border border-warning/40 bg-warning-light/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Hourglass className="h-4 w-4 text-warning-dark shrink-0" />
        <p className="text-sm font-semibold text-text-primary">
          {session.learnerName} requested a reschedule
        </p>
      </div>

      <p className="text-xs text-text-secondary leading-relaxed italic">
        &ldquo;{req.reason}&rdquo;
      </p>

      <div className="space-y-1.5 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-secondary w-16 shrink-0">Original</span>
          <span className="line-through">{formatShortDate(session.date)} · {formatTime(session.startTime)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-warning-dark w-16 shrink-0">Proposed</span>
          <span className="font-semibold text-text-primary">
            {formatShortDate(req.proposedDate)} · {formatTime(req.proposedStartTime)}
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleAccept}
          disabled={actionState !== "idle"}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
            "bg-success text-white hover:bg-success-dark",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {actionState === "accepting"
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Check className="h-3.5 w-3.5" />
          }
          {actionState === "accepting" ? "Accepting…" : "Accept"}
        </button>
        <button
          onClick={handleDecline}
          disabled={actionState !== "idle"}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
            "border border-border bg-card text-text-secondary hover:border-destructive/40 hover:text-destructive",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {actionState === "declining"
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <X className="h-3.5 w-3.5" />
          }
          {actionState === "declining" ? "Declining…" : "Decline"}
        </button>
      </div>
    </div>
  );
}

// ─── Notification row ─────────────────────────────────────────────────────────

const NOTIF_ICONS = {
  booking:      { icon: CalendarDays, color: "text-primary",    bg: "bg-primary/10" },
  cancellation: { icon: X,            color: "text-destructive", bg: "bg-destructive-light" },
  reschedule:   { icon: Hourglass,    color: "text-warning-dark", bg: "bg-warning-light" },
  rating:       { icon: Star,         color: "text-secondary",   bg: "bg-secondary/10" },
  message:      { icon: Bell,         color: "text-accent",      bg: "bg-accent/10" },
};

function NotificationRow({ notif, onRead }: { notif: MentorNotification; onRead: (id: string) => void }) {
  const { icon: Icon, color, bg } = NOTIF_ICONS[notif.type];

  return (
    <button
      onClick={() => { if (!notif.isRead) onRead(notif.id); }}
      className="flex items-start gap-3 w-full text-left py-3 border-b border-border last:border-0 hover:bg-muted/50 -mx-1 px-1 rounded-lg transition-colors"
    >
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5", bg)}>
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs leading-relaxed", notif.isRead ? "text-text-muted" : "text-text-primary font-medium")}>
          {notif.message}
        </p>
        <p className="text-[10px] text-text-muted mt-0.5">{timeAgo(notif.createdAt)}</p>
      </div>
      {!notif.isRead && (
        <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />
      )}
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function MentorDashboard() {
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [notifications, setNotifications] = useState<MentorNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setSessions([...getMentorSessions()]);
    setNotifications([...getMentorNotifications()]);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Derived data
  const upcoming = sessions
    .filter((s) => s.status === "upcoming" || s.status === "reschedule-pending")
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const completed = sessions.filter((s) => s.status === "completed");
  const uniqueLearners = new Set(sessions.map((s) => s.learnerId)).size;
  const endedSessions = sessions.filter((s) => s.status === "completed" || s.status === "cancelled").length;
  const completionRate = endedSessions > 0 ? Math.round((completed.length / endedSessions) * 100) : 0;
  const hoursDelivered = Math.round(completed.reduce((a, s) => a + s.durationMinutes, 0) / 60);
  const rescheduleRequests = sessions.filter(
    (s) => s.status === "reschedule-pending" && s.rescheduleRequest
  );
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const todaySession = upcoming.find((s) => getDayContext(s.date) === "today");

  // After accept/decline, reload state
  const handleRescheduleAction = () => {
    load();
  };

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    load();
  };

  return (
    <DashboardLayout
      role="mentor"
      pageTitle="Dashboard"
      pageSubtitle={
        !loading
          ? todaySession
            ? `You have a session with ${todaySession.learnerName} today`
            : `${upcoming.length} upcoming session${upcoming.length !== 1 ? "s" : ""} scheduled`
          : "Your mentoring command center."
      }
      userName="Alex Johnson"
      userTitle="Senior Engineer"
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6 max-w-7xl">

          {/* ── Today banner ─────────────────────────────────────── */}
          {todaySession && (
            <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm select-none">
                {getInitials(todaySession.learnerName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary">Session today with {todaySession.learnerName}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {formatTime(todaySession.startTime)} — {formatTime(todaySession.endTime)} · {todaySession.learnerRole}
                </p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shrink-0">
                <Zap className="h-3 w-3" /> Today
              </span>
            </div>
          )}

          {/* ── Stat cards ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Upcoming Sessions"
              value={upcoming.length}
              sub={upcoming.length === 0 ? "Nothing scheduled" : `Next: ${formatShortDate(upcoming[0].date)}`}
              icon={CalendarDays}
              iconBg="bg-primary/10"
              iconColor="text-primary"
              sparkKey="upcoming"
              sparkColor="bg-primary"
              href="/mentor/sessions"
            />
            <StatCard
              label="Completed Sessions"
              value={completed.length}
              sub={`${completed.length} session${completed.length !== 1 ? "s" : ""} delivered`}
              icon={CheckCircle2}
              iconBg="bg-success-light"
              iconColor="text-success"
              sparkKey="completed"
              sparkColor="bg-success"
            />
            <StatCard
              label="Learners Mentored"
              value={uniqueLearners}
              sub={`${uniqueLearners} unique learner${uniqueLearners !== 1 ? "s" : ""}`}
              icon={Users}
              iconBg="bg-secondary/10"
              iconColor="text-secondary"
              sparkKey="learners"
              sparkColor="bg-secondary"
            />
            <StatCard
              label="Average Rating"
              value="4.9"
              sub="Based on 8 reviews"
              icon={Star}
              iconBg="bg-accent/10"
              iconColor="text-accent"
              sparkKey="rating"
              sparkColor="bg-accent"
            />
          </div>

          {/* ── Main grid ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left (2/3) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Upcoming sessions */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-text-primary">Upcoming Sessions</h2>
                    <p className="text-xs text-text-muted mt-0.5">
                      {upcoming.length} session{upcoming.length !== 1 ? "s" : ""} scheduled
                    </p>
                  </div>
                  <Link href="/mentor/sessions" className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {upcoming.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <CalendarX className="h-10 w-10 text-text-muted" />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">No upcoming sessions</p>
                      <p className="text-xs text-text-muted mt-0.5">Update your availability to let learners book sessions</p>
                    </div>
                    <Link
                      href="/mentor/availability"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
                    >
                      Manage Availability
                    </Link>
                  </div>
                ) : (
                  <div>
                    {upcoming.slice(0, 5).map((s) => (
                      <UpcomingSessionRow key={s.id} session={s} />
                    ))}
                  </div>
                )}
              </div>

              {/* Recent sessions */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-text-primary">Recent Sessions</h2>
                    <p className="text-xs text-text-muted mt-0.5">{completed.length} completed</p>
                  </div>
                  <Link href="/mentor/sessions" className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {completed.length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-muted">No completed sessions yet.</p>
                ) : (
                  <div>
                    {[...completed]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 4)
                      .map((s) => (
                        <div key={s.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-light text-success font-bold text-xs select-none">
                            {getInitials(s.learnerName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{s.learnerName}</p>
                            <p className="text-xs text-text-muted truncate">{s.learnerRole}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-text-muted">{formatShortDate(s.date)}</p>
                            <span className="inline-block rounded-full bg-success-light px-2 py-0.5 text-[10px] font-semibold text-success mt-0.5">
                              Completed
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Performance snapshot */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-text-primary">Performance Snapshot</h2>
                    <p className="text-xs text-text-muted mt-0.5">Your mentoring at a glance</p>
                  </div>
                  <Link href="/mentor/performance" className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
                    Full report <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Completion rate */}
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-success" />
                      <p className="text-xs font-medium text-text-secondary">Completion Rate</p>
                    </div>
                    <p className="text-2xl font-bold text-text-primary tabular-nums">{completionRate}%</p>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-success" style={{ width: `${completionRate}%` }} />
                    </div>
                    <p className="text-[10px] text-text-muted">{completed.length} of {endedSessions} concluded</p>
                  </div>
                  {/* Rating */}
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-accent" />
                      <p className="text-xs font-medium text-text-secondary">Avg Rating</p>
                    </div>
                    <p className="text-2xl font-bold text-text-primary tabular-nums">4.9</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-3 w-3 text-accent" style={{ fill: "currentColor" }} />
                      ))}
                    </div>
                    <p className="text-[10px] text-text-muted">Based on 8 reviews</p>
                  </div>
                  {/* Hours */}
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Clock className="h-3.5 w-3.5 text-info" />
                      <p className="text-xs font-medium text-text-secondary">Hours Delivered</p>
                    </div>
                    <p className="text-2xl font-bold text-text-primary tabular-nums">{hoursDelivered}h</p>
                    <p className="text-[10px] text-text-muted mt-1">Across {completed.length} sessions</p>
                  </div>
                  {/* Learners */}
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="h-3.5 w-3.5 text-secondary" />
                      <p className="text-xs font-medium text-text-secondary">Learners Helped</p>
                    </div>
                    <p className="text-2xl font-bold text-text-primary tabular-nums">{uniqueLearners}</p>
                    <p className="text-[10px] text-text-muted mt-1">Unique learners</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right (1/3) */}
            <div className="space-y-6">

              {/* Needs attention */}
              {rescheduleRequests.length > 0 && (
                <div className="rounded-xl border border-warning/40 bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-sm font-bold text-text-primary">Needs Attention</h2>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-white">
                      {rescheduleRequests.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {rescheduleRequests.map((s) => (
                      <RescheduleRequestCard
                        key={s.id}
                        session={s}
                        onAction={handleRescheduleAction}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Notifications */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-text-primary">Notifications</h2>
                    {unreadCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="py-6 text-center">
                    <Bell className="h-8 w-8 text-text-muted mx-auto mb-2" />
                    <p className="text-sm text-text-muted">No notifications yet</p>
                  </div>
                ) : (
                  <div>
                    {notifications.slice(0, 5).map((n) => (
                      <NotificationRow key={n.id} notif={n} onRead={handleMarkRead} />
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-1">
                <p className="text-sm font-bold text-text-primary mb-3">Quick Actions</p>
                {[
                  { label: "Manage Availability", sub: "Set your open slots", href: "/mentor/availability", icon: CalendarDays, color: "text-primary", bg: "bg-primary/10" },
                  { label: "View All Sessions",   sub: "Upcoming & past sessions", href: "/mentor/sessions",     icon: BookOpen,      color: "text-secondary", bg: "bg-secondary/10" },
                  { label: "Performance Metrics", sub: "Ratings & session stats",  href: "/mentor/performance",  icon: BarChart2,     color: "text-accent",    bg: "bg-accent/10" },
                ].map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted transition-colors group"
                  >
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", a.bg)}>
                      <a.icon className={cn("h-4 w-4", a.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{a.label}</p>
                      <p className="text-xs text-text-muted">{a.sub}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}
