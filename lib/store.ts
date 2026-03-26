import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Task, TaskStatus, ChecklistItem, Comment, Member, Column, Project } from "./types";
import { INITIAL_TASKS, MEMBERS, ACTIVITY_FEED } from "./mock-data";
import { DEFAULT_COLUMNS, getColumnTheme } from "./utils";

interface AppState {
  tasks: Task[];
  columns: Column[];
  projects: Project[];
  activeProjectId: string;
  authUser: { email: string; name: string; initials: string } | null;
  isAuthenticated: boolean;
  sessionStartedAt: string | null;
  sessionLastActiveAt: string | null;
  sessionExpired: boolean;
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
  taskCounter: number;

  // Actions
  setSelectedTask: (task: Task | null) => void;
  setProjects: (projects: Project[], activeProjectId?: string) => void;
  setActiveProjectId: (projectId: string) => void;
  setActiveProject: (projectId: string) => void;
  addProject: (name: string) => void;
  deleteProject: (projectId: string) => void;
  signIn: (email: string, password: string) => boolean;
  signOut: () => void;
  touchSession: () => void;
  checkSession: () => void;
  updateAuthProfile: (name: string, email: string) => void;
  updatePreferences: (updates: Partial<AppState["preferences"]>) => void;
  updateTask: (taskId: string, updates: Partial<Task>, actor?: Member) => void;
  moveTask: (taskId: string, newStatus: TaskStatus, actor?: Member) => void;
  addColumn: (title: string) => void;
  addTask: (task: Omit<Task, "id" | "order">, actor?: Member) => void;
  deleteTask: (taskId: string, actor?: Member) => void;
  addComment: (taskId: string, text: string, actor?: Member) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  addChecklistItem: (taskId: string, text: string) => void;
  toggleSidebar: () => void;
  setActiveView: (view: "board" | "dashboard") => void;
  setSearchQuery: (q: string) => void;
  setFilterPriority: (p: string | null) => void;
  reorderTasks: (activeId: string, overId: string, newStatus: TaskStatus) => void;
}

