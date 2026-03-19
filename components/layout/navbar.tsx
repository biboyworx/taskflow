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
import type { LoginFormValues } from "@/types/auth";
import { toast } from "sonner";

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const searchQuery = useAppStore((s) => s.searchQuery);
  const filterPriority = useAppStore((s) => s.filterPriority);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const setFilterPriority = useAppStore((s) => s.setFilterPriority);
  const authUser = useAppStore((s) => s.authUser);
  const signIn = useAppStore((s) => s.signIn);
  const signOut = useAppStore((s) => s.signOut);
  const touchSession = useAppStore((s) => s.touchSession);
  const checkSession = useAppStore((s) => s.checkSession);
  const sessionExpired = useAppStore((s) => s.sessionExpired);
  const projects = useAppStore((s) => s.projects);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
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

  // Handle Authenticaion
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!session && !isLoading) {
      setIsAuthenticated(false);
      toast.warning("Please login first");
    }
  }, [session, isLoading]);

  // Handle Login
  const { mutate: login, isPending, isError, error } = useLogin();
  const handleLogin = useCallback(() => {
    const payload = {
      email: authEmail,
      password: authPassword,
    };

    login(payload, {
      onSuccess: () => {
        setIsAuthenticated(true);
        toast.success("Login Successfully");
      },
      onError: (error) => {
        toast.error(`Something went wrong: ${error.message}`);
      },
    });
  }, []);

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
              Kanban Board
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
            {(activeProject?.members ?? []).slice(0, 4).map((m) => (
              <div
                key={m.id}
                title={m.name}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-white shrink-0 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: m.color }}
              >
                {m.initials}
              </div>
            ))}
            {(activeProject?.members?.length ?? 0) > 4 && (
              <div className="w-7 h-7 rounded-full bg-surface-100 flex items-center justify-center text-[11px] font-bold text-slate-500 ring-2 ring-white">
                +{(activeProject?.members.length ?? 0) - 4}
              </div>
            )}
          </div>
        )}

        {isAuthenticated && (
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
                    onClick={() => {
                      setInviteEmail("");
                      setShowInvite(false);
                    }}
                    className="h-8 px-3 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                  >
                    Send
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
                {authUser?.initials ?? "TU"}
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showUserMenu && (
              <div className="absolute top-10 right-0 z-50 bg-white/90 backdrop-blur-xl rounded-xl shadow-modal border border-white/70 p-2 min-w-[180px] animate-scale-in">
                <div className="px-2.5 py-2">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {authUser?.email ?? "test@test.com"}
                  </p>
                </div>
                <div className="h-px bg-white/70 my-1" />
                <button
                  onClick={() => {
                    signOut();
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
                Sign in
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
              {sessionExpired && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
                  Session expired due to inactivity. Please sign in again.
                </p>
              )}
              <input
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-white/70 border border-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400"
              />
              <input
                type="password"
                placeholder="Password"
                disabled={isPending}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-white/70 border border-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400"
              />
              {authError && <p className="text-xs text-red-500">{authError}</p>}
              <button
                onClick={handleLogin}
                className="w-full h-9 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
