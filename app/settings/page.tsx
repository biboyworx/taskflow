"use client";
import { useEffect, useState } from "react";
import { User, SlidersHorizontal, ShieldCheck, Calendar, RefreshCw, Palette } from "lucide-react";
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
    <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 theme-dark:from-slate-950 theme-dark:via-slate-900 theme-dark:to-slate-950">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-white via-cyan-50/30 to-white theme-dark:from-slate-800 theme-dark:via-slate-800/50 theme-dark:to-slate-800 backdrop-blur-xl p-8 shadow-lg">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-cyan-200/30 to-blue-200/20 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl text-slate-900 theme-dark:text-slate-100">
                Settings
              </h1>
              <p className="text-slate-600 theme-dark:text-slate-400 mt-1">
                Personalize your workspace and manage integrations
              </p>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 theme-dark:text-slate-400 mb-4">Account</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Card */}
            <div className="rounded-2xl border border-white/70 theme-dark:border-slate-700/70 bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <div className="px-6 py-5 border-b border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-white/50 to-transparent theme-dark:from-slate-700/50 dark:to-transparent flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 theme-dark:text-slate-100">Profile</h3>
                  <p className="text-xs text-slate-500 theme-dark:text-slate-400">Update your account details</p>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 theme-dark:text-slate-300">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 mt-2 px-4 rounded-lg bg-white/70 theme-dark:bg-slate-700/70 border border-white/70 theme-dark:border-slate-700/70 text-sm text-slate-900 theme-dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all"
                    disabled={!isAuthenticated || isLoading || isSaving}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 theme-dark:text-slate-300">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 mt-2 px-4 rounded-lg bg-white/70 theme-dark:bg-slate-700/70 border border-white/70 theme-dark:border-slate-700/70 text-sm text-slate-900 theme-dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all"
                    disabled={!isAuthenticated || isLoading || isSaving}
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isAuthenticated || isLoading || isSaving}
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                  {saved && <span className="text-xs font-medium text-emerald-500">✓ Saved</span>}
                </div>
              </div>
            </div>

            {/* Preferences Card */}
            <div className="rounded-2xl border border-white/70 theme-dark:border-slate-700/70 bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <div className="px-6 py-5 border-b border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-white/50 to-transparent theme-dark:from-slate-700/50 dark:to-transparent flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 theme-dark:text-slate-100">Preferences</h3>
                  <p className="text-xs text-slate-500 theme-dark:text-slate-400">Customize your experience</p>
                </div>
              </div>
              <div className="px-6 py-5 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 theme-dark:text-slate-300">Theme</label>
                  <select
                    value={preferences.theme}
                    onChange={(e) =>
                      updatePreferences({
                        theme: e.target.value as typeof preferences.theme,
                      })
                    }
                    className="w-full h-10 mt-2 px-4 rounded-lg bg-white/70 theme-dark:bg-slate-700/70 border border-white/70 theme-dark:border-slate-700/70 text-sm text-slate-900 theme-dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-400/30 transition-all"
                  >
                    <option value="mist">Mist (Light, airy)</option>
                    <option value="linen">Linen (Warm light)</option>
                    <option value="dark">Midnight (Dark)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  {[
                    { id: "compactMode" as const, label: "Compact board", icon: "▬" },
                    { id: "showCompleted" as const, label: "Show completed", icon: "✓" },
                    { id: "weekStartsOnMonday" as const, label: "Monday first", icon: "📅" },
                    { id: "enableAnimations" as const, label: "Animations", icon: "✨" },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-white/70 theme-dark:border-slate-700/70 hover:bg-white/50 theme-dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={(preferences[item.id] as boolean) ?? false}
                        onChange={(e) => {
                          updatePreferences({ [item.id]: e.target.checked });
                        }}
                        className="w-4 h-4 cursor-pointer rounded accent-purple-500"
                      />
                      <span className="text-sm font-medium text-slate-700 theme-dark:text-slate-200">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Integrations Section */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 theme-dark:text-slate-400 mb-4">Integrations</h2>
          <div className="rounded-2xl border border-white/70 theme-dark:border-slate-700/70 bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
            <div className="px-6 py-5 border-b border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-white/50 to-transparent theme-dark:from-slate-700/50 dark:to-transparent flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-md">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 theme-dark:text-slate-100">Google Calendar</h3>
                <p className="text-xs text-slate-500 theme-dark:text-slate-400">Manage calendar reminders and sync</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="text-xs font-semibold text-slate-600 theme-dark:text-slate-300">Popup reminder</label>
                  <select
                    value={popupMinutes === null ? "off" : String(popupMinutes)}
                    onChange={(e) => {
                      const value = e.target.value === "off" ? null : Number(e.target.value);
                      setPopupMinutes(Number.isNaN(value as number) ? null : (value as number | null));
                    }}
                    className="w-full h-10 mt-2 px-4 rounded-lg bg-white/70 theme-dark:bg-slate-700/70 border border-white/70 theme-dark:border-slate-700/70 text-sm text-slate-900 theme-dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400/30 transition-all"
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
                <div>
                  <label className="text-xs font-semibold text-slate-600 theme-dark:text-slate-300">Email reminder</label>
                  <select
                    value={emailMinutes === null ? "off" : String(emailMinutes)}
                    onChange={(e) => {
                      const value = e.target.value === "off" ? null : Number(e.target.value);
                      setEmailMinutes(Number.isNaN(value as number) ? null : (value as number | null));
                    }}
                    className="w-full h-10 mt-2 px-4 rounded-lg bg-white/70 theme-dark:bg-slate-700/70 border border-white/70 theme-dark:border-slate-700/70 text-sm text-slate-900 theme-dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400/30 transition-all"
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
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  onClick={handleSaveCalendarSettings}
                  className="h-9 px-4 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isAuthenticated || !calendarReady || calendarSaving}
                >
                  {calendarSaving ? "Saving..." : "Save reminder settings"}
                </button>
                <button
                  onClick={handleManualSync}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white/70 theme-dark:bg-slate-700/70 border border-white/70 theme-dark:border-slate-700/70 text-sm font-semibold text-slate-700 theme-dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isAuthenticated || calendarSyncing}
                >
                  <RefreshCw className={cn("w-4 h-4", calendarSyncing && "animate-spin")} />
                  {calendarSyncing ? "Syncing..." : "Sync calendar"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 theme-dark:text-slate-400 mb-4">Security</h2>
          <div className="rounded-2xl border border-white/70 theme-dark:border-slate-700/70 bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
            <div className="px-6 py-5 border-b border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-white/50 to-transparent theme-dark:from-slate-700/50 dark:to-transparent flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 theme-dark:text-slate-100">Session</h3>
                <p className="text-xs text-slate-500 theme-dark:text-slate-400">Manage your account access</p>
              </div>
            </div>
            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-700 theme-dark:text-slate-200">Signed in as</p>
                <p className="text-xs text-slate-500 theme-dark:text-slate-400 mt-1">{user?.email ?? "Not signed in"}</p>
              </div>
              <button
                onClick={signOut}
                className={cn(
                  "h-9 px-4 rounded-lg text-xs font-semibold border transition-all",
                  isAuthenticated
                    ? "border-red-200 theme-dark:border-red-900/50 text-red-600 theme-dark:text-red-400 hover:bg-red-50 theme-dark:hover:bg-red-900/20 hover:scale-105"
                    : "border-slate-200 theme-dark:border-slate-700/70 text-slate-400 cursor-not-allowed"
                )}
                disabled={!isAuthenticated}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
