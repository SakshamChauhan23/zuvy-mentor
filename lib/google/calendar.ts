import crypto from "crypto";

/**
 * Google Calendar integration via direct HTTP — no googleapis package.
 * Uses Node.js built-in crypto to sign JWT assertions (zero extra deps).
 */

// ─── Auth ──────────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const email  = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY is not set");
  }

  // Vercel stores the key with literal \n — convert to real newlines
  const privateKey = rawKey.replace(/\\n/g, "\n");

  // Build JWT assertion (RFC 7523)
  const now     = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss:   email,
    scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
    aud:   "https://oauth2.googleapis.com/token",
    iat:   now,
    exp:   now + 3600,
  })).toString("base64url");

  const unsigned  = `${header}.${payload}`;
  const signer    = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(privateKey, "base64url");
  const jwt       = `${unsigned}.${signature}`;

  // Exchange JWT for short-lived access token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion:  jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get Google access token: ${text}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface CalendarEventResult {
  eventId:  string;
  meetLink: string | null;
  htmlLink: string | null;
}

export interface CreateEventParams {
  summary:        string;
  description:    string;
  startIso:       string;   // ISO 8601
  endIso:         string;   // ISO 8601
  attendeeEmails: string[];
  timeZone?:      string;
}

// ─── Create event ──────────────────────────────────────────────────────────

/**
 * Creates a Google Calendar event and sends email invites to all attendees.
 */
export async function createCalendarEvent(
  params: CreateEventParams
): Promise<CalendarEventResult> {
  const token = await getAccessToken();
  const tz    = params.timeZone ?? "UTC";

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
    {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary:     params.summary,
        description: params.description,
        start:       { dateTime: params.startIso, timeZone: tz },
        end:         { dateTime: params.endIso,   timeZone: tz },
        attendees:   params.attendeeEmails.map((email) => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 60 },
            { method: "popup", minutes: 10 },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar event creation failed: ${text}`);
  }

  const event = await res.json() as { id: string; htmlLink?: string };
  return {
    eventId:  event.id,
    meetLink: null,   // Meet links require Google Workspace — not available with service account
    htmlLink: event.htmlLink ?? null,
  };
}

// ─── Update event ──────────────────────────────────────────────────────────

/**
 * Updates start/end time of an existing calendar event (reschedule).
 */
export async function updateCalendarEvent(
  eventId:   string,
  startIso:  string,
  endIso:    string,
  timeZone?: string
): Promise<void> {
  const token = await getAccessToken();
  const tz    = timeZone ?? "UTC";

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    {
      method:  "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        start: { dateTime: startIso, timeZone: tz },
        end:   { dateTime: endIso,   timeZone: tz },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar event update failed: ${text}`);
  }
}

// ─── Cancel event ──────────────────────────────────────────────────────────

/**
 * Cancels (soft-deletes) a Google Calendar event and notifies attendees.
 */
export async function cancelCalendarEvent(eventId: string): Promise<void> {
  const token = await getAccessToken();

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    {
      method:  "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar event cancellation failed: ${text}`);
  }
}
