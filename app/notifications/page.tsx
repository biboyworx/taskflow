"use client";
import { useMemo } from "react";
import { Bell } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
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
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-xl text-slate-800 mb-5">Notifications</h1>

        {invites.filter((invite) => invite.status === "sent").length > 0 && (
          <div className="bg-white rounded-2xl border border-surface-200 shadow-card overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-surface-100 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Invites
            </div>
            {invites
              .filter((invite) => invite.status === "sent")
              .map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center gap-4 px-5 py-4 border-t border-surface-100"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: invite.projectColor ?? "#14b8a6" }}
                  >
                    {invite.projectEmoji ?? "📁"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">
                      You were invited to <span className="font-semibold text-slate-900">{invite.projectName ?? "a project"}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{timeAgo(invite.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => user && void acceptInvite(invite, user.id)}
                      className="h-8 px-3 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => void declineInvite(invite.id)}
                      className="h-8 px-3 rounded-lg bg-white/70 border border-white/70 text-xs font-medium text-slate-600 hover:bg-white transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-surface-200 shadow-card overflow-hidden">
          {notifications.map((item, i) => (
            <div
              key={item.id}
              className={cn(
                "flex gap-4 px-5 py-4 hover:bg-surface-50 transition-colors",
                i !== 0 && "border-t border-surface-100",
              )}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: item.user?.color ?? "#94a3b8" }}
              >
                {item.user?.initials ?? "?"}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{item.user?.name ?? "Someone"}</span>{" "}
                  {item.action}{" "}
                  <span className="text-brand-600 font-medium">{item.target}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">{timeAgo(item.createdAt)}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              No notifications yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
