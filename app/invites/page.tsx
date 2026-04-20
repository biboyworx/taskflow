"use client";

import { useEffect } from "react";
import { MailOpen, CheckCircle2, XCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/components/auth-provider";
import { timeAgo } from "@/lib/utils";

export default function InvitesPage() {
  const invites = useAppStore((s) => s.invites);
  const acceptInvite = useAppStore((s) => s.acceptInvite);
  const declineInvite = useAppStore((s) => s.declineInvite);
  const loadInvites = useAppStore((s) => s.loadInvites);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email) {
      void loadInvites(user.email);
    }
  }, [loadInvites, user?.email]);

  const pendingInvites = invites.filter((invite) => invite.status === "sent");

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 theme-dark:from-slate-950 theme-dark:via-slate-900 theme-dark:to-slate-950">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-white via-blue-50/30 to-white theme-dark:from-slate-800 theme-dark:via-slate-800/50 theme-dark:to-slate-800 backdrop-blur-xl p-8 shadow-lg">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/20 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
              <MailOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl text-slate-900 theme-dark:text-slate-100">
                Invitations
              </h1>
              <p className="text-slate-600 theme-dark:text-slate-400 mt-1">
                Manage your project invitations and join new teams
              </p>
            </div>
          </div>
        </div>

        {pendingInvites.length === 0 ? (
          <div className="rounded-2xl border border-white/70 theme-dark:border-slate-700/70 bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl shadow-lg px-8 py-12 text-center">
            <MailOpen className="w-12 h-12 text-slate-300 theme-dark:text-slate-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-700 theme-dark:text-slate-300">
              No pending invitations
            </p>
            <p className="text-sm text-slate-500 theme-dark:text-slate-400 mt-2">
              When you receive an invite, it will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="group rounded-2xl border border-white/70 theme-dark:border-slate-700/70 bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                <div className="flex items-center gap-5 px-6 py-5">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0 shadow-md group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: invite.projectColor ?? "#14b8a6" }}
                  >
                    {invite.projectEmoji ?? "📁"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base text-slate-700 theme-dark:text-slate-200">
                      You were invited to{" "}
                      <span className="font-bold text-slate-900 theme-dark:text-slate-100">
                        {invite.projectName ?? "a project"}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 theme-dark:text-slate-400 mt-1.5">
                      {timeAgo(invite.createdAt)} • Pending your response
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => user && void acceptInvite(invite, user.id)}
                      className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all group/accept"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => void declineInvite(invite.id)}
                      className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-white/70 theme-dark:bg-slate-700/70 border border-white/70 theme-dark:border-slate-700/70 text-sm font-semibold text-slate-700 theme-dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700/90 transition-all group/decline"
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {invites.filter(i => i.status === "accepted").length > 0 && (
          <div className="rounded-2xl border border-white/70 theme-dark:border-slate-700/70 bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-white/50 to-transparent theme-dark:from-slate-700/50 dark:to-transparent">
              <h2 className="font-semibold text-slate-900 theme-dark:text-slate-100">
                ✓ Accepted invitations
              </h2>
            </div>
            <div className="divide-y divide-white/70 theme-dark:divide-slate-700/70">
              {invites
                .filter((i) => i.status === "accepted")
                .map((invite) => (
                  <div key={invite.id} className="flex items-center gap-3 px-6 py-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: invite.projectColor ?? "#14b8a6" }}
                    >
                      {invite.projectEmoji ?? "📁"}
                    </div>
                    <p className="text-sm text-slate-700 theme-dark:text-slate-200">
                      {invite.projectName}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
