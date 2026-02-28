"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatTime, formatDuration } from "@/lib/mock/slots";
import { cn } from "@/lib/utils";
import type { Mentor } from "@/lib/types/mentor";
import type { TimeSlot } from "@/lib/types/slot";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toHHMM(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toDateStr(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === tomorrow.getTime()) return "Tomorrow";
  return "";
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState = "loading" | "review" | "confirming" | "success" | "error" | "invalid";

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-semibold text-text-primary">{value}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-lg animate-pulse space-y-4">
      <div className="h-4 w-32 rounded bg-muted" />
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-px bg-muted" />
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted" />
          </div>
        </div>
        <div className="h-px bg-muted" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted" />
              <div className="space-y-1.5">
                <div className="h-3 w-12 rounded bg-muted" />
                <div className="h-4 w-36 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-10 w-full rounded-lg bg-muted" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ConfirmPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const slotId = searchParams.get("slot");

  const [pageState, setPageState] = useState<PageState>("loading");
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [label, setLabel] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Load mentor + slot from real APIs
  useEffect(() => {
    if (!slotId) { setPageState("invalid"); return; }

    Promise.all([
      fetch(`/api/mentors/${id}`),
      fetch(`/api/mentors/${id}/availability`),
    ])
      .then(async ([mentorRes, slotsRes]) => {
        if (mentorRes.status === 404) { setPageState("invalid"); return; }
        if (!mentorRes.ok || !slotsRes.ok) throw new Error("Failed to fetch");

        const mentorData: Mentor = await mentorRes.json();
        const rawSlots: {
          id: string;
          slot_start: string;
          slot_end: string;
          duration_minutes: number;
          current_booked_count: number;
          max_capacity: number;
        }[] = await slotsRes.json();

        const foundRaw = rawSlots.find((s) => s.id === slotId);
        if (!foundRaw || foundRaw.current_booked_count >= foundRaw.max_capacity) {
          setPageState("invalid");
          return;
        }

        const foundSlot: TimeSlot = {
          id: foundRaw.id,
          mentorId: id,
          date: toDateStr(foundRaw.slot_start),
          startTime: toHHMM(foundRaw.slot_start),
          endTime: toHHMM(foundRaw.slot_end),
          durationMinutes: foundRaw.duration_minutes,
          isBooked: false,
        };

        setMentor(mentorData);
        setSlot(foundSlot);
        setLabel(getDateLabel(foundSlot.date));
        setPageState("review");
      })
      .catch(() => setPageState("invalid"));
  }, [id, slotId]);

  // Confirm booking handler
  const handleConfirm = async () => {
    if (!mentor || !slot || pageState !== "review") return;
    setPageState("confirming");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: slot.id }),
      });

      if (!res.ok) {
        if (res.status === 409) { setPageState("invalid"); return; }
        setPageState("error");
        return;
      }

      const { bookingId: newBookingId } = await res.json();
      setBookingId(newBookingId);
      setPageState("success");
    } catch {
      setPageState("error");
    }
  };

  const initials = mentor?.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "";

  return (
    <DashboardLayout
      role="learner"
      pageTitle="Confirm Booking"
      pageSubtitle={mentor ? `Session with ${mentor.name}` : undefined}
      userName="Jane Doe"
      userTitle="Learner"
    >
      <div className="mx-auto max-w-lg">

        {/* ── Loading ────────────────────────────────────────── */}
        {pageState === "loading" && <LoadingSkeleton />}

        {/* ── Invalid / not found ───────────────────────────── */}
        {pageState === "invalid" && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-light">
              <AlertCircle className="h-6 w-6 text-warning-dark" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">This slot is no longer available</p>
              <p className="text-sm text-text-muted mt-1">It may have been booked by someone else.</p>
            </div>
            <Link
              href={`/mentors/${id}/book`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
            >
              Choose another slot
            </Link>
          </div>
        )}

        {/* ── Review ───────────────────────────────────────────── */}
        {(pageState === "review" || pageState === "confirming") && mentor && slot && (
          <>
            <Link
              href={`/mentors/${id}/book`}
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to availability
            </Link>

            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Confirm your booking</h2>
                <p className="text-sm text-text-muted mt-0.5">
                  Review the details below before confirming.
                </p>
              </div>

              <div className="h-px bg-border" />

              {/* Mentor summary */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold select-none">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-text-primary truncate">{mentor.name}</span>
                    {mentor.isVerified && (
                      <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />
                    )}
                  </div>
                  <p className="text-xs text-text-secondary truncate">{mentor.title}</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Session details */}
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Session Details</p>

                <DetailRow
                  icon={CalendarDays}
                  label="Date"
                  value={new Date(slot.date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long", month: "long", day: "numeric", year: "numeric",
                  })}
                  sub={label || undefined}
                />

                <DetailRow
                  icon={Clock}
                  label="Time"
                  value={`${formatTime(slot.startTime)} — ${formatTime(slot.endTime)}`}
                  sub={formatDuration(slot.durationMinutes)}
                />

                <DetailRow
                  icon={Users}
                  label="Session type"
                  value="1:1 Mentorship Session"
                />
              </div>

              <div className="h-px bg-border" />

              {/* Notice */}
              <div className="flex items-start gap-2.5 rounded-lg bg-primary-light px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-text-accent leading-relaxed">
                  Confirming will secure this slot and notify{" "}
                  <span className="font-semibold">{mentor.name.split(" ")[0]}</span>.
                  The session will appear in your upcoming sessions.
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={handleConfirm}
                disabled={pageState === "confirming"}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3",
                  "bg-primary text-primary-foreground text-sm font-semibold",
                  "hover:bg-primary-dark transition-colors",
                  "disabled:opacity-70 disabled:cursor-not-allowed"
                )}
              >
                {pageState === "confirming" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirming booking…
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </button>

              {pageState !== "confirming" && (
                <button
                  onClick={() => router.back()}
                  className="w-full text-center text-sm text-text-muted hover:text-text-secondary transition-colors"
                >
                  Go back
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Error ───────────────────────────────────────────── */}
        {pageState === "error" && mentor && slot && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-5 text-center">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive-light">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Booking Failed</h2>
              <p className="text-sm text-text-muted mt-1.5 max-w-xs mx-auto">
                This slot may no longer be available, or something went wrong on our end.
                Your session was not confirmed.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleConfirm}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
              >
                Try Again
              </button>
              <Link
                href={`/mentors/${id}/book`}
                className="text-sm text-text-muted hover:text-text-secondary transition-colors py-1"
              >
                Choose a different slot
              </Link>
            </div>
          </div>
        )}

        {/* ── Success ─────────────────────────────────────────── */}
        {pageState === "success" && mentor && slot && (
          <div className="rounded-xl border border-border bg-card p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-text-primary">Session Confirmed!</h2>
              <p className="text-sm text-text-muted mt-1.5">
                Your session has been booked successfully.
              </p>
            </div>

            {/* Session summary pill */}
            <div className="inline-flex flex-col items-center gap-1 rounded-xl bg-muted px-6 py-4 text-center">
              <p className="text-sm font-semibold text-text-primary">{mentor.name}</p>
              <p className="text-xs text-text-muted">
                {new Date(slot.date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                })}
                {" · "}
                {formatTime(slot.startTime)}
              </p>
              {bookingId && (
                <p className="text-[10px] text-text-muted mt-1 font-mono">
                  #{bookingId.slice(0, 8)}
                </p>
              )}
            </div>

            {/* What happens next */}
            <div className="rounded-lg bg-primary-light px-4 py-3 text-left">
              <p className="text-xs font-semibold text-text-accent mb-1.5">What happens next</p>
              <ul className="space-y-1 text-xs text-text-secondary">
                <li>• Your session appears in <span className="font-medium">My Sessions</span></li>
                <li>• You&apos;ll receive a reminder before the session</li>
                <li>• Join at the scheduled time — the mentor will be ready</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <Link
                href="/sessions"
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
              >
                <CalendarDays className="h-4 w-4" />
                View My Sessions
              </Link>
              <Link
                href="/mentors"
                className="text-sm text-text-muted hover:text-text-secondary transition-colors py-1"
              >
                Find more mentors
              </Link>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
