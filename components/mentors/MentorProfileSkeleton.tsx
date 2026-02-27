// Skeleton layout matches MentorProfile exactly to prevent layout shift
export default function MentorProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Back nav */}
      <div className="h-4 w-36 rounded bg-muted" />

      {/* Hero card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-20 w-20 shrink-0 rounded-full bg-muted" />
            <div className="space-y-2">
              {/* Name */}
              <div className="h-5 w-40 rounded bg-muted" />
              {/* Title */}
              <div className="h-4 w-52 rounded bg-muted" />
              {/* Stats */}
              <div className="flex gap-4 pt-1">
                <div className="h-3.5 w-16 rounded bg-muted" />
                <div className="h-3.5 w-24 rounded bg-muted" />
              </div>
            </div>
          </div>
          {/* Availability pill */}
          <div className="h-7 w-32 rounded-full bg-muted" />
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* About section */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded bg-muted" />
              <div className="h-3.5 w-full rounded bg-muted" />
              <div className="h-3.5 w-4/5 rounded bg-muted" />
              <div className="h-3.5 w-full rounded bg-muted" />
              <div className="h-3.5 w-3/4 rounded bg-muted" />
            </div>
          </div>

          {/* Expertise section */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="h-4 w-36 rounded bg-muted" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-7 w-24 rounded-md bg-muted" />
              ))}
            </div>
          </div>
        </div>

        {/* Right column — booking card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 h-fit">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-px bg-muted" />
          <div className="h-7 w-36 rounded-full bg-muted" />
          <div className="h-10 w-full rounded-lg bg-muted" />
          <div className="h-px bg-muted" />
          <div className="space-y-2">
            <div className="h-3.5 w-24 rounded bg-muted" />
            <div className="h-3.5 w-32 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
