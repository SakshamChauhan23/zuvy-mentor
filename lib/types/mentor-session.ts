export type MentorSessionStatus =
  | "upcoming"
  | "completed"
  | "cancelled"
  | "reschedule-pending";

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
