"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock,
  ChevronRight,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SlotPicker from "@/components/availability/SlotPicker";
import { formatTime, formatDuration } from "@/lib/mock/slots";
import { cn } from "@/lib/utils";
import type { Mentor } from "@/lib/types/mentor";
import type { TimeSlot, SlotsByDate } from "@/lib/types/slot";

type PageState = "loading" | "error" | "empty" | "ready";

function toHHMM(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toDateStr(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === tomorrow.getTime()) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function groupByDate(slots: TimeSlot[]): SlotsByDate[] {
  const map = new Map<string, TimeSlot[]>();
  for (const slot of slots) {
    const arr = map.get(slot.date) ?? [];
    arr.push(slot);
    map.set(slot.date, arr);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, s]) => ({ date, label: dateLabel(date), slots: s }));
}

export default function AvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [groups, setGroups] = useState<SlotsByDate[]>([]);
  const [state, setState] = useState<PageState>("loading");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const loadData = async () => {
    setState("loading");
    setSelectedSlot(null);
    try {
      const [mentorRes, slotsRes] = await Promise.all([
        fetch(`/api/mentors/${id}`),
        fetch(`/api/mentors/${id}/availability`),
      ]);
      if (mentorRes.status === 404) { router.replace(`/mentors/${id}`); return; }
      if (!mentorRes.ok || !slotsRes.ok) throw new Error("Failed to fetch");

      const mentorData: Mentor = await mentorRes.json();
      const rawSlots: { id: string; slot_start: string; slot_end: string; duration_minutes: number; current_booked_count: number; max_capacity: number }[] = await slotsRes.json();

      setMentor(mentorData);

      const timeSlots: TimeSlot[] = rawSlots.map((s) => ({
        id: s.id,
        mentorId: id,
        date: toDateStr(s.slot_start),
        startTime: toHHMM(s.slot_start),
        endTime: toHHMM(s.slot_end),
        durationMinutes: s.duration_minutes,
        isBooked: s.current_booked_count >= s.max_capacity,
      }));

      const grouped = groupByDate(timeSlots);
      setGroups(grouped);
      setState(grouped.length === 0 ? "empty" : "ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => { loadData(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const availableCount = state === "ready"
    ? groups.reduce((acc, g) => acc + g.slots.filter((s) => !s.isBooked).length, 0)
    : null;

  return (
    <DashboardLayout
      role="learner"
      pageTitle="Book a Session"
      pageSubtitle={mentor ? `${mentor.name} · ${availableCount ?? "…"} slots available` : "Select an available time slot"}
      userName="Jane Doe"
      userTitle="Learner"
    >
      <div className="pb-28 lg:pb-0">
        <Link href={`/mentors/${id}`} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {mentor && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold select-none">
                  {mentor.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-text-primary truncate">{mentor.name}</span>
                    {mentor.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                  </div>
                  <p className="text-xs text-text-secondary truncate">{mentor.title}</p>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-base font-semibold text-text-primary">Select a time slot</h2>
              <p className="text-sm text-text-muted mt-0.5">All times shown are in your local timezone.</p>
            </div>

            <SlotPicker groups={groups} state={state} selectedSlotId={selectedSlot?.id ?? null} onSelect={setSelectedSlot} onRetry={loadData} />
          </div>

          <div>
            <div className="sticky top-6 rounded-xl border border-border bg-card p-5 space-y-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Your Selection</h3>
              <div className="h-px bg-border" />
              {selectedSlot ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                        <CalendarDays className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Date</p>
                        <p className="text-sm font-semibold text-text-primary">
                          {groups.find((g) => g.date === selectedSlot.date)?.label ?? selectedSlot.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Time</p>
                        <p className="text-sm font-semibold text-text-primary">
                          {formatTime(selectedSlot.startTime)} — {formatTime(selectedSlot.endTime)}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">{formatDuration(selectedSlot.durationMinutes)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <Link
                    href={`/mentors/${id}/book/confirm?slot=${selectedSlot.id}`}
                    className={cn("flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3", "bg-primary text-primary-foreground text-sm font-semibold", "hover:bg-primary-dark transition-colors")}
                  >
                    Continue to Book <ChevronRight className="h-4 w-4" />
                  </Link>
                  <button onClick={() => setSelectedSlot(null)} className="w-full text-center text-xs text-text-muted hover:text-text-secondary transition-colors">
                    Clear selection
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                  <CalendarDays className="h-8 w-8 text-text-muted" />
                  <p className="text-sm font-medium text-text-secondary">No slot selected</p>
                  <p className="text-xs text-text-muted">Choose an available time from the list to continue.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card px-4 py-3 lg:hidden">
        {selectedSlot ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-text-muted">Selected</p>
              <p className="text-sm font-semibold text-text-primary truncate">
                {groups.find((g) => g.date === selectedSlot.date)?.label ?? selectedSlot.date} · {formatTime(selectedSlot.startTime)}
              </p>
            </div>
            <Link
              href={`/mentors/${id}/book/confirm?slot=${selectedSlot.id}`}
              className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-lg px-5 py-2.5", "bg-primary text-primary-foreground text-sm font-semibold", "hover:bg-primary-dark transition-colors")}
            >
              Continue <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <p className="text-center text-sm text-text-muted py-1">Select a time slot to continue</p>
        )}
      </div>
    </DashboardLayout>
  );
}
