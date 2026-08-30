import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Google Calendar integration for the consultation booking form.
//
// Requires these env vars to be set on whichever host runs this
// (see DEPLOYMENT.md for the one-time Google Cloud OAuth setup):
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_REFRESH_TOKEN   (obtained once via a manual OAuth consent flow)
//   GOOGLE_CALENDAR_ID     (defaults to "primary" — the authorizing account's calendar)
//
// How it works:
// - getAvailability(date) checks the admin's real Google Calendar busy blocks
//   for that day (via the Freebusy API) and returns which of the fixed
//   business-hour slots are still open.
// - createCalendarEvent(...) creates an actual event on the admin's Google
//   Calendar with the customer as an attendee. Google's own Calendar apps
//   then handle notifying the admin on every device they're signed into —
//   no separate push-notification service needed.

const TIMEZONE = "Africa/Lagos"; // UTC+1, no DST
const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 17;
const SLOT_MINUTES = 60; // conflict-check + event duration per booking
export const TIME_SLOTS = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];

function env(name: string): string | undefined {
  const cfEnv = typeof globalThis !== "undefined" ? (globalThis as any)._cf_env : undefined;
  return cfEnv?.[name] ?? (typeof process !== "undefined" ? process.env[name] : undefined);
}

function requireGoogleEnv() {
  const clientId = env("GOOGLE_CLIENT_ID");
  const clientSecret = env("GOOGLE_CLIENT_SECRET");
  const refreshToken = env("GOOGLE_REFRESH_TOKEN");
  const calendarId = env("GOOGLE_CALENDAR_ID") || "primary";
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google Calendar is not configured (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN). See DEPLOYMENT.md.",
    );
  }
  return { clientId, clientSecret, refreshToken, calendarId };
}

async function getAccessToken(): Promise<{ accessToken: string; calendarId: string }> {
  const { clientId, clientSecret, refreshToken, calendarId } = requireGoogleEnv();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(`Google token refresh failed: ${json.error_description || json.error || res.statusText}`);
  }
  return { accessToken: json.access_token, calendarId };
}

// Business-hours wall-clock time in Africa/Lagos (UTC+1, fixed offset) as an ISO instant.
function slotToIso(date: string, time: string): string {
  return `${date}T${time}:00+01:00`;
}

function isWeekend(date: string): boolean {
  const day = new Date(`${date}T12:00:00+01:00`).getUTCDay(); // 0 Sun, 6 Sat
  return day === 0 || day === 6;
}

const availabilityInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
});

export const getAvailability = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => availabilityInput.parse(d))
  .handler(async ({ data }) => {
    const { date } = data;
    const todayStr = new Date().toISOString().slice(0, 10);
    if (date < todayStr || isWeekend(date)) {
      return { slots: [] as string[], reason: isWeekend(date) ? "weekend" : "past" };
    }

    let accessToken: string;
    let calendarId: string;
    try {
      ({ accessToken, calendarId } = await getAccessToken());
    } catch (err) {
      // Google not configured yet — fail open with the full static list so
      // the form still works (just without real-availability checking) until
      // the calendar env vars are set.
      console.error("[calendar] getAvailability:", (err as Error).message);
      return { slots: TIME_SLOTS, reason: "calendar_not_configured" as const };
    }

    const timeMin = slotToIso(date, `${String(BUSINESS_START_HOUR).padStart(2, "0")}:00`);
    const timeMax = slotToIso(date, `${String(BUSINESS_END_HOUR).padStart(2, "0")}:00`);

    const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ timeMin, timeMax, timeZone: TIMEZONE, items: [{ id: calendarId }] }),
    });
    const json = (await res.json()) as {
      calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
      error?: { message?: string };
    };
    if (!res.ok) {
      console.error("[calendar] freeBusy error:", json.error?.message);
      return { slots: TIME_SLOTS, reason: "calendar_error" as const };
    }

    const busy = json.calendars?.[calendarId]?.busy ?? [];
    const free = TIME_SLOTS.filter((time) => {
      const slotStart = new Date(slotToIso(date, time)).getTime();
      const slotEnd = slotStart + SLOT_MINUTES * 60_000;
      return !busy.some((b) => {
        const busyStart = new Date(b.start).getTime();
        const busyEnd = new Date(b.end).getTime();
        return slotStart < busyEnd && slotEnd > busyStart; // overlap
      });
    });

    return { slots: free, reason: "ok" as const };
  });

const createEventInput = z.object({
  bookingId: z.string().uuid(),
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  serviceTitle: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  projectDetails: z.string().optional().nullable(),
});

export const createCalendarEvent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => createEventInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let accessToken: string;
    let calendarId: string;
    try {
      ({ accessToken, calendarId } = await getAccessToken());
    } catch (err) {
      const message = (err as Error).message;
      console.error("[calendar] createCalendarEvent:", message);
      try {
        await supabaseAdmin
          .from("bookings")
          .update({ calendar_sync_status: "not_configured", calendar_sync_error: message })
          .eq("id", data.bookingId);
      } catch {}
      return { ok: false as const, reason: "not_configured" as const };
    }

    const startIso = slotToIso(data.date, data.time);
    const endIso = new Date(new Date(startIso).getTime() + SLOT_MINUTES * 60_000).toISOString();

    const descriptionLines = [
      data.company ? `Company: ${data.company}` : null,
      data.phone ? `Phone: ${data.phone}` : null,
      data.serviceTitle ? `Service: ${data.serviceTitle}` : null,
      data.projectDetails ? `\n${data.projectDetails}` : null,
    ].filter(Boolean);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: `Consultation — ${data.fullName}`,
          description: descriptionLines.join("\n"),
          start: { dateTime: startIso, timeZone: TIMEZONE },
          end: { dateTime: endIso, timeZone: TIMEZONE },
          attendees: [{ email: data.email, displayName: data.fullName }],
          reminders: { useDefault: true },
        }),
      },
    );
    const json = (await res.json()) as { id?: string; error?: { message?: string } };

    if (!res.ok || !json.id) {
      const message = json.error?.message || res.statusText;
      console.error("[calendar] event creation failed:", message);
      try {
        await supabaseAdmin
          .from("bookings")
          .update({ calendar_sync_status: "error", calendar_sync_error: message })
          .eq("id", data.bookingId);
      } catch {}
      return { ok: false as const, reason: "api_error" as const, message };
    }

    try {
      await supabaseAdmin
        .from("bookings")
        .update({ google_event_id: json.id, calendar_sync_status: "synced", calendar_sync_error: null })
        .eq("id", data.bookingId);
    } catch (err) {
      // Event is created either way; just couldn't record it back on the row
      // (e.g. SUPABASE_SERVICE_ROLE_KEY not set on this host).
      console.error("[calendar] failed to record google_event_id on booking:", (err as Error).message);
    }

    return { ok: true as const, eventId: json.id };
  });
