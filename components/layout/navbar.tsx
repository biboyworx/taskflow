"use client";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  UserPlus,
  Bell,
  ChevronDown,
  Check,
  X,
  LogOut,
  User,
  Moon,
  Sun,
  Palette,
  Archive,
  Tag,
} from "lucide-react";
import { cn, optimizeAvatarUrl } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { Priority } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { searchProjects, fetchUserProfile, updateMemberRole, removeProjectMember } from "@/lib/data";

// UUID validation helper
const isUuid = (value: string | null | undefined): boolean => {
  if (!value) return false;
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return UUID_REGEX.test(value);
};

// backend
import { useAuth } from "../auth-provider";
import { useLogin } from "@/hooks/auth/useLogin";
import { toast } from "sonner";
import { signInWithGoogle, signUpWithEmail } from "@/lib/auth";

const PRIORITY_FILTERS: {
  label: string;
  value: Priority | null;
  color: string;
}[] = [
  { label: "All", value: null, color: "bg-slate-400" },
  { label: "Urgent", value: "urgent", color: "bg-red-500" },
  { label: "High", value: "high", color: "bg-orange-500" },
  { label: "Medium", value: "medium", color: "bg-amber-500" },
  { label: "Low", value: "low", color: "bg-slate-400" },
];

const THEME_OPTIONS = [
  { label: "Mist", value: "mist", icon: "🌤️" },
  { label: "Linen", value: "linen", icon: "🌅" },
  { label: "Midnight", value: "dark", icon: "🌙" },
];

const ROLE_OPTIONS = [
  { label: "Owner", value: "owner", description: "Full control" },
  { label: "Member", value: "member", description: "Can edit tasks" },
  { label: "Viewer", value: "viewer", description: "View only" },
];

const DEFAULT_MEMBER_COLOR = "#14b8a6";

type ProjectMember = {
  id: string;
  name: string;
  initials: string;
  color: string;
  avatarUrl: string | null;
  role: string;
};

type ProfileRow = {
  full_name: string | null;
  avatar_url: string | null;
  color: string | null;
  initials: string | null;
};

type ProjectMemberRow = {
  user_id: string;
  role: string;
  profiles: ProfileRow | ProfileRow[] | null;
};

const normalizeProfile = (
  profiles: ProjectMemberRow["profiles"],
): ProfileRow | null =>
  Array.isArray(profiles) ? profiles[0] ?? null : profiles ?? null;


