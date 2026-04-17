"use client";
import { useEffect, useState } from "react";
import { User, SlidersHorizontal, ShieldCheck, Calendar, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { updateUserProfile, getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import { AUTH_QUERY_KEY } from "@/hooks/auth/useLogin";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const preferences = useAppStore((s) => s.preferences);
  const updatePreferences = useAppStore((s) => s.updatePreferences);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [popupMinutes, setPopupMinutes] = useState<number | null>(60);
  const [emailMinutes, setEmailMinutes] = useState<number | null>(24 * 60);
  const [calendarReady, setCalendarReady] = useState(false);
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [calendarSyncing, setCalendarSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      setName((user.user_metadata?.full_name as string) ?? "");
      setEmail(user.email ?? "");
    } else {
      setName("");
      setEmail("");
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    fetch("/api/google/settings")
      .then((res) => res.json())
      .then((data) => {
        setPopupMinutes(typeof data?.popupMinutes === "number" ? data.popupMinutes : null);
        setEmailMinutes(typeof data?.emailMinutes === "number" ? data.emailMinutes : null);
        setCalendarReady(true);
      })
      .catch(() => {
        setCalendarReady(true);
      });
  }, [isAuthenticated, isLoading]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Update the profile
      await updateUserProfile({
        fullName: name.trim() || undefined,
        email: email.trim() || undefined,
      });

      // Refresh the user data in the query cache
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      
      // Also fetch the latest user data to ensure cache is fresh
      await getCurrentUser();

      // Reload invites to refresh any user references
      const loadInvites = useAppStore.getState().loadInvites;
      await loadInvites(user.email ?? "");

      // Reload current project data to update member info everywhere
      const activeProjectId = useAppStore.getState().activeProjectId;
      if (activeProjectId) {
        const loadProjectData = useAppStore.getState().loadProjectData;
        await loadProjectData(activeProjectId, user.id);
      }

      // Reload projects to ensure all member references are updated
      const loadProjects = useAppStore.getState().loadProjects;
      await loadProjects(user.id);

      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
      toast.success("Profile updated successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed";
      toast.error(message);
      console.error("Profile update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const reminderOptions: Array<{ label: string; value: number | null }> = [
    { label: "Off", value: null },
    { label: "At time of event", value: 0 },
    { label: "10 minutes before", value: 10 },
    { label: "30 minutes before", value: 30 },
    { label: "1 hour before", value: 60 },
    { label: "1 day before", value: 24 * 60 },
  ];

  const handleSaveCalendarSettings = async () => {
    if (!isAuthenticated) return;
    setCalendarSaving(true);
    try {
      const response = await fetch("/api/google/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ popupMinutes, emailMinutes }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save calendar settings");
      }
      toast.success("Calendar reminders updated");
      await fetch("/api/google/calendar/sync", { method: "POST" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save calendar settings";
      toast.error(message);
    } finally {
      setCalendarSaving(false);
    }
  };

  const handleManualSync = async () => {
    if (!isAuthenticated) return;
    setCalendarSyncing(true);
    try {
      const response = await fetch("/api/google/calendar/sync", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Calendar sync failed");
      }
      toast.success("Calendar synced successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Calendar sync failed";
      toast.error(message);
    } finally {
      setCalendarSyncing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/70 backdrop-blur-xl p-6 shadow-card">
          <div className="absolute -right-14 -top-16 h-32 w-32 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="relative flex flex-col gap-3">
            <h1 className="font-display font-bold text-2xl text-slate-800">Settings</h1>
            <p className="text-sm text-slate-500">
              Personalize your workspace, manage integrations, and keep your account in sync.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Account</h2>
          <span className="text-xs text-slate-400">Profile & session</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white/80 backdrop-blur-xl border border-white/70 shadow-card rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/70 border border-white/70 flex items-center justify-center">
                <User className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-slate-800">Profile</h2>
                <p className="text-xs text-slate-400">Manage your personal details.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 mt-1 px-3 rounded-lg bg-white/70 border border-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                  disabled={!isAuthenticated || isLoading || isSaving}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 mt-1 px-3 rounded-lg bg-white/70 border border-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                  disabled={!isAuthenticated || isLoading || isSaving}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="h-8 px-3 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isAuthenticated || isLoading || isSaving}
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
                {saved && <span className="text-xs text-emerald-500">Saved</span>}
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/70 shadow-card rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/70 border border-white/70 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-slate-800">Preferences</h2>
                <p className="text-xs text-slate-400">Tune your workspace experience.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-white/70 bg-white/70 px-3 py-2.5">
                <label className="text-xs text-slate-500">Theme</label>
                <select
                  value={preferences.theme}
                  onChange={(e) =>
                    updatePreferences({
                      theme: e.target.value as typeof preferences.theme,
                    })
                  }
                  className="w-full h-9 mt-1 px-3 rounded-lg bg-white/70 border border-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                >
                  <option value="mist">Mist (light, airy)</option>
                  <option value="linen">Linen (warm light)</option>
                  <option value="dark">Midnight (dark)</option>
                </select>
              </div>
              {[
                {
                  id: "compactMode" as const,
                  label: "Compact board spacing",
                  description: "Reduce padding and gaps in the Project board.",
                },
                {
                  id: "showCompleted" as const,
                  label: "Show completed tasks",
                  description: "Include tasks in the Done column and agenda.",
                },
                {
                  id: "weekStartsOnMonday" as const,
                  label: "Week starts on Monday",
                  description: "Use Monday as the first day in Agenda.",
                },
                {
                  id: "enableAnimations" as const,
                  label: "Enable animations",
                  description: "Turn on subtle UI motion.",
                },
              ].map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-white/70 bg-white/70 px-3 py-2.5 cursor-pointer hover:bg-white/80 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={(preferences[item.id] as boolean) ?? false}
                    onChange={(e) => {
                      updatePreferences({ [item.id]: e.target.checked });
                    }}
                    className="mt-1 cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Integrations</h2>
          <span className="text-xs text-slate-400">Calendar sync</span>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/70 shadow-card rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-white/70 border border-white/70 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-brand-500" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-slate-800">Google Calendar</h2>
              <p className="text-xs text-slate-400">Manage reminders and manual sync.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/70 bg-white/70 px-3 py-2.5">
              <label className="text-xs text-slate-500">Popup reminder</label>
              <select
                value={popupMinutes === null ? "off" : String(popupMinutes)}
                onChange={(e) => {
                  const value = e.target.value === "off" ? null : Number(e.target.value);
                  setPopupMinutes(Number.isNaN(value as number) ? null : (value as number | null));
                }}
                className="w-full h-9 mt-1 px-3 rounded-lg bg-white/70 border border-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                disabled={!calendarReady || !isAuthenticated}
              >
                {reminderOptions.map((option) => (
                  <option
                    key={option.label}
                    value={option.value === null ? "off" : String(option.value)}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-white/70 bg-white/70 px-3 py-2.5">
              <label className="text-xs text-slate-500">Email reminder</label>
              <select
                value={emailMinutes === null ? "off" : String(emailMinutes)}
                onChange={(e) => {
                  const value = e.target.value === "off" ? null : Number(e.target.value);
                  setEmailMinutes(Number.isNaN(value as number) ? null : (value as number | null));
                }}
                className="w-full h-9 mt-1 px-3 rounded-lg bg-white/70 border border-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                disabled={!calendarReady || !isAuthenticated}
              >
                {reminderOptions.map((option) => (
                  <option
                    key={option.label}
                    value={option.value === null ? "off" : String(option.value)}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
            <button
              onClick={handleSaveCalendarSettings}
              className="h-8 px-3 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isAuthenticated || !calendarReady || calendarSaving}
            >
              {calendarSaving ? "Saving..." : "Save reminder settings"}
            </button>
            <button
              onClick={handleManualSync}
              className="h-8 px-3 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              disabled={!isAuthenticated || calendarSyncing}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {calendarSyncing ? "Syncing..." : "Sync Google Calendar"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Security</h2>
          <span className="text-xs text-slate-400">Session control</span>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/70 shadow-card rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-white/70 border border-white/70 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-slate-800">Session</h2>
              <p className="text-xs text-slate-400">Manage your current session.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-slate-700">Signed in as</p>
              <p className="text-xs text-slate-400">{user?.email ?? "Not signed in"}</p>
            </div>
            <button
              onClick={signOut}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-medium border transition-colors",
                isAuthenticated
                  ? "border-red-200 text-red-600 hover:bg-red-50"
                  : "border-slate-200 text-slate-400 cursor-not-allowed"
              )}
              disabled={!isAuthenticated}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
