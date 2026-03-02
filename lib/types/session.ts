export type SessionStatus =
  | "upcoming"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "reschedule-pending";

export interface RescheduleRequest {
  proposedDate: string;          // "YYYY-MM-DD"
  proposedStartTime: string;     // "HH:MM" 24-hour
  proposedEndTime: string;       // "HH:MM" 24-hour
  proposedDurationMinutes: number;
  reason: string;
  requestedAt: string;           // ISO timestamp
}

export interface BookedSession {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorTitle: string;
  isVerified: boolean;
  date: string;                  // "YYYY-MM-DD"
  startTime: string;             // "HH:MM" 24-hour
  endTime: string;               // "HH:MM" 24-hour
  durationMinutes: number;
  status: SessionStatus;
  bookedAt: string;              // ISO timestamp
  meetLink?: string | null;
  rescheduleRequest?: RescheduleRequest;
}
