import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ActivityItem,
  ChecklistItem,
  Column,
  Comment,
  Invite,
  Member,
  Project,
  Tag,
  Task,
  TaskStatus,
} from "./types";
import { supabase } from "@/lib/supabase";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined) {
  return !!value && UUID_REGEX.test(value);
}
import {
  addChecklistItem as addChecklistItemApi,
  addComment as addCommentApi,
  acceptInvite as acceptInviteApi,
  createActivity,
  createColumn as createColumnApi,
  createProject as createProjectApi,
  createTask as createTaskApi,
  deleteProject as deleteProjectApi,
  deleteTask as deleteTaskApi,
  fetchActivities,
  fetchColumns,
  fetchInvites,
  fetchProjectMembers,
  fetchProjects,
  fetchTags,
  fetchTasks,
  declineInvite as declineInviteApi,
  moveTask as moveTaskApi,
  setTaskAssignees,
  setTaskTags,
  toggleChecklistItem as toggleChecklistItemApi,
  updateTask as updateTaskApi,
} from "./data";
import { getColumnTheme } from "./utils";

interface AppState {
  tasks: Task[];
  columns: Column[];
  projects: Project[];
  members: Member[];
  tags: Tag[];
  activities: ActivityItem[];
  invites: Invite[];
  activeProjectId: string | null;
  currentMemberRole: string | null;
  preferences: {
    compactMode: boolean;
    showCompleted: boolean;
    weekStartsOnMonday: boolean;
    enableAnimations: boolean;
    theme: "mist" | "linen" | "dark";
  };
  selectedTask: Task | null;
  sidebarCollapsed: boolean;
  activeView: "board" | "dashboard";
  searchQuery: string;
  filterPriority: string | null;
  isDataLoading: boolean;

  // Actions
  setSelectedTask: (task: Task | null) => void;
  setProjects: (projects: Project[]) => void;
  setColumns: (columns: Column[]) => void;
  setTasks: (tasks: Task[]) => void;
  setMembers: (members: Member[]) => void;
  setTags: (tags: Tag[]) => void;
  setActivities: (activities: ActivityItem[]) => void;
  setInvites: (invites: Invite[]) => void;
  setCurrentMemberRole: (role: string | null) => void;
  setActiveProject: (projectId: string | null) => void;
  setDataLoading: (isLoading: boolean) => void;
  loadProjects: (userId: string) => Promise<void>;
  loadProjectData: (projectId: string, userId?: string) => Promise<void>;
  loadInvites: (email: string) => Promise<void>;
  addProject: (name: string) => Promise<void>;
  deleteProject: (projectId: string, ownerId: string) => Promise<void>;
  acceptInvite: (invite: Invite, userId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  updatePreferences: (updates: Partial<AppState["preferences"]>) => void;
  updateTask: (taskId: string, updates: Partial<Task>, actor?: Member) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus, actor?: Member) => Promise<void>;
  addColumn: (title: string, projectId: string) => Promise<void>;
  addTask: (task: Omit<Task, "id" | "order">, actor?: Member) => Promise<void>;
  deleteTask: (taskId: string, actor?: Member) => Promise<void>;
  addComment: (taskId: string, text: string, actor?: Member) => Promise<void>;
  toggleChecklistItem: (taskId: string, itemId: string) => Promise<void>;
  addChecklistItem: (taskId: string, text: string) => Promise<void>;
  toggleSidebar: () => void;
  setActiveView: (view: "board" | "dashboard") => void;
  setSearchQuery: (q: string) => void;
  setFilterPriority: (p: string | null) => void;
  reorderTasks: (activeId: string, overId: string, newStatus: TaskStatus) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      columns: [],
      projects: [],
      members: [],
      tags: [],
      activities: [],
      invites: [],
      activeProjectId: null,
      currentMemberRole: null,
      preferences: {
        compactMode: false,
        showCompleted: true,
        weekStartsOnMonday: false,
        enableAnimations: true,
        theme: "mist",
      },
      selectedTask: null,
      sidebarCollapsed: false,
      activeView: "board",
      searchQuery: "",
      filterPriority: null,
      isDataLoading: false,

