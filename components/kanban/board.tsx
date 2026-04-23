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
import { BulkActionsToolbar } from "./bulk-actions-toolbar";
import { TaskModal } from "../modals/task-modal";
import { useAppStore } from "@/lib/store";
import { Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

export function Board() {
  const tasks = useAppStore((s) => s.tasks);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const filterPriority = useAppStore((s) => s.filterPriority);
  const filterArchived = useAppStore((s) => s.filterArchived);
  const filterAssignees = useAppStore((s) => s.filterAssignees);
  const filterTags = useAppStore((s) => s.filterTags);
  const selectedTask = useAppStore((s) => s.selectedTask);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);
  const reorderTasks = useAppStore((s) => s.reorderTasks);
  const moveTask = useAppStore((s) => s.moveTask);
  const columns = useAppStore((s) => s.columns);
  const addColumn = useAppStore((s) => s.addColumn);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const preferences = useAppStore((s) => s.preferences);
  const currentMemberRole = useAppStore((s) => s.currentMemberRole);
  const projects = useAppStore((s) => s.projects);
  const { user } = useAuth();
  
  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId),
    [projects, activeProjectId]
  );

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
      // Search filter
      const matchesSearch = !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Priority filter
      const matchesPriority = !filterPriority || t.priority === filterPriority;
      
      // Completed status filter
      const matchesCompleted = preferences.showCompleted || t.status !== "done";
      
      // Archive filter
      const matchesArchived = !filterArchived || t.archived === true;
      
      // Assignee filter (if assignees are selected, task must have one of them)
      const matchesAssignees = filterAssignees.length === 0 || 
        t.assignees.some(assignee => filterAssignees.includes(assignee.id));
      
      // Tags filter (if tags are selected, task must have at least one)
      const matchesTags = filterTags.length === 0 || 
        t.tags.some(tag => filterTags.includes(tag.id));
      
      return matchesSearch && matchesPriority && matchesCompleted && 
             matchesArchived && matchesAssignees && matchesTags;
    });
  }, [
    tasks, 
    searchQuery, 
    filterPriority, 
    filterArchived,
    filterAssignees,
    filterTags,
    preferences.showCompleted,
  ]);

  const getColumnTasks = (status: TaskStatus) =>
    filteredTasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order);

  const handleDragStart = (event: DragStartEvent) => {
    if (currentMemberRole !== "owner") return;
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (currentMemberRole !== "owner") return;
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
    if (currentMemberRole !== "owner") return;
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
        <div className="flex flex-col h-full w-full overflow-hidden bg-white/50">
          {/* Project Banner */}
          {activeProject?.bannerUrl && (
            <div className="w-full h-32 rounded-lg overflow-hidden mb-4 mx-6 mt-5 shrink-0">
              <img
                src={activeProject.bannerUrl}
                alt={activeProject.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Kanban Board */}
          <div
            className={cn(
              "flex-1 overflow-x-auto overflow-y-hidden flex flex-row",
              preferences.compactMode ? "gap-3 px-4 py-4" : "gap-5 px-6 py-5"
            )}
          >
          {columns.map((col, index) => (
            <div
              key={col.id}
              className={cn("shrink-0", preferences.enableAnimations ? "animate-fade-up" : "")}
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
                <div className="bg-white rounded-lg border border-surface-200 shadow-md p-3">
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
                    className="w-full text-sm text-slate-800 placeholder:text-slate-400 bg-white border border-surface-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        if (activeProjectId) {
                          void addColumn(newColumnTitle, activeProjectId);
                        }
                        setNewColumnTitle("");
                        setAddingColumn(false);
                      }}
                      className="h-7 px-3 rounded-md bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors"
                    >
                      Add column
                    </button>
                    <button
                      onClick={() => { setNewColumnTitle(""); setAddingColumn(false); }}
                      className="w-7 h-7 rounded-md hover:bg-surface-100 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 h-3 text-slate-400 rotate-45" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingColumn(true)}
                  className="w-full h-10 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-surface-300 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add column
                </button>
              )}
            </div>
          )}
        </div>
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

      {/* Bulk actions toolbar */}
      <BulkActionsToolbar />
    </>
  );
}
