"use client";
import React, { useState, useMemo } from "react";
import {
  DndContext, DragOverlay, DragEndEvent, DragStartEvent,
  DragOverEvent, PointerSensor, useSensor, useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Column } from "./column";
import { TaskCard } from "./task-card";
import { TaskModal } from "../modals/task-modal";
import { useAppStore } from "@/lib/store";
import { Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

export function Board() {
  const tasks = useAppStore((s) => s.tasks);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const filterPriority = useAppStore((s) => s.filterPriority);
  const selectedTask = useAppStore((s) => s.selectedTask);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);
  const reorderTasks = useAppStore((s) => s.reorderTasks);
  const moveTask = useAppStore((s) => s.moveTask);
  const columns = useAppStore((s) => s.columns);
  const addColumn = useAppStore((s) => s.addColumn);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const preferences = useAppStore((s) => s.preferences);
  const currentMemberRole = useAppStore((s) => s.currentMemberRole);
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

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch = !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = !filterPriority || t.priority === filterPriority;
      const matchesCompleted = preferences.showCompleted || t.status !== "done";
      return matchesSearch && matchesPriority && matchesCompleted;
    });
  }, [tasks, searchQuery, filterPriority, preferences.showCompleted]);

  const getColumnTasks = (status: TaskStatus) =>
    filteredTasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Over a column
    const overColumn = columns.find((c) => c.id === overId);
    if (overColumn && activeTask.status !== overColumn.id) {
      void moveTask(activeId, overColumn.id, actor ?? undefined);
      return;
    }

    // Over another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && overTask.status !== activeTask.status) {
      void moveTask(activeId, overTask.status, actor ?? undefined);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      void reorderTasks(activeId, overId, overTask.status);
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className={cn(
            "flex h-full overflow-x-auto overflow-y-hidden",
            preferences.compactMode ? "gap-3 px-4 py-4" : "gap-5 px-6 py-5"
          )}
        >
          {columns.map((col, index) => (
            <div
              key={col.id}
              className={preferences.enableAnimations ? "animate-fade-up" : ""}
              style={preferences.enableAnimations ? { animationDelay: `${index * 80}ms` } : undefined}
            >
              <Column
                id={col.id}
                title={col.title}
                color={col.color}
                dotColor={col.dotColor}
                headerBg={col.headerBg}
                tasks={getColumnTasks(col.id)}
              />
            </div>
          ))}

          {currentMemberRole === "owner" && (
            <div className="shrink-0 w-72">
              {addingColumn ? (
                <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/70 shadow-card p-3 animate-scale-in">
                  <input
                    autoFocus
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (activeProjectId) {
                          void addColumn(newColumnTitle, activeProjectId);
                        }
                        setNewColumnTitle("");
                        setAddingColumn(false);
                      }
                      if (e.key === "Escape") {
                        setNewColumnTitle("");
                        setAddingColumn(false);
                      }
                    }}
                    placeholder="Column name"
                    className="w-full text-sm text-slate-800 placeholder:text-slate-400 bg-white/70 border border-white/70 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
                  />
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={() => {
                        if (activeProjectId) {
                          void addColumn(newColumnTitle, activeProjectId);
                        }
                        setNewColumnTitle("");
                        setAddingColumn(false);
                      }}
                      className="h-7 px-3 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors"
                    >
                      Add column
                    </button>
                    <button
                      onClick={() => { setNewColumnTitle(""); setAddingColumn(false); }}
                      className="w-7 h-7 rounded-lg hover:bg-white/70 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-400 rotate-45" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingColumn(true)}
                  className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/80 text-sm text-slate-500 hover:border-brand-300 hover:text-brand-600 hover:bg-white/70 transition-all group"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                  Add column
                </button>
              )}
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
          {activeTask && <TaskCard task={activeTask} overlay />}
        </DragOverlay>
      </DndContext>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
