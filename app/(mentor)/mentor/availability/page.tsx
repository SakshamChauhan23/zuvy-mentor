"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  CalendarX,
  Lock,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatTime, formatDuration } from "@/lib/mock/slots";
import { cn } from "@/lib/utils";
import type { MentorAvailabilitySlot } from "@/lib/types/availability";

// ─── Slot utilities ───────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function addMinutesToTime(time: string, minutes: number): string {
  const total = timeToMinutes(time) + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function toDateStr(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface ApiSlot {
  id: string;
  slotStart: string;
  slotEnd: string;
  durationMinutes: number;
  status: "open" | "booked";
  createdAt: string;
}

function toAvailabilitySlot(a: ApiSlot): MentorAvailabilitySlot {
  return {
    id: a.id,
    date: toDateStr(a.slotStart),
    startTime: toHHMM(a.slotStart),
    endTime: toHHMM(a.slotEnd),
    durationMinutes: a.durationMinutes,
    status: a.status,
    createdAt: a.createdAt,
  };
}

function groupSlotsByDate(slots: MentorAvailabilitySlot[]): Record<string, MentorAvailabilitySlot[]> {
  const grouped: Record<string, MentorAvailabilitySlot[]> = {};
  for (const slot of slots) {
    if (!grouped[slot.date]) grouped[slot.date] = [];
    grouped[slot.date].push(slot);
  }
  return grouped;
}

function checkConflict(
  slots: MentorAvailabilitySlot[],
  date: string,
  startTime: string,
  durationMinutes: number
): MentorAvailabilitySlot | undefined {
  const newStart = timeToMinutes(startTime);
  const newEnd = newStart + durationMinutes;
  return slots.find((s) => {
    if (s.date !== date) return false;
    const exStart = timeToMinutes(s.startTime);
    const exEnd = timeToMinutes(s.endTime);
    return exStart < newEnd && exEnd > newStart;
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Every 30 min from 07:00 to 21:00
const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 21; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 21) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

const DURATION_OPTIONS = [
  { value: 30,  label: "30 min" },
  { value: 45,  label: "45 min" },
  { value: 60,  label: "1 hr" },
  { value: 90,  label: "1.5 hr" },
  { value: 120, label: "2 hr" },
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function formatLongDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatHeadingDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 1) return "Tomorrow";
  if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Slot item ────────────────────────────────────────────────────────────────

function SlotItem({
  slot,
  onDelete,
}: {
  slot: MentorAvailabilitySlot;
  onDelete: (id: string) => Promise<void>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Auto-cancel confirm after 4 seconds
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(slot.id);
    setDeleting(false);
  };

  return (
    <div className={cn(
      "flex items-center gap-3 py-2.5 border-b border-border last:border-0",
    )}>
      {/* Time icon */}
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        slot.status === "booked" ? "bg-info-light" : "bg-primary/10"
      )}>
        <Clock className={cn("h-4 w-4", slot.status === "booked" ? "text-info" : "text-primary")} />
      </div>

      {/* Time + duration */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">
          {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
        </p>
        <p className="text-xs text-text-muted">{formatDuration(slot.durationMinutes)}</p>
      </div>

      {/* Status + action */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
          slot.status === "booked"
            ? "bg-info-light text-info"
            : "bg-success-light text-success-dark"
        )}>
          {slot.status === "booked" ? "Booked" : "Open"}
        </span>

        {slot.status === "booked" ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted" title="Cannot delete a booked slot">
            <Lock className="h-3.5 w-3.5" />
          </div>
        ) : confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 rounded-lg bg-destructive px-2 py-1 text-[10px] font-semibold text-destructive-foreground hover:bg-destructive-dark transition-colors disabled:opacity-60"
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-border px-2 py-1 text-[10px] font-medium text-text-muted hover:text-text-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-destructive-light hover:text-destructive transition-colors"
            title="Delete slot"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FormState = "idle" | "creating" | "success" | "error";

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<MentorAvailabilitySlot[]>([]);
  const [slotsByDate, setSlotsByDate] = useState<Record<string, MentorAvailabilitySlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [mentorName, setMentorName] = useState("Mentor");
  const [mentorTitle, setMentorTitle] = useState("");

  // Form state
  const [date, setDate] = useState(getTomorrowStr());
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [formState, setFormState] = useState<FormState>("idle");
  const [createdSlot, setCreatedSlot] = useState<MentorAvailabilitySlot | null>(null);

  const endTime = addMinutesToTime(startTime, duration);

  const loadSlots = async () => {
    const res = await fetch("/api/mentor/slots");
    if (res.ok) {
      const data: ApiSlot[] = await res.json();
      const mapped = data.map(toAvailabilitySlot);
      setSlots(mapped);
      setSlotsByDate(groupSlotsByDate(mapped));
    }
  };

  useEffect(() => {
    const init = async () => {
      const profileRes = await fetch("/api/mentor/profile");
      if (profileRes.ok) {
        const p = await profileRes.json();
        setMentorName(p.name ?? "Mentor");
        setMentorTitle(p.title ?? "");
      }
      await loadSlots();
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live conflict detection (client-side using loaded slots)
  const conflictingSlot = useMemo(() => {
    if (!date || !startTime) return undefined;
    return checkConflict(slots, date, startTime, duration);
  }, [date, startTime, duration, slots]);

  // Validate: date must be >= today, end time must not exceed midnight
  const endMinutes = timeToMinutes(startTime) + duration;
  const isEndNextDay = endMinutes >= 24 * 60;
  const isPastDate = date < getTodayStr();
  const isFormValid = !conflictingSlot && !isEndNextDay && !isPastDate && date !== "";

  const handleCreate = async () => {
    if (!isFormValid || formState !== "idle") return;
    setFormState("creating");

    // Construct ISO timestamps from local date + HH:MM
    const slotStart = new Date(`${date}T${startTime}:00`).toISOString();
    const slotEnd = new Date(`${date}T${endTime}:00`).toISOString();

    const res = await fetch("/api/mentor/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotStart, slotEnd, durationMinutes: duration }),
    });

    if (res.ok) {
      const data: ApiSlot = await res.json();
      setCreatedSlot(toAvailabilitySlot(data));
      setFormState("success");
      await loadSlots();
    } else {
      setFormState("error");
    }
  };

  const handleReset = () => {
    setFormState("idle");
    setCreatedSlot(null);
    setDate(getTomorrowStr());
    setStartTime("09:00");
    setDuration(60);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/mentor/slots/${id}`, { method: "DELETE" });
    await loadSlots();
  };

  const openCount = slots.filter((s) => s.status === "open").length;
  const bookedCount = slots.filter((s) => s.status === "booked").length;

  return (
    <DashboardLayout
      role="mentor"
      pageTitle="Availability"
      pageSubtitle={!loading ? `${openCount} open slot${openCount !== 1 ? "s" : ""} · ${bookedCount} booked` : "Manage your available time slots."}
      userName={mentorName}
      userTitle={mentorTitle}
    >
      <div className="max-w-5xl">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
            <div className="lg:col-span-2 rounded-xl border border-border bg-card h-96" />
            <div className="rounded-xl border border-border bg-card h-96" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left: Creation form (2/3) ─────────────────────── */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border bg-card p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-text-primary">Create New Slot</h2>
                  <p className="text-sm text-text-muted mt-0.5">
                    Define when you&apos;re available — learners will see this as a bookable time.
                  </p>
                </div>

                <div className="h-px bg-border" />

                {/* Success state */}
                {formState === "success" && createdSlot && (
                  <div className="rounded-xl border border-success/30 bg-success-light p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      <p className="text-sm font-bold text-success-dark">Slot created successfully!</p>
                    </div>
                    <div className="rounded-lg bg-white/50 px-4 py-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-text-primary">
                        <CalendarDays className="h-3.5 w-3.5 text-success shrink-0" />
                        <span className="font-semibold">{formatLongDate(createdSlot.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Clock className="h-3.5 w-3.5 text-success shrink-0" />
                        {formatTime(createdSlot.startTime)} — {formatTime(createdSlot.endTime)}
                        <span className="text-text-muted">· {formatDuration(createdSlot.durationMinutes)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-success-dark">Learners can now discover and book this slot.</p>
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-xs font-semibold text-white hover:bg-success-dark transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create Another Slot
                    </button>
                  </div>
                )}

                {/* Form (hidden on success) */}
                {formState !== "success" && (
                  <>
                    {/* Date */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-text-primary">
                        Date
                        <span className="text-destructive ml-1" aria-hidden>*</span>
                      </label>
                      <input
                        type="date"
                        min={getTodayStr()}
                        value={date}
                        onChange={(e) => { setDate(e.target.value); setFormState("idle"); }}
                        className={cn(
                          "w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm text-text-primary",
                          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow",
                          isPastDate ? "border-destructive" : "border-border"
                        )}
                      />
                      {isPastDate && (
                        <p className="text-xs text-destructive">Please select today or a future date.</p>
                      )}
                    </div>

                    {/* Start Time + Duration (2-col) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-text-primary">
                          Start Time
                          <span className="text-destructive ml-1" aria-hidden>*</span>
                        </label>
                        <select
                          value={startTime}
                          onChange={(e) => { setStartTime(e.target.value); setFormState("idle"); }}
                          className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>{formatTime(t)}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-text-primary">
                          Duration
                          <span className="text-destructive ml-1" aria-hidden>*</span>
                        </label>
                        <select
                          value={duration}
                          onChange={(e) => { setDuration(Number(e.target.value)); setFormState("idle"); }}
                          className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                        >
                          {DURATION_OPTIONS.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* End-of-day validation */}
                    {isEndNextDay && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        This session would extend past midnight. Please adjust the start time or duration.
                      </p>
                    )}

                    {/* Live preview */}
                    <div className={cn(
                      "rounded-xl border p-4 space-y-3 transition-colors",
                      conflictingSlot
                        ? "border-destructive/30 bg-destructive-light/30"
                        : isEndNextDay || isPastDate
                        ? "border-border bg-muted/30"
                        : "border-primary/20 bg-primary/5"
                    )}>
                      <p className={cn(
                        "text-[10px] font-semibold uppercase tracking-wide",
                        conflictingSlot ? "text-destructive" : "text-primary"
                      )}>
                        {conflictingSlot ? "Conflict Detected" : "Slot Preview"}
                      </p>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                          <CalendarDays className={cn("h-3.5 w-3.5 shrink-0", conflictingSlot ? "text-destructive" : "text-primary")} />
                          {date ? formatLongDate(date) : <span className="text-text-muted">Select a date</span>}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <Clock className={cn("h-3.5 w-3.5 shrink-0", conflictingSlot ? "text-destructive" : "text-primary")} />
                          <span className={cn(conflictingSlot && "text-destructive font-medium")}>
                            {formatTime(startTime)} — {formatTime(endTime)}
                          </span>
                          <span className="text-text-muted">· {formatDuration(duration)}</span>
                        </div>
                      </div>

                      {/* Conflict detail */}
                      {conflictingSlot && (
                        <div className="rounded-lg bg-destructive-light border border-destructive/20 px-3 py-2">
                          <p className="text-xs text-destructive font-medium flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            Overlaps with an existing slot
                          </p>
                          <p className="text-xs text-destructive/80 mt-0.5 ml-5">
                            {formatTime(conflictingSlot.startTime)} — {formatTime(conflictingSlot.endTime)} ({conflictingSlot.status})
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Error */}
                    {formState === "error" && (
                      <div className="flex items-center gap-2 rounded-lg bg-destructive-light px-4 py-3">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        <p className="text-xs text-destructive">
                          Something went wrong. Your slot was not created — please try again.
                        </p>
                      </div>
                    )}

                    {/* CTA */}
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={handleCreate}
                        disabled={!isFormValid || formState === "creating"}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3",
                          "bg-primary text-primary-foreground text-sm font-semibold",
                          "hover:bg-primary-dark transition-colors",
                          "disabled:opacity-60 disabled:cursor-not-allowed"
                        )}
                      >
                        {formState === "creating" ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating slot…
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Confirm & Create Slot
                          </>
                        )}
                      </button>
                    </div>

                    {/* Tip */}
                    <p className="text-xs text-text-muted text-center">
                      You can create multiple slots in a row — each one is immediately visible to learners.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* ── Right: Existing slots (1/3) ───────────────────── */}
            <div>
              <div className="rounded-xl border border-border bg-card p-5 space-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-text-primary">Your Availability</h2>
                    <p className="text-xs text-text-muted mt-0.5">
                      {openCount} open · {bookedCount} booked
                    </p>
                  </div>
                </div>

                {Object.keys(slotsByDate).length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <CalendarX className="h-8 w-8 text-text-muted" />
                    <p className="text-sm text-text-muted">No slots created yet.</p>
                    <p className="text-xs text-text-muted">Create your first slot using the form.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(slotsByDate).map(([d, daySlots]) => (
                      <div key={d}>
                        <p className="text-xs font-semibold text-text-muted mb-2 flex items-center gap-1.5">
                          <CalendarDays className="h-3 w-3" />
                          {formatHeadingDate(d)}
                        </p>
                        <div>
                          {daySlots.map((slot) => (
                            <SlotItem key={slot.id} slot={slot} onDelete={handleDelete} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="mt-4 rounded-xl border border-border bg-card p-4 space-y-2">
                <p className="text-xs font-semibold text-text-muted">Legend</p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-semibold text-success-dark">Open</span>
                  <p className="text-xs text-text-muted">Learners can book this slot</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-info-light px-2 py-0.5 text-[10px] font-semibold text-info">Booked</span>
                  <p className="text-xs text-text-muted">A learner has reserved this slot</p>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-3 w-3 text-text-muted shrink-0" />
                  <p className="text-xs text-text-muted">Booked slots cannot be deleted</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
