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

export default function AgendaPage() {
  const preferences = useAppStore((s) => s.preferences);
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
    if (!tasksByDate[task.dueDate]) tasksByDate[task.dueDate] = [];
    tasksByDate[task.dueDate].push(task);
  });

  const selectedTasks = tasksByDate[selectedDate] ?? [];
  const noDate = userTasks.filter((t) => !t.dueDate && (preferences.showCompleted || t.status !== "done"));

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-800 theme-dark:text-slate-100">Agenda</h1>
            <p className="text-sm text-slate-400 theme-dark:text-slate-500 mt-1">Calendar-style view of your upcoming work.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-5">
            <div className={cn(
              "bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl border border-white/70 theme-dark:border-slate-700/70 shadow-card rounded-2xl p-5",
              preferences.enableAnimations && "animate-fade-up"
            )}
            style={preferences.enableAnimations ? { animationDelay: "0ms" } : undefined}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-500" />
                  <h2 className="font-display font-semibold text-slate-800 theme-dark:text-slate-100">
                    {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                    className="w-8 h-8 rounded-lg bg-white/70 theme-dark:bg-slate-700/70 border border-white/70 theme-dark:border-slate-700/70 hover:bg-white/90 theme-dark:hover:bg-slate-700/90 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-500 theme-dark:text-slate-400" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                    className="w-8 h-8 rounded-lg bg-white/70 theme-dark:bg-slate-700/70 border border-white/70 theme-dark:border-slate-700/70 hover:bg-white/90 theme-dark:hover:bg-slate-700/90 flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-500 theme-dark:text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-[11px] text-slate-400 theme-dark:text-slate-500 mb-2">
                {(preferences.weekStartsOnMonday
                  ? [...WEEKDAYS.slice(1), WEEKDAYS[0]]
                  : WEEKDAYS
                ).map((day) => (
                  <div key={day} className="py-1 text-center font-semibold uppercase tracking-wider">
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
                  
                  // Determine task status on this date
                  const hasOverdue = tasksOnDate.some(t => isOverdue(t.dueDate) && t.status !== "done");
                  const hasDueToday = tasksOnDate.some(t => t.dueDate === today && t.status !== "done");
                  
                  const isToday = dateKey === todayKey;
                  const isSelected = dateKey === selectedDate;
                  
                  // Determine indicator color
                  let indicatorColor = "bg-slate-200 theme-dark:bg-slate-600";
                  let bgColor = "bg-white/60 theme-dark:bg-slate-700/40";
                  
                  if (hasOverdue) {
                    indicatorColor = "bg-red-500";
                    bgColor = "bg-red-50/40 theme-dark:bg-red-900/20";
                  } else if (hasDueToday) {
                    indicatorColor = "bg-amber-500";
                    bgColor = "bg-amber-50/40 theme-dark:bg-amber-900/20";
                  } else if (hasTasks) {
                    indicatorColor = "bg-brand-500";
                  }
                  
                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(dateKey)}
                      className={cn(
                        "h-16 rounded-xl border border-white/70 theme-dark:border-slate-700/70 hover:bg-white/90 theme-dark:hover:bg-slate-700/70 transition-colors flex flex-col items-center justify-center gap-1",
                        bgColor,
                        isSelected && "ring-2 ring-brand-300 theme-dark:ring-brand-500/50",
                        isToday && "bg-brand-50/70 theme-dark:bg-brand-900/30"
                      )}
                    >
                      <span className={cn("text-sm font-semibold", isToday ? "text-brand-700 theme-dark:text-brand-300" : "text-slate-700 theme-dark:text-slate-200")}>
                        {day}
                      </span>
                      <div className="flex items-center gap-1">
                        {hasTasks ? (
                          <span className={cn("h-1.5 w-1.5 rounded-full", indicatorColor)} />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-200 theme-dark:bg-slate-600" />
                        )}
                        {hasTasks && (
                          <span className={cn("text-[10px]", 
                            hasOverdue ? "text-red-500" : hasDueToday ? "text-amber-500" : "text-slate-400 theme-dark:text-slate-500"
                          )}>
                            {tasksOnDate.length}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={cn(
                "bg-white/80 theme-dark:bg-slate-800/80 backdrop-blur-xl border border-white/70 theme-dark:border-slate-700/70 shadow-card rounded-2xl overflow-hidden",
                preferences.enableAnimations && "animate-fade-up"
              )}
              style={preferences.enableAnimations ? { animationDelay: "80ms" } : undefined}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/70 theme-dark:border-slate-700/70">
                <div>
                  <h2 className="font-display font-semibold text-slate-800 theme-dark:text-slate-100">Tasks</h2>
                  <p className="text-xs text-slate-400 theme-dark:text-slate-500">{formatDate(selectedDate)}</p>
                </div>
                <span className="text-xs text-slate-400 theme-dark:text-slate-500">{selectedTasks.length} tasks</span>
              </div>

              {selectedTasks.length === 0 ? (
                <div className="px-5 py-6 text-sm text-slate-400 theme-dark:text-slate-500">No tasks due on this date.</div>
              ) : (
                <div className="divide-y divide-white/70 theme-dark:divide-slate-700/70">
                  {selectedTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-white/70 theme-dark:hover:bg-slate-700/70 transition-colors"
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        isOverdue(task.dueDate) ? "bg-red-500" : "bg-brand-500"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 theme-dark:text-slate-200 truncate">{task.title}</p>
                        <p className="text-xs text-slate-400 theme-dark:text-slate-500">{task.status}</p>
                      </div>
                      <span className={cn(
                        "text-xs font-medium",
                        isOverdue(task.dueDate) ? "text-red-500" : "text-slate-400 theme-dark:text-slate-500"
                      )}>
                        {formatDate(task.dueDate)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {noDate.length > 0 && (
                <div className="border-t border-white/70 theme-dark:border-slate-700/70 px-5 py-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400 theme-dark:text-slate-500 mb-2">No Due Date</p>
                  <div className="space-y-2">
                    {noDate.slice(0, 4).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="w-full text-left flex items-center gap-2.5 rounded-lg px-3 py-2 bg-white/70 theme-dark:bg-slate-700/70 hover:bg-white theme-dark:hover:bg-slate-700/90 transition-colors"
                      >
                        <span className="w-2 h-2 rounded-full bg-slate-300 theme-dark:bg-slate-600" />
                        <span className="text-sm text-slate-700 theme-dark:text-slate-200 truncate">{task.title}</span>
                      </button>
                    ))}
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
