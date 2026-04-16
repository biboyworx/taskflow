import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  deleteCalendarEvent,
  ensureTaskflowCalendar,
  findExistingTaskEvents,
  getValidGoogleAccessToken,
  upsertCalendarEvent,
  type CalendarTask,
  type GoogleCalendarProfile,
} from "@/lib/google-calendar";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const projectId = body?.projectId ?? null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, google_access_token, google_refresh_token, google_token_expires_at, google_calendar_id, google_calendar_timezone, google_reminder_popup_minutes, google_reminder_email_minutes"
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (!profile.google_refresh_token && !profile.google_access_token) {
    return NextResponse.json(
      { error: "Google account not connected" },
      { status: 400 }
    );
  }

  const updateProfile = async (updates: Partial<GoogleCalendarProfile>) => {
    await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);
  };

  try {
    const accessToken = await getValidGoogleAccessToken(
      profile as GoogleCalendarProfile,
      updateProfile,
    );

    const { calendarId, timezone } = await ensureTaskflowCalendar(
      profile as GoogleCalendarProfile,
      accessToken,
      updateProfile,
    );

    const reminders = {
      popupMinutes:
        typeof profile.google_reminder_popup_minutes === "number"
          ? profile.google_reminder_popup_minutes
          : 60,
      emailMinutes:
        typeof profile.google_reminder_email_minutes === "number"
          ? profile.google_reminder_email_minutes
          : 24 * 60,
    };

    const { data: assignedRows, error: assignedError } = await supabase
      .from("task_assignees")
      .select(
        "task:tasks(id, title, description, due_date, archived, project_id, project:projects(name))"
      )
      .eq("user_id", user.id);

    if (assignedError) throw assignedError;

    const allTasks = (assignedRows || [])
      .map((row: any) => row.task)
      .filter(Boolean)
      .filter((task: any) => !projectId || task.project_id === projectId)
      .map((task: any) => ({
        id: task.id as string,
        title: task.title as string,
        description: task.description as string | null,
        dueDate: task.due_date as string | null,
        archived: Boolean(task.archived),
        projectName: task.project?.name ?? null,
      })) as CalendarTask[];

    const activeTasks = allTasks.filter((task) => !task.archived);

    const { data: existingEvents, error: eventsError } = await supabase
      .from("task_calendar_events")
      .select("task_id, calendar_event_id, calendar_id")
      .eq("user_id", user.id);

    if (eventsError) throw eventsError;

    const eventMap = new Map(
      (existingEvents || []).map((row: any) => [row.task_id, row])
    );

    for (const task of activeTasks) {
      const existing = eventMap.get(task.id);
      let existingEventId = existing?.calendar_event_id ?? null;

      if (!existingEventId) {
        const matches = await findExistingTaskEvents({
          accessToken,
          calendarId,
          taskId: task.id,
        });

        if (matches.length > 0) {
          existingEventId = matches[0].id;
          if (matches.length > 1) {
            const duplicates = matches.slice(1);
            for (const dup of duplicates) {
              try {
                await deleteCalendarEvent({
                  accessToken,
                  calendarId,
                  eventId: dup.id,
                });
              } catch {}
            }
          }
        }
      }

      const eventId = await upsertCalendarEvent({
        accessToken,
        calendarId,
        timezone: timezone || "UTC",
        task,
        existingEventId,
        reminders,
      });

      await supabase
        .from("task_calendar_events")
        .upsert(
          {
            task_id: task.id,
            user_id: user.id,
            calendar_id: calendarId,
            calendar_event_id: eventId,
          },
          { onConflict: "task_id,user_id" }
        );
    }

    const activeTaskIds = new Set(activeTasks.map((task) => task.id));
    const eventsToRemove = (existingEvents || []).filter(
      (row: any) => !activeTaskIds.has(row.task_id)
    );

    for (const event of eventsToRemove) {
      try {
        await deleteCalendarEvent({
          accessToken,
          calendarId: event.calendar_id,
          eventId: event.calendar_event_id,
        });
      } catch {}

      await supabase
        .from("task_calendar_events")
        .delete()
        .eq("task_id", event.task_id)
        .eq("user_id", user.id);
    }

    return NextResponse.json({ ok: true, synced: activeTasks.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
