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
  Edit,
} from "lucide-react";
import { cn, extractAvatarUrlFromUser, optimizeAvatarUrl } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/components/auth-provider";
import { fetchUserProfile } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ProjectEditModal } from "@/components/modals/project-edit-modal";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
};

const NAV_ITEMS: NavItem[] = [
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
  const updateProject = useAppStore((s) => s.updateProject);
  const loadProjectData = useAppStore((s) => s.loadProjectData);
  const currentMemberRole = useAppStore((s) => s.currentMemberRole);
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [openProjectMenu, setOpenProjectMenu] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Fetch user avatar
  useEffect(() => {
    if (!user?.id) {
      setUserAvatarUrl(null);
      return;
    }

    const metadataAvatar = extractAvatarUrlFromUser(user, 64);
    if (metadataAvatar) {
      setUserAvatarUrl(metadataAvatar);
      return;
    }

    const fetchUserAvatar = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const authAvatar = extractAvatarUrlFromUser(authData?.user ?? null, 64);
        if (authAvatar) {
          setUserAvatarUrl(authAvatar);
          return;
        }
        const profile = await fetchUserProfile(user.id);
        setUserAvatarUrl(optimizeAvatarUrl(profile.avatar_url, 64));
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
    <>
      <aside
        className={cn(
          "sidebar-transition flex flex-col h-full bg-gradient-to-b from-white/80 via-white/70 to-white/60 backdrop-blur-xl border-r border-white/70 shadow-lg relative z-20 shrink-0",
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
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent text-lg tracking-tight">
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
          <div className="pt-6 pb-2">
            <div className="flex items-center justify-between px-2.5 mb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Projects
                </span>
              </div>
              <button
                onClick={() => setAddingProject(true)}
                className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 hover:from-blue-500/40 hover:to-purple-500/40 flex items-center justify-center transition-all border border-blue-200/50 hover:border-blue-300/50"
                aria-label="Add project"
                disabled={!isAuthenticated}
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
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
                          "flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all group duration-200",
                          isActive
                            ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-slate-900 shadow-sm border border-blue-200/50"
                            : "text-slate-500 hover:text-slate-800 hover:bg-white/80 hover:shadow-sm border border-transparent hover:border-slate-200/50",
                        )}
                      >
                        {project.logoUrl ? (
                          <img
                            src={project.logoUrl}
                            alt={project.name}
                            className="w-5 h-5 rounded object-cover shrink-0"
                          />
                        ) : (
                          <span className="text-lg leading-none">
                            {project.emoji}
                          </span>
                        )}
                        <span className={cn("text-sm font-medium truncate flex-1", isActive && "font-semibold")}>
                          {project.name}
                        </span>
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shrink-0 shadow-sm" />
                        )}
                        {currentMemberRole === "owner" && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenProjectMenu(menuOpen ? null : project.id);
                            }}
                            className="w-6 h-6 rounded-lg hover:bg-white/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            aria-label={`Project options for ${project.name}`}
                          >
                            <MoreVertical className="w-4 h-4 text-slate-400" />
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
                              setEditingProjectId(project.id);
                              setOpenProjectMenu(null);
                            }}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 theme-dark:text-slate-200 theme-dark:hover:bg-slate-700/60 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit project
                          </button>
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
          "shrink-0 border-t border-white/70 bg-gradient-to-b from-white/50 to-white/30 p-3",
          collapsed ? "flex justify-center" : "flex items-center gap-3",
        )}
      >
        {!collapsed && (
          <>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden ring-2 ring-white/80 shadow-md"
              style={{ backgroundColor: "#14b8a6" }}
            >
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt="User avatar"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  referrerPolicy="no-referrer"
                  onLoad={() => console.log("[sidebar] avatar loaded:", userAvatarUrl)}
                  onError={() => console.error("[sidebar] avatar failed to load:", userAvatarUrl)}
                  className="w-full h-full object-cover"
                />
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
              <p className="text-sm font-semibold text-slate-800 truncate">
                {user?.user_metadata?.full_name ?? user?.email ?? "User"}
              </p>
              <p className="text-xs text-slate-500 capitalize tracking-wider font-medium">
                {user?.user_metadata?.role ?? "Member"}
              </p>
            </div>
          </>
        )}
        <button
          onClick={toggleSidebar}
          className="w-7 h-7 rounded-lg bg-gradient-to-br from-white/60 to-white/40 hover:from-white/80 hover:to-white/60 flex items-center justify-center transition-all shrink-0 border border-white/70"
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
          )}
        </button>
      </div>
    </aside>

    {editingProjectId && (
      <ProjectEditModal
        project={projects.find(p => p.id === editingProjectId)!}
        onClose={() => setEditingProjectId(null)}
        onSave={async (updates) => {
          await updateProject(editingProjectId, updates);
          setEditingProjectId(null);
          toast.success("Project updated successfully");
        }}
      />
    )}
    </>
  );
}
