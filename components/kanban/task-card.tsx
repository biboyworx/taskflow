"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MessageSquare, Paperclip, Calendar, CheckSquare,
  GripVertical
} from "lucide-react";
import { cn, formatDate, isOverdue, isDueSoon, PRIORITY_CONFIG, getChecklistProgress } from "@/lib/utils";
import { Task } from "@/lib/types";
import { useAppStore } from "@/lib/store";

interface TaskCardProps {
  task: Task;
  overlay?: boolean;
}

export function TaskCard({ task, overlay }: TaskCardProps) {
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = PRIORITY_CONFIG[task.priority];
  const progress = getChecklistProgress(task.checklist);
  const overdue = isOverdue(task.dueDate);
  const dueSoon = isDueSoon(task.dueDate);
  const completedChecklist = task.checklist.filter((i) => i.done).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-white/85 backdrop-blur-xl rounded-2xl border border-white/70 shadow-card cursor-pointer select-none",
        "hover:shadow-card-hover hover:border-white transition-all duration-200 hover:-translate-y-0.5",
        isDragging && "opacity-40",
        overlay && "shadow-modal rotate-2 cursor-grabbing"
      )}
      onClick={() => setSelectedTask(task)}
    >
      {/* Cover accent */}
      {task.coverColor && (
        <div
          className="h-1.5 rounded-t-2xl w-full"
          style={{ backgroundColor: task.coverColor }}
        />
      )}

      <div className="p-3.5">
        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold"
                style={{ backgroundColor: tag.color + "18", color: tag.color }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Title + Drag handle */}
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5 text-slate-300" />
          </button>
          <p className="text-sm font-medium text-slate-800 leading-snug flex-1 line-clamp-2">
            {task.title}
          </p>
        </div>

        {/* Priority */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className={cn(
            "inline-flex items-center gap-1 h-5 px-1.5 rounded-md text-[10px] font-semibold border",
            priority.color, priority.bg
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", priority.dot)} />
            {priority.label}
          </span>
        </div>

        {/* Checklist progress */}
        {task.checklist.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <CheckSquare className="w-3 h-3" />
                <span>{completedChecklist}/{task.checklist.length}</span>
              </div>
              <span className="text-[11px] text-slate-400">{progress}%</span>
            </div>
            <div className="h-1 bg-surface-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: progress === 100 ? "#10b981" : "#14b8a6",
                }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/70">
          {/* Assignees */}
          <div className="flex items-center -space-x-1.5">
            {task.assignees.slice(0, 3).map((a) => (
              <div
                key={a.id}
                title={a.name}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-1.5 ring-white shrink-0 overflow-hidden"
                style={{ backgroundColor: a.color, boxShadow: "0 0 0 1.5px white" }}
              >
                {a.avatar ? (
                  <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" />
                ) : (
                  a.initials
                )}
              </div>
            ))}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2.5">
            {task.comments.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <MessageSquare className="w-3 h-3" />
                <span>{task.comments.length}</span>
              </div>
            )}
            {task.attachments.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Paperclip className="w-3 h-3" />
                <span>{task.attachments.length}</span>
              </div>
            )}
            {task.dueDate && (
              <div className={cn(
                "flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md",
                overdue
                  ? "bg-red-50 text-red-600"
                  : dueSoon
                    ? "bg-amber-50 text-amber-600"
                    : "text-slate-400"
              )}>
                <Calendar className="w-3 h-3" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
