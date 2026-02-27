// Skeleton matches MentorCard layout exactly to prevent layout shift on load
export default function MentorCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5 animate-pulse">
      {/* Availability pill */}
      <div className="absolute top-4 right-4 h-6 w-24 rounded-full bg-muted" />

      {/* Avatar + name block */}
      <div className="flex items-center gap-3 pr-24">
        <div className="h-11 w-11 shrink-0 rounded-full bg-muted" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-3.5 w-28 rounded bg-muted" />
          <div className="h-3 w-40 rounded bg-muted" />
        </div>
      </div>

      {/* Expertise tags */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <div className="h-6 w-16 rounded-md bg-muted" />
        <div className="h-6 w-20 rounded-md bg-muted" />
        <div className="h-6 w-12 rounded-md bg-muted" />
      </div>

      {/* Divider */}
      <div className="my-4 h-px bg-muted" />

      {/* Rating row */}
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-10 rounded bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
      </div>
    </div>
  );
}
