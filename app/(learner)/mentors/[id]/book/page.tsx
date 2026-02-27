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
import { getMentorById } from "@/lib/mock/mentors";
import {
  generateSlotsForMentor,
  groupSlotsByDate,
  formatTime,
  formatDuration,
} from "@/lib/mock/slots";
import { cn } from "@/lib/utils";
import type { Mentor } from "@/lib/types/mentor";
import type { TimeSlot, SlotsByDate } from "@/lib/types/slot";

type PageState = "loading" | "error" | "empty" | "ready";

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

  const loadData = () => {
    setState("loading");
    setSelectedSlot(null);

    setTimeout(() => {
      const foundMentor = getMentorById(id);
      if (!foundMentor) {
        router.replace(`/mentors/${id}`);
        return;
      }

      setMentor(foundMentor);

      const slots = generateSlotsForMentor(id);
      const availableGroups = groupSlotsByDate(slots);

      if (availableGroups.length === 0) {
        setState("empty");
      } else {
        setGroups(availableGroups);
        setState("ready");
      }
    }, 800);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Total available slot count for the subtitle
  const availableCount =
    state === "ready"
      ? groups.reduce((acc, g) => acc + g.slots.filter((s) => !s.isBooked).length, 0)
      : null;

  return (
    <DashboardLayout
      role="learner"
      pageTitle="Book a Session"
      pageSubtitle={
        mentor
          ? `${mentor.name} · ${availableCount ?? "…"} slots available`
          : "Select an available time slot"
      }
      userName="Jane Doe"
      userTitle="Learner"
    >
      {/* Extra bottom padding on mobile for sticky bar */}
      <div className="pb-28 lg:pb-0">
        {/* Back nav */}
        <Link
          href={`/mentors/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Left: slot picker ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mentor mini-card */}
            {mentor && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold select-none">
                  {mentor.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-text-primary truncate">
                      {mentor.name}
                    </span>
                    {mentor.isVerified && (
                      <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-text-secondary truncate">{mentor.title}</p>
                </div>
              </div>
            )}

            {/* Section heading */}
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Select a time slot
              </h2>
              <p className="text-sm text-text-muted mt-0.5">
                All times shown are in your local timezone. Sessions are 60 minutes.
              </p>
            </div>

            {/* Slot picker */}
            <SlotPicker
              groups={groups}
              state={state}
              selectedSlotId={selectedSlot?.id ?? null}
              onSelect={setSelectedSlot}
              onRetry={loadData}
            />
          </div>

          {/* ── Right: summary panel (desktop, sticky) ───────── */}
          <div>
            <div className="sticky top-6 rounded-xl border border-border bg-card p-5 space-y-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                Your Selection
              </h3>

              <div className="h-px bg-border" />

              {selectedSlot ? (
                <>
                  {/* Selected slot details */}
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
                        <p className="text-xs text-text-muted mt-0.5">
                          {formatDuration(selectedSlot.durationMinutes)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Continue CTA */}
                  <Link
                    href={`/mentors/${id}/book/confirm?slot=${selectedSlot.id}`}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3",
                      "bg-primary text-primary-foreground text-sm font-semibold",
                      "hover:bg-primary-dark transition-colors"
                    )}
                  >
                    Continue to Book
                    <ChevronRight className="h-4 w-4" />
                  </Link>

                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="w-full text-center text-xs text-text-muted hover:text-text-secondary transition-colors"
                  >
                    Clear selection
                  </button>
                </>
              ) : (
                /* No slot selected yet */
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                  <CalendarDays className="h-8 w-8 text-text-muted" />
                  <p className="text-sm font-medium text-text-secondary">
                    No slot selected
                  </p>
                  <p className="text-xs text-text-muted">
                    Choose an available time from the list to continue.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bottom bar ──────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card px-4 py-3 lg:hidden">
        {selectedSlot ? (
          <div className="flex items-center justify-between gap-3">
            {/* Selected info */}
            <div className="min-w-0">
              <p className="text-xs text-text-muted">Selected</p>
              <p className="text-sm font-semibold text-text-primary truncate">
                {groups.find((g) => g.date === selectedSlot.date)?.label ?? selectedSlot.date}
                {" · "}
                {formatTime(selectedSlot.startTime)}
              </p>
            </div>
            {/* CTA */}
            <Link
              href={`/mentors/${id}/book/confirm?slot=${selectedSlot.id}`}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-5 py-2.5",
                "bg-primary text-primary-foreground text-sm font-semibold",
                "hover:bg-primary-dark transition-colors"
              )}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <p className="text-center text-sm text-text-muted py-1">
            Select a time slot to continue
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