      setSelectedTask: (task) => set({ selectedTask: task }),

      setProjects: (projects) => set({ projects }),
      setColumns: (columns) => set({ columns }),
      setTasks: (tasks) => set({ tasks }),
      setMembers: (members) => set({ members }),
      setTags: (tags) => set({ tags }),
      setActivities: (activities) => set({ activities }),
      setInvites: (invites) => set({ invites }),
      setCurrentMemberRole: (role) => set({ currentMemberRole: role }),
      setActiveProject: (projectId) => set({ activeProjectId: projectId, selectedTask: null }),
      setDataLoading: (isLoading) => set({ isDataLoading: isLoading }),

      loadProjects: async (userId) => {
        set({ isDataLoading: true });
        try {
          const projects = await fetchProjects(userId);
          set((state) => {
            const current = isUuid(state.activeProjectId)
              ? state.activeProjectId
              : null;
            const exists = current && projects.some((p) => p.id === current);
            return {
              projects,
              activeProjectId: exists ? current : projects[0]?.id ?? null,
            };
          });
        } finally {
          set({ isDataLoading: false });
        }
      },

      loadProjectData: async (projectId, userId) => {
        set({ isDataLoading: true });
        try {
          const [columns, tasks, members, tags, activities] = await Promise.all([
            fetchColumns(projectId),
            fetchTasks(projectId),
            fetchProjectMembers(projectId),
            fetchTags(projectId),
            fetchActivities(projectId),
          ]);
          const currentRole = userId
            ? members.find((m) => m.id === userId)?.role ?? null
            : null;
          set({
            columns,
            tasks,
            members,
            tags,
            activities,
            activeProjectId: projectId,
            currentMemberRole: currentRole,
          });
        } finally {
          set({ isDataLoading: false });
        }
      },

      loadInvites: async (email) => {
        const invites = await fetchInvites(email);
        set({ invites });
      },

