"use client";
import React, { useMemo, useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  ArrowRight,
  Flame,
  Target,
} from "lucide-react";
import {
  cn,
  PRIORITY_CONFIG,
  formatDate,
  isOverdue,
  timeAgo,
  optimizeAvatarUrl,
} from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { fetchUserAssignedTasks } from "@/lib/data";
import { TaskModal } from "@/components/modals/task-modal";
import { useAuth } from "@/components/auth-provider";
import { Task } from "@/lib/types";

export default function DashboardPage() {
  const selectedTask = useAppStore((s) => s.selectedTask);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);
  const filterPriority = useAppStore((s) => s.filterPriority);
  const filterArchived = useAppStore((s) => s.filterArchived);
  const filterAssignees = useAppStore((s) => s.filterAssignees);
  const filterTags = useAppStore((s) => s.filterTags);
  const projects = useAppStore((s) => s.projects);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const { user } = useAuth();

  // Subscribe to store tasks instead of fetching locally
  const storeTasks = useAppStore((s) => s.tasks);
  const [userTasks, setUserTasks] = useState<Task[]>([]);

  // Fetch user's assigned tasks once on mount, then use store updates
  useEffect(() => {
    if (!user?.id) {
      setUserTasks([]);
      return;
    }

    const loadUserTasks = async () => {
      try {
        const tasks = await fetchUserAssignedTasks(user.id);
        setUserTasks(tasks);
      } catch (error) {
        console.error("Failed to fetch user tasks:", error);
        setUserTasks([]);
      }
    };

    loadUserTasks();
  }, [user?.id]);

  // Update when store tasks change (real-time updates from board)
  useEffect(() => {
    if (!user?.id) return;

    // Filter store tasks to only show those assigned to current user across all projects
    const filteredTasks = storeTasks.filter((t) =>
      t.assignees.some((a) => a.id === user.id),
    );

    setUserTasks(filteredTasks);
  }, [storeTasks, user?.id]);

  const activities = useAppStore((s) => s.activities);
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  // Memoize task calculations for performance
  const { myTasks, dueTodayTasks, overdueTasks, doneTasks } = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    
    // Apply filters
    const filteredTasks = userTasks.filter((t) => {
      // Priority filter
      if (filterPriority && t.priority !== filterPriority) return false;
      
      // Archive filter
      if (filterArchived && !t.archived) return false;
      
      // Assignee filter (if assignees are selected, task must have one of them)
      if (filterAssignees.length > 0 && !t.assignees.some((a) => filterAssignees.includes(a.id))) {
        return false;
      }
      
      // Tags filter (if tags are selected, task must have at least one)
      if (filterTags.length > 0 && !t.tags.some((tag) => filterTags.includes(tag.id))) {
        return false;
      }
      
      return true;
    });
    
    const dueTodayTasks = filteredTasks.filter(
      (t) => t.dueDate === today && t.status !== "done",
    );
    const myTasks = filteredTasks.filter((t) => t.status !== "done");
    const overdueTasks = filteredTasks.filter(
      (t) => isOverdue(t.dueDate) && t.status !== "done",
    );
    const doneTasks = filteredTasks.filter((t) => t.status === "done");

    return { myTasks, dueTodayTasks, overdueTasks, doneTasks };
  }, [userTasks, filterPriority, filterArchived, filterAssignees, filterTags]);

  const focusTasks = useMemo(() => {
    const sorted = [...myTasks].filter((t) => t.status !== "done");
    sorted.sort((a, b) => {
      const aOverdue = isOverdue(a.dueDate);
      const bOverdue = isOverdue(b.dueDate);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && !b.dueDate) return 0;
      return new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime();
    });
    return sorted.slice(0, 3);
  }, [myTasks]);

  const getProjectLabel = (task: Task) =>
    (task as any).projectName ??
    projects.find((p) => p.id === activeProjectId)?.name ??
    "Project";

  const stats = [
    {
      label: "My Tasks",
      value: myTasks.length,
      icon: CheckCircle2,
      color: "text-brand-500",
      bg: "bg-brand-50 theme-dark:bg-brand-900/30 border-brand-100 theme-dark:border-brand-800/50",
    },
    {
      label: "Due Today",
      value: dueTodayTasks.length,
      icon: Calendar,
      color: "text-amber-500",
      bg: "bg-amber-50 theme-dark:bg-amber-900/30 border-amber-100 theme-dark:border-amber-800/50",
    },
    {
      label: "Overdue",
      value: overdueTasks.length,
      icon: AlertCircle,
      color: "text-red-500",
      bg: "bg-red-50 theme-dark:bg-red-900/30 border-red-100 theme-dark:border-red-800/50",
    },
    {
      label: "Completed",
      value: doneTasks.length,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-50 theme-dark:bg-emerald-900/30 border-emerald-100 theme-dark:border-emerald-800/50",
    },
  ];

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 theme-dark:from-slate-950 theme-dark:via-slate-900 theme-dark:to-slate-950">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Welcome Hero */}
          <div className="relative overflow-hidden rounded-3xl border border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-white via-blue-50/30 to-white theme-dark:from-slate-800 theme-dark:via-slate-800/50 theme-dark:to-slate-800 backdrop-blur-xl p-8 shadow-lg">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-teal-200/30 to-blue-200/20 blur-3xl" />
            <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-gradient-to-br from-amber-200/30 to-orange-200/20 blur-3xl" />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 mb-4">
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-600 theme-dark:text-emerald-400 uppercase tracking-wider">Your Dashboard</span>
                </div>
                <h1 className="font-display font-bold text-3xl sm:text-4xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 bg-clip-text text-transparent">
                  Welcome back, {displayName}
                </h1>
                <p className="text-slate-600 theme-dark:text-slate-400 text-base mt-3 max-w-2xl">
                  Track your progress with <span className="font-semibold text-slate-800 theme-dark:text-slate-200">{myTasks.length} active tasks</span> • <span className="font-semibold text-amber-600">{dueTodayTasks.length} due today</span> • <span className="font-semibold text-emerald-600">{doneTasks.length} completed</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/50 bg-emerald-50 theme-dark:bg-emerald-900/20 px-3 py-1 text-xs font-semibold text-emerald-700 theme-dark:text-emerald-300">✓ Focus mode</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/50 bg-blue-50 theme-dark:bg-blue-900/20 px-3 py-1 text-xs font-semibold text-blue-700 theme-dark:text-blue-300">📅 Synced</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/50 bg-purple-50 theme-dark:bg-purple-900/20 px-3 py-1 text-xs font-semibold text-purple-700 theme-dark:text-purple-300">⚡ Bulk ready</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon, color, bg }, index) => (
              <div
                key={label}
                className={cn(
                  "group relative rounded-2xl border p-5 bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden",
                  bg,
                )}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-widest font-bold text-slate-600 theme-dark:text-slate-400">
                    {label}
                  </span>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-white/90 to-slate-100/90 theme-dark:from-slate-700 theme-dark:to-slate-800 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Icon className={cn("w-5 h-5", color)} />
                  </div>
                </div>
                <p className="font-display font-bold text-4xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* My tasks */}
            <div
              className="md:col-span-2 bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/70 theme-dark:border-slate-700/70 shadow-lg overflow-hidden transition-all hover:shadow-xl"
              style={{ animationDelay: "160ms" }}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-white/50 to-transparent theme-dark:from-slate-700/50 dark:to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full bg-gradient-to-b from-brand-500 to-brand-600" />
                  <div>
                    <h2 className="font-display font-bold text-lg text-slate-900 theme-dark:text-slate-100">
                      Assigned to me
                    </h2>
                    <p className="text-xs text-slate-500 theme-dark:text-slate-400 mt-0.5">
                      Your active workload
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 theme-dark:bg-brand-900/30 text-brand-700 theme-dark:text-brand-300 font-bold text-sm">
                  {myTasks.length}
                </span>
              </div>
              <div className="divide-y divide-white/70 theme-dark:divide-slate-700/70 max-h-[400px] overflow-y-auto">
                {myTasks.slice(0, 5).map((task, idx) => {
                  const priority = PRIORITY_CONFIG[task.priority];
                  const overdue = isOverdue(task.dueDate);
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-white/50 theme-dark:hover:bg-slate-700/50 cursor-pointer transition-all group border-l-4 border-l-transparent hover:border-l-brand-500"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white theme-dark:bg-slate-700 border border-white/70 theme-dark:border-slate-600 shrink-0 text-xs font-bold text-slate-600 theme-dark:text-slate-300 group-hover:bg-brand-50 theme-dark:group-hover:bg-brand-900/20 transition-colors">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 theme-dark:text-slate-100 truncate group-hover:text-brand-600 transition-colors">
                          {task.title}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 theme-dark:border-slate-700 bg-white/70 theme-dark:bg-slate-800/70 px-2 py-0.5 text-[10px] font-medium text-slate-600 theme-dark:text-slate-400">
                            📁 {getProjectLabel(task)}
                          </span>
                          {(task as any).statusLabel && (
                            <span className="text-[10px] text-slate-500 theme-dark:text-slate-400">
                              {(task as any).statusLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        "hidden sm:inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold border transition-all group-hover:scale-105",
                        priority.bg,
                        priority.color
                      )}>
                        {priority.label}
                      </span>
                      {task.dueDate && (
                        <span
                          className={cn(
                            "text-xs shrink-0 px-2.5 py-1 rounded-full border font-medium transition-all group-hover:scale-105",
                            overdue
                              ? "text-red-600 border-red-300 bg-red-50 theme-dark:bg-red-900/30 theme-dark:border-red-800/50 theme-dark:text-red-300"
                              : "text-slate-600 theme-dark:text-slate-400 border-slate-200 theme-dark:border-slate-700 bg-white/70 theme-dark:bg-slate-800/70",
                          )}
                        >
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-300 theme-dark:text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  );
                })}
                {myTasks.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-600 theme-dark:text-slate-400">
                      All caught up! No active tasks.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Focus today */}
              <div
                className="bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/70 theme-dark:border-slate-700/70 shadow-lg overflow-hidden transition-all hover:shadow-xl"
                style={{ animationDelay: "200ms" }}
              >
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-emerald-50/50 to-transparent theme-dark:from-emerald-900/20 dark:to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
                    <div>
                      <h2 className="font-display font-bold text-lg text-slate-900 theme-dark:text-slate-100">
                        Focus today
                      </h2>
                      <p className="text-xs text-slate-500 theme-dark:text-slate-400 mt-0.5">
                        Top priorities
                      </p>
                    </div>
                  </div>
                  <Target className="w-5 h-5 text-emerald-500 animate-pulse" />
                </div>
                <div className="divide-y divide-white/70 theme-dark:divide-slate-700/70 max-h-[300px] overflow-y-auto">
                  {focusTasks.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 theme-dark:text-slate-400 font-medium">
                        No urgent tasks right now.
                      </p>
                    </div>
                  ) : (
                    focusTasks.map((task, idx) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="flex items-center gap-3 px-6 py-4 hover:bg-white/50 theme-dark:hover:bg-slate-700/50 cursor-pointer transition-all group border-l-4 border-l-transparent hover:border-l-emerald-500"
                      >
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 theme-dark:text-slate-100 truncate group-hover:text-emerald-600 transition-colors">
                            {task.title}
                          </p>
                          <p className="text-[11px] text-slate-500 theme-dark:text-slate-400 mt-0.5">
                            📁 {getProjectLabel(task)}
                          </p>
                        </div>
                        <span className={cn(
                          "text-xs shrink-0 px-2.5 py-1 rounded-full border font-medium transition-all group-hover:scale-105",
                          isOverdue(task.dueDate)
                            ? "text-red-600 border-red-300 bg-red-50 theme-dark:bg-red-900/30 theme-dark:border-red-800/50 theme-dark:text-red-300"
                            : "text-slate-600 theme-dark:text-slate-400 border-slate-200 theme-dark:border-slate-700 bg-white/70 theme-dark:bg-slate-800/70"
                        )}>
                          {task.dueDate ? formatDate(task.dueDate) : "No date"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Activity */}
              <div
                className="bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/70 theme-dark:border-slate-700/70 shadow-lg overflow-hidden transition-all hover:shadow-xl"
                style={{ animationDelay: "240ms" }}
              >
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-orange-50/50 to-transparent theme-dark:from-orange-900/20 dark:to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full bg-gradient-to-b from-orange-500 to-red-600" />
                    <div>
                      <h2 className="font-display font-bold text-lg text-slate-900 theme-dark:text-slate-100">
                        Activity
                      </h2>
                      <p className="text-xs text-slate-500 theme-dark:text-slate-400 mt-0.5">
                        Recent updates
                      </p>
                    </div>
                  </div>
                  <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                </div>
                <div className="relative max-h-[300px] overflow-y-auto">
                  <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gradient-to-b from-orange-200 via-slate-200 to-transparent theme-dark:from-orange-800 dark:via-slate-700 dark:to-transparent" />
                  <div className="space-y-3 px-4 py-4">
                    {activities.slice(0, 5).map((item) => (
                      <div key={item.id} className="relative flex gap-3 pl-4">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5 overflow-hidden border-2 border-white theme-dark:border-slate-800 shadow-md ring-2 ring-white/50 theme-dark:ring-slate-700/50"
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
                            (item.user?.initials ?? "?")
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-xs text-slate-600 theme-dark:text-slate-300 leading-snug">
                            <span className="font-bold text-slate-800 theme-dark:text-slate-100">
                              {item.user?.name?.split(" ")[0] ?? "Someone"}
                            </span>{" "}
                            <span className="text-slate-600 theme-dark:text-slate-400">{item.action}</span>{" "}
                            <span className="font-semibold text-brand-600 theme-dark:text-brand-400 truncate">
                              {item.target}
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 theme-dark:text-slate-500 mt-1">
                            {timeAgo(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Due today */}
          {dueTodayTasks.length > 0 && (
            <div
              className="bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/70 theme-dark:border-slate-700/70 shadow-lg overflow-hidden transition-all hover:shadow-xl"
              style={{ animationDelay: "280ms" }}
            >
              <div className="flex items-center gap-3 px-6 py-5 border-b border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-amber-50/50 to-transparent theme-dark:from-amber-900/20 dark:to-transparent">
                <div className="w-2 h-8 rounded-full bg-gradient-to-b from-amber-500 to-orange-600" />
                <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                <h2 className="font-display font-bold text-lg text-slate-900 theme-dark:text-slate-100">
                  Due Today
                </h2>
                <span className="ml-auto inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 theme-dark:from-amber-900/50 dark:to-orange-900/50 text-amber-800 theme-dark:text-amber-300 text-sm font-bold">
                  {dueTodayTasks.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-6">
                {dueTodayTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="group flex flex-col gap-3 bg-gradient-to-br from-white via-amber-50/30 to-white theme-dark:from-slate-700 dark:via-slate-700/50 dark:to-slate-700 rounded-xl px-4 py-4 shadow-md hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all border border-amber-100/50 theme-dark:border-amber-800/30 hover:border-amber-300/70 theme-dark:hover:border-amber-700/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-amber-400 to-orange-500 shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 theme-dark:text-slate-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                            {task.title}
                          </p>
                          <p className="text-xs text-slate-600 theme-dark:text-slate-400 mt-1">
                            📁 {getProjectLabel(task)}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full border whitespace-nowrap ml-2",
                        PRIORITY_CONFIG[task.priority].bg,
                        PRIORITY_CONFIG[task.priority].color
                      )}>
                        {PRIORITY_CONFIG[task.priority].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 theme-dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-medium">Today</span>
                      <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span>Due now</span>
                    </div>
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
