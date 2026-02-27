import type {
  MentorSession,
  MentorNotification,
  MentorRescheduleRequest,
} from "@/lib/types/mentor-session";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysFromToday(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}

// ─── Seed sessions (mentor Alex Johnson's session history) ───────────────────

const SEED_SESSIONS: MentorSession[] = [
  // ── Upcoming ────────────────────────────────────────────────────────────
  {
    id: "ms-1",
    learnerId: "l-1",
    learnerName: "Sarah Kim",
    learnerRole: "Software Engineer Intern at Meta",
    date: daysFromToday(1),
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    status: "upcoming",
    bookedAt: daysAgo(2),
  },
  {
    id: "ms-2",
    learnerId: "l-2",
    learnerName: "Marcus Chen",
    learnerRole: "CS Student at MIT",
    date: daysFromToday(3),
    startTime: "14:00",
    endTime: "15:00",
    durationMinutes: 60,
    status: "upcoming",
    bookedAt: daysAgo(1),
  },
  {
    id: "ms-3",
    learnerId: "l-3",
    learnerName: "Priya Patel",
    learnerRole: "Junior Frontend Developer",
    date: daysFromToday(5),
    startTime: "11:00",
    endTime: "12:00",
    durationMinutes: 60,
    status: "reschedule-pending",
    bookedAt: daysAgo(5),
    rescheduleRequest: {
      proposedDate: daysFromToday(8),
      proposedStartTime: "15:00",
      proposedEndTime: "16:00",
      proposedDurationMinutes: 60,
      reason: "I have a team sprint review that conflicts with the original time. Would the following week work?",
      requestedAt: hoursAgo(1),
    },
  },
  {
    id: "ms-4",
    learnerId: "l-4",
    learnerName: "James Wright",
    learnerRole: "Career Switcher → Software Engineering",
    date: daysFromToday(8),
    startTime: "16:00",
    endTime: "17:00",
    durationMinutes: 60,
    status: "upcoming",
    bookedAt: daysAgo(1),
  },

  // ── Completed ────────────────────────────────────────────────────────────
  {
    id: "ms-5",
    learnerId: "l-5",
    learnerName: "Lila Rodriguez",
    learnerRole: "Data Analyst at Spotify",
    date: daysFromToday(-3),
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    status: "completed",
    bookedAt: daysAgo(14),
  },
  {
    id: "ms-6",
    learnerId: "l-6",
    learnerName: "Tom Baker",
    learnerRole: "Final Year Engineering Student",
    date: daysFromToday(-7),
    startTime: "14:00",
    endTime: "15:00",
    durationMinutes: 60,
    status: "completed",
    bookedAt: daysAgo(21),
  },
  {
    id: "ms-7",
    learnerId: "l-2",
    learnerName: "Marcus Chen",
    learnerRole: "CS Student at MIT",
    date: daysFromToday(-10),
    startTime: "11:00",
    endTime: "12:00",
    durationMinutes: 60,
    status: "completed",
    bookedAt: daysAgo(24),
  },
  {
    id: "ms-8",
    learnerId: "l-3",
    learnerName: "Priya Patel",
    learnerRole: "Junior Frontend Developer",
    date: daysFromToday(-14),
    startTime: "15:00",
    endTime: "16:00",
    durationMinutes: 60,
    status: "completed",
    bookedAt: daysAgo(28),
  },

  // ── Cancelled ────────────────────────────────────────────────────────────
  {
    id: "ms-9",
    learnerId: "l-1",
    learnerName: "Sarah Kim",
    learnerRole: "Software Engineer Intern at Meta",
    date: daysFromToday(-20),
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    status: "cancelled",
    bookedAt: daysAgo(35),
  },
];

// ─── Seed notifications ───────────────────────────────────────────────────────

const SEED_NOTIFICATIONS: MentorNotification[] = [
  {
    id: "n-1",
    type: "reschedule",
    message: "Priya Patel requested to reschedule their session on " +
      new Date(daysFromToday(5) + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    learnerName: "Priya Patel",
    sessionId: "ms-3",
    isRead: false,
    createdAt: hoursAgo(1),
  },
  {
    id: "n-2",
    type: "booking",
    message: "Marcus Chen booked a new session for " +
      new Date(daysFromToday(3) + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    learnerName: "Marcus Chen",
    sessionId: "ms-2",
    isRead: false,
    createdAt: hoursAgo(3),
  },
  {
    id: "n-3",
    type: "booking",
    message: "James Wright booked a session for " +
      new Date(daysFromToday(8) + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    learnerName: "James Wright",
    sessionId: "ms-4",
    isRead: true,
    createdAt: daysAgo(1),
  },
  {
    id: "n-4",
    type: "rating",
    message: "Lila Rodriguez left you a 5-star rating after their session",
    learnerName: "Lila Rodriguez",
    sessionId: "ms-5",
    isRead: true,
    createdAt: daysAgo(3),
  },
  {
    id: "n-5",
    type: "cancellation",
    message: "Sarah Kim cancelled their session that was scheduled for last month",
    learnerName: "Sarah Kim",
    sessionId: "ms-9",
    isRead: true,
    createdAt: daysAgo(20),
  },
];

// ─── In-memory store ──────────────────────────────────────────────────────────

let _sessions: MentorSession[] = [...SEED_SESSIONS];
let _notifications: MentorNotification[] = [...SEED_NOTIFICATIONS];

// ─── Session queries ──────────────────────────────────────────────────────────

export function getMentorSessions(): MentorSession[] {
  return _sessions;
}

export function getMentorSessionById(id: string): MentorSession | undefined {
  return _sessions.find((s) => s.id === id);
}

// ─── Reschedule request actions ───────────────────────────────────────────────

export function acceptRescheduleRequest(id: string): boolean {
  const session = _sessions.find((s) => s.id === id);
  if (!session?.rescheduleRequest) return false;

  const req = session.rescheduleRequest;
  session.date = req.proposedDate;
  session.startTime = req.proposedStartTime;
  session.endTime = req.proposedEndTime;
  session.durationMinutes = req.proposedDurationMinutes;
  session.status = "upcoming";
  session.rescheduleRequest = undefined;
  return true;
}

export function declineRescheduleRequest(id: string): boolean {
  const session = _sessions.find((s) => s.id === id);
  if (!session?.rescheduleRequest) return false;

  session.status = "upcoming";
  session.rescheduleRequest = undefined;
  return true;
}

// ─── Notification queries ─────────────────────────────────────────────────────

export function getMentorNotifications(): MentorNotification[] {
  return [..._notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function markNotificationRead(id: string): void {
  const n = _notifications.find((n) => n.id === id);
  if (n) n.isRead = true;
}

export function getUnreadCount(): number {
  return _notifications.filter((n) => !n.isRead).length;
}
