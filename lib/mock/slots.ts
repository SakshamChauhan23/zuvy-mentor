import { TimeSlot, SlotsByDate } from "@/lib/types/slot";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// ─── Slot generation ──────────────────────────────────────────────────────────

// Generates a deterministic set of slots for a given mentorId across
// the next 10 days. Each mentor gets a slightly different pattern
// driven by their id hash — this ensures cards look different per mentor.
export function generateSlotsForMentor(mentorId: string): TimeSlot[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Each mentor's slot pattern varies by their id
  const idNum = parseInt(mentorId, 10) || 1;
  const slots: TimeSlot[] = [];

  // Template slot times (24-hr): morning, midday, afternoon, evening
  const slotTimes = ["09:00", "11:00", "14:00", "16:00", "18:00"];

  let slotIndex = 0;

  for (let dayOffset = 1; dayOffset <= 12; dayOffset++) {
    const date = addDays(today, dayOffset);
    const dateStr = toDateStr(date);

    // Skip some days to create realistic gaps
    if ((dayOffset + idNum) % 4 === 0) continue;

    // Pick 1–3 slots per day, offset by mentor id
    const startIdx = (idNum + dayOffset) % slotTimes.length;
    const count = ((idNum + dayOffset) % 3) + 1;

    for (let i = 0; i < count; i++) {
      const timeIdx = (startIdx + i) % slotTimes.length;
      const startTime = slotTimes[timeIdx];
      const durationMinutes = 60;
      const endTime = addMinutes(startTime, durationMinutes);

      // Mark ~30% of slots as booked
      const isBooked = (slotIndex + idNum) % 3 === 0;

      slots.push({
        id: `slot-${mentorId}-${dateStr}-${startTime.replace(":", "")}`,
        mentorId,
        date: dateStr,
        startTime,
        endTime,
        durationMinutes,
        isBooked,
      });

      slotIndex++;
    }
  }

  return slots;
}

// ─── Date label helper ────────────────────────────────────────────────────────

function getDateLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slotDate = new Date(dateStr + "T00:00:00");

  const diffDays = Math.round(
    (slotDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";

  return slotDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── Group slots by date ──────────────────────────────────────────────────────

export function groupSlotsByDate(slots: TimeSlot[]): SlotsByDate[] {
  const map = new Map<string, TimeSlot[]>();

  for (const slot of slots) {
    const existing = map.get(slot.date) ?? [];
    existing.push(slot);
    map.set(slot.date, existing);
  }

  // Sort dates ascending, sort slots within each date ascending
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dateSlots]) => ({
      date,
      label: getDateLabel(date),
      slots: dateSlots.sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
}

// ─── Time formatters ──────────────────────────────────────────────────────────

export function formatTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  const min = String(m).padStart(2, "0");
  return `${hour}:${min} ${period}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
