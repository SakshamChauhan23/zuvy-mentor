"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Users,
  Clock,
  ArrowRight,
  BadgeCheck,
  Zap,
  BookOpen,
  Star,
  ChevronRight,
  Search,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getSessions } from "@/lib/mock/sessions";
import { MOCK_MENTORS } from "@/lib/mock/mentors";
import { formatTime } from "@/lib/mock/slots";
import { cn } from "@/lib/utils";
import type { BookedSession } from "@/lib/types/session";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getDayContext(dateStr: string): "today" | "tomorrow" | null {
  const today = new Date();
  const d = new Date(dateStr + "T00:00:00");
  const diff = Math.round((d.getTime() - new Date(today.toDateString()).getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  return null;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Sparkline bars (decorative) ──────────────────────────────────────────────

const SPARKLINES: Record<string, number[]> = {
  upcoming: [3, 5, 4, 6, 5, 7, 6],
  completed: [2, 4, 3, 5, 6, 5, 8],
  mentors: [1, 1, 2, 2, 3, 3, 4],
  hours: [1, 2, 1, 3, 2, 4, 3],
};

function Sparkline({ bars, color }: { bars: number[]; color: string }) {
  const max = Math.max(...bars);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {bars.map((h, i) => (
        <div
          key={i}
          className={cn("w-1.5 rounded-sm", color)}
          style={{ height: `${(h / max) * 100}%`, opacity: i === bars.length - 1 ? 1 : 0.4 + (i / bars.length) * 0.5 }}
        />
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  sparkKey,
  sparkColor,
  href,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  sparkKey: keyof typeof SPARKLINES;
  sparkColor: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow group">
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

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

// ─── Session row (compact) ─────────────────────────────────────────────────────

function SessionRow({ session }: { session: BookedSession }) {
  const ctx = getDayContext(session.date);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs select-none">
        {getInitials(session.mentorName)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">{session.mentorName}</p>
        <p className="text-xs text-text-muted truncate">{session.mentorTitle}</p>
      </div>
      <div className="text-right shrink-0">
        {ctx ? (
          <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize">{ctx}</span>
        ) : (
          <p className="text-xs text-text-muted">{formatShortDate(session.date)}</p>
        )}
        <p className="text-xs text-text-secondary mt-0.5">{formatTime(session.startTime)}</p>
      </div>
    </div>
  );
}

// ─── Next Session highlight card ──────────────────────────────────────────────

function NextSessionCard({ session }: { session: BookedSession }) {
  const ctx = getDayContext(session.date);
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Next Session</p>
        {ctx && (
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground capitalize flex items-center gap-1">
            <Zap className="h-2.5 w-2.5" />
            {ctx}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold select-none">
          {getInitials(session.mentorName)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary truncate">{session.mentorName}</p>
          <p className="text-xs text-text-muted truncate">{session.mentorTitle}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <CalendarDays className="h-3.5 w-3.5 text-text-muted shrink-0" />
          {formatShortDate(session.date)}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Clock className="h-3.5 w-3.5 text-text-muted shrink-0" />
          {formatTime(session.startTime)} — {formatTime(session.endTime)}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          href="/sessions"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
        >
          View Details
        </Link>
        <Link
          href={`/sessions/${session.id}/cancel`}
          className="text-center text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          Cancel session
        </Link>
      </div>
    </div>
  );
}

// ─── Quick actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Find a Mentor", sub: "Browse 12+ verified mentors", href: "/mentors", icon: Search, color: "text-primary", bg: "bg-primary/10" },
  { label: "My Sessions", sub: "View all upcoming & past", href: "/sessions", icon: CalendarDays, color: "text-accent", bg: "bg-accent/10" },
  { label: "Learning Resources", sub: "Articles, guides & more", href: "#", icon: BookOpen, color: "text-secondary", bg: "bg-secondary/10" },
];

function QuickActions() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-1">
      <p className="text-sm font-bold text-text-primary mb-3">Quick Actions</p>
      {QUICK_ACTIONS.map((a) => (
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
          <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
        </Link>
      ))}
    </div>
  );
}

// ─── Suggested mentor card ─────────────────────────────────────────────────────

function SuggestedMentorCard({ mentor }: { mentor: (typeof MOCK_MENTORS)[number] }) {
  return (
    <Link
      href={`/mentors/${mentor.id}`}
      className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 hover:shadow-md hover:border-primary/30 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm select-none">
          {getInitials(mentor.name)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold text-text-primary truncate">{mentor.name}</p>
            {mentor.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
          </div>
          <p className="text-xs text-text-muted truncate">{mentor.title}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {mentor.expertise.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-text-secondary">
            {tag}
          </span>
        ))}
        {mentor.expertise.length > 2 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-text-muted">
            +{mentor.expertise.length - 2}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-text-secondary">
          <Star className="h-3 w-3 fill-secondary text-secondary" />
          <span className="font-semibold">{mentor.rating}</span>
          <span className="text-text-muted">· {mentor.totalSessions} sessions</span>
        </div>
        <span className="text-xs font-semibold text-primary group-hover:underline">
          View →
        </span>
      </div>
    </Link>
  );
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
              <div className="flex items-end gap-0.5 h-8">{[...Array(7)].map((_, j) => <div key={j} className="w-1.5 rounded-sm bg-muted" style={{ height: `${40 + j * 8}%` }} />)}</div>
            </div>
            <div className="space-y-1.5">
              <div className="h-7 w-12 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-64 rounded-xl border border-border bg-card" />
          <div className="h-48 rounded-xl border border-border bg-card" />
        </div>
        <div className="space-y-4">
          <div className="h-56 rounded-xl border border-border bg-card" />
          <div className="h-48 rounded-xl border border-border bg-card" />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function LearnerDashboard() {
  const [sessions, setSessions] = useState<BookedSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSessions(getSessions());
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const upcoming = sessions
    .filter((s) => s.status === "upcoming" || s.status === "rescheduled")
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const completed = sessions.filter((s) => s.status === "completed");
  const uniqueMentorIds = new Set(sessions.map((s) => s.mentorId));
  const totalHours = Math.round(
    completed.reduce((acc, s) => acc + s.durationMinutes, 0) / 60
  );

  // Pick 3 available mentors not yet booked for suggestions
  const suggestedMentors = MOCK_MENTORS.filter(
    (m) => m.isAvailable && !uniqueMentorIds.has(m.id)
  ).slice(0, 3);

  const nextSession = upcoming[0];
  const otherUpcoming = upcoming.slice(1, 3);

  return (
    <DashboardLayout
      role="learner"
      pageTitle="Dashboard"
      pageSubtitle="Welcome back, Jane — here's what's happening."
      userName="Jane Doe"
      userTitle="Learner"
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6 max-w-7xl">

          {/* ── Stat cards ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Upcoming Sessions"
              value={upcoming.length}
              sub={upcoming.length === 0 ? "No sessions scheduled" : `Next: ${formatShortDate(upcoming[0].date)}`}
              icon={CalendarDays}
              iconBg="bg-primary/10"
              iconColor="text-primary"
              sparkKey="upcoming"
              sparkColor="bg-primary"
              href="/sessions"
            />
            <StatCard
              label="Completed Sessions"
              value={completed.length}
              sub={completed.length === 0 ? "No completed sessions yet" : `${completed.length} session${completed.length !== 1 ? "s" : ""} finished`}
              icon={CheckCircle2}
              iconBg="bg-success-light"
              iconColor="text-success"
              sparkKey="completed"
              sparkColor="bg-success"
              href="/sessions"
            />
            <StatCard
              label="Mentors Connected"
              value={uniqueMentorIds.size}
              sub={uniqueMentorIds.size === 0 ? "Book your first session" : `${uniqueMentorIds.size} unique mentor${uniqueMentorIds.size !== 1 ? "s" : ""}`}
              icon={Users}
              iconBg="bg-accent/10"
              iconColor="text-accent"
              sparkKey="mentors"
              sparkColor="bg-accent"
            />
            <StatCard
              label="Learning Hours"
              value={totalHours}
              sub={totalHours === 0 ? "Start learning today" : `${totalHours} hour${totalHours !== 1 ? "s" : ""} invested`}
              icon={Clock}
              iconBg="bg-secondary/10"
              iconColor="text-secondary"
              sparkKey="hours"
              sparkColor="bg-secondary"
            />
          </div>

          {/* ── Main grid ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left column (2/3) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Upcoming sessions */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-text-primary">Upcoming Sessions</h2>
                    <p className="text-xs text-text-muted mt-0.5">{upcoming.length} session{upcoming.length !== 1 ? "s" : ""} scheduled</p>
                  </div>
                  <Link
                    href="/sessions"
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {upcoming.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <CalendarDays className="h-5 w-5 text-text-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">No upcoming sessions</p>
                      <p className="text-xs text-text-muted mt-0.5">Book a session with a mentor to get started</p>
                    </div>
                    <Link
                      href="/mentors"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Find a Mentor
                    </Link>
                  </div>
                ) : (
                  <div>
                    {upcoming.slice(0, 4).map((s) => (
                      <SessionRow key={s.id} session={s} />
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
                  <Link
                    href="/sessions"
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {completed.length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-muted">No completed sessions yet.</p>
                ) : (
                  <div>
                    {[...completed]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 3)
                      .map((s) => (
                        <div key={s.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-light text-success font-bold text-xs select-none">
                            {getInitials(s.mentorName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{s.mentorName}</p>
                            <p className="text-xs text-text-muted truncate">{s.mentorTitle}</p>
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
            </div>

            {/* Right column (1/3) */}
            <div className="space-y-6">
              {/* Next session highlight */}
              {nextSession ? (
                <NextSessionCard session={nextSession} />
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-card p-5 text-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto">
                    <CalendarDays className="h-5 w-5 text-text-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">No upcoming sessions</p>
                    <p className="text-xs text-text-muted mt-0.5">Find a mentor and book your first session</p>
                  </div>
                  <Link
                    href="/mentors"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
                  >
                    Browse Mentors
                  </Link>
                </div>
              )}

              {/* Quick actions */}
              <QuickActions />
            </div>
          </div>

          {/* ── Suggested mentors ─────────────────────────────────────── */}
          {suggestedMentors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-text-primary">Suggested Mentors</h2>
                  <p className="text-xs text-text-muted mt-0.5">Available mentors you haven&apos;t connected with yet</p>
                </div>
                <Link
                  href="/mentors"
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                >
                  Browse all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedMentors.map((m) => (
                  <SuggestedMentorCard key={m.id} mentor={m} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </DashboardLayout>
  );
}
