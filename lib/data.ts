import { supabase } from "@/lib/supabase";
import { DEFAULT_COLUMNS, getColumnTheme } from "@/lib/utils";
import type {
  ActivityItem,
  Attachment,
  ChecklistItem,
  Column,
  Comment,
  Invite,
  Member,
  Project,
  Tag,
  Task,
  TaskStatus,
} from "@/lib/types";

const PRIORITY_VALUES = ["urgent", "high", "medium", "low"] as const;

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  initials: string | null;
  color: string | null;
  role: string | null;
};

async function ensureProfile(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? null;
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;
  const initials = deriveInitials(fullName, user.email ?? null);

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: fullName,
      email: user.email ?? null,
      avatar_url: avatarUrl,
      initials,
    });

  if (error) throw error;
}

function deriveInitials(name?: string | null, email?: string | null) {
  const base = (name || email || "User").split("@")[0];
  return (
    base
      .split(/[._\s-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

function mapProfileToMember(profile: ProfileRow): Member {
  return {
    id: profile.id,
    name: profile.full_name || profile.email?.split("@")[0] || "User",
    avatar: profile.avatar_url || "",
    color: profile.color || "#14b8a6",
    role: profile.role || "Member",
    initials: profile.initials || deriveInitials(profile.full_name, profile.email),
  };
}

export async function fetchProjects(userId: string) {
  const { data, error } = await supabase
    .from("project_members")
    .select("project:projects(*)")
    .eq("user_id", userId);

  if (error) throw error;

  const projects = (data || [])
    .map((row: any) => row.project)
    .filter(Boolean);
  return projects as unknown as Project[];
}

export async function createProject({
  name,
  description = "",
  color = "#14b8a6",
  emoji = "📁",
}: {
  name: string;
  description?: string;
  color?: string;
  emoji?: string;
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Not authenticated");

  await ensureProfile(user);

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ owner_id: user.id, name, description, color, emoji })
    .select("*")
    .single();

  if (error) throw error;

  const { error: memberError } = await supabase
    .from("project_members")
    .insert({ project_id: project.id, user_id: user.id, role: "owner" });

  if (memberError) throw memberError;

  const columnRows = DEFAULT_COLUMNS.map((col, idx) => ({
    project_id: project.id,
    title: col.title,
    color: col.color,
    dot_color: col.dotColor,
    header_bg: col.headerBg,
    position: idx,
  }));

  const { error: columnError } = await supabase
    .from("columns")
    .insert(columnRows);

  if (columnError) throw columnError;

  return project as Project;
}

export async function deleteProject(projectId: string) {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

export async function fetchProjectMembers(projectId: string) {
  const { data, error } = await supabase
    .from("project_members")
    .select("role, profile:profiles(id, full_name, email, avatar_url, initials, color, role)")
    .eq("project_id", projectId);

  if (error) throw error;

  const rows = (data || []) as unknown as Array<{ role: string; profile: ProfileRow | null }>;
  return rows
    .filter((row) => row.profile)
    .map((row) => {
      const member = mapProfileToMember(row.profile as ProfileRow);
      return { ...member, role: row.role };
    });
}

export async function fetchTags(projectId: string) {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as Tag[];
}

export async function fetchColumns(projectId: string) {
  const { data, error } = await supabase
    .from("columns")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data || []).map((col) => ({
    id: col.id,
    title: col.title,
    color: col.color,
    dotColor: col.dot_color,
    headerBg: col.header_bg,
  })) as Column[];
}

export async function createColumn({
  projectId,
  title,
  position,
}: {
  projectId: string;
  title: string;
  position: number;
}) {
  const theme = getColumnTheme(position);
  const { data, error } = await supabase
    .from("columns")
    .insert({
      project_id: projectId,
      title,
      color: theme.color,
      dot_color: theme.dotColor,
      header_bg: theme.headerBg,
      position,
    })
    .select("*")
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    color: data.color,
    dotColor: data.dot_color,
    headerBg: data.header_bg,
  } as Column;
}

export async function fetchTasks(projectId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "*, assignees:task_assignees(user_id, profile:profiles(id, full_name, email, avatar_url, initials, color, role)), tags:task_tags(tag:tags(id, label, color)), checklist:checklist_items(*), comments:comments(id, text, created_at, author:profiles(id, full_name, email, avatar_url, initials, color, role)), attachments:attachments(*)"
    )
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  if (error) throw error;

  return (data || []).map((row) => {
    const assignees = (row.assignees || [])
      .map((assignee: { profile: ProfileRow | null }) => assignee.profile)
      .filter(Boolean)
      .map(mapProfileToMember);

    const tags = (row.tags || [])
      .map((t: { tag: Tag | null }) => t.tag)
      .filter(Boolean) as Tag[];

    const checklist = (row.checklist || []).map((item: ChecklistItem) => ({
      id: item.id,
      text: item.text,
      done: item.done,
    }));

    const comments = (row.comments || []).map((comment: any) => ({
      id: comment.id,
      text: comment.text,
      createdAt: comment.created_at,
      author: comment.author ? mapProfileToMember(comment.author) : null,
    }));

    const attachments = (row.attachments || []).map((attachment: any) => ({
      id: attachment.id,
      name: attachment.name,
      size: attachment.size,
      type: attachment.type,
      uploadedAt: attachment.uploaded_at,
      url: attachment.url,
    }));

    return {
      id: row.id,
      title: row.title,
      description: row.description || "",
      status: row.column_id,
      priority: PRIORITY_VALUES.includes(row.priority)
        ? row.priority
        : "medium",
      assignees,
      dueDate: row.due_date,
      checklist,
      comments,
      attachments,
      tags,
      coverColor: row.cover_color || undefined,
      order: row.order_index ?? 0,
    } as Task;
  });
}

export async function fetchActivities(projectId: string) {
  const { data, error } = await supabase
    .from("activities")
    .select("id, action, target, created_at, actor:profiles(id, full_name, email, avatar_url, initials, color, role)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    action: row.action,
    target: row.target,
    createdAt: row.created_at,
    user: row.actor ? mapProfileToMember(row.actor) : null,
  })) as ActivityItem[];
}

