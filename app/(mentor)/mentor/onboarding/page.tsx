"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Users,
  CalendarCheck,
  BadgeCheck,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

interface ProfileData {
  title: string;
  bio: string;
  expertise: string[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const rh = Math.floor(total / 60) % 24;
  const rm = total % 60;
  return `${String(rh).padStart(2, "0")}:${String(rm).padStart(2, "0")}`;
}

const DURATION_OPTIONS = [
  { label: "30 minutes", value: 30 },
  { label: "45 minutes", value: 45 },
  { label: "60 minutes", value: 60 },
  { label: "90 minutes", value: 90 },
];

const TOTAL_STEPS = 5;

// ─── Step indicator ────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-300",
                done ? "bg-primary" : active ? "bg-primary w-6" : "bg-border"
              )}
            />
          </div>
        );
      })}
      <span className="ml-2 text-xs text-text-muted font-medium">
        Step {current} of {TOTAL_STEPS}
      </span>
    </div>
  );
}

// ─── Step 1: Welcome ───────────────────────────────────────────────────────

function StepWelcome({
  mentorName,
  onNext,
}: {
  mentorName: string;
  onNext: () => void;
}) {
  const firstName = mentorName.split(" ")[0];

  return (
    <div className="text-center max-w-lg">
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-text-primary mb-3">
        Welcome to Zuvy, {firstName}!
      </h1>
      <p className="text-text-secondary text-base leading-relaxed mb-10">
        You're about to set up your mentor profile. This takes just a few minutes
        and puts you in front of learners who are ready to grow.
      </p>

      <div className="space-y-4 mb-10 text-left">
        {[
          {
            icon: Users,
            title: "Create your public profile",
            desc: "Learners discover and evaluate you based on your title, bio, and expertise.",
          },
          {
            icon: CalendarCheck,
            title: "Add your first availability slot",
            desc: "Define when you're free so learners can book sessions with you.",
          },
          {
            icon: BadgeCheck,
            title: "Go live and start mentoring",
            desc: "Once set up, your profile appears in search results immediately.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{title}</p>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
      >
        Get Started
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Step 2: Profile form ──────────────────────────────────────────────────

function StepProfile({
  initial,
  onNext,
  onBack,
}: {
  initial: ProfileData;
  onNext: (data: ProfileData) => void;
  onBack: () => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [bio, setBio] = useState(initial.bio);
  const [expertise, setExpertise] = useState<string[]>(initial.expertise);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tagRef = useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/,$/, "").trim();
    if (tag && !expertise.includes(tag)) {
      setExpertise((prev) => [...prev, tag]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && expertise.length > 0) {
      setExpertise((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => setExpertise((prev) => prev.filter((t) => t !== tag));

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim()) { setError("Professional title is required."); return; }
    if (!bio.trim()) { setError("Bio is required."); return; }
    setSaving(true);

    const res = await fetch("/api/onboarding/mentor/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), bio: bio.trim(), expertise }),
    });

    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Failed to save. Please try again.");
      return;
    }

    onNext({ title, bio, expertise });
  };

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary">Set up your profile</h2>
        <p className="mt-1.5 text-sm text-text-muted">
          This is what learners will see when they find you.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive-light px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">
            Professional Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Software Engineer at Google"
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">
            Bio <span className="text-destructive">*</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write 2–3 sentences about your background, what you're passionate about, and how you help learners."
            rows={4}
            className="w-full resize-none rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
          <p className="mt-1 text-xs text-text-muted">{bio.length} characters</p>
        </div>

        {/* Expertise tags */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">
            Areas of Expertise
          </label>
          <div
            className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 cursor-text focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-colors"
            onClick={() => tagRef.current?.focus()}
          >
            {expertise.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {tag}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                  className="rounded-full hover:bg-primary/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              ref={tagRef}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
              placeholder={expertise.length === 0 ? "Type a skill and press Enter…" : "Add more…"}
              className="min-w-[140px] flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-text-muted">Press Enter or comma to add a tag</p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : "Save & Continue"}
          {!saving && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Profile preview ───────────────────────────────────────────────

function StepPreview({
  profile,
  mentorName,
  onNext,
  onBack,
}: {
  profile: ProfileData;
  mentorName: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const initials = mentorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary">Here's what learners will see</h2>
        <p className="mt-1.5 text-sm text-text-muted">
          Your profile is public as soon as you go live.
        </p>
      </div>

      {/* Mentor card preview */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-text-primary">{mentorName}</h3>
              <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
            </div>
            <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">{profile.title}</p>
          </div>
        </div>

        {profile.expertise.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.expertise.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-text-secondary"
              >
                {tag}
              </span>
            ))}
            {profile.expertise.length > 4 && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-text-muted">
                +{profile.expertise.length - 4} more
              </span>
            )}
          </div>
        )}

        <p className="mt-4 text-sm text-text-secondary leading-relaxed line-clamp-3">
          {profile.bio}
        </p>

        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Available
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Edit profile
        </button>
        <button
          onClick={onNext}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
        >
          Looks good, continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Create first slot ─────────────────────────────────────────────

function StepFirstSlot({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [date, setDate] = useState(getTomorrowStr());
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const handleCreate = async () => {
    setError(null);
    if (!date || !startTime) { setError("Please select a date and start time."); return; }

    setCreating(true);
    const slotStart = new Date(`${date}T${startTime}:00`).toISOString();
    const endTime = addMinutesToTime(startTime, duration);
    const slotEnd = new Date(`${date}T${endTime}:00`).toISOString();

    const res = await fetch("/api/mentor/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotStart, slotEnd, durationMinutes: duration }),
    });

    setCreating(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      const msg = (d as { error?: string }).error ?? "Failed to create slot.";
      setError(msg === "Slot must be in the future" ? "Please select a future date and time." : msg);
      return;
    }

    onNext();
  };

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary">Add your first availability slot</h2>
        <p className="mt-1.5 text-sm text-text-muted">
          Learners can only book you when you have open slots. Add at least one to go live.
        </p>
      </div>

      {/* Why this matters */}
      <div className="mb-6 flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
        <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">
          You can add as many slots as you like from your Availability page after setup.
          For now, just create one to get started.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive-light px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Date */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Date</label>
          <input
            type="date"
            value={date}
            min={todayStr}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>

        {/* Start time */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Duration</label>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDuration(value)}
                className={cn(
                  "rounded-xl border py-2.5 text-xs font-medium transition-all",
                  duration === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-text-secondary hover:border-grey hover:bg-muted"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary pill */}
        {date && startTime && (
          <div className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Slot: </span>
            {new Date(`${date}T${startTime}:00`).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}{" "}
            · {startTime} – {addMinutesToTime(startTime, duration)} ({duration} min)
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {creating && <Loader2 className="h-4 w-4 animate-spin" />}
          {creating ? "Creating slot…" : "Create Slot"}
          {!creating && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Complete ──────────────────────────────────────────────────────

function StepComplete({
  profile,
  mentorName,
  onDone,
}: {
  profile: ProfileData;
  mentorName: string;
  onDone: () => void;
}) {
  return (
    <div className="text-center max-w-lg">
      <div className="mb-6 flex justify-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-accent/15">
          <CheckCircle2 className="h-10 w-10 text-accent" />
          <div className="absolute -right-1 -top-1">
            <Sparkles className="h-5 w-5 text-secondary" />
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-text-primary mb-3">You're all set!</h1>
      <p className="text-text-secondary text-base leading-relaxed mb-8">
        Your mentor profile is live. Learners can now discover and book sessions with you.
      </p>

      {/* Summary */}
      <div className="mb-8 space-y-2 text-left">
        {[
          { label: "Profile created", detail: `${mentorName} · ${profile.title}` },
          {
            label: "Expertise added",
            detail: profile.expertise.length > 0
              ? profile.expertise.slice(0, 3).join(", ") + (profile.expertise.length > 3 ? "…" : "")
              : "Not specified",
          },
          { label: "First slot created", detail: "Open for bookings" },
        ].map(({ label, detail }) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
              <span className="text-sm font-medium text-text-primary">{label}</span>
            </div>
            <span className="text-xs text-text-muted max-w-[160px] text-right truncate">{detail}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onDone}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
      >
        Go to Dashboard
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function MentorOnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [mentorName, setMentorName] = useState("Mentor");
  const [profile, setProfile] = useState<ProfileData>({ title: "", bio: "", expertise: [] });
  const [initializing, setInitializing] = useState(true);

  // Resume logic: check current onboarding state
  useEffect(() => {
    const checkStatus = async () => {
      const res = await fetch("/api/onboarding/mentor/status");
      if (!res.ok) { setInitializing(false); return; }

      const status: { profileComplete: boolean; slotCount: number; mentorName: string } =
        await res.json();

      setMentorName(status.mentorName);

      if (status.profileComplete && status.slotCount > 0) {
        // Already complete — send to dashboard
        router.replace("/mentor/dashboard");
        return;
      }

      if (status.profileComplete && status.slotCount === 0) {
        // Profile done but no slot yet — resume at slot step
        setStep(4);
      }
      // else: start from step 1

      setInitializing(false);
    };

    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS) as Step);
  const back = () => setStep((s) => Math.max(s - 1, 1) as Step);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-text-primary">Zuvy</span>
          </div>

          <StepIndicator current={step} />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 py-12">
        {step === 1 && (
          <StepWelcome mentorName={mentorName} onNext={next} />
        )}
        {step === 2 && (
          <StepProfile
            initial={profile}
            onNext={(data) => { setProfile(data); next(); }}
            onBack={back}
          />
        )}
        {step === 3 && (
          <StepPreview
            profile={profile}
            mentorName={mentorName}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 4 && (
          <StepFirstSlot onNext={next} onBack={back} />
        )}
        {step === 5 && (
          <StepComplete
            profile={profile}
            mentorName={mentorName}
            onDone={() => router.push("/mentor/dashboard")}
          />
        )}
      </main>
    </div>
  );
}
