import { google } from "googleapis";

// ─── Auth ──────────────────────────────────────────────────────────────────

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY is not set");
  }

  // Vercel stores the key with literal \n — convert to real newlines
  const privateKey = rawKey.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
  });
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface CalendarEventResult {
  eventId: string;
  meetLink: string | null;
  htmlLink: string | null;
}

export interface CreateEventParams {
  summary: string;       // event title
  description: string;
  startIso: string;      // ISO 8601
  endIso: string;        // ISO 8601
  attendeeEmails: string[];
  timeZone?: string;
}

// ─── Create event ──────────────────────────────────────────────────────────

/**
 * Creates a Google Calendar event with a Google Meet link.
 * Invitations are sent automatically to all attendees.
 */
export async function createCalendarEvent(
  params: CreateEventParams
): Promise<CalendarEventResult> {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });
  const tz = params.timeZone ?? "UTC";

  const response = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: {
      summary: params.summary,
      description: params.description,
      start: { dateTime: params.startIso, timeZone: tz },
      end:   { dateTime: params.endIso,   timeZone: tz },
      attendees: params.attendeeEmails.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `zuvy-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 10 },
        ],
      },
    },
  });

  const event = response.data;
  const meetLink =
    event.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video"
    )?.uri ?? null;

  return {
    eventId: event.id!,
    meetLink,
    htmlLink: event.htmlLink ?? null,
  };
}

// ─── Update event ──────────────────────────────────────────────────────────

/**
 * Updates start/end time of an existing calendar event (reschedule).
 */
export async function updateCalendarEvent(
  eventId: string,
  startIso: string,
  endIso: string,
  timeZone?: string
): Promise<void> {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });
  const tz = timeZone ?? "UTC";

  await calendar.events.patch({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
    requestBody: {
      start: { dateTime: startIso, timeZone: tz },
      end:   { dateTime: endIso,   timeZone: tz },
    },
  });
}

// ─── Cancel event ──────────────────────────────────────────────────────────

/**
 * Cancels (deletes) a Google Calendar event and notifies attendees.
 */
export async function cancelCalendarEvent(eventId: string): Promise<void> {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });

  // Set status to "cancelled" rather than hard-delete so attendees are notified
  await calendar.events.patch({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
    requestBody: { status: "cancelled" },
  });
}
