"use client";
import React from "react";
import {
  CheckCircle2, Clock, AlertCircle, TrendingUp,
  Calendar, ArrowRight, Flame
} from "lucide-react";
import { cn, PRIORITY_CONFIG, formatDate, isOverdue, timeAgo } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { TaskModal } from "@/components/modals/task-modal";
import { useAuth } from "@/components/auth-provider";

export default function DashboardPage() {
  const tasks = useAppStore((s) => s.tasks);
  const selectedTask = useAppStore((s) => s.selectedTask);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);
  const activities = useAppStore((s) => s.activities);
  const { user } = useAuth();
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  const today = new Date().toISOString().split("T")[0];
  const dueTodayTasks = tasks.filter((t) => t.dueDate === today && t.status !== "done");
  const myTasks = user
    ? tasks.filter((t) =>
        t.assignees.some((a) => a.id === user.id) && t.status !== "done"
      )
    : [];
  const overdueTasks = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const stats = [
    { label: "My Tasks", value: myTasks.length, icon: CheckCircle2, color: "text-brand-500", bg: "bg-brand-50 border-brand-100" },
    { label: "Due Today", value: dueTodayTasks.length, icon: Calendar, color: "text-amber-500", bg: "bg-amber-50 border-amber-100" },
    { label: "Overdue", value: overdueTasks.length, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 border-red-100" },
    { label: "Completed", value: doneTasks.length, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-100" },
  ];

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Welcome */}
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-800">
              Good morning, {displayName} 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Here's what's happening with your projects today.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon, color, bg }, index) => (
              <div
                key={label}
                className={cn(
                  "rounded-2xl border p-4 bg-white/70 backdrop-blur-xl shadow-card animate-fade-up transition-transform hover:-translate-y-0.5",
                  bg
                )}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-600">{label}</span>
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-white/70")}> 
                    <Icon className={cn("w-4 h-4", color)} />
                  </div>
                </div>
                <p className="font-display font-bold text-3xl text-slate-800">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* My tasks */}
            <div className="md:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/70 shadow-card overflow-hidden animate-fade-up" style={{ animationDelay: "160ms" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/70">
                <h2 className="font-display font-semibold text-slate-800">Assigned to me</h2>
                <span className="text-xs text-slate-400">{myTasks.length} tasks</span>
              </div>
              <div className="divide-y divide-white/70">
                {myTasks.slice(0, 5).map((task) => {
                  const priority = PRIORITY_CONFIG[task.priority];
                  const overdue = isOverdue(task.dueDate);
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-white/70 cursor-pointer transition-all group"
                    >
                      <div className={cn("w-2 h-2 rounded-full shrink-0", priority.dot)} />
                      <p className="flex-1 text-sm font-medium text-slate-700 truncate group-hover:text-slate-900">
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <span className={cn(
                          "text-xs shrink-0",
                          overdue ? "text-red-500 font-semibold" : "text-slate-400"
                        )}>
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  );
                })}
                {myTasks.length === 0 && (
                  <div className="px-5 py-8 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">All caught up! No tasks assigned.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Activity */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/70 shadow-card overflow-hidden animate-fade-up" style={{ animationDelay: "220ms" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/70">
                <h2 className="font-display font-semibold text-slate-800">Activity</h2>
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <div className="divide-y divide-white/70">
                {activities.map((item) => (
                  <div key={item.id} className="flex gap-3 px-4 py-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5"
                      style={{ backgroundColor: item.user?.color ?? "#94a3b8" }}
                    >
                      {item.user?.initials ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 leading-snug">
                        <span className="font-semibold text-slate-800">
                          {item.user?.name?.split(" ")[0] ?? "Someone"}
                        </span>
                        {" "}{item.action}{" "}
                        <span className="text-brand-600 font-medium truncate">{item.target}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Due today */}
          {dueTodayTasks.length > 0 && (
            <div className="bg-white/75 backdrop-blur-xl rounded-2xl border border-white/70 p-5 shadow-card animate-fade-up" style={{ animationDelay: "280ms" }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="font-display font-semibold text-slate-800">Due Today</h2>
                <span className="h-5 px-2 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center">
                  {dueTodayTasks.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {dueTodayTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="flex items-center gap-3 bg-white/85 rounded-xl px-4 py-3 shadow-card hover:shadow-card-hover cursor-pointer transition-all border border-white/70 group hover:-translate-y-0.5"
                  >
                    <div className={cn("w-2 h-2 rounded-full shrink-0", PRIORITY_CONFIG[task.priority].dot)} />
                    <p className="flex-1 text-sm font-medium text-slate-700 truncate">{task.title}</p>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </>
  );
}
