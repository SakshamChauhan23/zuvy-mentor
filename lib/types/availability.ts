export type SlotStatus = "open" | "booked";

export interface MentorAvailabilitySlot {
  id: string;
  date: string;          // "YYYY-MM-DD"
  startTime: string;     // "HH:MM" 24-hour
  endTime: string;       // "HH:MM" 24-hour
  durationMinutes: number;
  status: SlotStatus;
  createdAt: string;     // ISO timestamp
}
