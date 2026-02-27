"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Star,
  CalendarDays,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mentor } from "@/lib/types/mentor";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-4">
      {children}
    </h2>
  );
}

// ─── Hero card ────────────────────────────────────────────────────────────────

function ProfileHero({ mentor }: { mentor: Mentor }) {
  const { name, title, isVerified, isAvailable, rating, totalSessions } = mentor;
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SectionCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold select-none">
            {initials}
          </div>

          <div>
            {/* Name + verified */}
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary">{name}</h1>
              {isVerified && (
                <BadgeCheck
                  className="h-5 w-5 text-primary shrink-0"
                  aria-label="Verified mentor"
                />
              )}
            </div>

            {/* Title */}
            <p className="mt-0.5 text-sm text-text-secondary">{title}</p>

            {/* Stats row */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1 text-sm text-text-primary">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
                <span className="text-text-muted">rating</span>
              </span>
              <span className="flex items-center gap-1 text-sm text-text-muted">
                <CalendarDays className="h-3.5 w-3.5" />
                {totalSessions.toLocaleString()} sessions completed
              </span>
            </div>
          </div>
        </div>

        {/* Availability pill */}
        <div className="shrink-0">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
              isAvailable
                ? "bg-success-light text-success-dark"
                : "bg-muted text-text-muted"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isAvailable ? "bg-success" : "bg-grey"
              )}
            />
            {isAvailable ? "Accepting sessions" : "Not available"}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── About section ────────────────────────────────────────────────────────────

function AboutSection({ bio }: { bio?: string }) {
  // Edge case: no bio provided
  if (!bio) {
    return (
      <SectionCard>
        <SectionHeading>About</SectionHeading>
        <p className="text-sm text-text-muted italic">
          This mentor hasn&apos;t added a bio yet.
        </p>
      </SectionCard>
    );
  }

  // Render paragraphs split by \n\n
  const paragraphs = bio.split("\n\n").filter(Boolean);

  return (
    <SectionCard>
      <SectionHeading>About</SectionHeading>
      <div className="space-y-3">
        {paragraphs.map((para, i) => (
          <p key={i} className="text-sm leading-relaxed text-text-secondary">
            {para}
          </p>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Expertise section ────────────────────────────────────────────────────────

function ExpertiseSection({ expertise }: { expertise: string[] }) {
  return (
    <SectionCard>
      <SectionHeading>Areas of Expertise</SectionHeading>

      {expertise.length === 0 ? (
        <p className="text-sm text-text-muted italic">No expertise areas listed.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {expertise.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Booking card ─────────────────────────────────────────────────────────────

function BookingCard({ mentor }: { mentor: Mentor }) {
  const { id, isAvailable, rating, totalSessions } = mentor;

  return (
    <SectionCard className="sticky top-6 space-y-4">
      <SectionHeading>Book a Session</SectionHeading>

      <div className="h-px bg-border" />

      {/* Availability status */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full shrink-0",
            isAvailable ? "bg-success" : "bg-grey"
          )}
        />
        <p
          className={cn(
            "text-sm font-medium",
            isAvailable ? "text-success-dark" : "text-text-muted"
          )}
        >
          {isAvailable
            ? "Accepting new sessions"
            : "Not accepting sessions right now"}
        </p>
      </div>

      {/* CTA */}
      {isAvailable ? (
        <Link
          href={`/mentors/${id}/book`}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3",
            "bg-primary text-primary-foreground text-sm font-semibold",
            "hover:bg-primary-dark transition-colors"
          )}
        >
          <CalendarDays className="h-4 w-4" />
          Book a Session
        </Link>
      ) : (
        <button
          disabled
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3",
            "bg-muted text-text-muted text-sm font-semibold cursor-not-allowed"
          )}
          aria-disabled="true"
        >
          Not Available
        </button>
      )}

      {!isAvailable && (
        <p className="text-xs text-text-muted text-center">
          Check back later — availability changes regularly.
        </p>
      )}

      {/* Divider + stats */}
      <div className="h-px bg-border" />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">Rating</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-text-primary">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            {rating.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">Sessions completed</span>
          <span className="text-sm font-semibold text-text-primary">
            {totalSessions.toLocaleString()}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ProfileError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive-light">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold text-text-primary">
          Couldn&apos;t load this profile
        </p>
        <p className="text-sm text-text-muted">
          Something went wrong. Please try again.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

// ─── Not found state ──────────────────────────────────────────────────────────

function ProfileNotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card">
      <p className="text-sm font-semibold text-text-primary">Mentor not found</p>
      <p className="text-sm text-text-muted">
        This profile may no longer be available.
      </p>
      <Link
        href="/mentors"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Mentors
      </Link>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface MentorProfileProps {
  mentor: Mentor | null;
  state: "ready" | "error" | "not-found";
  onRetry: () => void;
}

export default function MentorProfile({ mentor, state, onRetry }: MentorProfileProps) {
  const router = useRouter();

  if (state === "error") return <ProfileError onRetry={onRetry} />;
  if (state === "not-found" || !mentor) return <ProfileNotFound />;

  return (
    <div className="space-y-6">
      {/* Back navigation — preserves scroll via router.back() */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Find Mentors
      </button>

      {/* Hero */}
      <ProfileHero mentor={mentor} />

      {/* Two-column body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — bio + expertise */}
        <div className="space-y-6 lg:col-span-2">
          <AboutSection bio={mentor.bio} />
          <ExpertiseSection expertise={mentor.expertise} />
        </div>

        {/* Right — booking card (sticky) */}
        <div>
          <BookingCard mentor={mentor} />
        </div>
      </div>

      {/* Mobile-only sticky booking bar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card px-4 py-3",
          "flex items-center justify-between gap-3 lg:hidden"
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full shrink-0",
              mentor.isAvailable ? "bg-success" : "bg-grey"
            )}
          />
          <span className="text-sm font-medium text-text-secondary">
            {mentor.isAvailable ? "Accepting sessions" : "Not available"}
          </span>
        </div>

        {mentor.isAvailable ? (
          <Link
            href={`/mentors/${mentor.id}/book`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors shrink-0"
          >
            Book Session
          </Link>
        ) : (
          <button
            disabled
            className="inline-flex items-center rounded-lg bg-muted px-5 py-2.5 text-sm font-semibold text-text-muted cursor-not-allowed shrink-0"
          >
            Not Available
          </button>
        )}
      </div>
    </div>
  );
}
