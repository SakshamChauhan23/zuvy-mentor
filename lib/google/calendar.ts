import crypto from "crypto";

/**
 * Google Calendar integration via direct HTTP.
 * Production-safe lightweight reliability layer included.
 */

// ─────────────────────────────────────────────────────────────
// Retry + Timeout Wrapper
// ─────────────────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  timeoutMs = 6000
): Promise<Response> {

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Retry only on server errors or rate limits
      if (res.status >= 500 || res.status === 429) {
        if (attempt === retries) return res;
        await new Promise(r => setTimeout(r, 300 * attempt));
        continue;
      }

      return res;

    } catch (err) {
      clearTimeout(timeout);

      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 300 * attempt));
    }
  }

  throw new Error("Unreachable fetch retry state");
}

// ─────────────────────────────────────────────────────────────
// Access Token (with lightweight in-memory cache)
// ─────────────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && tokenExpiry && now < tokenExpiry - 30000) {
    return cachedToken;
  }

  const email  = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error("Google service account credentials missing");
  }

  const privateKey = rawKey.replace(/\\n/g, "\n");

  const iat = Math.floor(now / 1000);
  const exp = iat + 3600;

  const header = Buffer
    .from(JSON.stringify({ alg: "RS256", typ: "JWT" }))
    .toString("base64url");

  const payload = Buffer
    .from(JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
      aud: "https://oauth2.googleapis.com/token",
      iat,
      exp,
    }))
    .toString("base64url");

  const unsigned = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(privateKey, "base64url");
  const jwt = `${unsigned}.${signature}`;

  const res = await fetchWithRetry(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to get Google access token: ${await res.text()}`);
  }

  const data = await res.json() as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in * 1000;

  return cachedToken;
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CalendarEventResult {
  eventId: string;
  meetLink: string | null;
  htmlLink: string | null;
}

export interface CreateEventParams {
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
  attendeeEmails: string[];
  timeZone?: string;
}

// ─────────────────────────────────────────────────────────────
// Create Event
// ─────────────────────────────────────────────────────────────

export async function createCalendarEvent(
  params: CreateEventParams
): Promise<CalendarEventResult> {

  const token = await getAccessToken();
  const tz = params.timeZone ?? "UTC";

  const res = await fetchWithRetry(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: params.summary,
        description: params.description,
        start: { dateTime: params.startIso, timeZone: tz },
        end:   { dateTime: params.endIso,   timeZone: tz },
        attendees: params.attendeeEmails.map(email => ({ email })),
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
    throw new Error(`Calendar event creation failed: ${await res.text()}`);
  }

  const event = await res.json() as { id: string; htmlLink?: string };

  return {
    eventId: event.id,
    meetLink: null,
    htmlLink: event.htmlLink ?? null,
  };
}

// ─────────────────────────────────────────────────────────────
// Update Event
// ─────────────────────────────────────────────────────────────

export async function updateCalendarEvent(
  eventId: string,
  startIso: string,
  endIso: string,
  timeZone?: string
): Promise<void> {

  const token = await getAccessToken();
  const tz = timeZone ?? "UTC";

  const res = await fetchWithRetry(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start: { dateTime: startIso, timeZone: tz },
        end:   { dateTime: endIso,   timeZone: tz },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Calendar event update failed: ${await res.text()}`);
  }
}

// ─────────────────────────────────────────────────────────────
// Cancel Event
// ─────────────────────────────────────────────────────────────

export async function cancelCalendarEvent(eventId: string): Promise<void> {

  const token = await getAccessToken();

  const res = await fetchWithRetry(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "cancelled" }),
    }
  );

  if (!res.ok) {
    throw new Error(`Calendar event cancellation failed: ${await res.text()}`);
  }
}