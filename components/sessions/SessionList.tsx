"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, XCircle, Users } from "lucide-react";
import SessionCard from "./SessionCard";
import { cn } from "@/lib/utils";
import type { BookedSession, SessionStatus } from "@/lib/types/session";

// ─── Tab config ───────────────────────────────────────────────────────────────

type Tab = "upcoming" | "completed" | "cancelled";

const TABS: { id: Tab; label: string; icon: React.ElementType; statuses: SessionStatus[] }[] = [
  { id: "upcoming",  label: "Upcoming",  icon: CalendarDays,  statuses: ["upcoming", "rescheduled"] },
  { id: "completed", label: "Completed", icon: CheckCircle2,  statuses: ["completed"] },
  { id: "cancelled", label: "Cancelled", icon: XCircle,       statuses: ["cancelled"] },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SessionCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-pulse space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-44 rounded bg-muted" />
          </div>
        </div>
        <div className="h-6 w-20 rounded-full bg-muted" />
      </div>
      <div className="flex gap-4">
        <div className="h-3.5 w-28 rounded bg-muted" />
        <div className="h-3.5 w-40 rounded bg-muted" />
      </div>
      <div className="flex gap-2 border-t border-border pt-4">
        <div className="h-7 w-24 rounded-lg bg-muted" />
        <div className="h-7 w-20 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const EMPTY_CONFIG: Record<
  Tab,
  { icon: React.ElementType; title: string; description: string; cta?: { label: string; href: string } }
> = {
  upcoming: {
    icon: CalendarDays,
    title: "No upcoming sessions",
    description: "You haven't booked any sessions yet. Browse mentors to get started.",
    cta: { label: "Find a Mentor", href: "/mentors" },
  },
  completed: {
    icon: CheckCircle2,
    title: "No completed sessions yet",
    description: "Your completed sessions will appear here after you attend them.",
    cta: { label: "Book a Session", href: "/mentors" },
  },
  cancelled: {
    icon: XCircle,
    title: "No cancelled sessions",
    description: "You don't have any cancelled sessions. Keep up the good work!",
  },
};

function EmptyState({ tab }: { tab: Tab }) {
  const { icon: Icon, title, description, cta } = EMPTY_CONFIG[tab];
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card py-16 text-center px-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="text-sm text-text-muted max-w-xs">{description}</p>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
        >
          <Users className="h-4 w-4" />
          {cta.label}
        </Link>
      )}
    </div>
  );
}

// ─── Stats strip ──────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  colorClass: string;
}

function StatCard({ label, count, active, onClick, colorClass }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start rounded-xl border p-4 text-left transition-all",
        "hover:shadow-sm w-full",
        active ? "border-primary bg-primary-light" : "border-border bg-card hover:border-primary/30"
      )}
    >
      <span className={cn("text-2xl font-bold", colorClass)}>{count}</span>
      <span className={cn("text-xs mt-0.5", active ? "text-text-accent" : "text-text-muted")}>
        {label}
      </span>
    </button>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface SessionListProps {
  sessions: BookedSession[];
  loading: boolean;
}

export default function SessionList({ sessions, loading }: SessionListProps) {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  const counts = {
    upcoming:  sessions.filter((s) => s.status === "upcoming" || s.status === "rescheduled").length,
    completed: sessions.filter((s) => s.status === "completed").length,
    cancelled: sessions.filter((s) => s.status === "cancelled").length,
  };

  const filteredSessions = sessions
    .filter((s) => TABS.find((t) => t.id === activeTab)!.statuses.includes(s.status))
    .sort((a, b) => {
      // Upcoming: chronological asc; others: reverse chron desc
      const dir = activeTab === "upcoming" ? 1 : -1;
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare * dir;
      return a.startTime.localeCompare(b.startTime) * dir;
    });

  return (
    <div className="space-y-6">
      {/* ── Stats strip ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Upcoming"
          count={counts.upcoming}
          active={activeTab === "upcoming"}
          onClick={() => setActiveTab("upcoming")}
          colorClass="text-info"
        />
        <StatCard
          label="Completed"
          count={counts.completed}
          active={activeTab === "completed"}
          onClick={() => setActiveTab("completed")}
          colorClass="text-success"
        />
        <StatCard
          label="Cancelled"
          count={counts.cancelled}
          active={activeTab === "cancelled"}
          onClick={() => setActiveTab("cancelled")}
          colorClass="text-text-muted"
        />
      </div>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              activeTab === id
                ? "bg-card text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
            {counts[id] > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  activeTab === id ? "bg-primary text-primary-foreground" : "bg-border text-text-muted"
                )}
              >
                {counts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Session cards ─────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SessionCardSkeleton key={i} />)}
        </div>
      ) : filteredSessions.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
