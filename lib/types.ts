export type Priority = "urgent" | "high" | "medium" | "low";
export type ColumnId = string;
export type TaskStatus = ColumnId;

export interface Member {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: string;
  initials: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Comment {
  id: string;
  author: Member | null;
  text: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface Tag {
  id: string;
  label: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignees: Member[];
  dueDate: string | null;
  checklist: ChecklistItem[];
  comments: Comment[];
  attachments: Attachment[];
  tags: Tag[];
  coverColor?: string;
  order: number;
}

export interface Column {
  id: ColumnId;
  title: string;
  color: string;
  dotColor: string;
  headerBg: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  emoji: string;
  members?: Member[];
  tasks?: Task[];
  activities?: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  user: Member | null;
  action: string;
  target: string;
  createdAt: string;
}

export interface Invite {
  id: string;
  projectId: string;
  email: string;
  invitedBy: string;
  role: string;
  status: string;
  createdAt: string;
  projectName?: string;
  projectEmoji?: string;
  projectColor?: string;
}
