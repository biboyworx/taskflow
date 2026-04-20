"use client";
import { useMemo } from "react";
import { Bell, Mail, Activity } from "lucide-react";
import { cn, timeAgo, optimizeAvatarUrl } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/components/auth-provider";

export default function NotificationsPage() {
  const projects = useAppStore((s) => s.projects);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const invites = useAppStore((s) => s.invites);
  const acceptInvite = useAppStore((s) => s.acceptInvite);
  const declineInvite = useAppStore((s) => s.declineInvite);
  const { user } = useAuth();

  const notifications = useMemo(() => {
    const baseActivities = activeProject?.activities ?? [];
    const seedSource = user?.id ?? user?.email ?? "guest";
    const hashString = (value: string) => {
      let hash = 0;
      for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };
    const seed = hashString(seedSource);

    return [...baseActivities]
      .sort((a, b) => hashString(a.id + seed) - hashString(b.id + seed))
      .slice(0, 8);
  }, [activeProject?.activities, user?.email, user?.id]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 theme-dark:from-slate-950 theme-dark:via-slate-900 theme-dark:to-slate-950">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-white via-blue-50/30 to-white theme-dark:from-slate-800 theme-dark:via-slate-800/50 theme-dark:to-slate-800 backdrop-blur-xl p-8 shadow-lg">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-purple-200/30 to-pink-200/20 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl text-slate-900 theme-dark:text-slate-100">
                Notifications
              </h1>
              <p className="text-slate-600 theme-dark:text-slate-400 mt-1">
                Stay updated on project activity and team interactions
              </p>
            </div>
          </div>
        </div>

        {/* Invites Section */}
        {invites.filter((invite) => invite.status === "sent").length > 0 && (
          <div className="rounded-2xl border border-white/70 theme-dark:border-slate-700/70 bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-white/50 to-transparent theme-dark:from-slate-700/50 dark:to-transparent flex items-center gap-3">
              <Mail className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-slate-900 theme-dark:text-slate-100">
                Project Invites
              </h2>
              <span className="ml-auto inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 theme-dark:bg-amber-900/30 text-amber-700 theme-dark:text-amber-300 text-xs font-bold">
                {invites.filter((invite) => invite.status === "sent").length}
              </span>
            </div>
            <div className="divide-y divide-white/70 theme-dark:divide-slate-700/70">
              {invites
                .filter((invite) => invite.status === "sent")
                .map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center gap-4 px-6 py-5 hover:bg-white/50 theme-dark:hover:bg-slate-700/50 transition-colors group"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0 group-hover:scale-110 transition-transform shadow-md"
                      style={{ backgroundColor: invite.projectColor ?? "#14b8a6" }}
                    >
                      {invite.projectEmoji ?? "📁"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 theme-dark:text-slate-200">
                        Invited to <span className="font-bold text-slate-900 theme-dark:text-slate-100">{invite.projectName ?? "a project"}</span>
                      </p>
                      <p className="text-xs text-slate-500 theme-dark:text-slate-400 mt-1">{timeAgo(invite.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => user && void acceptInvite(invite, user.id)}
                        className="h-8 px-3 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => void declineInvite(invite.id)}
                        className="h-8 px-3 rounded-lg bg-white/70 theme-dark:bg-slate-700/70 border border-white/70 theme-dark:border-slate-700/70 text-xs font-semibold text-slate-700 theme-dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700/90 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Activity Section */}
        <div className="rounded-2xl border border-white/70 theme-dark:border-slate-700/70 bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-white/50 to-transparent theme-dark:from-slate-700/50 dark:to-transparent flex items-center gap-3">
            <Activity className="w-5 h-5 text-purple-500" />
            <h2 className="font-bold text-slate-900 theme-dark:text-slate-100">
              Recent Activity
            </h2>
          </div>
          {notifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Bell className="w-12 h-12 text-slate-300 theme-dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700 theme-dark:text-slate-300">
                No activity yet
              </p>
              <p className="text-xs text-slate-500 theme-dark:text-slate-400 mt-1">
                Activity from your project will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/70 theme-dark:divide-slate-700/70 max-h-[600px] overflow-y-auto">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 px-6 py-4 hover:bg-white/50 theme-dark:hover:bg-slate-700/50 transition-colors group"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden shadow-md border-2 border-white/50 theme-dark:border-slate-700/50 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: item.user?.color ?? "#94a3b8" }}
                  >
                    {item.user?.avatar ? (
                      <img
                        src={optimizeAvatarUrl(item.user.avatar, 48) || item.user.avatar}
                        alt={item.user?.name ?? "User"}
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      item.user?.initials ?? "?"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 theme-dark:text-slate-200">
                      <span className="font-bold text-slate-900 theme-dark:text-slate-100">{item.user?.name ?? "Someone"}</span>
                      <span className="text-slate-600 theme-dark:text-slate-400"> {item.action} </span>
                      <span className="text-purple-600 theme-dark:text-purple-400 font-medium">{item.target}</span>
                    </p>
                    <p className="text-xs text-slate-500 theme-dark:text-slate-400 mt-1">{timeAgo(item.createdAt)}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
