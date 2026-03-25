"use client";
import React, { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { Priority } from "@/lib/types";

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

export function Navbar() {
  const [showFilter, setShowFilter] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviteSending, setIsInviteSending] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const filterPriority = useAppStore((s) => s.filterPriority);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const setFilterPriority = useAppStore((s) => s.setFilterPriority);
  const projects = useAppStore((s) => s.projects);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const members = useAppStore((s) => s.members);
  const currentMemberRole = useAppStore((s) => s.currentMemberRole);
  const activeProject = projects.find((p) => p.id === activeProjectId);

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

  useEffect(() => {
    if (!session && !isLoading) {
      toast.warning("Please login first");
    }
  }, [session, isLoading]);

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
    if (!activeProjectId) {
      toast.error("Select a project first");
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

      toast.success("Invite sent");
      setInviteEmail("");
      setShowInvite(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invite failed";
      toast.error(message);
    } finally {
      setIsInviteSending(false);
    }
  }, [activeProjectId, inviteEmail]);

  return (
    <>
      <header className="h-[60px] bg-white/70 backdrop-blur-xl border-b border-white/70 flex items-center px-5 gap-4 shrink-0 z-10 relative">
        {/* Project name */}
        <div className="flex items-center gap-2.5 mr-2 shrink-0">
          <span className="text-xl">
            {isAuthenticated ? (activeProject?.emoji ?? "📁") : "🔒"}
          </span>
          <div>
            <h1 className="font-display font-semibold text-slate-800 text-[15px] leading-tight">
              {isAuthenticated
                ? (activeProject?.name ?? "Project")
                : "Sign in required"}
            </h1>
            <p className="text-[11px] text-slate-400 leading-tight">
              Project Board
            </p>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-200/80 shrink-0" />

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-9 pr-3 rounded-lg bg-white/70 border border-white/70 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium border transition-all",
              filterPriority
                ? "bg-brand-50/80 border-brand-200 text-brand-700"
                : "bg-white/70 border-white/70 text-slate-600 hover:bg-white/90",
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
            {filterPriority && (
              <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-brand-500" />
            )}
          </button>

          {showFilter && (
            <div className="absolute top-10 left-0 z-50 bg-white/90 backdrop-blur-xl rounded-xl shadow-modal border border-white/70 p-2 min-w-[160px] animate-scale-in">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-2 py-1.5">
                Priority
              </p>
              {PRIORITY_FILTERS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => {
                    setFilterPriority(f.value);
                    setShowFilter(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-white/70 text-sm text-slate-700 transition-colors"
                >
                  <span className={cn("w-2 h-2 rounded-full", f.color)} />
                  {f.label}
                  {filterPriority === f.value && (
                    <Check className="w-3.5 h-3.5 text-brand-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Members */}
        {isAuthenticated && (
          <div className="flex items-center -space-x-2">
            {members.slice(0, 4).map((m) => (
              <div
                key={m.id}
                title={m.name}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-white shrink-0 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: m.color }}
              >
                {m.initials}
              </div>
            ))}
            {members.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-surface-100 flex items-center justify-center text-[11px] font-bold text-slate-500 ring-2 ring-white">
                +{members.length - 4}
              </div>
            )}
          </div>
        )}

        {isAuthenticated && currentMemberRole === "owner" && (
          <div className="relative">
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite
            </button>
            {showInvite && (
              <div className="absolute top-10 right-0 z-50 bg-white/90 backdrop-blur-xl rounded-xl shadow-modal border border-white/70 p-4 w-72 animate-scale-in">
                <p className="font-display font-semibold text-slate-800 text-sm mb-3">
                  Invite to project
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 h-8 px-3 rounded-lg bg-white/70 border border-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all"
                  />
                  <button
                    onClick={handleInvite}
                    disabled={isInviteSending}
                    className="h-8 px-3 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isInviteSending ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auth */}
        {!isAuthenticated && (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium bg-white/80 border border-white/70 text-slate-600 hover:bg-white transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            Sign in
          </button>
        )}

        {/* Notifications */}
        {isAuthenticated && (
          <button className="relative w-8 h-8 rounded-lg bg-white/70 border border-white/70 flex items-center justify-center hover:bg-white/90 transition-colors">
            <Bell className="w-4 h-4 text-slate-500" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
          </button>
        )}

        {/* User */}
        {isAuthenticated && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 h-8 px-2.5 rounded-lg hover:bg-white/70 border border-transparent hover:border-white/70 transition-all"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: "#14b8a6" }}
              >
                {userInitials}
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showUserMenu && (
              <div className="absolute top-10 right-0 z-50 bg-white/90 backdrop-blur-xl rounded-xl shadow-modal border border-white/70 p-2 min-w-[180px] animate-scale-in">
                <div className="px-2.5 py-2">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {userEmail}
                  </p>
                </div>
                <div className="h-px bg-white/70 my-1" />
                <button
                  onClick={async () => {
                    await signOut();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-slate-700 hover:bg-white/70 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-slate-400" />
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
          <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-2xl border border-white/70 shadow-modal p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-slate-800">
                {authMode === "signin" ? "Sign in" : "Sign up"}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/70 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
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
