"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  CalendarX,
  Trash2,
  Loader2,
  Lock,
  Plus,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  getAvailabilitySlots,
  deleteAvailabilitySlot,
  timeToMinutes,
} from "@/lib/mock/availability";
import { formatTime, formatDuration } from "@/lib/mock/slots";
import { cn } from "@/lib/utils";
import type { MentorAvailabilitySlot } from "@/lib/types/availability";

// ─── Calendar constants ───────────────────────────────────────────────────────

const START_HOUR = 7;
const END_HOUR = 22;
const HOURS_COUNT = END_HOUR - START_HOUR;   // 15 spans
const HOUR_HEIGHT = 56;                       // px per hour
const TOTAL_HEIGHT = HOURS_COUNT * HOUR_HEIGHT; // 840px

// Hour tick labels: 7, 8, …, 22
const HOUR_TICKS = Array.from({ length: HOURS_COUNT + 1 }, (_, i) => START_HOUR + i);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonday(ref: Date): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function hourLabel(h: number): string {
  if (h === 0 || h === 24) return "12am";
  if (h === 12) return "12pm";
  return h > 12 ? `${h - 12}pm` : `${h}am`;
}

function formatLong(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function isPastSlot(slot: MentorAvailabilitySlot): boolean {
  const today = toDateStr(new Date());
  if (slot.date < today) return true;
  if (slot.date > today) return false;
  const now = new Date();
  const [h, m] = slot.endTime.split(":").map(Number);
  const slotEnd = new Date();
  slotEnd.setHours(h, m, 0, 0);
  return now >= slotEnd;
}

function slotTop(slot: MentorAvailabilitySlot): number {
  return (timeToMinutes(slot.startTime) - START_HOUR * 60) / 60 * HOUR_HEIGHT;
}

function slotHeight(slot: MentorAvailabilitySlot): number {
  return Math.max(slot.durationMinutes / 60 * HOUR_HEIGHT, 22);
}

// ─── Day header ───────────────────────────────────────────────────────────────

function DayHeader({ day, today }: { day: Date; today: string }) {
  const dateStr = toDateStr(day);
  const isToday = dateStr === today;
  return (
    <div className={cn("text-center py-2.5 select-none", isToday && "relative")}>
      <p className="text-[10px] font-medium text-text-muted uppercase tracking-wide">
        {day.toLocaleDateString("en-US", { weekday: "short" })}
      </p>
      <div className={cn(
        "mx-auto mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
        isToday
          ? "bg-primary text-primary-foreground"
          : "text-text-primary"
      )}>
        {day.getDate()}
      </div>
    </div>
  );
}

// ─── Slot block (in the calendar grid) ───────────────────────────────────────

function SlotBlock({
  slot,
  selected,
  onClick,
}: {
  slot: MentorAvailabilitySlot;
  selected: boolean;
  onClick: () => void;
}) {
  const past = isPastSlot(slot);
  const top = slotTop(slot);
  const height = slotHeight(slot);
  const booked = slot.status === "booked";
  const tall = height >= 40;

  return (
    <button
      onClick={onClick}
      disabled={past}
      title={`${formatTime(slot.startTime)} — ${formatTime(slot.endTime)} · ${booked ? "Booked" : "Open"}`}
      className={cn(
        "absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-left transition-all duration-150 overflow-hidden",
        booked
          ? past
            ? "bg-info-light/30 text-info/50 cursor-default"
            : "bg-info-light border border-info/30 text-info hover:brightness-95"
          : past
            ? "bg-success-light/25 text-success-dark/40 cursor-default"
            : "bg-success-light border border-success/30 text-success-dark hover:brightness-95",
        selected && !past && "ring-2 ring-primary ring-offset-1 z-10"
      )}
      style={{ top: `${top}px`, height: `${height}px` }}
    >
      <p className="text-[10px] font-bold leading-none truncate">
        {formatTime(slot.startTime)}
      </p>
      {tall && (
        <p className="text-[9px] leading-none mt-0.5 truncate opacity-80">
          {booked ? "Booked" : "Open"}
        </p>
      )}
    </button>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function SlotDetailPanel({
  slot,
  onClose,
  onDelete,
}: {
  slot: MentorAvailabilitySlot;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const past = isPastSlot(slot);
  const booked = slot.status === "booked";

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const handleDelete = async () => {
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 600));
    onDelete(slot.id);
    onClose();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Slot Details</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {past ? "This slot has passed" : "Active availability slot"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-muted hover:text-text-primary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Status badge */}
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        past
          ? "bg-muted text-text-muted"
          : booked
            ? "bg-info-light text-info"
            : "bg-success-light text-success-dark"
      )}>
        <span className={cn(
          "h-1.5 w-1.5 rounded-full",
          past ? "bg-text-muted" : booked ? "bg-info" : "bg-success"
        )} />
        {past ? "Past" : booked ? "Booked" : "Open"}
      </span>

      {/* Details */}
      <div className="space-y-3">
        <div className="flex items-start gap-2.5">
          <CalendarDays className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-text-muted">Date</p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">{formatLong(slot.date)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-text-muted">Time</p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">
              {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
            </p>
            <p className="text-xs text-text-muted mt-0.5">{formatDuration(slot.durationMinutes)}</p>
          </div>
        </div>
      </div>

      {/* Context messages */}
      {booked && !past && (
        <div className="flex items-start gap-2 rounded-lg bg-info-light px-3 py-2.5 text-xs text-info-dark">
          <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>This slot is reserved by a learner and cannot be deleted.</p>
        </div>
      )}
      {past && (
        <div className="rounded-lg bg-muted px-3 py-2.5 text-xs text-text-muted">
          This slot is in the past and is no longer active.
        </div>
      )}

      {/* Delete (open + future only) */}
      {!booked && !past && (
        <div>
          {confirmDelete ? (
            <div className="space-y-2">
              <p className="text-xs text-destructive font-medium">Delete this slot? This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive-dark transition-colors disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  {deleting ? "Deleting…" : "Confirm Delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive-light transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Slot
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Empty detail placeholder ─────────────────────────────────────────────────

function EmptyDetailPanel() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center space-y-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mx-auto">
        <CalendarDays className="h-5 w-5 text-text-muted" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">No slot selected</p>
        <p className="text-xs text-text-muted mt-0.5">Click any slot on the calendar to view its details</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = toDateStr(new Date());
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [slots, setSlots] = useState<MentorAvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<MentorAvailabilitySlot | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMobileDay, setSelectedMobileDay] = useState(0); // index 0–6

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load slots
  const loadSlots = () => setSlots(getAvailabilitySlots());

  useEffect(() => {
    const t = setTimeout(() => { loadSlots(); setLoading(false); }, 500);
    return () => clearTimeout(t);
  }, []);

  // Update current time every minute for the live time indicator
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to 8am on load
  useEffect(() => {
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollTop = HOUR_HEIGHT; // 1 hour = 56px = 8am
    }
  }, [loading]);

  // Reset mobile day selection when week changes
  useEffect(() => {
    const todayInWeek = weekDays.findIndex((d) => toDateStr(d) === today);
    setSelectedMobileDay(todayInWeek >= 0 ? todayInWeek : 0);
    setSelectedSlot(null);
  }, [weekStart]); // eslint-disable-line

  // Week days (Mon–Sun)
  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    }),
  [weekStart]);

  const weekEnd = weekDays[6];

  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  // Map slots by date for fast lookup
  const slotsByDate = useMemo(() => {
    const map: Record<string, MentorAvailabilitySlot[]> = {};
    for (const s of slots) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [slots]);

  // Is this week the current week?
  const isCurrentWeek = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return toDateStr(weekStart) <= today && today <= toDateStr(weekEnd);
  }, [weekStart, weekEnd, today]);

  // Current time red line position
  const currentTimePx = useMemo(() => {
    const mins = currentTime.getHours() * 60 + currentTime.getMinutes();
    return (mins - START_HOUR * 60) / 60 * HOUR_HEIGHT;
  }, [currentTime]);

  // Navigation
  const prevWeek = () => setWeekStart((d) => { const nd = new Date(d); nd.setDate(nd.getDate() - 7); return nd; });
  const nextWeek = () => setWeekStart((d) => { const nd = new Date(d); nd.setDate(nd.getDate() + 7); return nd; });
  const goToToday = () => setWeekStart(getMonday(new Date()));

  // Delete handler
  const handleDelete = (id: string) => {
    deleteAvailabilitySlot(id);
    loadSlots();
    setSelectedSlot(null);
  };

  // Total slots in current week (for subtitle)
  const weekSlots = weekDays.flatMap((d) => slotsByDate[toDateStr(d)] ?? []);

  return (
    <DashboardLayout
      role="mentor"
      pageTitle="Calendar"
      pageSubtitle={!loading ? `${weekSlots.length} slot${weekSlots.length !== 1 ? "s" : ""} this week` : "Your availability at a glance."}
      userName="Alex Johnson"
      userTitle="Senior Engineer"
    >
      <div className="space-y-4 max-w-7xl">

        {/* ── Week navigation ───────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={prevWeek}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-text-secondary" />
            </button>
            <button
              onClick={nextWeek}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-text-secondary" />
            </button>
            <span className="text-sm font-semibold text-text-primary ml-1">{weekLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            {!isCurrentWeek && (
              <button
                onClick={goToToday}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-muted transition-colors"
              >
                Today
              </button>
            )}
            <Link
              href="/mentor/availability"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Slot
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-card animate-pulse" style={{ height: "520px" }} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

            {/* ── Calendar grid (desktop) ─────────────────────────────────── */}
            <div className="lg:col-span-3 rounded-xl border border-border bg-card overflow-hidden">

              {/* Day headers — sticky above the scrollable grid */}
              <div className="flex border-b border-border bg-card">
                <div className="w-12 shrink-0" /> {/* spacer for time labels */}
                {weekDays.map((day) => (
                  <div key={toDateStr(day)} className="flex-1 min-w-0 border-l border-border/30 first:border-l-0">
                    <DayHeader day={day} today={today} />
                  </div>
                ))}
              </div>

              {/* Mobile: date pill selector */}
              <div className="lg:hidden flex gap-1.5 overflow-x-auto px-3 py-2 border-b border-border">
                {weekDays.map((day, i) => {
                  const ds = toDateStr(day);
                  const isToday = ds === today;
                  const hasSlotsOnDay = (slotsByDate[ds] ?? []).length > 0;
                  return (
                    <button
                      key={ds}
                      onClick={() => setSelectedMobileDay(i)}
                      className={cn(
                        "shrink-0 flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        selectedMobileDay === i
                          ? "bg-primary text-primary-foreground"
                          : isToday
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-text-secondary hover:bg-muted/80"
                      )}
                    >
                      <span className="text-[9px] font-semibold">{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
                      <span className="font-bold">{day.getDate()}</span>
                      {hasSlotsOnDay && <span className="h-1 w-1 rounded-full bg-current opacity-60" />}
                    </button>
                  );
                })}
              </div>

              {/* Mobile: slot cards for selected day */}
              <div className="lg:hidden p-3 space-y-2">
                {(slotsByDate[toDateStr(weekDays[selectedMobileDay])] ?? []).length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <CalendarX className="h-8 w-8 text-text-muted" />
                    <p className="text-sm text-text-muted">No slots on this day</p>
                    <Link href="/mentor/availability" className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
                      + Add availability
                    </Link>
                  </div>
                ) : (
                  (slotsByDate[toDateStr(weekDays[selectedMobileDay])] ?? []).map((slot) => {
                    const past = isPastSlot(slot);
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                          selectedSlot?.id === slot.id ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:bg-muted",
                          past && "opacity-60"
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          slot.status === "booked" ? "bg-info-light" : "bg-success-light"
                        )}>
                          <Clock className={cn("h-4 w-4", slot.status === "booked" ? "text-info" : "text-success")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary">{formatTime(slot.startTime)} — {formatTime(slot.endTime)}</p>
                          <p className="text-xs text-text-muted">{formatDuration(slot.durationMinutes)}</p>
                        </div>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0",
                          slot.status === "booked" ? "bg-info-light text-info" : "bg-success-light text-success-dark"
                        )}>
                          {slot.status === "booked" ? "Booked" : "Open"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Desktop: time grid */}
              <div ref={scrollRef} className="hidden lg:block overflow-y-auto" style={{ maxHeight: "580px" }}>
                <div className="flex" style={{ height: `${TOTAL_HEIGHT}px` }}>

                  {/* Time label column */}
                  <div className="w-12 shrink-0 relative select-none">
                    {HOUR_TICKS.map((h, i) => (
                      <div
                        key={h}
                        className="absolute right-2 text-[10px] text-text-muted leading-none"
                        style={{ top: `${i * HOUR_HEIGHT - 6}px` }}
                      >
                        {hourLabel(h)}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {weekDays.map((day) => {
                    const dateStr = toDateStr(day);
                    const isToday = dateStr === today;
                    const daySlots = slotsByDate[dateStr] ?? [];

                    return (
                      <div key={dateStr} className="flex-1 relative border-l border-border/20 min-w-0">

                        {/* Today background tint */}
                        {isToday && <div className="absolute inset-0 bg-primary/[0.025] pointer-events-none" />}

                        {/* Hour grid lines */}
                        {HOUR_TICKS.map((h, i) => (
                          <div
                            key={h}
                            className="absolute left-0 right-0 border-t border-border/25"
                            style={{ top: `${i * HOUR_HEIGHT}px` }}
                          />
                        ))}

                        {/* Half-hour grid lines (lighter) */}
                        {HOUR_TICKS.slice(0, -1).map((h, i) => (
                          <div
                            key={`half-${h}`}
                            className="absolute left-0 right-0 border-t border-border/10"
                            style={{ top: `${i * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                          />
                        ))}

                        {/* Current time indicator */}
                        {isToday && currentTimePx >= 0 && currentTimePx <= TOTAL_HEIGHT && (
                          <div
                            className="absolute left-0 right-0 z-10 pointer-events-none"
                            style={{ top: `${currentTimePx}px` }}
                          >
                            <div className="absolute -left-0.5 -top-1 h-2 w-2 rounded-full bg-red-500" />
                            <div className="border-t-2 border-red-500 w-full" />
                          </div>
                        )}

                        {/* Slot blocks */}
                        {daySlots.map((slot) => (
                          <SlotBlock
                            key={slot.id}
                            slot={slot}
                            selected={selectedSlot?.id === slot.id}
                            onClick={() => setSelectedSlot(
                              selectedSlot?.id === slot.id ? null : slot
                            )}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Right: Detail panel + legend ──────────────────── */}
            <div className="space-y-4">
              {selectedSlot ? (
                <SlotDetailPanel
                  slot={selectedSlot}
                  onClose={() => setSelectedSlot(null)}
                  onDelete={handleDelete}
                />
              ) : (
                <EmptyDetailPanel />
              )}

              {/* Legend */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-xs font-bold text-text-primary">Legend</p>
                <div className="space-y-2">
                  {[
                    { color: "bg-success-light border border-success/30", label: "Open", desc: "Available for booking" },
                    { color: "bg-info-light border border-info/30", label: "Booked", desc: "Reserved by a learner" },
                    { color: "bg-success-light/25", label: "Past (open)", desc: "Passed, not booked" },
                    { color: "bg-info-light/30", label: "Past (booked)", desc: "Passed session" },
                  ].map(({ color, label, desc }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={cn("h-3 w-5 shrink-0 rounded-sm", color)} />
                      <div>
                        <p className="text-[10px] font-semibold text-text-secondary">{label}</p>
                        <p className="text-[9px] text-text-muted">{desc}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-5 bg-red-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-text-secondary">Now</p>
                      <p className="text-[9px] text-text-muted">Current time</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Week summary */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <p className="text-xs font-bold text-text-primary">This Week</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Total slots", value: weekSlots.length },
                    { label: "Open", value: weekSlots.filter((s) => s.status === "open").length },
                    { label: "Booked", value: weekSlots.filter((s) => s.status === "booked").length },
                    { label: "Hours", value: `${Math.round(weekSlots.reduce((a, s) => a + s.durationMinutes, 0) / 60)}h` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-muted p-2 text-center">
                      <p className="text-base font-bold text-text-primary tabular-nums">{value}</p>
                      <p className="text-[9px] text-text-muted">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Empty state — no slots exist at all */}
        {!loading && slots.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <CalendarX className="h-7 w-7 text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">No availability slots yet</p>
              <p className="text-xs text-text-muted mt-1">Create slots so learners can book sessions with you</p>
            </div>
            <Link
              href="/mentor/availability"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Availability
            </Link>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
