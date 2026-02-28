"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Search,
  CalendarCheck,
  Video,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────

const INTEREST_OPTIONS = [
  "Web Development",
  "Data Science",
  "Career Growth",
  "Leadership",
  "Design & UX",
  "Machine Learning",
  "Entrepreneurship",
  "Interview Prep",
];

const TOTAL_STEPS = 4;
const LS_KEY = "zuvy_learner_onboarded";

// ─── Step indicator ────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n}>
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                done ? "w-2 bg-primary" : active ? "w-6 bg-primary" : "w-2 bg-border"
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
  learnerName,
  onNext,
}: {
  learnerName: string;
  onNext: () => void;
}) {
  const firstName = learnerName.split(" ")[0];

  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome to Zuvy, {firstName}!
        </h1>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          Zuvy connects you with experienced mentors who help you grow your skills,
          navigate your career, and achieve your goals — one session at a time.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {[
          { emoji: "🎯", text: "Get personalised guidance from industry experts" },
          { emoji: "📅", text: "Book sessions that fit your schedule, any time" },
          { emoji: "🚀", text: "Make real progress with focused 1-on-1 mentorship" },
        ].map(({ emoji, text }) => (
          <div key={text} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <span className="text-lg">{emoji}</span>
            <p className="text-sm text-text-secondary">{text}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
      >
        Let's go
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Step 2: How sessions work ─────────────────────────────────────────────

function StepHowItWorks({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const steps = [
    {
      icon: Search,
      title: "Discover mentors",
      desc: "Browse profiles, expertise, and availability to find the right mentor for your goals.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: CalendarCheck,
      title: "Book a session",
      desc: "Pick an available time slot that works for you and confirm your booking in seconds.",
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: Video,
      title: "Attend and grow",
      desc: "Join your session, get personalised advice, and take the next step in your journey.",
      color: "bg-accent/15 text-accent",
    },
  ];

  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">How sessions work</h2>
        <p className="mt-1.5 text-sm text-text-muted">Three simple steps to your first mentorship session.</p>
      </div>

      <div className="space-y-3 mb-8">
        {steps.map(({ icon: Icon, title, desc, color }, i) => (
          <div key={title} className="relative flex items-start gap-4 rounded-xl border border-border bg-card p-4">
            {i < steps.length - 1 && (
              <div className="absolute left-[28px] top-[56px] h-[calc(100%+12px)] w-px bg-border" />
            )}
            <div className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", color)}>
              <Icon className="h-4 w-4" />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-background text-[10px] font-bold text-text-primary border border-border">
                {i + 1}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{title}</p>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Interests ─────────────────────────────────────────────────────

function StepInterests({
  onNext,
  onBack,
}: {
  onNext: (selected: string[]) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (tag: string) => {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">What are you interested in?</h2>
        <p className="mt-1.5 text-sm text-text-muted">
          Select any areas you'd like mentorship on. You can skip this — it's optional.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {INTEREST_OPTIONS.map((tag) => {
          const active = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-text-secondary hover:border-grey hover:bg-muted"
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="mb-4 text-xs text-text-muted">
          {selected.length} topic{selected.length > 1 ? "s" : ""} selected
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={() => onNext(selected)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
        >
          {selected.length === 0 ? "Skip" : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Complete ──────────────────────────────────────────────────────

function StepComplete({
  learnerName,
  interests,
  onDone,
}: {
  learnerName: string;
  interests: string[];
  onDone: () => void;
}) {
  const firstName = learnerName.split(" ")[0];

  return (
    <div className="w-full max-w-[440px] text-center">
      <div className="mb-6 flex justify-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-accent/15">
          <CheckCircle2 className="h-10 w-10 text-accent" />
          <div className="absolute -right-1 -top-1">
            <Sparkles className="h-5 w-5 text-secondary" />
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-text-primary mb-2">
        You're ready, {firstName}!
      </h1>
      <p className="text-text-secondary text-sm leading-relaxed mb-8">
        Start browsing mentors and book your first session. Great things start with one conversation.
      </p>

      {interests.length > 0 && (
        <div className="mb-8 rounded-xl border border-border bg-card px-4 py-3 text-left">
          <p className="text-xs font-medium text-text-muted mb-2">Your interests</p>
          <div className="flex flex-wrap gap-2">
            {interests.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onDone}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
      >
        Browse Mentors
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function LearnerOnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [learnerName, setLearnerName] = useState("there");
  const [interests, setInterests] = useState<string[]>([]);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // If already onboarded, skip to mentors
    if (typeof window !== "undefined" && localStorage.getItem(LS_KEY)) {
      router.replace("/mentors");
      return;
    }

    // Fetch user name for personalisation
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("id", user.id)
          .single();
        setLearnerName(profile?.name ?? profile?.email ?? "there");
      }
      setInitializing(false);
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (initializing) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const handleComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, "1");
    }
    router.push("/mentors");
  };

  return (
    <div className="w-full max-w-[440px]">
      {/* Step indicator */}
      <div className="mb-8">
        <StepIndicator current={step} />
      </div>

      {step === 1 && (
        <StepWelcome learnerName={learnerName} onNext={next} />
      )}
      {step === 2 && (
        <StepHowItWorks onNext={next} onBack={back} />
      )}
      {step === 3 && (
        <StepInterests
          onNext={(sel) => { setInterests(sel); next(); }}
          onBack={back}
        />
      )}
      {step === 4 && (
        <StepComplete
          learnerName={learnerName}
          interests={interests}
          onDone={handleComplete}
        />
      )}
    </div>
  );
}
