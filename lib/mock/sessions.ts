import { BookedSession } from "@/lib/types/session";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysFromToday(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

// ─── Pre-seeded sessions for Jane Doe (learner demo) ─────────────────────────
// Covers: upcoming, completed, cancelled — so the dashboard has data immediately.

const SEED_SESSIONS: BookedSession[] = [
  {
    id: "session-seed-1",
    mentorId: "1",
    mentorName: "Priya Sharma",
    mentorTitle: "Staff Engineer at Stripe",
    isVerified: true,
    date: daysFromToday(3),
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    status: "upcoming",
    bookedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
  },
  {
    id: "session-seed-2",
    mentorId: "5",
    mentorName: "Aisha Oduya",
    mentorTitle: "Machine Learning Engineer at Google",
    isVerified: true,
    date: daysFromToday(7),
    startTime: "14:00",
    endTime: "15:00",
    durationMinutes: 60,
    status: "upcoming",
    bookedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: "session-seed-3",
    mentorId: "2",
    mentorName: "James Okonkwo",
    mentorTitle: "Senior Product Manager at Notion",
    isVerified: true,
    date: daysFromToday(-5),
    startTime: "11:00",
    endTime: "12:00",
    durationMinutes: 60,
    status: "completed",
    bookedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: "session-seed-4",
    mentorId: "9",
    mentorName: "Fatima Al-Rashid",
    mentorTitle: "Data Science Lead at Airbnb",
    isVerified: true,
    date: daysFromToday(-1),
    startTime: "16:00",
    endTime: "17:00",
    durationMinutes: 60,
    status: "cancelled",
    bookedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
];

// ─── In-memory store ──────────────────────────────────────────────────────────
// Persists across client-side navigations within the same browser session.

let _sessions: BookedSession[] = [...SEED_SESSIONS];

export function getSessions(): BookedSession[] {
  return _sessions;
}

export function addBookedSession(session: BookedSession): void {
  // Prevent duplicates — idempotent
  if (_sessions.some((s) => s.id === session.id)) return;
  _sessions = [session, ..._sessions];
}

export function getSessionById(id: string): BookedSession | undefined {
  return _sessions.find((s) => s.id === id);
}

// Returns false if session not found or not in a cancellable state
export function cancelSession(id: string): boolean {
  const session = _sessions.find((s) => s.id === id);
  if (!session) return false;
  if (session.status !== "upcoming" && session.status !== "rescheduled") return false;
  session.status = "cancelled";
  return true;
}

// Marks session as reschedule-pending with the proposed new slot.
// Returns false if session not found or not in a reschedulable state.
export function rescheduleSession(
  id: string,
  request: {
    proposedDate: string;
    proposedStartTime: string;
    proposedEndTime: string;
    proposedDurationMinutes: number;
    reason: string;
  }
): boolean {
  const session = _sessions.find((s) => s.id === id);
  if (!session) return false;
  if (session.status !== "upcoming" && session.status !== "rescheduled") return false;
  session.status = "reschedule-pending";
  session.rescheduleRequest = { ...request, requestedAt: new Date().toISOString() };
  return true;
}
