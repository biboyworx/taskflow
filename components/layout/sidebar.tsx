"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  FolderKanban,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Zap,
  Hash,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/board", label: "Projects", icon: FolderKanban },
  { href: "/notifications", label: "Notifications", icon: Bell, badge: 3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const projects = useAppStore((s) => s.projects);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const setActiveProject = useAppStore((s) => s.setActiveProject);
  const setActiveProjectId = useAppStore((s) => s.setActiveProjectId);
  const setProjects = useAppStore((s) => s.setProjects);
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const loadProjects = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProjects([]);
      return;
    }

    const { data, error } = await supabase
      .from("projects")
      .select("id, name, description, color, emoji")
      .order("created_at", { ascending: true });

    if (error) {
      return;
    }

    const mapped = (data ?? []).map((project) => ({
      id: project.id as string,
      name: project.name as string,
      description: (project.description as string) ?? "",
      color: (project.color as string) ?? "#14b8a6",
      emoji: (project.emoji as string) ?? "📁",
      members: [],
      tasks: [],
      activities: [],
    }));

    setProjects(mapped, activeProjectId);
    if (!activeProjectId && mapped[0]?.id) {
      setActiveProjectId(mapped[0].id);
    }
  }, [activeProjectId, isAuthenticated, setActiveProjectId, setProjects, user]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleCreateProject = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    const trimmedName = newProjectName.trim();
    if (!trimmedName) return;

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: trimmedName,
        description: "",
        color: "#14b8a6",
        emoji: "📁",
        created_by: user.id,
      })
      .select("id, name, description, color, emoji")
      .single();

    if (error || !data) {
      return;
    }

    await supabase.from("project_members").insert({
      project_id: data.id,
      user_id: user.id,
      role: "owner",
    });

    setNewProjectName("");
    setAddingProject(false);
    await loadProjects();
    setActiveProjectId(data.id as string);
  }, [isAuthenticated, loadProjects, newProjectName, setActiveProjectId, user]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (!isAuthenticated) return;
    await supabase.from("projects").delete().eq("id", projectId);
    await loadProjects();
  }, [isAuthenticated, loadProjects]);

  return (
    <aside
      className={cn(
        "sidebar-transition flex flex-col h-full bg-white/60 backdrop-blur-xl border-r border-white/60 shadow-lg relative z-20 shrink-0",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-[60px] px-4 border-b border-white/70 shrink-0",
          collapsed ? "justify-center" : "gap-3",
        )}
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0 shadow-md">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-slate-900 text-lg tracking-tight">
            Tasqon
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2 min-h-0">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const active =
            pathname === href ||
            (href === "/board" && pathname.startsWith("/board"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all duration-150 group relative",
                collapsed ? "justify-center" : "",
                active
                  ? "bg-white/85 text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/70",
              )}
              title={collapsed ? label : undefined}
            >
              <Icon
                className={cn(
                  "w-4.5 h-4.5 shrink-0",
                  collapsed ? "w-5 h-5" : "w-[18px] h-[18px]",
                )}
              />
              {!collapsed && (
                <span className="text-sm font-medium flex-1">{label}</span>
              )}
              {!collapsed && badge && (
                <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold shadow-sm">
                  {badge}
                </span>
              )}
              {collapsed && badge && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-400 ring-2 ring-white/80" />
              )}
            </Link>
          );
        })}

        {/* Projects section */}
        {!collapsed && (
          <div className="pt-5 pb-2">
            <div className="flex items-center justify-between px-2.5 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Projects
              </span>
              <button
                onClick={() => setAddingProject(true)}
                className="w-5 h-5 rounded-md bg-white/60 hover:bg-white/90 flex items-center justify-center transition-colors"
                aria-label="Add project"
                disabled={!isAuthenticated}
              >
                <Plus className="w-3 h-3 text-slate-400" />
              </button>
            </div>
            <div className="space-y-0.5">
              {!isAuthenticated && (
                <div className="px-2.5 py-3 rounded-xl bg-white/70 border border-white/70 text-xs text-slate-400">
                  Sign in to view and manage projects.
                </div>
              )}

              {addingProject && (
                <div className="px-2.5">
                  <div className="bg-white/80 backdrop-blur-xl border border-white/70 rounded-xl p-2 shadow-card animate-scale-in">
                    <input
                      autoFocus
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          void handleCreateProject();
                        }
                        if (e.key === "Escape") {
                          setNewProjectName("");
                          setAddingProject(false);
                        }
                      }}
                      placeholder="Project name"
                      className="w-full text-sm text-slate-700 placeholder:text-slate-400 bg-white/70 border border-white/70 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
                      disabled={!isAuthenticated}
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => void handleCreateProject()}
                        className="h-7 px-3 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors"
                        disabled={!isAuthenticated}
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setNewProjectName("");
                          setAddingProject(false);
                        }}
                        className="w-7 h-7 rounded-lg hover:bg-white/70 flex items-center justify-center transition-colors"
                        aria-label="Cancel"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-400 rotate-45" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isAuthenticated &&
                projects.map((project) => {
                  const isActive = project.id === activeProjectId;
                  return (
                    <Link
                      key={project.id}
                      href="/board"
                      onClick={() => setActiveProject(project.id)}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all group",
                        isActive
                          ? "bg-white/85 text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800 hover:bg-white/70",
                      )}
                    >
                      <span className="text-base leading-none">
                        {project.emoji}
                      </span>
                      <span className="text-sm font-medium truncate flex-1">
                        {project.name}
                      </span>
                      {isActive && (
                        <Circle className="w-1.5 h-1.5 fill-brand-500 text-brand-500 shrink-0" />
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void handleDeleteProject(project.id);
                        }}
                        className="w-5 h-5 rounded-md hover:bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        aria-label={`Delete ${project.name}`}
                      >
                        <X className="w-3 h-3 text-slate-400" />
                      </button>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}
      </nav>

      {/* User avatar + collapse button */}
      <div
        className={cn(
          "shrink-0 border-t border-white/70 p-3",
          collapsed ? "flex justify-center" : "flex items-center gap-3",
        )}
      >
        {!collapsed && (
          <>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: "#14b8a6" }}
            >
              {(user?.user_metadata?.full_name ?? user?.email ?? "")
                .split("@")[0]
                .split(/[._\s-]+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part: string) => part[0]?.toUpperCase() ?? "")
                .join("") || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {user?.user_metadata?.full_name ?? user?.email ?? "User"}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.user_metadata?.role ?? "Member"}
              </p>
            </div>
          </>
        )}
        <button
          onClick={toggleSidebar}
          className="w-7 h-7 rounded-lg bg-white/60 hover:bg-white/90 flex items-center justify-center transition-colors shrink-0"
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>
      </div>
    </aside>
  );
}
