export type MentorSessionStatus =
  | "upcoming"
  | "completed"
  | "cancelled"
  | "reschedule-pending";

export interface AttendanceRecord {
  startedAt: string;  // "HH:MM" 24-hour actual start
  endedAt: string;    // "HH:MM" 24-hour actual end
  recordedAt: string; // ISO timestamp
}

export interface SessionFeedback {
  rating: number;       // 1–5
  notes: string;        // general feedback
  improvements: string; // improvement suggestions (may be empty)
  submittedAt: string;  // ISO timestamp
}

export interface MentorRescheduleRequest {
  proposedDate: string;          // "YYYY-MM-DD"
  proposedStartTime: string;     // "HH:MM" 24-hour
  proposedEndTime: string;       // "HH:MM" 24-hour
  proposedDurationMinutes: number;
  reason: string;
  requestedAt: string;           // ISO timestamp
}

export interface MentorSession {
  id: string;
  learnerId: string;
  learnerName: string;
  learnerRole: string;           // e.g. "Software Engineer Intern"
  date: string;                  // "YYYY-MM-DD"
  startTime: string;             // "HH:MM" 24-hour
  endTime: string;               // "HH:MM" 24-hour
  durationMinutes: number;
  status: MentorSessionStatus;
  bookedAt: string;              // ISO timestamp
  rescheduleRequest?: MentorRescheduleRequest;
  attendance?: AttendanceRecord;
  feedback?: SessionFeedback;
}

export type NotificationType =
  | "booking"
  | "cancellation"
  | "reschedule"
  | "rating"
  | "message";

export interface MentorNotification {
  id: string;
  type: NotificationType;
  message: string;
  learnerName?: string;
  sessionId?: string;
  isRead: boolean;
  createdAt: string;             // ISO timestamp
}
