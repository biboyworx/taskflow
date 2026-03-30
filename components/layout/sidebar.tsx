"use client";
import React, { useState, useEffect } from "react";
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
  MoreVertical,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/components/auth-provider";
import { fetchUserProfile } from "@/lib/data";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/board", label: "Projects", icon: FolderKanban },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const projects = useAppStore((s) => s.projects);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const setActiveProject = useAppStore((s) => s.setActiveProject);
  const addProject = useAppStore((s) => s.addProject);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const loadProjectData = useAppStore((s) => s.loadProjectData);
  const currentMemberRole = useAppStore((s) => s.currentMemberRole);
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [openProjectMenu, setOpenProjectMenu] = useState<string | null>(null);

  // Fetch user avatar
  useEffect(() => {
    if (!user?.id) {
      setUserAvatarUrl(null);
      return;
    }

    const fetchUserAvatar = async () => {
      try {
        const profile = await fetchUserProfile(user.id);
        setUserAvatarUrl(profile.avatar_url || null);
      } catch (error) {
        console.error("Failed to fetch user avatar:", error);
      }
    };

    fetchUserAvatar();
  }, [user?.id]);

  // Close project menu when pathname changes
  useEffect(() => {
    setOpenProjectMenu(null);
  }, [pathname]);

  return (
    <aside
      className={cn(
        "sidebar-transition flex flex-col h-full bg-white/60 backdrop-blur-xl border-r border-white/60 shadow-lg relative z-20 shrink-0",
        collapsed ? "w-16" : "w-64",
      )}
      onClick={() => setOpenProjectMenu(null)}
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
                          void addProject(newProjectName);
                          setNewProjectName("");
                          setAddingProject(false);
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
                        onClick={() => {
                          void addProject(newProjectName);
                          setNewProjectName("");
                          setAddingProject(false);
                        }}
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
                  const menuOpen = openProjectMenu === project.id;
                  return (
                    <div key={project.id} className="relative">
                      <Link
                        href="/board"
                        onClick={() => {
                          setActiveProject(project.id);
                          if (user?.id) {
                            void loadProjectData(project.id, user.id);
                          }
                        }}
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
                        {currentMemberRole === "owner" && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenProjectMenu(menuOpen ? null : project.id);
                            }}
                            className="w-5 h-5 rounded-md hover:bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            aria-label={`Project options for ${project.name}`}
                          >
                            <MoreVertical className="w-3 h-3 text-slate-400" />
                          </button>
                        )}
                      </Link>

                      {/* Project Options Menu */}
                      {currentMemberRole === "owner" && menuOpen && (
                        <div 
                          className="absolute top-full right-0 mt-1 z-50 bg-white/95 theme-dark:bg-slate-800/95 backdrop-blur-xl rounded-lg shadow-lg border border-white/70 theme-dark:border-slate-700/70 py-1 min-w-[180px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (user?.id) {
                                void deleteProject(project.id, user.id);
                                setOpenProjectMenu(null);
                                toast.success("Project deleted successfully");
                              }
                            }}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 theme-dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete project
                          </button>
                        </div>
                      )}
                    </div>
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
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden"
              style={{ backgroundColor: "#14b8a6" }}
            >
              {userAvatarUrl ? (
                <img src={userAvatarUrl} alt="User avatar" className="w-full h-full object-cover" />
              ) : (
                (user?.user_metadata?.full_name ?? user?.email ?? "")
                  .split("@")[0]
                  .split(/[._\s-]+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part: string) => part[0]?.toUpperCase() ?? "")
                  .join("") || "U"
              )}
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