const DEFAULT_TASK_COUNTER = INITIAL_TASKS.length + 1;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: INITIAL_TASKS,
      columns: DEFAULT_COLUMNS,
      projects: [
        {
          id: "b7dadbea-6c00-4233-a41a-ce27e0a01fad",
          name: "Taskflow v2.0",
          description: "Next generation of our flagship product",
          color: "#14b8a6",
          emoji: "🚀",
          members: MEMBERS,
          tasks: INITIAL_TASKS,
          activities: ACTIVITY_FEED,
        },
      ],
      activeProjectId: "b7dadbea-6c00-4233-a41a-ce27e0a01fad",
      authUser: null,
      isAuthenticated: false,
      sessionStartedAt: null,
      sessionLastActiveAt: null,
      sessionExpired: false,
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
      taskCounter: DEFAULT_TASK_COUNTER,

      setSelectedTask: (task) => set({ selectedTask: task }),

      setProjects: (projects, nextActiveId) =>
        set((state) => {
          const activeId = nextActiveId
            ?? (projects.find((p) => p.id === state.activeProjectId)?.id
            ?? projects[0]?.id
            ?? "");
          return {
            projects,
            activeProjectId: activeId || state.activeProjectId,
          };
        }),

      setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),

      signIn: (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const isValid = normalizedEmail === "test@test.com" && password === "test123";
        if (!isValid) return false;
        set({
          authUser: { email: normalizedEmail, name: "Test User", initials: "TU" },
          isAuthenticated: true,
          sessionStartedAt: new Date().toISOString(),
          sessionLastActiveAt: new Date().toISOString(),
          sessionExpired: false,
        });
        return true;
      },

      signOut: () =>
        set({
          authUser: null,
          isAuthenticated: false,
          sessionStartedAt: null,
          sessionLastActiveAt: null,
          sessionExpired: false,
        }),

      touchSession: () =>
        set((state) =>
          state.isAuthenticated
            ? { sessionLastActiveAt: new Date().toISOString() }
            : state
        ),

      checkSession: () =>
        set((state) => {
          if (!state.isAuthenticated || !state.sessionLastActiveAt) return state;
          const lastActive = new Date(state.sessionLastActiveAt).getTime();
          const now = Date.now();
          if (now - lastActive < SESSION_TIMEOUT_MS) return state;
          return {
            authUser: null,
            isAuthenticated: false,
            sessionStartedAt: null,
            sessionLastActiveAt: null,
            sessionExpired: true,
          };
        }),

      updateAuthProfile: (name, email) =>
        set((state) => {
          if (!state.authUser) return state;
          const trimmedName = name.trim();
          const trimmedEmail = email.trim().toLowerCase();
          const initials = trimmedName
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase();
          return {
            authUser: {
              ...state.authUser,
              name: trimmedName || state.authUser.name,
              email: trimmedEmail || state.authUser.email,
              initials: initials || state.authUser.initials,
            },
          };
        }),

      updatePreferences: (updates) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        })),

      setActiveProject: (projectId) =>
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId);
          if (!project) return state;
          return {
            activeProjectId: projectId,
            tasks: project.tasks,
            selectedTask: null,
          };
        }),

      addProject: (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;
        const id = `proj-${Date.now()}`;
        const newProject: Project = {
          id,
          name: trimmedName,
          description: "",
          color: "#14b8a6",
          emoji: "📁",
          members: MEMBERS,
          tasks: [],
          activities: [],
        };
        set((state) => ({
          projects: [...state.projects, newProject],
          activeProjectId: id,
          tasks: [],
          selectedTask: null,
        }));
      },

      deleteProject: (projectId) =>
        set((state) => {
          if (state.projects.length <= 1) return state;
          const nextProjects = state.projects.filter((p) => p.id !== projectId);
          const nextActiveId = state.activeProjectId === projectId
            ? nextProjects[0]?.id
            : state.activeProjectId;
          const nextActiveProject = nextProjects.find((p) => p.id === nextActiveId);
          return {
            projects: nextProjects,
            activeProjectId: nextActiveId,
            tasks: nextActiveProject?.tasks ?? [],
            selectedTask: null,
          };
        }),

      updateTask: (taskId, updates, actor) =>
        set((state) => {
          const activeProject = state.projects.find((p) => p.id === state.activeProjectId);
          const taskBefore = activeProject?.tasks.find((t) => t.id === taskId);
          const tasks = state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
          const activity = taskBefore
            ? {
                id: `act-${Date.now()}`,
                user: actor ?? MEMBERS[0],
                action: "updated",
                target: taskBefore.title,
                createdAt: new Date().toISOString(),
              }
            : null;
          const projects = state.projects.map((p) =>
            p.id === state.activeProjectId
              ? { ...p, tasks, activities: activity ? [activity, ...(p.activities ?? [])] : (p.activities ?? []) }
              : p
          );
          return {
            tasks,
            projects,
            selectedTask: state.selectedTask?.id === taskId ? { ...state.selectedTask, ...updates } : state.selectedTask,
          };
        }),

      moveTask: (taskId, newStatus, actor) => {
        const state = get();
        const tasksInColumn = state.tasks.filter((t) => t.status === newStatus);
        set((s) => {
          const taskBefore = s.tasks.find((t) => t.id === taskId);
          const tasks = s.tasks.map((t) =>
            t.id === taskId ? { ...t, status: newStatus, order: tasksInColumn.length } : t
          );
          const activity = taskBefore
            ? {
                id: `act-${Date.now()}`,
                user: actor ?? MEMBERS[0],
                action: "moved",
                target: `${taskBefore.title} to ${newStatus}`,
                createdAt: new Date().toISOString(),
              }
            : null;
          const projects = s.projects.map((p) =>
            p.id === s.activeProjectId
              ? { ...p, tasks, activities: activity ? [activity, ...(p.activities ?? [])] : (p.activities ?? []) }
              : p
          );
          return {
            tasks,
            projects,
            selectedTask: s.selectedTask?.id === taskId ? { ...s.selectedTask, status: newStatus } : s.selectedTask,
          };
        });
      },

      addColumn: (title) => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;
        const state = get();
        const theme = getColumnTheme(state.columns.length);
        const newColumn: Column = {
          id: `col-${Date.now()}`,
          title: trimmedTitle,
          ...theme,
        };
        set((s) => ({ columns: [...s.columns, newColumn] }));
      },

      addTask: (task, actor) => {
        const state = get();
        const tasksInColumn = state.tasks.filter((t) => t.status === task.status);
        const newTask: Task = {
          ...task,
          id: `task-${state.taskCounter}`,
          order: tasksInColumn.length,
        };
        set((s) => {
          const activity = {
            id: `act-${Date.now()}`,
            user: actor ?? MEMBERS[0],
            action: "added",
            target: newTask.title,
            createdAt: new Date().toISOString(),
          };
          const tasks = [...s.tasks, newTask];
          const projects = s.projects.map((p) =>
            p.id === s.activeProjectId
              ? { ...p, tasks, activities: [activity, ...(p.activities ?? [])] }
              : p
          );
          return { tasks, projects, taskCounter: s.taskCounter + 1 };
        });
      },

      deleteTask: (taskId, actor) =>
        set((s) => {
          const taskBefore = s.tasks.find((t) => t.id === taskId);
          const tasks = s.tasks.filter((t) => t.id !== taskId);
          const activity = taskBefore
            ? {
                id: `act-${Date.now()}`,
                user: actor ?? MEMBERS[0],
                action: "deleted",
                target: taskBefore.title,
                createdAt: new Date().toISOString(),
              }
            : null;
          const projects = s.projects.map((p) =>
            p.id === s.activeProjectId
              ? { ...p, tasks, activities: activity ? [activity, ...(p.activities ?? [])] : (p.activities ?? []) }
              : p
          );
          return {
            tasks,
            projects,
            selectedTask: s.selectedTask?.id === taskId ? null : s.selectedTask,
          };
        }),

      addComment: (taskId, text, actor) => {
        const newComment: Comment = {
          id: `comment-${Date.now()}`,
          author: actor ?? MEMBERS[0],
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
                user: actor ?? MEMBERS[0],
                action: "commented on",
                target: taskBefore.title,
                createdAt: new Date().toISOString(),
              }
            : null;
          const projects = s.projects.map((p) =>
            p.id === s.activeProjectId
              ? { ...p, tasks, activities: activity ? [activity, ...(p.activities ?? [])] : (p.activities ?? []) }
              : p
          );
          return {
            tasks,
            projects,
            selectedTask:
              s.selectedTask?.id === taskId
                ? { ...s.selectedTask, comments: [...s.selectedTask.comments, newComment] }
                : s.selectedTask,
          };
        });
      },

      toggleChecklistItem: (taskId, itemId) =>
        set((s) => {
          const updatedTasks = s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  checklist: t.checklist.map((item) =>
                    item.id === itemId ? { ...item, done: !item.done } : item
                  ),
                }
              : t
          );
          const updatedTask = updatedTasks.find((t) => t.id === taskId);
          const projects = s.projects.map((p) =>
            p.id === s.activeProjectId ? { ...p, tasks: updatedTasks } : p
          );
          return {
            tasks: updatedTasks,
            projects,
            selectedTask: s.selectedTask?.id === taskId ? updatedTask || null : s.selectedTask,
          };
        }),

      addChecklistItem: (taskId, text) => {
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
          const projects = s.projects.map((p) =>
            p.id === s.activeProjectId ? { ...p, tasks: updatedTasks } : p
          );
          return {
            tasks: updatedTasks,
            projects,
            selectedTask: s.selectedTask?.id === taskId ? updatedTask || null : s.selectedTask,
          };
        });
      },

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setActiveView: (view) => set({ activeView: view }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setFilterPriority: (p) => set({ filterPriority: p }),

      reorderTasks: (activeId, overId, newStatus) => {
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

          const projects = s.projects.map((p) =>
            p.id === s.activeProjectId ? { ...p, tasks } : p
          );

          return { tasks, projects };
        });
      },
    }),
    {
      name: "taskflow-store",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : (undefined as unknown as Storage)
      ),
      partialize: (state) => ({
        tasks: state.tasks,
        columns: state.columns,
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        authUser: state.authUser,
        isAuthenticated: state.isAuthenticated,
        sessionStartedAt: state.sessionStartedAt,
        sessionLastActiveAt: state.sessionLastActiveAt,
        sessionExpired: state.sessionExpired,
        preferences: state.preferences,
        sidebarCollapsed: state.sidebarCollapsed,
        searchQuery: state.searchQuery,
        filterPriority: state.filterPriority,
        taskCounter: state.taskCounter,
      }),
    }
  )
);
