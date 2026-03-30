"use client";
import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  X, Calendar, Tag as TagIcon, Users, Paperclip,
  CheckSquare, MessageSquare, Plus, Check, Trash2,
  Edit2, ChevronDown, Flag, AlignLeft, Hash
} from "lucide-react";
import { cn, PRIORITY_CONFIG, timeAgo, formatDate } from "@/lib/utils";
import { Task, Priority, TaskStatus, Attachment } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/components/auth-provider";
import { uploadTaskAttachment, deleteAttachment } from "@/lib/data";
import { toast } from "sonner";

interface TaskModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskModal({ task, onClose }: TaskModalProps) {
  const updateTask = useAppStore((s) => s.updateTask);
  const addComment = useAppStore((s) => s.addComment);
  const toggleChecklistItem = useAppStore((s) => s.toggleChecklistItem);
  const addChecklistItem = useAppStore((s) => s.addChecklistItem);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const createTag = useAppStore((s) => s.createTag);
  const columns = useAppStore((s) => s.columns);
  const members = useAppStore((s) => s.members);
  const tags = useAppStore((s) => s.tags);
  const currentMemberRole = useAppStore((s) => s.currentMemberRole);
  const { user } = useAuth();

  // Allow members to edit tasks they're working on
  const canEditTask = currentMemberRole === "owner" || currentMemberRole === "member";

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

  const updateTaskWithActor = (updates: Partial<Task>) => {
    if (!canEditTask) return;
    void updateTask(task.id, updates, actor ?? undefined);
  };