      updatePreferences: (updates) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        })),

      addProject: async (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;
        const project = await createProjectApi({ name: trimmedName });
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const projects = user ? await fetchProjects(user.id) : [];
        set({ projects, activeProjectId: project.id, selectedTask: null });
        await get().loadProjectData(project.id, user?.id ?? undefined);
      },

      deleteProject: async (projectId, ownerId) => {
        await deleteProjectApi(projectId);
        const projects = await fetchProjects(ownerId);
        const nextProjectId = projects[0]?.id ?? null;
        set({ projects, activeProjectId: nextProjectId, selectedTask: null });
        if (nextProjectId) {
          await get().loadProjectData(nextProjectId, ownerId);
        } else {
          set({ columns: [], tasks: [], members: [], tags: [], activities: [], currentMemberRole: null });
        }
      },

      acceptInvite: async (invite, userId) => {
        await acceptInviteApi({
          inviteId: invite.id,
          projectId: invite.projectId,
          userId,
        });
        await get().loadProjects(userId);
        await get().loadProjectData(invite.projectId, userId);
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.email) {
          await get().loadInvites(userData.user.email);
        }
      },

      declineInvite: async (inviteId) => {
        await declineInviteApi(inviteId);
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.email) {
          await get().loadInvites(userData.user.email);
        }
      },

      updateTask: async (taskId, updates, actor) => {
        const projectId = get().activeProjectId;
        const taskBefore = get().tasks.find((t) => t.id === taskId);
        await updateTaskApi(taskId, updates);

        if (updates.assignees) {
          await setTaskAssignees(taskId, updates.assignees.map((a) => a.id));
        }
        if (updates.tags) {
          await setTaskTags(taskId, updates.tags.map((t) => t.id));
        }

        if (actor && projectId) {
          await createActivity({
            projectId,
            actorId: actor.id,
            action: "updated",
            target: updates.title ?? taskBefore?.title ?? "Task",
          });
        }

        set((state) => {
          const tasks = state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
          const activity = actor
            ? {
                id: `act-${Date.now()}`,
                user: actor,
                action: "updated",
                target: state.tasks.find((t) => t.id === taskId)?.title ?? "Task",
                createdAt: new Date().toISOString(),
              }
            : null;
          return {
            tasks,
            activities: activity ? [activity, ...state.activities] : state.activities,
            selectedTask: state.selectedTask?.id === taskId
              ? { ...state.selectedTask, ...updates }
              : state.selectedTask,
          };
        });
      },

      moveTask: async (taskId, newStatus, actor) => {
        const state = get();
        const taskBefore = state.tasks.find((t) => t.id === taskId);
        const tasksInColumn = state.tasks.filter((t) => t.status === newStatus);
        await moveTaskApi(taskId, newStatus, tasksInColumn.length);
        if (actor && state.activeProjectId) {
          await createActivity({
            projectId: state.activeProjectId,
            actorId: actor.id,
            action: "moved",
            target: taskBefore?.title ?? "Task",
          });
        }
        set((s) => {
          const taskBefore = s.tasks.find((t) => t.id === taskId);
          const tasks = s.tasks.map((t) =>
            t.id === taskId ? { ...t, status: newStatus, order: tasksInColumn.length } : t
          );
          const activity = taskBefore && actor
            ? {
                id: `act-${Date.now()}`,
                user: actor,
                action: "moved",
                target: `${taskBefore.title}`,
                createdAt: new Date().toISOString(),
              }
            : null;
          return {
            tasks,
            activities: activity ? [activity, ...s.activities] : s.activities,
            selectedTask: s.selectedTask?.id === taskId ? { ...s.selectedTask, status: newStatus } : s.selectedTask,
          };
        });
      },

      addColumn: async (title, projectId) => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;
        const state = get();
        const newColumn = await createColumnApi({
          projectId,
          title: trimmedTitle,
          position: state.columns.length,
        });
        set((s) => ({ columns: [...s.columns, newColumn] }));
      },

      addTask: async (task, actor) => {
        const state = get();
        if (!state.activeProjectId) return;
        const tasksInColumn = state.tasks.filter((t) => t.status === task.status);
        await createTaskApi({
          projectId: state.activeProjectId,
          columnId: task.status,
          title: task.title,
          priority: task.priority,
          assigneeIds: task.assignees.map((a) => a.id),
          order: tasksInColumn.length,
        });
        const { data: userData } = await supabase.auth.getUser();
        await state.loadProjectData(state.activeProjectId, userData?.user?.id ?? undefined);
        if (actor) {
          await createActivity({
            projectId: state.activeProjectId,
            actorId: actor.id,
            action: "added",
            target: task.title,
          });
        }
      },

      deleteTask: async (taskId, actor) => {
        const state = get();
        const taskBefore = state.tasks.find((t) => t.id === taskId);
        await deleteTaskApi(taskId);
        if (actor && state.activeProjectId) {
          await createActivity({
            projectId: state.activeProjectId,
            actorId: actor.id,
            action: "deleted",
            target: taskBefore?.title ?? "Task",
          });
        }
        set((s) => {
          const taskBefore = s.tasks.find((t) => t.id === taskId);
          const tasks = s.tasks.filter((t) => t.id !== taskId);
          const activity = taskBefore && actor
            ? {
                id: `act-${Date.now()}`,
                user: actor,
                action: "deleted",
                target: taskBefore.title,
                createdAt: new Date().toISOString(),
              }
            : null;
          return {
            tasks,
            activities: activity ? [activity, ...s.activities] : s.activities,
            selectedTask: s.selectedTask?.id === taskId ? null : s.selectedTask,
          };
        });
      },

      addComment: async (taskId, text, actor) => {
        if (!actor) return;
        const taskBefore = get().tasks.find((t) => t.id === taskId);
        await addCommentApi(taskId, actor.id, text);
        const projectId = get().activeProjectId;
        if (projectId) {
          await createActivity({
            projectId,
            actorId: actor.id,
            action: "commented on",
            target: taskBefore?.title ?? "Task",
          });
        }
        const newComment: Comment = {
          id: `comment-${Date.now()}`,
          author: actor,
          text,
          createdAt: new Date().toISOString(),
        };
        set((s) => {
          const taskBefore = s.tasks.find((t) => t.id === taskId);
          const tasks = s.tasks.map((t) =>
            t.id === taskId ? { ...t, comments: [...t.comments, newComment] } : t
          );
          const activity = taskBefore
            ? {
                id: `act-${Date.now()}`,
                user: actor,
                action: "commented on",
                target: taskBefore.title,
                createdAt: new Date().toISOString(),
              }
            : null;
          return {
            tasks,
            activities: activity ? [activity, ...s.activities] : s.activities,
            selectedTask:
              s.selectedTask?.id === taskId
                ? { ...s.selectedTask, comments: [...s.selectedTask.comments, newComment] }
                : s.selectedTask,
          };
        });
      },

      toggleChecklistItem: async (taskId, itemId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        const item = task?.checklist.find((i) => i.id === itemId);
        if (!item) return;
        await toggleChecklistItemApi(itemId, !item.done);
        set((s) => {
          const updatedTasks = s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  checklist: t.checklist.map((checkItem) =>
                    checkItem.id === itemId ? { ...checkItem, done: !checkItem.done } : checkItem
                  ),
                }
              : t
          );
          const updatedTask = updatedTasks.find((t) => t.id === taskId);
          return {
            tasks: updatedTasks,
            selectedTask: s.selectedTask?.id === taskId ? updatedTask || null : s.selectedTask,
          };
        });
      },

      addChecklistItem: async (taskId, text) => {
        const task = get().tasks.find((t) => t.id === taskId);
        const position = task?.checklist.length ?? 0;
        await addChecklistItemApi(taskId, text, position);
        const newItem: ChecklistItem = {
          id: `cl-${Date.now()}`,
          text,
          done: false,
        };
        set((s) => {
          const updatedTasks = s.tasks.map((t) =>
            t.id === taskId ? { ...t, checklist: [...t.checklist, newItem] } : t
          );
          const updatedTask = updatedTasks.find((t) => t.id === taskId);
          return {
            tasks: updatedTasks,
            selectedTask: s.selectedTask?.id === taskId ? updatedTask || null : s.selectedTask,
          };
        });
      },

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setActiveView: (view) => set({ activeView: view }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setFilterPriority: (p) => set({ filterPriority: p }),

      reorderTasks: async (activeId, overId, newStatus) => {
        let nextOrder = 0;
        set((s) => {
          const tasks = [...s.tasks];
          const activeIdx = tasks.findIndex((t) => t.id === activeId);
          const overIdx = tasks.findIndex((t) => t.id === overId);

          if (activeIdx === -1) return s;

          const updatedActive = { ...tasks[activeIdx], status: newStatus };
          tasks[activeIdx] = updatedActive;

          if (overIdx !== -1 && activeId !== overId) {
            tasks.splice(activeIdx, 1);
            const newOverIdx = tasks.findIndex((t) => t.id === overId);
            tasks.splice(newOverIdx, 0, updatedActive);
          }

          const columnTasks = tasks
            .filter((t) => t.status === newStatus)
            .map((t, index) => ({ ...t, order: index }));

          const others = tasks.filter((t) => t.status !== newStatus);
          const merged = [...others, ...columnTasks];
          nextOrder = columnTasks.find((t) => t.id === activeId)?.order ?? 0;

          return { tasks: merged };
        });

        await moveTaskApi(activeId, newStatus, nextOrder);
      },
    }),
    {
      name: "taskflow-store",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : (undefined as unknown as Storage)
      ),
      partialize: (state) => ({
        preferences: state.preferences,
        sidebarCollapsed: state.sidebarCollapsed,
        searchQuery: state.searchQuery,
        filterPriority: state.filterPriority,
        activeProjectId: state.activeProjectId,
      }),
    }
  )
);
