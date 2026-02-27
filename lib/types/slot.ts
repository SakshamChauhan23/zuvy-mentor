export interface TimeSlot {
  id: string;
  mentorId: string;
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:MM" 24-hour
  endTime: string;    // "HH:MM" 24-hour
  durationMinutes: number;
  isBooked: boolean;
}

// Grouped structure used by the SlotPicker UI
export interface SlotsByDate {
  date: string;         // "YYYY-MM-DD"
  label: string;        // "Today", "Tomorrow", "Mon, Mar 3"
  slots: TimeSlot[];
}