  const [commentText, setCommentText] = useState("");
  const [newCheckItem, setNewCheckItem] = useState("");
  const [addingCheck, setAddingCheck] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const [descValue, setDescValue] = useState(task.description);
  const [editingDesc, setEditingDesc] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagColor, setNewTagColor] = useState("#14b8a6");

  const titleRef = useRef<HTMLInputElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const checkRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const priority = PRIORITY_CONFIG[task.priority];
  const completedItems = task.checklist.filter((i) => i.done).length;
  const progress = task.checklist.length > 0
    ? Math.round((completedItems / task.checklist.length) * 100) : 0;

  useEffect(() => {
    if (editingTitle) titleRef.current?.focus();
  }, [editingTitle]);

  const handleTitleSave = () => {
    if (!canEditTask) return;
    if (titleValue.trim()) updateTaskWithActor({ title: titleValue });
    setEditingTitle(false);
  };

  const handleDescSave = () => {
    if (!canEditTask) return;
    updateTaskWithActor({ description: descValue });
    setEditingDesc(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    void addComment(task.id, commentText, actor ?? undefined);
    setCommentText("");
  };

  const handleAddChecklist = () => {
    if (!canEditTask) return;
    if (!newCheckItem.trim()) return;
    void addChecklistItem(task.id, newCheckItem);
    setNewCheckItem("");
    setAddingCheck(false);
  };

  const handleToggleAssignee = (memberId: string) => {
    if (!canEditTask) return;
    const isAssigned = task.assignees.some((a) => a.id === memberId);
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    const newAssignees = isAssigned
      ? task.assignees.filter((a) => a.id !== memberId)
      : [...task.assignees, member];
    updateTaskWithActor({ assignees: newAssignees });
  };

  const handleToggleTag = (tagId: string) => {
    if (!canEditTask) return;
    const hasTag = task.tags.some((t) => t.id === tagId);
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;
    const newTags = hasTag ? task.tags.filter((t) => t.id !== tagId) : [...task.tags, tag];
    updateTaskWithActor({ tags: newTags });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const attachment = await uploadTaskAttachment(task.id, file);
        newAttachments.push(attachment);
      }

      // Update task with new attachments
      const updatedAttachments = [...task.attachments, ...newAttachments];
      updateTaskWithActor({ attachments: updatedAttachments });
      toast.success(`Uploaded ${newAttachments.length} file(s)`);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload file(s)");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
      const updatedAttachments = task.attachments.filter((a) => a.id !== attachmentId);
      updateTaskWithActor({ attachments: updatedAttachments });
      toast.success("Attachment deleted");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete attachment");
    }
  };

  const handleCreateTag = async () => {
    if (!newTagLabel.trim()) return;
    try {
      setCreatingTag(true);
      await createTag(newTagLabel, newTagColor);
      toast.success(`Tag "${newTagLabel}" created`);
      setNewTagLabel("");
      setNewTagColor("#14b8a6");
    } catch (error) {
      console.error("Tag creation failed:", error);
      toast.error("Failed to create tag");
    } finally {
      setCreatingTag(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[3px] animate-fade-in" />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-white/90 backdrop-blur-xl h-full shadow-modal flex flex-col animate-slide-in overflow-hidden border-l border-white/70">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/70 shrink-0">
          <div className="flex items-center gap-2">
            {/* Status badge */}
            <div className="relative">
              <button
                onClick={() => { if (canEditTask) setShowStatusPicker(!showStatusPicker); }}
                className={cn(
                  "flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-white/70 border border-white/70 text-xs font-medium text-slate-600 transition-colors",
                  canEditTask ? "hover:bg-white/90" : "cursor-not-allowed opacity-60"
                )}
                aria-disabled={!canEditTask}
              >
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  columns.find((c) => c.id === task.status)?.dotColor
                )} />
                {columns.find((c) => c.id === task.status)?.title}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {showStatusPicker && canEditTask && (
                <div className="absolute top-8 left-0 z-10 bg-white/90 backdrop-blur-xl rounded-xl shadow-modal border border-white/70 p-1.5 min-w-[150px] animate-scale-in">
                  {columns.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => {
                        updateTaskWithActor({ status: col.id as TaskStatus });
                        setShowStatusPicker(false);
                      }}
                      className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg hover:bg-white/70 text-sm text-slate-700 transition-colors"
                    >
                      <span className={cn("w-2 h-2 rounded-full", col.dotColor)} />
                      {col.title}
                      {task.status === col.id && <Check className="w-3 h-3 text-brand-500 ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="relative">
              <button
                onClick={() => { if (canEditTask) setShowPriorityPicker(!showPriorityPicker); }}
                className={cn(
                  "flex items-center gap-1 h-7 px-2 rounded-lg text-xs font-semibold border transition-colors",
                  priority.color, priority.bg,
                  canEditTask ? "" : "cursor-not-allowed opacity-60"
                )}
                aria-disabled={!canEditTask}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", priority.dot)} />
                {priority.label}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
              {showPriorityPicker && canEditTask && (
                <div className="absolute top-8 left-0 z-10 bg-white/90 backdrop-blur-xl rounded-xl shadow-modal border border-white/70 p-1.5 min-w-[140px] animate-scale-in">
                  {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => {
                    const conf = PRIORITY_CONFIG[p];
                    return (
                      <button
                        key={p}
                        onClick={() => { updateTaskWithActor({ priority: p }); setShowPriorityPicker(false); }}
                        className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg hover:bg-white/70 text-sm transition-colors"
                      >
                        <span className={cn("w-2 h-2 rounded-full", conf.dot)} />
                        <span className={conf.color}>{conf.label}</span>
                        {task.priority === p && <Check className="w-3 h-3 text-brand-500 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEditTask && (
              <button
                onClick={() => { void deleteTask(task.id, actor ?? undefined); onClose(); }}
                className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/70 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-6 py-5 space-y-6">
            {/* Title */}
            <div>
              {editingTitle && canEditTask ? (
                <input
                  ref={titleRef}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => { if (e.key === "Enter") handleTitleSave(); if (e.key === "Escape") { setTitleValue(task.title); setEditingTitle(false); } }}
                  className="w-full font-display font-bold text-xl text-slate-800 focus:outline-none border-b-2 border-brand-400 pb-1 bg-transparent"
                />
              ) : (
                <div
                  onClick={() => { if (canEditTask) setEditingTitle(true); }}
                  className={cn(
                    "group flex items-start gap-2",
                    canEditTask ? "cursor-text" : "cursor-default"
                  )}
                >
                  <h2 className="font-display font-bold text-xl text-slate-800 leading-snug flex-1">
                    {task.title}
                  </h2>
                  {canEditTask && (
                    <Edit2 className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                  )}
                </div>
              )}
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Due date */}
              <div className="bg-white/70 rounded-xl p-3 border border-white/70">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Due Date
                </div>
                <input
                  type="date"
                  value={task.dueDate || ""}
                  onChange={(e) => updateTaskWithActor({ dueDate: e.target.value || null })}
                  className={cn(
                    "text-sm font-medium text-slate-700 bg-transparent focus:outline-none",
                    canEditTask ? "cursor-pointer" : "cursor-not-allowed opacity-70"
                  )}
                  disabled={!canEditTask}
                />
              </div>

              {/* Assignees */}
              <div className="bg-white/70 rounded-xl p-3 border border-white/70">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    <Users className="w-3.5 h-3.5" />
                    Assigned
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => { if (canEditTask) setShowMemberPicker(!showMemberPicker); }}
                      className={cn(
                        "w-5 h-5 rounded-full bg-white/80 border border-white/70 flex items-center justify-center transition-colors",
                        canEditTask ? "hover:bg-brand-50 hover:border-brand-300" : "cursor-not-allowed opacity-60"
                      )}
                      aria-disabled={!canEditTask}
                    >
                      <Plus className="w-3 h-3 text-slate-400 hover:text-brand-500" />
                    </button>
                    {showMemberPicker && canEditTask && (
                      <div className="absolute top-6 right-0 z-10 bg-white/90 backdrop-blur-xl rounded-xl shadow-modal border border-white/70 p-2 w-52 animate-scale-in">
                        {members.map((m) => {
                          const assigned = task.assignees.some((a) => a.id === m.id);
                          return (
                            <button
                              key={m.id}
                              onClick={() => handleToggleAssignee(m.id)}
                              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg hover:bg-white/70 transition-colors"
                            >
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden"
                                style={{ backgroundColor: m.color }}
                              >
                                {m.avatar ? (
                                  <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                                ) : (
                                  m.initials
                                )}
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-slate-700">{m.name}</p>
                                <p className="text-[11px] text-slate-400">{m.role}</p>
                              </div>
                              {assigned && <Check className="w-3.5 h-3.5 text-brand-500" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {task.assignees.length === 0 && (
                    <p className="text-sm text-slate-400">Unassigned</p>
                  )}
                  {task.assignees.map((a) => (
                    <div
                      key={a.id}
                      title={a.name}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
                      style={{ backgroundColor: a.color, boxShadow: "0 0 0 2px white" }}
                    >
                      {a.avatar ? (
                        <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" />
                      ) : (
                        a.initials
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <Hash className="w-3.5 h-3.5" />
                  Tags
                </div>
                <div className="relative">
                  <button
                    onClick={() => { if (canEditTask) setShowTagPicker(!showTagPicker); }}
                    className={cn(
                      "w-5 h-5 rounded-full bg-white/70 flex items-center justify-center transition-colors",
                      canEditTask ? "hover:bg-brand-50" : "cursor-not-allowed opacity-60"
                    )}
                    aria-disabled={!canEditTask}
                  >
                    <Plus className="w-3 h-3 text-slate-400" />
                  </button>
                  {showTagPicker && canEditTask && (
                    <div className="absolute top-6 right-0 z-10 bg-white/90 backdrop-blur-xl rounded-xl shadow-modal border border-white/70 p-2 w-56 animate-scale-in max-h-80 overflow-y-auto">
                      {tags.length === 0 && !creatingTag && (
                        <div className="px-2.5 py-3 text-sm text-slate-500 text-center border-b border-white/70 mb-2">
                          No tags yet
                        </div>
                      )}
                      {tags.map((tag) => {
                        const hasTag = task.tags.some((t) => t.id === tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => handleToggleTag(tag.id)}
                            className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg hover:bg-white/70 transition-colors"
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="text-sm text-slate-700 flex-1">{tag.label}</span>
                            {hasTag && <Check className="w-3.5 h-3.5 text-brand-500" />}
                          </button>
                        );
                      })}
                      {tags.length > 0 && !creatingTag && (
                        <div className="border-t border-white/70 mt-2 pt-2" />
                      )}
                      {creatingTag ? (
                        <div className="px-2.5 py-2 space-y-2">
                          <input
                            type="text"
                            placeholder="Tag name"
                            value={newTagLabel}
                            onChange={(e) => setNewTagLabel(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateTag();
                            }}
                            className="w-full px-2 py-1.5 text-sm border border-white/70 rounded bg-white/50 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {["#14b8a6", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"].map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setNewTagColor(color)}
                                  className={cn(
                                    "w-5 h-5 rounded-full border-2 transition-all",
                                    newTagColor === color ? "border-slate-700" : "border-transparent"
                                  )}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1.5 pt-1">
                            <button
                              onClick={handleCreateTag}
                              disabled={!newTagLabel.trim()}
                              className="flex-1 px-2 py-1 text-xs bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50 font-medium"
                            >
                              Create
                            </button>
                            <button
                              onClick={() => {
                                setCreatingTag(false);
                                setNewTagLabel("");
                                setNewTagColor("#14b8a6");
                              }}
                              className="flex-1 px-2 py-1 text-xs bg-white/70 text-slate-700 rounded hover:bg-white/90 font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCreatingTag(true)}
                          className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg hover:bg-white/70 transition-colors text-xs text-brand-500 font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Create Tag
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.length === 0 && (
                  <span className="text-sm text-slate-400">No tags</span>
                )}
                {task.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: tag.color + "18", color: tag.color }}
                    onClick={() => { if (canEditTask) handleToggleTag(tag.id); }}
                  >
                    {tag.label}
                    {canEditTask && <X className="w-3 h-3 ml-1" />}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2.5">
                <AlignLeft className="w-3.5 h-3.5" />
                Description
              </div>
              {editingDesc && canEditTask ? (
                <div>
                  <textarea
                    autoFocus
                    rows={4}
                    value={descValue}
                    onChange={(e) => setDescValue(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/70 border border-brand-300 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400/20 transition-all"
                    placeholder="Add a description…"
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleDescSave} className="h-7 px-3 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors">
                      Save
                    </button>
                    <button onClick={() => { setDescValue(task.description); setEditingDesc(false); }} className="h-7 px-3 rounded-lg hover:bg-white/70 text-xs text-slate-500 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => { if (canEditTask) setEditingDesc(true); }}
                  className={cn(
                    "px-3 py-2.5 rounded-xl bg-white/70 transition-colors min-h-[60px]",
                    canEditTask ? "hover:bg-white/90 cursor-text" : "cursor-default"
                  )}
                >
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {task.description || <span className="text-slate-400">Add a description…</span>}
                  </p>
                </div>
              )}
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    <CheckSquare className="w-3.5 h-3.5" />
                    Checklist
                  </div>
                  {task.checklist.length > 0 && (
                    <span className="text-xs text-slate-400">
                      {completedItems}/{task.checklist.length}
                    </span>
                  )}
                </div>
                {canEditTask && (
                  <button
                    onClick={() => setAddingCheck(true)}
                    className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700 font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add item
                  </button>
                )}
              </div>

              {/* Progress bar */}
              {task.checklist.length > 0 && (
                <div className="h-1.5 bg-white/70 rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: progress === 100 ? "#10b981" : "#14b8a6",
                    }}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                {task.checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 group px-2 py-1.5 rounded-lg hover:bg-white/70 transition-colors cursor-pointer"
                    onClick={() => void toggleChecklistItem(task.id, item.id)}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0",
                      item.done
                        ? "bg-brand-500 border-brand-500"
                        : "border-slate-300 group-hover:border-brand-400"
                    )}>
                      {item.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className={cn(
                      "text-sm transition-all flex-1",
                      item.done ? "line-through text-slate-400" : "text-slate-700"
                    )}>
                      {item.text}
                    </span>
                  </div>
                ))}

                {addingCheck && canEditTask && (
                  <div className="flex items-center gap-2.5 px-2 py-1">
                    <div className="w-4 h-4 rounded border border-slate-300 shrink-0" />
                    <input
                      ref={checkRef}
                      autoFocus
                      value={newCheckItem}
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddChecklist();
                        if (e.key === "Escape") { setAddingCheck(false); setNewCheckItem(""); }
                      }}
                      onBlur={() => { if (!newCheckItem.trim()) { setAddingCheck(false); } }}
                      placeholder="Add item…"
                      className="flex-1 text-sm text-slate-700 bg-white/70 border border-brand-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <Paperclip className="w-3.5 h-3.5" />
                  Attachments
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700 font-medium transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {uploading ? "Uploading..." : "Upload"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>

              {task.attachments.length === 0 ? (
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/70 rounded-xl p-4 text-center hover:border-brand-300 hover:bg-brand-50/30 transition-all cursor-pointer"
                >
                  <Paperclip className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-sm text-slate-400">Drop files or click to upload</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {task.attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/70 border border-white/70 hover:bg-white/90 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white border border-white/70 flex items-center justify-center text-xs font-bold text-slate-500 uppercase shrink-0">
                        {att.type.slice(0, 3)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-slate-700 hover:text-brand-500 truncate block"
                        >
                          {att.name}
                        </a>
                        <p className="text-xs text-slate-400">{att.size} · {att.uploadedAt}</p>
                      </div>
                      {canEditTask && (
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                          title="Delete attachment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                <MessageSquare className="w-3.5 h-3.5" />
                Comments
                {task.comments.length > 0 && (
                  <span className="text-slate-400">({task.comments.length})</span>
                )}
              </div>

              <div className="space-y-4 mb-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 animate-fade-in">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 overflow-hidden"
                      style={{ backgroundColor: comment.author?.color ?? "#94a3b8" }}
                    >
                      {comment.author?.avatar ? (
                        <img src={comment.author.avatar} alt={comment.author?.name ?? "Author"} className="w-full h-full object-cover" />
                      ) : (
                        comment.author?.initials ?? "?"
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-800">
                          {comment.author?.name ?? "Unknown"}
                        </span>
                        <span className="text-xs text-slate-400">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed bg-white/70 px-3 py-2.5 rounded-xl rounded-tl-sm">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment input */}
              <div className="flex gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-1 overflow-hidden"
                  style={{ backgroundColor: actor?.color ?? "#14b8a6" }}
                >
                  {actor?.avatar ? (
                    <img src={actor.avatar} alt={actor?.name ?? "User"} className="w-full h-full object-cover" />
                  ) : (
                    actor?.initials ?? "AR"
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    ref={commentRef}
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment();
                    }}
                    placeholder="Write a comment… (⌘+Enter to send)"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/70 border border-white/70 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400/20 focus:border-brand-400 transition-all"
                  />
                  {commentText.trim() && (
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddComment}
                        className="h-7 px-3 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
