"use client";
import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { fetchUserAssignedTasks } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import { TaskModal } from "@/components/modals/task-modal";
import { cn, formatDate, isOverdue } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toDateKeyFromString(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
  }
  return value;
}

export default function AgendaPage() {
  const preferences = useAppStore((s) => s.preferences);
  const columns = useAppStore((s) => s.columns);
  const selectedTask = useAppStore((s) => s.selectedTask);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);
  const { user } = useAuth();
  const [userTasks, setUserTasks] = useState<any[]>([]);

  // Fetch user's assigned tasks across all projects
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

  const todayKey = toDateKey(new Date());
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const leadingBlankDays = preferences.weekStartsOnMonday
    ? (monthStart.getDay() + 6) % 7
    : monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const tasksByDate: Record<string, typeof userTasks> = {};
  userTasks.forEach((task) => {
    if (!task.dueDate) return;
    if (!preferences.showCompleted && task.status === "done") return;
    const dateKey = toDateKeyFromString(task.dueDate);
    if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
    tasksByDate[dateKey].push(task);
  });

  const selectedTasks = tasksByDate[selectedDate] ?? [];
  const noDate = userTasks.filter((t) => !t.dueDate && (preferences.showCompleted || t.status !== "done"));
  const tomorrowKey = toDateKey(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const overdueCount = userTasks.filter(
    (t) => isOverdue(t.dueDate) && t.status !== "done",
  ).length;
  const dueTodayCount = userTasks.filter(
    (t) => t.dueDate === todayKey && t.status !== "done",
  ).length;
  const noDateCount = noDate.length;

  const getStatusLabel = (task: any) =>
    task?.statusLabel ?? columns.find((c) => c.id === task.status)?.title ?? "";

  const getProjectLabel = (task: any) =>
    task?.projectName ?? "Project";

  const getDueLabel = (dueDate?: string | null) => {
    if (!dueDate) return "No due date";
    const dateKey = toDateKeyFromString(dueDate);
    if (dateKey === todayKey) return "Due today";
    if (dateKey === tomorrowKey) return "Due tomorrow";
    if (isOverdue(dateKey)) return "Overdue";
    return formatDate(dateKey);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 theme-dark:from-slate-950 theme-dark:via-slate-900 theme-dark:to-slate-950">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl border border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-white via-blue-50/30 to-white theme-dark:from-slate-800 theme-dark:via-slate-800/50 theme-dark:to-slate-800 backdrop-blur-xl p-8 shadow-lg">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-blue-200/30 to-cyan-200/20 blur-3xl" />
            <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-gradient-to-br from-amber-200/30 to-orange-200/20 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse" />
                <span className="text-xs font-semibold text-blue-600 theme-dark:text-blue-400 uppercase tracking-wider">Your Timeline</span>
              </div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 bg-clip-text text-transparent mb-3">
                Plan your week with clarity
              </h1>
              <p className="text-slate-600 theme-dark:text-slate-400 text-base max-w-2xl">
                Track deadlines, spot overdue work, and stay ahead of your commitments at a glance.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: "Due today",
                value: dueTodayCount,
                icon: "🎯",
                tone: "from-amber-50 to-white theme-dark:from-amber-900/20 dark:to-slate-800",
                border: "border-amber-100 theme-dark:border-amber-800/30",
                text: "text-amber-700 theme-dark:text-amber-300",
              },
              {
                label: "Overdue",
                value: overdueCount,
                icon: "⚠️",
                tone: "from-red-50 to-white theme-dark:from-red-900/20 dark:to-slate-800",
                border: "border-red-100 theme-dark:border-red-800/30",
                text: "text-red-700 theme-dark:text-red-300",
              },
              {
                label: "No due date",
                value: noDateCount,
                icon: "📋",
                tone: "from-slate-50 to-white theme-dark:from-slate-700 dark:to-slate-800",
                border: "border-slate-200 theme-dark:border-slate-700",
                text: "text-slate-700 theme-dark:text-slate-300",
              },
            ].map((card, idx) => (
              <div
                key={card.label}
                className={cn(
                  "group relative rounded-2xl border px-6 py-5 bg-gradient-to-br shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden",
                  card.tone,
                  card.border,
                )}
                style={{ animationDelay: `${idx * 70}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-widest font-bold text-slate-600 theme-dark:text-slate-400">
                      {card.label}
                    </p>
                    <p className={cn("mt-3 font-display font-bold text-4xl", card.text)}>
                      {card.value}
                    </p>
                  </div>
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    {card.icon}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6 auto-rows-max">
            {/* Calendar */}
            <div className={cn(
              "bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl border border-white/70 theme-dark:border-slate-700/70 shadow-lg rounded-2xl overflow-visible transition-all hover:shadow-xl",
              preferences.enableAnimations && "animate-fade-up"
            )}
            style={preferences.enableAnimations ? { animationDelay: "0ms" } : undefined}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-white/50 to-transparent theme-dark:from-slate-700/50 dark:to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full bg-gradient-to-b from-blue-500 to-cyan-600" />
                  <div>
                    <h2 className="font-display font-bold text-lg text-slate-900 theme-dark:text-slate-100">
                      {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </h2>
                    <p className="text-xs text-slate-500 theme-dark:text-slate-400 mt-0.5">Click a date to view tasks</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                    className="w-9 h-9 rounded-lg bg-white/70 theme-dark:bg-slate-700/70 border border-white/70 theme-dark:border-slate-700/70 hover:bg-white/90 dark:hover:bg-slate-700/90 hover:shadow-md flex items-center justify-center transition-all group"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-500 theme-dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                    className="w-9 h-9 rounded-lg bg-white/70 theme-dark:bg-slate-700/70 border border-white/70 theme-dark:border-slate-700/70 hover:bg-white/90 dark:hover:bg-slate-700/90 hover:shadow-md flex items-center justify-center transition-all group"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-500 theme-dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-7 text-[11px] text-slate-500 theme-dark:text-slate-400 mb-3 font-bold uppercase tracking-wider">
                  {(preferences.weekStartsOnMonday
                    ? [...WEEKDAYS.slice(1), WEEKDAYS[0]]
                    : WEEKDAYS
                  ).map((day) => (
                    <div key={day} className="py-2 text-center">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: leadingBlankDays }).map((_, i) => (
                    <div key={`blank-${i}`} className="h-16 rounded-xl bg-transparent" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    const dateKey = toDateKey(new Date(year, month, day));
                    const tasksOnDate = tasksByDate[dateKey] ?? [];
                    const hasTasks = tasksOnDate.length > 0;
                    const today = new Date().toISOString().split("T")[0];
                    
                    const hasOverdue = tasksOnDate.some(t => isOverdue(t.dueDate) && t.status !== "done");
                    const hasDueToday = tasksOnDate.some(t => t.dueDate === today && t.status !== "done");
                    
                    const isToday = dateKey === todayKey;
                    const isSelected = dateKey === selectedDate;
                    
                    let indicatorColor = "bg-slate-300 theme-dark:bg-slate-600";
                    let bgColor = "bg-white/60 theme-dark:bg-slate-700/40 border-slate-200/50 theme-dark:border-slate-600/50";
                    let hoverBg = "hover:bg-white/80 dark:hover:bg-slate-700/60";
                    
                    if (hasOverdue) {
                      indicatorColor = "bg-red-500";
                      bgColor = "bg-red-50/50 theme-dark:bg-red-900/20 border-red-200/50 theme-dark:border-red-800/30";
                      hoverBg = "hover:bg-red-100/50 dark:hover:bg-red-900/30";
                    } else if (hasDueToday) {
                      indicatorColor = "bg-amber-500";
                      bgColor = "bg-amber-50/50 theme-dark:bg-amber-900/20 border-amber-200/50 theme-dark:border-amber-800/30";
                      hoverBg = "hover:bg-amber-100/50 dark:hover:bg-amber-900/30";
                    } else if (hasTasks) {
                      indicatorColor = "bg-blue-500";
                      bgColor = "bg-blue-50/50 theme-dark:bg-blue-900/20 border-blue-200/50 theme-dark:border-blue-800/30";
                      hoverBg = "hover:bg-blue-100/50 dark:hover:bg-blue-900/30";
                    }
                    
                    return (
                      <button
                        key={dateKey}
                        onClick={() => setSelectedDate(dateKey)}
                        className={cn(
                          "h-16 rounded-xl border transition-all flex flex-col items-center justify-center gap-1",
                          bgColor,
                          hoverBg,
                          isSelected && "ring-2 ring-blue-400 theme-dark:ring-blue-500/50 border-blue-300/50 theme-dark:border-blue-700/50",
                          isToday && "ring-2 ring-emerald-300 theme-dark:ring-emerald-500/50"
                        )}
                      >
                        <span className={cn(
                          "text-sm font-bold",
                          isToday ? "text-emerald-700 theme-dark:text-emerald-300" : "text-slate-800 theme-dark:text-slate-200"
                        )}>
                          {day}
                        </span>
                        <div className="flex items-center gap-1">
                          {hasTasks ? (
                            <>
                              <span className={cn("h-1.5 w-1.5 rounded-full", indicatorColor)} />
                              <span className={cn(
                                "text-[10px] font-bold",
                                hasOverdue ? "text-red-600 theme-dark:text-red-400" : hasDueToday ? "text-amber-600 theme-dark:text-amber-400" : "text-blue-600 theme-dark:text-blue-400"
                              )}>
                                {tasksOnDate.length}
                              </span>
                            </>
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 theme-dark:bg-slate-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Task List */}
            <div
              className={cn(
                "bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl border border-white/70 theme-dark:border-slate-700/70 shadow-lg rounded-2xl overflow-visible transition-all hover:shadow-xl",
                preferences.enableAnimations && "animate-fade-up"
              )}
              style={preferences.enableAnimations ? { animationDelay: "80ms" } : undefined}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/70 theme-dark:border-slate-700/70 bg-gradient-to-br from-white/50 to-transparent theme-dark:from-slate-700/50 dark:to-transparent">
                <div className="flex-1">
                  <h2 className="font-display font-bold text-lg text-slate-900 theme-dark:text-slate-100">
                    {formatDate(selectedDate)}
                  </h2>
                  <p className="text-xs text-slate-500 theme-dark:text-slate-400 mt-0.5">
                    {selectedTasks.length > 0 ? `${selectedTasks.length} task${selectedTasks.length !== 1 ? 's' : ''}` : 'No tasks scheduled'}
                  </p>
                </div>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 theme-dark:bg-blue-900/30 text-blue-700 theme-dark:text-blue-300 text-sm font-bold">
                  {selectedTasks.length}
                </span>
              </div>

              {selectedTasks.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Calendar className="w-10 h-10 text-slate-300 theme-dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-600 theme-dark:text-slate-400">
                    No tasks due on this date.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/70 theme-dark:divide-slate-700/70 overflow-y-auto">
                  {selectedTasks.map((task, idx) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="w-full text-left flex items-center gap-4 px-6 py-4 hover:bg-white/50 theme-dark:hover:bg-slate-700/50 transition-all group border-l-4 border-l-transparent hover:border-l-blue-500"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 theme-dark:bg-blue-900/30 text-blue-700 theme-dark:text-blue-300 text-xs font-bold shrink-0 group-hover:scale-110 transition-transform">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 theme-dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-500 theme-dark:text-slate-400 mt-1">
                          📁 {getProjectLabel(task)}
                          {getStatusLabel(task) ? ` • ${getStatusLabel(task)}` : ""}
                        </p>
                      </div>
                      <span className={cn(
                        "text-xs font-bold px-3 py-1 rounded-full border whitespace-nowrap transition-all group-hover:scale-105",
                        isOverdue(task.dueDate)
                          ? "text-red-600 border-red-300 bg-red-50 theme-dark:bg-red-900/30 dark:border-red-800/50 theme-dark:text-red-300"
                          : "text-slate-600 theme-dark:text-slate-400 border-slate-200 theme-dark:border-slate-700 bg-white/70 theme-dark:bg-slate-800/70"
                      )}>
                        {getDueLabel(task.dueDate)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {noDate.length > 0 && (
                <div className="border-t border-white/70 theme-dark:border-slate-700/70 px-6 py-4 bg-gradient-to-br from-slate-50/50 to-transparent theme-dark:from-slate-700/50 dark:to-transparent">
                  <p className="text-xs uppercase tracking-widest font-bold text-slate-600 theme-dark:text-slate-400 mb-3">Unscheduled Tasks</p>
                  <div className="space-y-2">
                    {noDate.slice(0, 4).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="w-full text-left flex items-center gap-3 rounded-lg px-4 py-2.5 bg-white/70 theme-dark:bg-slate-700/70 hover:bg-white dark:hover:bg-slate-700/90 transition-all group border border-white/70 theme-dark:border-slate-700/70 hover:border-slate-200 dark:hover:border-slate-600"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 theme-dark:bg-slate-500 group-hover:scale-125 transition-transform" />
                        <span className="text-sm text-slate-700 theme-dark:text-slate-200 truncate group-hover:text-slate-900 dark:group-hover:text-slate-100 font-medium">{task.title}</span>
                      </button>
                    ))}
                    {noDate.length > 4 && (
                      <p className="text-xs text-slate-500 theme-dark:text-slate-400 px-4 py-2">
                        +{noDate.length - 4} more unscheduled
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
      </div>

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </>
  );
}
