import { useQuery } from "@tanstack/react-query";
import { getCurrentSession } from "@/lib/auth";
import { AUTH_QUERY_KEY } from "@/hooks/auth/useLogin";

/**
 * TanStack Query query that keeps the auth session in sync.
 * - `staleTime: Infinity` prevents re-fetching on mount; the
 *   AuthProvider invalidates the key whenever `onAuthStateChange` fires.
 * - `retry: false` avoids hammering Supabase when the user is simply
 *   unauthenticated.
 */
export function useUser() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getCurrentSession,
    staleTime: Infinity,
    retry: false,
  });
}
