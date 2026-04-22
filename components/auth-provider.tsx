"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { signOut as signOutApi } from "@/lib/auth";
import { useUser } from "@/hooks/auth/useUser";
import { AUTH_QUERY_KEY } from "@/hooks/auth/useLogin";
import { syncUserProfile } from "@/lib/data";
import { extractAvatarUrlFromUser } from "@/lib/utils";
import { toast } from "sonner";

import type { AuthContextValue } from "@/types/auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provides auth state to the entire app.
 *
 * - Resolves the initial session via `useUser` (TanStack Query).
 * - Subscribes to `onAuthStateChange` so that login / logout / token
 *   refresh events immediately propagate through the query cache.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: session, isLoading, isFetching } = useUser();
  const hasAcceptedInvitesRef = useRef<string | null>(null);

  // Listen for Supabase auth events and keep the cache in sync
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || isLoading || isFetching) return;
    if (hasAcceptedInvitesRef.current === userId) return;
    hasAcceptedInvitesRef.current = userId;
    fetch("/api/invite/accept", { method: "POST" }).catch(() => {});
  }, [session?.user?.id, isLoading, isFetching]);

  useEffect(() => {
    const user = session?.user;
    if (!user || isLoading || isFetching) return;
    syncUserProfile(user).catch((error) => {
      console.warn("Failed to sync profile:", error);
    });
  }, [session?.user, isLoading, isFetching]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const user = session?.user;
    if (!user || isLoading || isFetching) return;
    const refreshRequested = window.sessionStorage.getItem("profileRefreshRequested");
    if (!refreshRequested) return;

    const avatarUrl = extractAvatarUrlFromUser(user, 64);
    if (avatarUrl) {
      toast.success("Google profile refreshed.");
    } else {
      toast.error("Google profile did not return an avatar.");
    }
    window.sessionStorage.removeItem("profileRefreshRequested");
  }, [session?.user, isLoading, isFetching]);

  useEffect(() => {
    const accessToken = session?.provider_token ?? null;
    const refreshToken = session?.provider_refresh_token ?? null;
    if (!accessToken && !refreshToken) return;
    void fetch("/api/google/store-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, refreshToken }),
    }).catch(() => {});
  }, [session?.provider_token, session?.provider_refresh_token]);


  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session: session ?? null,
      isAuthenticated: !!session,
      isLoading: isLoading || isFetching,
      signOut: signOutApi,
    }),
    [session, isLoading, isFetching],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Convenience hook – throws when used outside AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an <AuthProvider />");
  }
  return ctx;
}