export async function fetchInvites(email: string) {
  const { data, error } = await supabase
    .from("invites")
    .select("*, project:projects(id, name, emoji, color)")
    .eq("email", email)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    projectId: row.project_id,
    email: row.email,
    invitedBy: row.invited_by,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    projectName: row.project?.name,
    projectEmoji: row.project?.emoji,
    projectColor: row.project?.color,
  })) as Invite[];
}

export async function acceptInvite({
  inviteId,
  projectId,
  userId,
}: {
  inviteId: string;
  projectId: string;
  userId: string;
}) {
  const { error: memberError } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, user_id: userId, role: "member" });

  if (memberError) throw memberError;

  const { error: inviteError } = await supabase
    .from("invites")
    .update({ status: "accepted" })
    .eq("id", inviteId);

  if (inviteError) throw inviteError;
}

export async function declineInvite(inviteId: string) {
  const { error } = await supabase
    .from("invites")
    .update({ status: "declined" })
    .eq("id", inviteId);
  if (error) throw error;
}

export async function createTask({
  projectId,
  columnId,
  title,
  priority,
  assigneeIds,
  order,
}: {
  projectId: string;
  columnId: string;
  title: string;
  priority: Task["priority"];
  assigneeIds: string[];
  order: number;
}) {
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      column_id: columnId,
      title,
      description: "",
      priority,
      order_index: order,
    })
    .select("*")
    .single();

  if (error) throw error;

  if (assigneeIds.length > 0) {
    const { error: assigneeError } = await supabase
      .from("task_assignees")
      .insert(assigneeIds.map((userId) => ({ task_id: task.id, user_id: userId })));
    if (assigneeError) throw assigneeError;
  }

  return task;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
  if (updates.status !== undefined) payload.column_id = updates.status as TaskStatus;
  if (updates.coverColor !== undefined) payload.cover_color = updates.coverColor;
  if (updates.order !== undefined) payload.order_index = updates.order;

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", taskId);

  if (error) throw error;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export async function moveTask(taskId: string, columnId: string, order: number) {
  const { error } = await supabase
    .from("tasks")
    .update({ column_id: columnId, order_index: order })
    .eq("id", taskId);
  if (error) throw error;
}

export async function addComment(taskId: string, authorId: string, text: string) {
  const { error } = await supabase
    .from("comments")
    .insert({ task_id: taskId, author_id: authorId, text });
  if (error) throw error;
}

export async function addChecklistItem(taskId: string, text: string, position: number) {
  const { error } = await supabase
    .from("checklist_items")
    .insert({ task_id: taskId, text, position });
  if (error) throw error;
}

export async function toggleChecklistItem(itemId: string, done: boolean) {
  const { error } = await supabase
    .from("checklist_items")
    .update({ done })
    .eq("id", itemId);
  if (error) throw error;
}

export async function setTaskAssignees(taskId: string, userIds: string[]) {
  const { error: deleteError } = await supabase
    .from("task_assignees")
    .delete()
    .eq("task_id", taskId);
  if (deleteError) throw deleteError;

  if (userIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("task_assignees")
    .insert(userIds.map((userId) => ({ task_id: taskId, user_id: userId })));

  if (insertError) throw insertError;
}

export async function setTaskTags(taskId: string, tagIds: string[]) {
  const { error: deleteError } = await supabase
    .from("task_tags")
    .delete()
    .eq("task_id", taskId);
  if (deleteError) throw deleteError;

  if (tagIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("task_tags")
    .insert(tagIds.map((tagId) => ({ task_id: taskId, tag_id: tagId })));

  if (insertError) throw insertError;
}

export async function createActivity({
  projectId,
  actorId,
  action,
  target,
}: {
  projectId: string;
  actorId: string;
  action: string;
  target: string;
}) {
  const { error } = await supabase
    .from("activities")
    .insert({ project_id: projectId, actor_id: actorId, action, target });
  if (error) throw error;
}
