"use client";
import React, { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, ColumnId } from "@/lib/types";
import { TaskCard } from "./task-card";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/components/auth-provider";

interface ColumnProps {
  id: ColumnId;
  title: string;
  color: string;
  dotColor: string;
  headerBg: string;
  tasks: Task[];
}

export function Column({ id, title, color, dotColor, headerBg, tasks }: ColumnProps) {
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const addTask = useAppStore((s) => s.addTask);
  const members = useAppStore((s) => s.members);
  const { user } = useAuth();

  const actor = useMemo(() => {
    if (!user) return null;
    const name =
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "User";
    const initials = name
      .split(/[._\s-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U";
    const palette = ["#14b8a6", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    const color = palette[Math.abs(hash) % palette.length];
    return {
      id: user.id,
      name,
      avatar: "",
      color,
      role: "Member",
      initials,
    };
  }, [user]);

  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "column", columnId: id } });

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    void addTask({
      title: newTaskTitle.trim(),
      description: "",
      status: id,
      priority: "medium",
      assignees: actor ? [actor] : members.slice(0, 1),
      dueDate: null,
      checklist: [],
      comments: [],
      attachments: [],
      tags: [],
    }, actor ?? undefined);
    setNewTaskTitle("");
    setAddingTask(false);
  };

  return (
    <div className="flex flex-col w-72 shrink-0 h-full">
      {/* Column header */}
      <div className={cn(
        "flex items-center gap-2.5 px-3.5 py-3 rounded-t-2xl border border-b-0 border-white/70 shadow-card backdrop-blur-xl",
        headerBg
      )}>
        <span className={cn("w-2 h-2 rounded-full", dotColor)} />
        <span className={cn("flex-1 text-sm font-semibold font-display", color)}>
          {title}
        </span>
        <span className="min-w-[22px] h-[22px] rounded-full bg-white/80 border border-white flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm px-1">
          {tasks.length}
        </span>
        <button className="w-6 h-6 rounded-md hover:bg-white/70 flex items-center justify-center transition-colors">
          <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Tasks */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-0 overflow-y-auto rounded-b-2xl border border-t-0 border-white/70 transition-colors duration-200 backdrop-blur-xl",
          isOver ? "column-drag-over bg-brand-50/40 border-brand-200" : "bg-white/55"
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="p-2.5 space-y-2.5">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}

            {/* Add task inline */}
            {addingTask ? (
              <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-brand-200 shadow-card p-3 animate-scale-in">
                <textarea
                  autoFocus
                  rows={2}
                  placeholder="Task title…"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddTask(); }
                    if (e.key === "Escape") { setAddingTask(false); setNewTaskTitle(""); }
                  }}
                  className="w-full text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none"
                />
                <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-white/70">
                  <button
                    onClick={handleAddTask}
                    className="h-7 px-3 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors"
                  >
                    Add task
                  </button>
                  <button
                    onClick={() => { setAddingTask(false); setNewTaskTitle(""); }}
                    className="w-7 h-7 rounded-lg hover:bg-white/70 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingTask(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-700 hover:bg-white/70 border border-dashed border-white/80 hover:border-brand-300 transition-all group"
              >
                <Plus className="w-3.5 h-3.5 group-hover:text-brand-500 transition-colors" />
                Add task
              </button>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
