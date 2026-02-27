"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import {
  getMentorProfile,
  updateMentorTitle,
  updateMentorBio,
  updateMentorExpertise,
  updateMentorAvailability,
  type MentorProfileData,
} from "@/lib/mock/mentor-profile";
import {
  Pencil,
  Check,
  X,
  Plus,
  Loader2,
  BadgeCheck,
  Eye,
  ToggleLeft,
  ToggleRight,
  Star,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Save state type ──────────────────────────────────────────────────────────

type SaveState = "idle" | "saving" | "saved" | "error";

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Saved badge ──────────────────────────────────────────────────────────────

function SavedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2 py-0.5 text-xs font-medium text-accent-foreground">
      <Check className="h-3 w-3" />
      Saved
    </span>
  );
}

// ─── Learner preview card ─────────────────────────────────────────────────────

function LearnerPreviewCard({ profile }: { profile: MentorProfileData }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
        <Eye className="h-3.5 w-3.5" />
        Learner view
      </div>

      {/* Avatar + name + title */}
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
          {initials(profile.name)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold text-text-primary">{profile.name}</p>
            <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
          </div>
          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{profile.title}</p>
          <span className={cn(
            "mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            profile.isAvailable
              ? "bg-accent-light text-accent-foreground"
              : "bg-muted text-text-muted"
          )}>
            {profile.isAvailable ? "Available" : "Unavailable"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 border-t border-border pt-3">
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 text-warning" style={{ fill: "currentColor" }} />
          <span className="text-xs font-semibold text-text-primary">{profile.rating.toFixed(1)}</span>
        </div>
        <span className="text-xs text-text-muted">{profile.totalSessions} sessions</span>
      </div>

      {/* Bio preview */}
      {profile.bio ? (
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-4">{profile.bio}</p>
      ) : (
        <p className="text-xs text-text-muted italic">No bio added yet.</p>
      )}

      {/* Expertise */}
      {profile.expertise.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {profile.expertise.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-text-secondary"
            >
              {tag}
            </span>
          ))}
          {profile.expertise.length > 6 && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-text-muted">
              +{profile.expertise.length - 6} more
            </span>
          )}
        </div>
      ) : (
        <p className="text-xs text-text-muted italic">No expertise tags yet.</p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MentorProfileData | null>(null);

  // Per-section draft + edit state
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [titleSave, setTitleSave] = useState<SaveState>("idle");

  const [editingBio, setEditingBio] = useState(false);
  const [draftBio, setDraftBio] = useState("");
  const [bioSave, setBioSave] = useState<SaveState>("idle");

  const [editingExpertise, setEditingExpertise] = useState(false);
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [expertiseSave, setExpertiseSave] = useState<SaveState>("idle");

  const [availSave, setAvailSave] = useState<SaveState>("idle");

  // Load
  useEffect(() => {
    const t = setTimeout(() => {
      const p = getMentorProfile();
      setProfile(p);
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  function refreshProfile() {
    setProfile(getMentorProfile());
  }

  // ── Title ──────────────────────────────────────────────────────────────────

  function startEditTitle() {
    setDraftTitle(profile!.title);
    setEditingTitle(true);
    setTitleSave("idle");
  }

  function saveTitle() {
    if (!draftTitle.trim()) return;
    setTitleSave("saving");
    setTimeout(() => {
      const ok = updateMentorTitle(draftTitle);
      if (ok) {
        setTitleSave("saved");
        setEditingTitle(false);
        refreshProfile();
        setTimeout(() => setTitleSave("idle"), 2500);
      } else {
        setTitleSave("error");
      }
    }, 600);
  }

  // ── Bio ────────────────────────────────────────────────────────────────────

  function startEditBio() {
    setDraftBio(profile!.bio);
    setEditingBio(true);
    setBioSave("idle");
  }

  function saveBio() {
    setBioSave("saving");
    setTimeout(() => {
      const ok = updateMentorBio(draftBio);
      if (ok) {
        setBioSave("saved");
        setEditingBio(false);
        refreshProfile();
        setTimeout(() => setBioSave("idle"), 2500);
      } else {
        setBioSave("error");
      }
    }, 600);
  }

  // ── Expertise ──────────────────────────────────────────────────────────────

  function startEditExpertise() {
    setDraftTags([...profile!.expertise]);
    setTagInput("");
    setEditingExpertise(true);
    setExpertiseSave("idle");
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || draftTags.includes(tag) || draftTags.length >= 12) return;
    setDraftTags([...draftTags, tag]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setDraftTags(draftTags.filter((t) => t !== tag));
  }

  function saveExpertise() {
    if (draftTags.length === 0) return;
    setExpertiseSave("saving");
    setTimeout(() => {
      const ok = updateMentorExpertise(draftTags);
      if (ok) {
        setExpertiseSave("saved");
        setEditingExpertise(false);
        refreshProfile();
        setTimeout(() => setExpertiseSave("idle"), 2500);
      } else {
        setExpertiseSave("error");
      }
    }, 600);
  }

  // ── Availability toggle ────────────────────────────────────────────────────

  function toggleAvailability() {
    if (!profile) return;
    setAvailSave("saving");
    setTimeout(() => {
      const ok = updateMentorAvailability(!profile.isAvailable);
      if (ok) {
        setAvailSave("saved");
        refreshProfile();
        setTimeout(() => setAvailSave("idle"), 2000);
      } else {
        setAvailSave("error");
      }
    }, 400);
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout role="mentor" pageTitle="Settings" userName="Alex Johnson" userTitle="Senior Mentor">
        <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="h-4 w-32 bg-muted rounded mb-4" />
              <div className="h-10 w-full bg-muted rounded" />
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) return null;

  return (
    <DashboardLayout
      role="mentor"
      pageTitle="Settings"
      pageSubtitle="Manage your public mentor profile"
      userName={profile.name}
      userTitle={profile.title}
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

          {/* ── Left column: editable sections ── */}
          <div className="space-y-5">

            {/* ─ Identity card ─ */}
            <SectionCard title="Identity">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-base">
                  {initials(profile.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-text-primary flex items-center gap-1.5">
                    {profile.name}
                    <BadgeCheck className="h-4 w-4 text-primary" />
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {profile.rating.toFixed(1)} rating · {profile.totalSessions} sessions
                  </p>
                </div>
              </div>
              <p className="text-xs text-text-muted mt-3">
                Your name is managed by your account and cannot be changed here.
              </p>
            </SectionCard>

            {/* ─ Professional title ─ */}
            <SectionCard title="Professional Title">
              {!editingTitle ? (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {profile.title ? (
                      <p className="text-sm text-text-primary">{profile.title}</p>
                    ) : (
                      <p className="text-sm text-text-muted italic">No title set</p>
                    )}
                    <p className="text-xs text-text-muted mt-1">
                      This appears below your name in the mentor listing.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <SavedBadge show={titleSave === "saved"} />
                    <button
                      onClick={startEditTitle}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-muted hover:text-text-primary transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    maxLength={100}
                    placeholder="e.g. Senior Software Engineer at Stripe"
                    className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">{draftTitle.length}/100 characters</span>
                    {titleSave === "error" && (
                      <span className="text-xs text-destructive">Title cannot be empty</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTitle(false)}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-muted transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                    <button
                      onClick={saveTitle}
                      disabled={!draftTitle.trim() || titleSave === "saving"}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {titleSave === "saving"
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Check className="h-3.5 w-3.5" />
                      }
                      Save
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ─ Availability ─ */}
            <SectionCard title="Availability">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    Accept new bookings
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    When off, learners see you as unavailable and cannot book sessions.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {availSave === "saving" && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
                  <SavedBadge show={availSave === "saved"} />
                  <button
                    onClick={toggleAvailability}
                    disabled={availSave === "saving"}
                    className="disabled:opacity-60 transition-opacity"
                    aria-label={profile.isAvailable ? "Turn off availability" : "Turn on availability"}
                  >
                    {profile.isAvailable
                      ? <ToggleRight className="h-8 w-8 text-primary" />
                      : <ToggleLeft className="h-8 w-8 text-text-muted" />
                    }
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <span className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  profile.isAvailable
                    ? "bg-accent-light text-accent-foreground"
                    : "bg-muted text-text-muted"
                )}>
                  {profile.isAvailable ? "Accepting bookings" : "Not accepting bookings"}
                </span>
              </div>
            </SectionCard>

            {/* ─ About / Bio ─ */}
            <SectionCard title="About">
              {!editingBio ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {profile.bio ? (
                        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                          {profile.bio}
                        </p>
                      ) : (
                        <p className="text-sm text-text-muted italic">
                          No bio added yet. A well-written bio helps learners decide to book with you.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <SavedBadge show={bioSave === "saved"} />
                      <button
                        onClick={startEditBio}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-muted hover:text-text-primary transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={draftBio}
                    onChange={(e) => setDraftBio(e.target.value)}
                    rows={8}
                    maxLength={2000}
                    placeholder="Tell learners about your background, expertise, and what they can expect from a session with you…"
                    className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">{draftBio.length}/2000 characters</span>
                    {bioSave === "error" && (
                      <span className="text-xs text-destructive">Failed to save. Try again.</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingBio(false)}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-muted transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                    <button
                      onClick={saveBio}
                      disabled={bioSave === "saving"}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {bioSave === "saving"
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Check className="h-3.5 w-3.5" />
                      }
                      Save
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ─ Expertise ─ */}
            <SectionCard title="Expertise">
              {!editingExpertise ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {profile.expertise.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.expertise.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-primary-light text-text-accent px-3 py-1 text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-text-muted italic">
                          No expertise tags. Add some to help learners find you.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <SavedBadge show={expertiseSave === "saved"} />
                      <button
                        onClick={startEditExpertise}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-muted hover:text-text-primary transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted">
                    {profile.expertise.length}/12 tags · These appear on your profile card and help learners filter mentors.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Current draft tags */}
                  <div className="flex flex-wrap gap-2 min-h-[36px]">
                    {draftTags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 rounded-full bg-primary-light text-text-accent pl-3 pr-2 py-1 text-xs font-medium"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
                          aria-label={`Remove ${tag}`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                    {draftTags.length === 0 && (
                      <p className="text-xs text-text-muted italic self-center">
                        No tags yet — add at least one.
                      </p>
                    )}
                  </div>

                  {/* Add tag input */}
                  {draftTags.length < 12 && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); addTag(); }
                          if (e.key === "," || e.key === "Tab") { e.preventDefault(); addTag(); }
                        }}
                        maxLength={40}
                        placeholder="Add a skill or topic…"
                        className="flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={addTag}
                        disabled={!tagInput.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-muted border border-border px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-primary-light hover:text-text-accent disabled:opacity-40 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-text-muted">
                    {draftTags.length}/12 tags · Press Enter or comma to add
                  </p>

                  {expertiseSave === "error" && (
                    <p className="text-xs text-destructive">At least one tag is required.</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingExpertise(false)}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-muted transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                    <button
                      onClick={saveExpertise}
                      disabled={draftTags.length === 0 || expertiseSave === "saving"}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {expertiseSave === "saving"
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Check className="h-3.5 w-3.5" />
                      }
                      Save
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* ── Right column: sticky preview ── */}
          <div className="hidden lg:block">
            <div className="sticky top-6 space-y-3">
              <LearnerPreviewCard profile={profile} />
              <p className="text-xs text-text-muted text-center px-2">
                This is how your profile appears to learners. Changes save immediately.
              </p>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