export function Navbar() {
  const router = useRouter();
  const [showFilter, setShowFilter] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviteSending, setIsInviteSending] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [selectedMemberMenu, setSelectedMemberMenu] = useState<string | null>(null);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const filterPriority = useAppStore((s) => s.filterPriority);
  const filterArchived = useAppStore((s) => s.filterArchived);
  const filterAssignees = useAppStore((s) => s.filterAssignees);
  const filterTags = useAppStore((s) => s.filterTags);
  const tasks = useAppStore((s) => s.tasks);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const setFilterPriority = useAppStore((s) => s.setFilterPriority);
  const setFilterArchived = useAppStore((s) => s.setFilterArchived);
  const setFilterAssignees = useAppStore((s) => s.setFilterAssignees);
  const setFilterTags = useAppStore((s) => s.setFilterTags);
  const projects = useAppStore((s) => s.projects);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const setActiveProject = useAppStore((s) => s.setActiveProject);
  const members = useAppStore((s) => s.members);
  const currentMemberRole = useAppStore((s) => s.currentMemberRole);
  const loadProjectData = useAppStore((s) => s.loadProjectData);
  const removeProjectMember = useAppStore((s) => s.removeProjectMember);
  const preferences = useAppStore((s) => s.preferences);
  const updatePreferences = useAppStore((s) => s.updatePreferences);
  const activities = useAppStore((s) => s.activities);
  const activeProject = projects.find((p) => p.id === activeProjectId);
  // Get recent activities (last 5)
  const recentActivities = useMemo(() => {
    return activities.slice(0, 5);
  }, [activities]);

  // Compute search results for projects
  const projectSearchResults = useMemo(() => {
    return searchProjects(projects, searchQuery);
  }, [projects, searchQuery]);

  // Handle project selection from search
  const handleSelectProject = useCallback(
    (projectId: string) => {
      setActiveProject(projectId);
      setSearchQuery("");
      setShowSearchResults(false);
      router.push("/board");
    },
    [setActiveProject, setSearchQuery, router]
  );

  // useEffect(() => {
  //   if (!isAuthenticated) return;
  //   const handleActivity = () => touchSession();
  //   const events: Array<keyof WindowEventMap> = ["click", "keydown", "mousemove", "scroll"];
  //   events.forEach((evt) => window.addEventListener(evt, handleActivity));
  //   const interval = window.setInterval(() => checkSession(), 60 * 1000);
  //   return () => {
  //     events.forEach((evt) => window.removeEventListener(evt, handleActivity));
  //     window.clearInterval(interval);
  //   };
  // }, [isAuthenticated, touchSession, checkSession]);

  // useEffect(() => {
  //   if (sessionExpired) {
  //     setShowAuthModal(true);
  //   }
  // }, [sessionExpired]);

  // Handle Authentication
  const { session, isLoading, signOut } = useAuth();
  const isAuthenticated = !!session;
  const userEmail = session?.user?.email ?? "test@test.com";
  const userInitials =
    userEmail
      .split("@")[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "TU";

  // Compute available assignees and tags from tasks
  const { availableAssignees, availableTags } = useMemo(() => {
    const assigneeMap = new Map<string, { id: string; name: string; initials: string; color: string; avatarUrl: string | null }>();
    const tagMap = new Map<string, { id: string; label: string; color: string }>();

    tasks.forEach((task) => {
      task.assignees.forEach((assignee) => {
        if (!assigneeMap.has(assignee.id)) {
          assigneeMap.set(assignee.id, {
            id: assignee.id,
            name: assignee.name,
            initials: assignee.initials,
            color: assignee.color,
            avatarUrl: assignee.avatar || null,
          });
        }
      });
      task.tags.forEach((tag) => {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, tag);
        }
      });
    });

    return {
      availableAssignees: Array.from(assigneeMap.values()),
      availableTags: Array.from(tagMap.values()),
    };
  }, [tasks]);

  // Fetch user avatar
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!session?.user?.id) {
      setUserAvatarUrl(null);
      return;
    }

    const metadataAvatar = optimizeAvatarUrl(
      (session.user.user_metadata?.avatar_url as string | undefined) ?? null,
      64,
    );
    if (metadataAvatar) {
      setUserAvatarUrl(metadataAvatar);
      return;
    }

    const fetchUserAvatar = async () => {
      try {
        const profile = await fetchUserProfile(session.user.id);
        setUserAvatarUrl(optimizeAvatarUrl(profile.avatar_url, 64));
      } catch (error) {
        console.error("Failed to fetch user avatar:", error);
      }
    };

    fetchUserAvatar();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session && !isLoading) {
      toast.warning("Please login first");
    }
  }, [session, isLoading]);

  const loadProjectMembers = useCallback(async () => {
    if (!isAuthenticated || !activeProjectId || !isUuid(activeProjectId)) {
      setProjectMembers([]);
      return;
    }

    const { data, error } = await supabase
      .from("project_members")
      .select(
        "user_id, role, profiles:profiles(id, full_name, avatar_url, color, initials)",
      )
      .eq("project_id", activeProjectId);

    if (error) {
      return;
    }

    const rows = (data ?? []) as ProjectMemberRow[];
    const mapped = rows.map((row) => {
      const profile = normalizeProfile(row.profiles);
      const name = profile?.full_name ?? "User";
      const initials =
        (profile?.initials ??
          name
            .split(/[\s._-]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("")) || "U";

      return {
        id: row.user_id as string,
        name,
        initials,
        color: profile?.color ?? DEFAULT_MEMBER_COLOR,
        avatarUrl: profile?.avatar_url ?? null,
        role: row.role ?? "member",
      };
    });

    setProjectMembers(mapped);
  }, [activeProjectId, isAuthenticated]);

  useEffect(() => {
    void loadProjectMembers();
  }, [loadProjectMembers]);

  // Subscribe to real-time member role changes
  useEffect(() => {
    if (!isAuthenticated || !activeProjectId || !isUuid(activeProjectId)) return;

    const channel = supabase
      .channel(`project-members-${activeProjectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_members",
          filter: `project_id=eq.${activeProjectId}`,
        },
        () => {
          void loadProjectMembers();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeProjectId, isAuthenticated, loadProjectMembers]);

  // Subscribe to current user's role changes
  useEffect(() => {
    if (!isAuthenticated || !activeProjectId || !isUuid(activeProjectId) || !session?.user?.id) return;

    const channel = supabase
      .channel(`user-role-${session.user.id}-${activeProjectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_members",
          filter: `project_id=eq.${activeProjectId} AND user_id=eq.${session.user.id}`,
        },
        () => {
          // Reload project data to update currentMemberRole
          void loadProjectData(activeProjectId, session.user.id);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeProjectId, isAuthenticated, session?.user?.id, loadProjectData]);

  // Close search results when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSearchResults(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !activeProjectId || !isUuid(activeProjectId)) return;
    const channel = supabase
      .channel(`project-members-${activeProjectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_members",
          filter: `project_id=eq.${activeProjectId}`,
        },
        () => {
          void loadProjectMembers();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          void loadProjectMembers();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeProjectId, isAuthenticated, loadProjectMembers]);

  // Handle Login
  const { mutate: login, isPending, isError, error } = useLogin();
  const handleLogin = useCallback(() => {
    const normalizedEmail = authEmail.trim().toLowerCase();

    if (!normalizedEmail || !authPassword) {
      setAuthError("Email and password are required");
      return;
    }

    const payload = {
      email: normalizedEmail,
      password: authPassword,
    };

    login(payload, {
      onSuccess: () => {
        setAuthError("");
        setShowAuthModal(false);
        toast.success("Login Successfully");
      },
      onError: (error) => {
        setAuthError(error.message);
        toast.error(`Something went wrong: ${error.message}`);
      },
    });
  }, [authEmail, authPassword, login]);

  const handleSignUp = useCallback(async () => {
    const normalizedEmail = authEmail.trim().toLowerCase();
    const trimmedName = authName.trim();

    if (!trimmedName || !normalizedEmail || !authPassword) {
      setAuthError("Name, email, and password are required");
      return;
    }

    if (authPassword !== authConfirmPassword) {
      setAuthError("Passwords do not match");
      return;
    }

    setIsSignUpLoading(true);
    try {
      const data = await signUpWithEmail({
        email: normalizedEmail,
        password: authPassword,
        fullName: trimmedName,
      });
      setAuthError("");
      if (data.session) {
        toast.success("Account created and signed in");
        setShowAuthModal(false);
      } else {
        toast.success("Account created. Check your email to confirm.");
        setAuthMode("signin");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign up failed";
      setAuthError(message);
      toast.error(message);
    } finally {
      setIsSignUpLoading(false);
    }
  }, [authEmail, authPassword, authConfirmPassword, authName]);

  const handleGoogleSignIn = useCallback(async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle(`${window.location.origin}/auth/callback`);
    } catch (signInError) {
      const message =
        signInError instanceof Error
          ? signInError.message
          : "Google sign-in failed";
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  }, []);

  const handleInvite = useCallback(async () => {
    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Please enter an email address");
      return;
    }
    if (!activeProjectId || !isUuid(activeProjectId)) {
      toast.error("Select a valid project first");
      return;
    }

    setIsInviteSending(true);
    try {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          projectId: activeProjectId,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Invite failed");
      }

      // Reload project members to show the invited member if they already accepted
      void loadProjectMembers();

      toast.success("Invite sent");
      setInviteEmail("");
      setShowInvite(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invite failed";
      toast.error(message);
    } finally {
      setIsInviteSending(false);
    }
  }, [activeProjectId, inviteEmail, loadProjectMembers]);

  return (
    <>
      <header className="h-[60px] bg-gradient-to-r from-white/80 via-white/70 to-white/60 backdrop-blur-xl border-b border-white/80 flex items-center px-6 gap-5 shrink-0 z-10 relative theme-dark:from-slate-900/80 theme-dark:via-slate-900/70 theme-dark:to-slate-900/60 theme-dark:border-slate-800/80 shadow-sm">
        {/* Project name */}
        <div className="flex items-center gap-3 mr-2 shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-200/50 shadow-sm">
            <span className="text-lg">
              {isAuthenticated ? (activeProject?.emoji ?? "📁") : "🔒"}
            </span>
          </div>
          <div>
            <h1 className="font-display font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent text-base leading-tight theme-dark:from-slate-100 theme-dark:via-slate-200 theme-dark:to-slate-100">
              {isAuthenticated
                ? (activeProject?.name ?? "Project")
                : "Sign in required"}
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 theme-dark:text-slate-400 leading-tight mt-0.5">
              Project Board
            </p>
          </div>
        </div>

        <div className="w-px h-7 bg-gradient-to-b from-slate-200/50 via-slate-300 to-slate-200/50 shrink-0" />

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 theme-dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks or projects…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(!!e.target.value);
            }}
            onFocus={() => {
              if (searchQuery) setShowSearchResults(true);
            }}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/60 theme-dark:bg-slate-800/60 border border-white/80 theme-dark:border-slate-700/80 text-sm text-slate-700 theme-dark:text-slate-100 placeholder:text-slate-400 theme-dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/60 transition-all shadow-sm hover:border-slate-300/50 focus:shadow-md"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setShowSearchResults(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 theme-dark:text-slate-500 theme-dark:hover:text-slate-400" />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showSearchResults && projectSearchResults.length > 0 && (
            <div className="absolute top-10 left-0 z-50 bg-white/95 theme-dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-lg border border-white/70 theme-dark:border-slate-700/70 p-2 min-w-[260px] max-w-sm animate-scale-in">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 theme-dark:text-slate-400 px-3 py-2 border-b border-white/70 theme-dark:border-slate-700/70 mb-1">
                🔍 Recent Projects
              </p>
              {projectSearchResults.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-white/80 theme-dark:hover:bg-slate-700/80 text-sm text-slate-700 theme-dark:text-slate-200 transition-colors text-left border border-transparent hover:border-white/70 theme-dark:hover:border-slate-700/70 duration-150"
                >
                  <span className="text-lg">{project.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{project.name}</p>
                    {project.description && (
                      <p className="text-xs text-slate-500 theme-dark:text-slate-400 truncate">
                        {project.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              "flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-medium border transition-all shadow-sm duration-200",
              filterPriority || filterArchived || filterAssignees.length > 0 || filterTags.length > 0
                ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-300/50 text-blue-700 theme-dark:from-blue-900/40 theme-dark:to-purple-900/40 theme-dark:border-blue-800/60 theme-dark:text-blue-300 shadow-md hover:shadow-lg"
                : "bg-white/60 theme-dark:bg-slate-800/60 border-white/80 theme-dark:border-slate-700/80 text-slate-600 theme-dark:text-slate-300 hover:bg-white/80 theme-dark:hover:bg-slate-700/80 hover:shadow-md",
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
            {(filterPriority || filterArchived || filterAssignees.length > 0 || filterTags.length > 0) && (
              <span className="ml-0.5 w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            )}
          </button>

          {showFilter && (
            <div className="absolute top-10 left-0 z-50 bg-white/90 theme-dark:bg-slate-800/90 backdrop-blur-xl rounded-xl shadow-modal border border-white/70 theme-dark:border-slate-700/70 p-3 min-w-[280px] max-h-[500px] overflow-y-auto animate-scale-in">
              {/* Priority Section */}
              <div className="mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 theme-dark:text-slate-500 px-1 py-1.5 mb-1">
                  Priority
                </p>
                {PRIORITY_FILTERS.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => {
                      setFilterPriority(f.value);
                    }}
                    className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-white/70 theme-dark:hover:bg-slate-700/70 text-sm text-slate-700 theme-dark:text-slate-200 transition-colors"
                  >
                    <span className={cn("w-2 h-2 rounded-full", f.color)} />
                    {f.label}
                    {filterPriority === f.value && (
                      <Check className="w-3.5 h-3.5 text-brand-500 ml-auto" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-white/50 theme-dark:border-slate-700/50 my-2" />

              {/* Archive Section */}
              <div className="mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 theme-dark:text-slate-500 px-1 py-1.5 mb-1">
                  Status
                </p>
                <button
                  onClick={() => setFilterArchived(!filterArchived)}
                  className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-white/70 theme-dark:hover:bg-slate-700/70 text-sm text-slate-700 theme-dark:text-slate-200 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Show Archived
                  {filterArchived && (
                    <Check className="w-3.5 h-3.5 text-brand-500 ml-auto" />
                  )}
                </button>
              </div>

              {availableAssignees.length > 0 && (
                <>
                  <div className="border-t border-white/50 theme-dark:border-slate-700/50 my-2" />
                  {/* Assignee Section */}
                  <div className="mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 theme-dark:text-slate-500 px-1 py-1.5 mb-1">
                      Assignees
                    </p>
                    {availableAssignees.map((assignee) => (
                      <button
                        key={assignee.id}
                        onClick={() => {
                          if (filterAssignees.includes(assignee.id)) {
                            setFilterAssignees(filterAssignees.filter((id) => id !== assignee.id));
                          } else {
                            setFilterAssignees([...filterAssignees, assignee.id]);
                          }
                        }}
                        className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-white/70 theme-dark:hover:bg-slate-700/70 text-sm text-slate-700 theme-dark:text-slate-200 transition-colors"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: assignee.color }}
                        />
                        {assignee.name}
                        {filterAssignees.includes(assignee.id) && (
                          <Check className="w-3.5 h-3.5 text-brand-500 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {availableTags.length > 0 && (
                <>
                  <div className="border-t border-white/50 theme-dark:border-slate-700/50 my-2" />
                  {/* Tags Section */}
                  <div className="mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 theme-dark:text-slate-500 px-1 py-1.5 mb-1">
                      Tags
                    </p>
                    {availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          if (filterTags.includes(tag.id)) {
                            setFilterTags(filterTags.filter((id) => id !== tag.id));
                          } else {
                            setFilterTags([...filterTags, tag.id]);
                          }
                        }}
                        className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-white/70 theme-dark:hover:bg-slate-700/70 text-sm text-slate-700 theme-dark:text-slate-200 transition-colors"
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.label}
                        {filterTags.includes(tag.id) && (
                          <Check className="w-3.5 h-3.5 text-brand-500 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Theme */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-medium border bg-white/60 theme-dark:bg-slate-800/60 border-white/80 theme-dark:border-slate-700/80 text-slate-600 theme-dark:text-slate-300 hover:bg-white/80 theme-dark:hover:bg-slate-700/80 transition-all shadow-sm hover:shadow-md"
          >
            <Palette className="w-4 h-4" />
            Theme
          </button>

          {showThemeMenu && (
            <div className="absolute top-10 left-0 z-50 bg-white/95 theme-dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-lg border border-white/70 theme-dark:border-slate-700/70 p-3 min-w-[240px] animate-scale-in">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 theme-dark:text-slate-400 px-2 py-2 border-b border-white/70 theme-dark:border-slate-700/70 mb-2">
                🎨 Choose Theme
              </p>
              <div className="space-y-2">
                {THEME_OPTIONS.map((t) => {
                  const isSelected = preferences.theme === t.value;
                  const previewColors = {
                    mist: "from-[#f7f4ef] via-white to-[#f0f9f8]",
                    linen: "from-[#fef5e7] via-white to-[#ffe8cc]",
                    dark: "from-slate-900 via-slate-800 to-slate-900",
                  };
                  return (
                    <button
                      key={t.value}
                      onClick={() => {
                        updatePreferences({ theme: t.value as any });
                        setShowThemeMenu(false);
                      }}
                      className={cn(
                        "w-full flex flex-col gap-2 p-3 rounded-lg transition-all duration-200 border-2",
                        isSelected
                          ? "border-blue-500 bg-blue-50/50 theme-dark:bg-blue-900/20"
                          : "border-transparent hover:border-slate-300 theme-dark:hover:border-slate-600 bg-white/50 theme-dark:bg-slate-700/30 hover:bg-white/80 theme-dark:hover:bg-slate-700/50",
                      )}
                    >
                      {/* Preview */}
                      <div className={cn("h-12 rounded-lg shadow-sm border border-white/50 bg-gradient-to-r", previewColors[t.value as keyof typeof previewColors])} />
                      
                      {/* Label and description */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-left flex-1">
                          <p className={cn("font-semibold text-sm", isSelected ? "text-blue-700 theme-dark:text-blue-300" : "text-slate-800 theme-dark:text-slate-200")}>
                            {t.label}
                          </p>
                          <p className="text-xs text-slate-500 theme-dark:text-slate-400">
                            {t.value === "mist" && "Light & airy"}
                            {t.value === "linen" && "Warm & cozy"}
                            {t.value === "dark" && "Dark mode"}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mt-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Members */}
        {isAuthenticated && (
          <div className="flex items-center -space-x-2.5 relative pl-2 border-l border-slate-200/50 theme-dark:border-slate-700/50">
            {members.slice(0, 4).map((m) => (
              <div key={m.id} className="relative">
                <button
                  onClick={() => setSelectedMemberMenu(selectedMemberMenu === m.id ? null : m.id)}
                  title={m.name}
                  className="w-8 h-8 rounded-full ring-2 ring-white theme-dark:ring-slate-800 shrink-0 cursor-pointer hover:scale-110 transition-transform overflow-hidden flex items-center justify-center text-[11px] font-bold text-white shadow-md hover:shadow-lg"
                  style={{ backgroundColor: m.color }}
                >
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    m.initials
                  )}
                </button>
                
                {/* Member Menu */}
                {currentMemberRole === "owner" && selectedMemberMenu === m.id && (
                  <div 
                    className="absolute top-full right-0 mt-1 bg-white/95 theme-dark:bg-slate-800/95 rounded-lg shadow-lg border border-white/70 theme-dark:border-slate-700/70 py-1 z-50 min-w-max"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 theme-dark:text-slate-500 px-3 py-1.5">
                      Role
                    </p>
                    {ROLE_OPTIONS.map((role) => (
                      <button
                        key={role.value}
                        onClick={async () => {
                          if (activeProjectId && isUuid(activeProjectId) && session?.user?.id) {
                            try {
                              await updateMemberRole(activeProjectId, m.id, role.value);
                              // Reload full project data to update members and permissions
                              await loadProjectData(activeProjectId, session.user.id);
                              setSelectedMemberMenu(null);
                              toast.success(`${m.name} role updated to ${role.label}`);
                            } catch (error) {
                              const msg = error instanceof Error ? error.message : "Failed to update role";
                              toast.error(msg);
                            }
                          }
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-xs transition-colors",
                          m.role && m.role.toLowerCase() === role.value.toLowerCase()
                            ? "bg-brand-50 theme-dark:bg-brand-900/50 text-brand-700 theme-dark:text-brand-300 font-medium"
                            : "text-slate-700 theme-dark:text-slate-200 hover:bg-white/50 theme-dark:hover:bg-slate-700/50"
                        )}
                      >
                        <div>{role.label}</div>
                        <div className="text-[10px] text-slate-400 theme-dark:text-slate-500">{role.description}</div>
                      </button>
                    ))}
                    
                    <div className="border-t border-white/50 theme-dark:border-slate-700/50 my-1" />
                    
                    <button
                      onClick={async () => {
                        if (activeProjectId && isUuid(activeProjectId)) {
                          try {
                            await removeProjectMember(activeProjectId, m.id);
                            setSelectedMemberMenu(null);
                            toast.success(`${m.name} removed from project`);
                          } catch (error) {
                            const msg = error instanceof Error ? error.message : "Failed to remove member";
                            toast.error(msg);
                          }
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 theme-dark:hover:bg-red-500/10 transition-colors font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
            {members.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[11px] font-bold text-slate-600 ring-2 ring-white theme-dark:ring-slate-800 shadow-md">
                +{members.length - 4}
              </div>
            )}
          </div>
        )}

        {isAuthenticated && currentMemberRole === "owner" && (
          <div className="relative">
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              Invite
            </button>
            {showInvite && (
              <div className="absolute top-10 right-0 z-50 bg-white/95 theme-dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/70 theme-dark:border-slate-700/70 overflow-hidden w-96 animate-scale-in">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-4">
                  <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Invite Team Member
                  </h3>
                  <p className="text-sm text-emerald-50/80 mt-1">Invite people to collaborate on {activeProject?.name}</p>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-600 theme-dark:text-slate-300 uppercase tracking-widest">
                      Email Address
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isInviteSending) {
                            handleInvite();
                          }
                        }}
                        disabled={isInviteSending}
                        className="flex-1 h-9 px-3 rounded-lg bg-slate-50 theme-dark:bg-slate-700/50 border border-slate-200 theme-dark:border-slate-600 text-sm text-slate-800 theme-dark:text-slate-100 placeholder:text-slate-400 theme-dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all disabled:opacity-50"
                      />
                      <button
                        onClick={handleInvite}
                        disabled={isInviteSending || !inviteEmail.trim()}
                        className="h-9 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isInviteSending ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </div>

                  {/* Team Members Preview */}
                  {projectMembers.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200 theme-dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-600 theme-dark:text-slate-300 uppercase tracking-widest">
                        Team Members ({projectMembers.length})
                      </p>
                      <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                        {projectMembers.map((member) => (
                          <div
                            key={member.id}
                            title={member.name}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 theme-dark:bg-slate-700/50 border border-slate-200 theme-dark:border-slate-600"
                          >
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                member.initials
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 theme-dark:text-slate-200 truncate">
                                {member.name}
                              </p>
                              <p className="text-[10px] text-slate-500 theme-dark:text-slate-400 capitalize">
                                {member.role}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Info note */}
                  <div className="flex gap-2 p-3 rounded-lg bg-blue-50 theme-dark:bg-blue-900/20 border border-blue-200 theme-dark:border-blue-800/50">
                    <Check className="w-4 h-4 text-blue-600 theme-dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 theme-dark:text-blue-300">
                      Invite links expire after 7 days. The invite will be sent to the provided email address.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auth */}
        {!isAuthenticated && (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
          >
            <User className="w-4 h-4" />
            Sign in
          </button>
        )}

        {/* Notifications */}
        {isAuthenticated && (
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 rounded-lg bg-white/60 theme-dark:bg-slate-800/60 border border-white/80 theme-dark:border-slate-700/80 flex items-center justify-center hover:bg-white/80 theme-dark:hover:bg-slate-700/80 transition-all shadow-sm hover:shadow-md">
              <Bell className="w-4 h-4 text-slate-500 theme-dark:text-slate-400" />
              {activities.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 shadow-md" />
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-10 right-0 z-50 bg-white/95 theme-dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-modal border border-white/70 theme-dark:border-slate-700/70 p-3 min-w-[320px] animate-scale-in">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 theme-dark:text-slate-100 text-sm">Notifications</h3>
                  {recentActivities.length > 0 && (
                    <span className="text-xs text-slate-400 theme-dark:text-slate-500 bg-slate-100 theme-dark:bg-slate-700/70 px-2 py-0.5 rounded">
                      {recentActivities.length}
                    </span>
                  )}
                </div>
                
                {recentActivities.length === 0 ? (
                  <p className="text-sm text-slate-400 theme-dark:text-slate-500 py-4 text-center">No new notifications</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {recentActivities.map((activity) => (
                      <div 
                        key={activity.id}
                        className="p-2 rounded-lg bg-white/70 theme-dark:bg-slate-700/70 hover:bg-white/90 theme-dark:hover:bg-slate-700/90 transition-colors"
                      >
                        <p className="text-xs text-slate-800 theme-dark:text-slate-200 mb-1">
                          <span className="font-semibold">{activity.user?.name ?? 'User'}</span> {activity.action}
                        </p>
                        <p className="text-xs text-slate-500 theme-dark:text-slate-400">{activity.target}</p>
                        <p className="text-[10px] text-slate-400 theme-dark:text-slate-500 mt-1">
                          {new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* User */}
        {isAuthenticated && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 h-9 px-2.5 rounded-lg hover:bg-white/80 theme-dark:hover:bg-slate-700/80 border border-transparent hover:border-white/80 theme-dark:hover:border-slate-700/80 transition-all shadow-sm hover:shadow-md"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white overflow-hidden ring-1 ring-white/50 shadow-sm"
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
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userInitials
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 theme-dark:text-slate-500" />
            </button>
            {showUserMenu && (
              <div className="absolute top-10 right-0 z-50 bg-white/95 theme-dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-lg border border-white/70 theme-dark:border-slate-700/70 p-2 min-w-[200px] animate-scale-in">
                <div className="px-3 py-2.5 border-b border-white/70 theme-dark:border-slate-700/70 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 theme-dark:text-slate-500 mb-1">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-800 theme-dark:text-slate-100 truncate break-all\">\n                    {userEmail}
                  </p>
                </div>
                <div className="h-px bg-white/70 theme-dark:bg-slate-700/70 my-1" />
                <button
                  onClick={async () => {
                    await signOut();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 theme-dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Sign in modal */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAuthModal(false);
          }}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[3px]" />
          <div className="relative w-full max-w-sm bg-white/90 theme-dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/70 theme-dark:border-slate-700/70 shadow-modal p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-slate-800 theme-dark:text-slate-100">
                {authMode === "signin" ? "Sign in" : "Sign up"}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/70 theme-dark:hover:bg-slate-700/70 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-400 theme-dark:text-slate-500" />
              </button>
            </div>
            {isError && (
              <div className="mb-6 rounded-lg px-4 py-3 text-sm">
                {error.message || "Something went wrong"}
              </div>
            )}
            <div className="space-y-3">
              {authMode === "signup" && (
                <input
                  type="text"
                  placeholder="Full name"
                  disabled={isPending || isSignUpLoading}
                  value={authName}
                  onChange={(e) => {
                    setAuthName(e.target.value);
                    if (authError) setAuthError("");
                  }}
                  className="w-full h-9 px-3 rounded-lg bg-white/70 border border-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400"
                />
              )}
              <input
                type="email"
                placeholder="Email"
                disabled={isPending || isSignUpLoading}
                value={authEmail}
                onChange={(e) => {
                  setAuthEmail(e.target.value);
                  if (authError) setAuthError("");
                }}
                className="w-full h-9 px-3 rounded-lg bg-white/70 border border-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400"
              />
              <input
                type="password"
                placeholder="Password"
                disabled={isPending || isSignUpLoading}
                value={authPassword}
                onChange={(e) => {
                  setAuthPassword(e.target.value);
                  if (authError) setAuthError("");
                }}
                className="w-full h-9 px-3 rounded-lg bg-white/70 border border-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400"
              />
              {authMode === "signup" && (
                <input
                  type="password"
                  placeholder="Confirm password"
                  disabled={isPending || isSignUpLoading}
                  value={authConfirmPassword}
                  onChange={(e) => {
                    setAuthConfirmPassword(e.target.value);
                    if (authError) setAuthError("");
                  }}
                  className="w-full h-9 px-3 rounded-lg bg-white/70 border border-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400"
                />
              )}
              {authError && <p className="text-xs text-red-500">{authError}</p>}
              <button
                onClick={authMode === "signin" ? handleLogin : handleSignUp}
                disabled={isPending || isSignUpLoading}
                className="w-full h-9 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                {authMode === "signin"
                  ? (isPending ? "Signing in..." : "Sign in")
                  : (isSignUpLoading ? "Creating account..." : "Create account")}
              </button>
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] uppercase tracking-widest text-slate-400">
                  Or
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <button
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isSignUpLoading}
                className="w-full h-9 rounded-lg bg-white/80 border border-white/70 text-sm font-medium text-slate-700 hover:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="w-4 h-4">
                  <svg
                    viewBox="0 0 48 48"
                    className="w-4 h-4"
                    aria-hidden="true"
                  >
                    <path
                      fill="#FFC107"
                      d="M43.611 20.083H42V20H24v8h11.303C33.59 32.88 29.172 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.273 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
                    />
                    <path
                      fill="#FF3D00"
                      d="M6.306 14.691l6.571 4.819C14.702 16.108 19.012 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.273 4 24 4 16.319 4 9.655 8.338 6.306 14.691z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24 44c5.084 0 9.804-1.943 13.314-5.116l-6.149-5.207C29.06 35.091 26.65 36 24 36c-5.138 0-9.534-3.084-11.273-7.494l-6.528 5.028C9.518 39.556 16.227 44 24 44z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.611 20.083H42V20H24v8h11.303c-0.82 2.27-2.358 4.192-4.338 5.677l6.149 5.207C39.591 36.635 44 31.091 44 24c0-1.341-.138-2.651-.389-3.917z"
                    />
                  </svg>
                </span>
                Continue with Google
              </button>
              <p className="text-xs text-slate-400 text-center">
                {authMode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
                <button
                  onClick={() => {
                    setAuthMode(authMode === "signin" ? "signup" : "signin");
                    setAuthError("");
                  }}
                  className="text-brand-600 hover:text-brand-700 font-medium"
                  type="button"
                >
                  {authMode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
