import type { MentorAvailabilitySlot, SlotStatus } from "@/lib/types/availability";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysFromToday(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const total = timeToMinutes(time) + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

let _idCounter = 100;
function nextId(): string {
  return `avail-${++_idCounter}`;
}

// ─── Seed slots ───────────────────────────────────────────────────────────────
// Pre-seeded so the mentor's slot list isn't empty on first load.

const SEED_SLOTS: MentorAvailabilitySlot[] = [
  // Day +1
  {
    id: "avail-1",
    date: daysFromToday(1),
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "avail-2",
    date: daysFromToday(1),
    startTime: "14:00",
    endTime: "15:00",
    durationMinutes: 60,
    status: "booked",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  // Day +2
  {
    id: "avail-3",
    date: daysFromToday(2),
    startTime: "11:00",
    endTime: "12:00",
    durationMinutes: 60,
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  // Day +3
  {
    id: "avail-4",
    date: daysFromToday(3),
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "avail-5",
    date: daysFromToday(3),
    startTime: "16:00",
    endTime: "17:00",
    durationMinutes: 60,
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  // Day +5
  {
    id: "avail-6",
    date: daysFromToday(5),
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    status: "booked",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: "avail-7",
    date: daysFromToday(5),
    startTime: "14:00",
    endTime: "15:00",
    durationMinutes: 60,
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  // Day +7
  {
    id: "avail-8",
    date: daysFromToday(7),
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
];

// ─── In-memory store ──────────────────────────────────────────────────────────

let _slots: MentorAvailabilitySlot[] = [...SEED_SLOTS];

// ─── Queries ──────────────────────────────────────────────────────────────────

export function getAvailabilitySlots(): MentorAvailabilitySlot[] {
  return [..._slots].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
  );
}

export function getSlotsByDate(): Record<string, MentorAvailabilitySlot[]> {
  const grouped: Record<string, MentorAvailabilitySlot[]> = {};
  for (const slot of getAvailabilitySlots()) {
    if (!grouped[slot.date]) grouped[slot.date] = [];
    grouped[slot.date].push(slot);
  }
  return grouped;
}

// ─── Conflict detection ───────────────────────────────────────────────────────

export function checkConflict(
  date: string,
  startTime: string,
  durationMinutes: number
): MentorAvailabilitySlot | undefined {
  const newStart = timeToMinutes(startTime);
  const newEnd = newStart + durationMinutes;

  return _slots.find((s) => {
    if (s.date !== date) return false;
    const exStart = timeToMinutes(s.startTime);
    const exEnd = timeToMinutes(s.endTime);
    return exStart < newEnd && exEnd > newStart;
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export type AddSlotResult =
  | { success: true; slot: MentorAvailabilitySlot }
  | { success: false; conflict: MentorAvailabilitySlot };

export function addAvailabilitySlot(
  date: string,
  startTime: string,
  durationMinutes: number
): AddSlotResult {
  const conflict = checkConflict(date, startTime, durationMinutes);
  if (conflict) return { success: false, conflict };

  const endTime = addMinutesToTime(startTime, durationMinutes);
  const slot: MentorAvailabilitySlot = {
    id: nextId(),
    date,
    startTime,
    endTime,
    durationMinutes,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  _slots = [slot, ..._slots];
  return { success: true, slot };
}

// Only open slots can be deleted (booked slots are protected)
export function deleteAvailabilitySlot(id: string): boolean {
  const slot = _slots.find((s) => s.id === id);
  if (!slot || slot.status === "booked") return false;
  _slots = _slots.filter((s) => s.id !== id);
  return true;
}
