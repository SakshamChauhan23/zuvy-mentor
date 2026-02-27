import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mentor } from "@/lib/types/mentor";

// Max expertise tags shown before "+N more"
const MAX_TAGS = 3;

interface MentorCardProps {
  mentor: Mentor;
}

export default function MentorCard({ mentor }: MentorCardProps) {
  const {
    id,
    name,
    title,
    expertise,
    isVerified,
    isAvailable,
    rating,
    totalSessions,
  } = mentor;

  const visibleTags = expertise.slice(0, MAX_TAGS);
  const overflowCount = expertise.length - MAX_TAGS;
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/mentors/${id}`}
      className={cn(
        // Base
        "group relative flex flex-col rounded-xl border bg-card p-5 transition-all duration-200",
        "border-border",
        // Hover — lift + border highlight
        "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
        // Unavailable — subtle dimming
        !isAvailable && "opacity-75"
      )}
      aria-label={`View ${name}'s profile`}
    >
      {/* ── Availability pill (top-right) ─────────────────── */}
      <div className="absolute top-4 right-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            isAvailable
              ? "bg-success-light text-success-dark"
              : "bg-muted text-text-muted"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isAvailable ? "bg-success" : "bg-grey"
            )}
          />
          {isAvailable ? "Accepting" : "Unavailable"}
        </span>
      </div>

      {/* ── Avatar + Name ──────────────────────────────────── */}
      <div className="flex items-center gap-3 pr-24">
        {/* Avatar */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold select-none"
          aria-hidden="true"
        >
          {initials}
        </div>

        {/* Name + verified + title */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-text-primary">
              {name}
            </span>
            {isVerified && (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-primary"
                aria-label="Verified mentor"
              />
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">{title}</p>
        </div>
      </div>

      {/* ── Expertise tags ─────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap gap-1.5 min-h-[28px]">
        {expertise.length === 0 ? (
          <span className="text-xs text-text-muted italic">No expertise listed</span>
        ) : (
          <>
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-text-secondary"
              >
                {tag}
              </span>
            ))}
            {overflowCount > 0 && (
              <span className="inline-flex items-center rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-text-accent">
                +{overflowCount} more
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Divider ────────────────────────────────────────── */}
      <div className="my-4 h-px bg-border" />

      {/* ── Rating + sessions ──────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
          <span className="text-sm font-semibold text-text-primary">{rating.toFixed(1)}</span>
        </div>
        <span className="text-xs text-text-muted">
          {totalSessions.toLocaleString()} sessions
        </span>
      </div>

      {/* ── Hover CTA bar ──────────────────────────────────── */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex items-center justify-center rounded-b-xl py-2.5",
          "bg-primary text-primary-foreground text-xs font-semibold",
          "translate-y-full opacity-0 transition-all duration-200",
          "group-hover:translate-y-0 group-hover:opacity-100"
        )}
        aria-hidden="true"
      >
        View Profile →
      </div>
    </Link>
  );
}
