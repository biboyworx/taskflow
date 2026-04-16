type GoogleCalendarProfile = {
  id: string;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expires_at: string | null;
  google_calendar_id: string | null;
  google_calendar_timezone: string | null;
  google_reminder_popup_minutes?: number | null;
  google_reminder_email_minutes?: number | null;
};

type CalendarTask = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  archived: boolean;
  projectName: string | null;
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const CALENDAR_NAME = "Tasqon";
const TASK_ID_PROP = "tasqonTaskId";

function isTokenExpiringSoon(expiresAt: string | null) {
  if (!expiresAt) return true;
  const expiry = new Date(expiresAt).getTime();
  return expiry - Date.now() <= 5 * 60 * 1000;
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDateString(input: string | null) {
  if (!input) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing Google client credentials");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh Google token: ${errorText}`);
  }

  return response.json() as Promise<{ access_token: string; expires_in: number }>;
}

async function fetchJson<T>(url: string, accessToken: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google API error: ${response.status} ${text}`);
  }

  return response.json() as Promise<T>;
}

export async function getValidGoogleAccessToken(
  profile: GoogleCalendarProfile,
  updateProfile: (updates: Partial<GoogleCalendarProfile>) => Promise<void>,
) {
  if (!profile.google_refresh_token && !profile.google_access_token) {
    throw new Error("Missing Google tokens");
  }

  if (profile.google_access_token && !isTokenExpiringSoon(profile.google_token_expires_at)) {
    return profile.google_access_token;
  }

  if (!profile.google_refresh_token) {
    throw new Error("Missing Google refresh token");
  }

  const refreshed = await refreshAccessToken(profile.google_refresh_token);
  const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await updateProfile({
    google_access_token: refreshed.access_token,
    google_token_expires_at: expiresAt,
  });
  return refreshed.access_token;
}

export async function ensureTaskflowCalendar(
  profile: GoogleCalendarProfile,
  accessToken: string,
  updateProfile: (updates: Partial<GoogleCalendarProfile>) => Promise<void>,
) {
  const calendarList = await fetchJson<{ items: Array<{ id: string; summary?: string; timeZone?: string }> }>(
    `${GOOGLE_CALENDAR_API}/users/me/calendarList`,
    accessToken,
  );

  if (profile.google_calendar_id) {
    const existingById = calendarList.items.find(
      (item) => item.id === profile.google_calendar_id,
    );
    if (existingById) {
      return {
        calendarId: existingById.id,
        timezone: existingById.timeZone ?? profile.google_calendar_timezone,
      };
    }

    await updateProfile({
      google_calendar_id: null,
      google_calendar_timezone: null,
    });
  }

  const existing = calendarList.items.find((item) =>
    item.summary === CALENDAR_NAME || item.summary === "Taskflow"
  );
  if (existing?.id) {
    if (existing.summary !== CALENDAR_NAME) {
      try {
        await fetchJson<{ id: string }>(
          `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(existing.id)}`,
          accessToken,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summary: CALENDAR_NAME }),
          },
        );
      } catch {}
    }
    await updateProfile({
      google_calendar_id: existing.id,
      google_calendar_timezone: existing.timeZone ?? "UTC",
    });
    return {
      calendarId: existing.id,
      timezone: existing.timeZone ?? "UTC",
    };
  }

  const timezoneSetting = await fetchJson<{ value: string }>(
    `${GOOGLE_CALENDAR_API}/users/me/settings/timezone`,
    accessToken,
  );
  const timezone = timezoneSetting?.value || "UTC";

  const calendar = await fetchJson<{ id: string; timeZone?: string }>(
    `${GOOGLE_CALENDAR_API}/calendars`,
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: CALENDAR_NAME, timeZone: timezone }),
    },
  );

  await updateProfile({
    google_calendar_id: calendar.id,
    google_calendar_timezone: calendar.timeZone || timezone,
  });

  return {
    calendarId: calendar.id,
    timezone: calendar.timeZone || timezone,
  };
}

function buildEventPayload(
  task: CalendarTask,
  timezone: string,
  reminders: { popupMinutes: number | null; emailMinutes: number | null },
) {
  const dueDate = normalizeDateString(task.dueDate) || getTodayDateString();
  const endDate = addDays(dueDate, 1);
  const descriptionParts = [
    task.projectName ? `Project: ${task.projectName}` : null,
    task.description ? `\n${task.description}` : null,
  ].filter(Boolean);

  const overrides = [] as Array<{ method: "popup" | "email"; minutes: number }>;
  if (typeof reminders.popupMinutes === "number") {
    overrides.push({ method: "popup", minutes: reminders.popupMinutes });
  }
  if (typeof reminders.emailMinutes === "number") {
    overrides.push({ method: "email", minutes: reminders.emailMinutes });
  }

  return {
    summary: task.title,
    description: descriptionParts.join("\n"),
    start: { date: dueDate, timeZone: timezone },
    end: { date: endDate, timeZone: timezone },
    extendedProperties: {
      private: {
        [TASK_ID_PROP]: task.id,
      },
    },
    reminders: {
      useDefault: false,
      overrides,
    },
  };
}

export async function findExistingTaskEvents(params: {
  accessToken: string;
  calendarId: string;
  taskId: string;
}) {
  const { accessToken, calendarId, taskId } = params;
  const query = new URLSearchParams({
    maxResults: "50",
    singleEvents: "true",
    showDeleted: "false",
    privateExtendedProperty: `${TASK_ID_PROP}=${taskId}`,
  });

  const result = await fetchJson<{ items?: Array<{ id: string }> }>(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${query.toString()}`,
    accessToken,
  );

  return result.items || [];
}

export async function upsertCalendarEvent(params: {
  accessToken: string;
  calendarId: string;
  timezone: string;
  task: CalendarTask;
  existingEventId?: string | null;
  reminders: { popupMinutes: number | null; emailMinutes: number | null };
}) {
  const { accessToken, calendarId, timezone, task, existingEventId, reminders } = params;
  const payload = buildEventPayload(task, timezone, reminders);

  if (existingEventId) {
    try {
      const updated = await fetchJson<{ id: string }>(
        `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(existingEventId)}`,
        accessToken,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      return updated.id;
    } catch {
      // Fall back to create if update fails (e.g., event deleted)
    }
  }

  const created = await fetchJson<{ id: string }>(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  return created.id;
}

export async function deleteCalendarEvent(params: {
  accessToken: string;
  calendarId: string;
  eventId: string;
}) {
  const { accessToken, calendarId, eventId } = params;
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`Failed to delete calendar event: ${response.status} ${text}`);
  }
}

export type { GoogleCalendarProfile, CalendarTask };
