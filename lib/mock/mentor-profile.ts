// ─── Types ────────────────────────────────────────────────────────────────────

export interface MentorProfileData {
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  isAvailable: boolean;
  rating: number;
  totalSessions: number;
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: MentorProfileData = {
  name: "Alex Johnson",
  title: "Senior Software Engineer & Mentor",
  bio: "I'm a Senior Software Engineer with 8+ years of experience building full-stack products at scale. I've worked across fintech, developer tooling, and SaaS — and I now focus my mentorship on helping engineers grow from mid-level to senior and beyond.\n\nI specialize in React, TypeScript, Node.js, and system design. Whether you're preparing for a senior engineering interview, navigating a tricky architectural decision, or just trying to grow your engineering fundamentals — I'm happy to help you build a concrete path forward.\n\nMy sessions are practical and outcome-focused. We'll identify what's blocking you, work through it together, and make sure you leave with something actionable.",
  expertise: ["React", "TypeScript", "Node.js", "System Design", "Career Growth", "Code Review"],
  isAvailable: true,
  rating: 4.8,
  totalSessions: 127,
};

// ─── In-memory store ──────────────────────────────────────────────────────────

let _profile: MentorProfileData = { ...DEFAULT_PROFILE };

// ─── Queries ──────────────────────────────────────────────────────────────────

export function getMentorProfile(): MentorProfileData {
  return { ..._profile };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function updateMentorTitle(title: string): boolean {
  if (!title.trim()) return false;
  _profile = { ..._profile, title: title.trim() };
  return true;
}

export function updateMentorBio(bio: string): boolean {
  _profile = { ..._profile, bio: bio.trim() };
  return true;
}

export function updateMentorExpertise(expertise: string[]): boolean {
  if (expertise.length === 0) return false;
  _profile = { ..._profile, expertise };
  return true;
}

export function updateMentorAvailability(isAvailable: boolean): boolean {
  _profile = { ..._profile, isAvailable };
  return true;
}
