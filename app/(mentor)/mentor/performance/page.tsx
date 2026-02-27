"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Star,
  Clock,
  Users,
  CalendarDays,
  BarChart2,
  Zap,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getMentorSessions } from "@/lib/mock/mentor-sessions";
import { cn } from "@/lib/utils";
import type { MentorSession } from "@/lib/types/mentor-session";

// ─── Star display ──────────────────────────────────────────────────────────────

function RatingStars({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(sz, i <= Math.round(value) ? "text-accent" : "text-muted")}
          style={i <= Math.round(value) ? { fill: "currentColor" } : {}}
        />
      ))}
    </div>
  );
}

// ─── Weekly bar chart ──────────────────────────────────────────────────────────

const WEEKLY_DATA = [
  { label: "Jan 12", completed: 1, cancelled: 0 },
  { label: "Jan 19", completed: 2, cancelled: 1 },
  { label: "Jan 26", completed: 1, cancelled: 0 },
  { label: "Feb 2",  completed: 3, cancelled: 1 },
  { label: "Feb 9",  completed: 2, cancelled: 0 },
  { label: "Feb 16", completed: 4, cancelled: 1 },
];

function WeeklyBarChart({
  data,
}: {
  data: { label: string; completed: number; cancelled: number }[];
}) {
  const CHART_H = 96;
  const max = Math.max(...data.map((d) => d.completed + d.cancelled), 1);
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height: CHART_H }}>
        {data.map((d, i) => {
          const total = d.completed + d.cancelled;
          const totalPx = Math.round((total / max) * CHART_H);
          const completedPx = total > 0 ? Math.round((d.completed / total) * totalPx) : 0;
          const cancelledPx = totalPx - completedPx;
          return (
            <div key={i} className="flex-1 flex flex-col justify-end gap-px">
              {cancelledPx > 0 && (
                <div
                  className="w-full rounded-sm shrink-0 bg-destructive/40"
                  style={{ height: cancelledPx }}
                />
              )}
              {completedPx > 0 && (
                <div
                  className="w-full rounded-sm shrink-0 bg-success"
                  style={{ height: completedPx }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <p className="text-[8px] text-text-muted leading-tight">{d.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PerformanceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-5xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-muted" />
            <div className="h-7 w-16 rounded bg-muted" />
            <div className="h-3 w-28 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 rounded-xl border border-border bg-card" />
        <div className="h-72 rounded-xl border border-border bg-card" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyMetrics() {
  return (
    <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center gap-4 text-center max-w-md mx-auto">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <BarChart2 className="h-8 w-8 text-primary" />
      </div>
      <div>
        <p className="text-base font-bold text-text-primary">No performance data yet</p>
        <p className="text-sm text-text-muted mt-1 leading-relaxed">
          Complete your first mentoring session to start seeing performance insights here.
        </p>
      </div>
      <Link
        href="/mentor/availability"
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
      >
        <CalendarDays className="h-4 w-4" />
        Set availability
      </Link>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function PerformanceMetricsPage() {
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setSessions([...getMentorSessions()]);
      setLoading(false);
    }, 700);
    return () => clearTimeout(t);
  }, []);

  // Derived metrics
  const completed = sessions.filter((s) => s.status === "completed");
  const cancelled = sessions.filter((s) => s.status === "cancelled");
  const upcoming = sessions.filter(
    (s) => s.status === "upcoming" || s.status === "reschedule-pending"
  );
  const ended = completed.length + cancelled.length;
  const completionRate = ended > 0 ? Math.round((completed.length / ended) * 100) : 0;
  const totalMinutes = completed.reduce((a, s) => a + s.durationMinutes, 0);
  const hoursDelivered = completed.length > 0 ? (totalMinutes / 60).toFixed(1) : "0";
  const avgMinutes =
    completed.length > 0 ? Math.round(totalMinutes / completed.length) : 0;
  const uniqueLearners = new Set(sessions.map((s) => s.learnerId)).size;

  // Rating — aggregated from submitted feedback (mocked constants for now)
  const avgRating: number = 4.9;
  const totalReviews: number = 8;
  const RATING_DIST: Record<number, number> = { 5: 6, 4: 2, 3: 0, 2: 0, 1: 0 };
  const recentFeedbackSession = [...completed]
    .reverse()
    .find((s) => s.feedback?.notes);

  const hasData = sessions.length > 0;

  return (
    <DashboardLayout
      role="mentor"
      pageTitle="Performance Metrics"
      pageSubtitle="Your mentoring performance at a glance"
      userName="Alex Johnson"
      userTitle="Senior Engineer"
    >
      {loading ? (
        <PerformanceSkeleton />
      ) : !hasData ? (
        <EmptyMetrics />
      ) : (
        <div className="space-y-6 max-w-5xl">

          {/* ── Key metric cards ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Completion Rate",
                value: `${completionRate}%`,
                sub: `${completed.length} of ${ended} sessions completed`,
                icon: TrendingUp,
                bg: "bg-success-light",
                color: "text-success",
              },
              {
                label: "Average Rating",
                value: avgRating.toFixed(1),
                sub: `Based on ${totalReviews} reviews`,
                icon: Star,
                bg: "bg-accent/10",
                color: "text-accent",
              },
              {
                label: "Hours Delivered",
                value: `${hoursDelivered}h`,
                sub: avgMinutes > 0 ? `${avgMinutes} min avg per session` : "No sessions yet",
                icon: Clock,
                bg: "bg-info-light",
                color: "text-info",
              },
              {
                label: "Learners Helped",
                value: uniqueLearners,
                sub: `${upcoming.length} more session${upcoming.length !== 1 ? "s" : ""} upcoming`,
                icon: Users,
                bg: "bg-secondary/10",
                color: "text-secondary",
              },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-border bg-card p-5">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl mb-4",
                    m.bg
                  )}
                >
                  <m.icon className={cn("h-5 w-5", m.color)} />
                </div>
                <p className="text-2xl font-bold text-text-primary tabular-nums">{m.value}</p>
                <p className="text-xs font-semibold text-text-primary mt-0.5">{m.label}</p>
                <p className="text-xs text-text-muted mt-1">{m.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Session outcomes + Rating ─────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Session activity */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-text-primary">Session Activity</h2>
                <p className="text-xs text-text-muted mt-0.5">Weekly sessions — last 6 weeks</p>
              </div>

              <WeeklyBarChart data={WEEKLY_DATA} />

              {/* Legend */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-success" />
                  <span className="text-[10px] text-text-muted">Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-destructive/40" />
                  <span className="text-[10px] text-text-muted">Cancelled</span>
                </div>
              </div>

              {/* Non-duplicate stats */}
              {(() => {
                const bestWeek = WEEKLY_DATA.reduce((b, w) =>
                  w.completed + w.cancelled > b.completed + b.cancelled ? w : b
                );
                const weeklyAvg = (
                  WEEKLY_DATA.reduce((s, w) => s + w.completed + w.cancelled, 0) /
                  WEEKLY_DATA.length
                ).toFixed(1);
                const hrs = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                const totalTime = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                return (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Avg / week", value: weeklyAvg },
                      { label: "Best week", value: `${bestWeek.completed + bestWeek.cancelled} sessions` },
                      { label: "Total time", value: totalTime },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-sm font-bold text-text-primary tabular-nums">{s.value}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Rating & feedback */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-5">
              <div>
                <h2 className="text-sm font-bold text-text-primary">Ratings &amp; Feedback</h2>
                <p className="text-xs text-text-muted mt-0.5">Learner satisfaction overview</p>
              </div>

              {totalReviews === 0 ? (
                <div className="py-8 text-center">
                  <Star className="h-8 w-8 text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-muted">
                    No ratings yet. Complete sessions to receive feedback.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Big rating + distribution */}
                  <div className="flex items-center gap-5 p-4 rounded-xl bg-muted/40">
                    <div className="text-center shrink-0">
                      <p className="text-5xl font-extrabold text-text-primary tabular-nums">
                        {avgRating.toFixed(1)}
                      </p>
                      <RatingStars value={avgRating} size="lg" />
                      <p className="text-[10px] text-text-muted mt-1.5">{totalReviews} reviews</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = RATING_DIST[star] ?? 0;
                        const pct =
                          totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-[10px] text-text-muted w-3 text-right shrink-0">
                              {star}
                            </span>
                            <Star
                              className="h-2.5 w-2.5 shrink-0 text-accent"
                              style={{ fill: "currentColor" }}
                            />
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-accent transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-text-muted w-4 shrink-0">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Most recent feedback */}
                  {recentFeedbackSession?.feedback?.notes && (
                    <div className="rounded-lg border border-border p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-text-secondary">
                        Most recent feedback
                      </p>
                      <p className="text-xs text-text-secondary leading-relaxed italic">
                        &ldquo;{recentFeedbackSession.feedback.notes}&rdquo;
                      </p>
                      <RatingStars value={recentFeedbackSession.feedback.rating} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Workload overview ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: CalendarDays,
                bg: "bg-primary/10",
                color: "text-primary",
                label: "Upcoming Sessions",
                value: upcoming.length,
                sub:
                  upcoming.length === 0
                    ? "Nothing scheduled ahead"
                    : `Session${upcoming.length !== 1 ? "s" : ""} booked ahead`,
              },
              {
                icon: Clock,
                bg: "bg-accent/10",
                color: "text-accent",
                label: "Avg Session Length",
                value: avgMinutes > 0 ? `${avgMinutes}m` : "—",
                sub: `Across ${completed.length} completed session${completed.length !== 1 ? "s" : ""}`,
              },
              {
                icon: Zap,
                bg: "bg-secondary/10",
                color: "text-secondary",
                label: "Total Sessions",
                value: sessions.length,
                sub: `${ended} concluded · ${upcoming.length} upcoming`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-card p-4 flex items-center gap-4"
              >
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                    item.bg
                  )}
                >
                  <item.icon className={cn("h-6 w-6", item.color)} />
                </div>
                <div>
                  <p className="text-xl font-bold text-text-primary tabular-nums">{item.value}</p>
                  <p className="text-xs font-semibold text-text-primary mt-0.5">{item.label}</p>
                  <p className="text-xs text-text-muted">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}
