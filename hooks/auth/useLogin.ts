import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { loginWithEmail } from "@/lib/auth";
import type { LoginFormValues } from "@/types/auth";

export const AUTH_QUERY_KEY = ["auth", "user"] as const;

/**
 * TanStack Query mutation for email/password login.
 * On success the auth-user query cache is invalidated so all
 * consumers (AuthProvider, ProtectedRoute, etc.) pick up the new session.
 */

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: LoginFormValues) => loginWithEmail(values),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.session);
      void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
}

// add a logic here to get the company_id from the user metadata using this one
// const companyId = data.session?.user?.app_metadata?.role; // loop through this one and make sure to store the data from company_id
// query that company ID from a company table to match it and store it in a variable and use it across the app to make sure that the user is only accessing the data from his company
// and show only the pages that are related to his company and make sure that the user is only accessing the data from his company and not from other companies data

// only use this to query data about the company like details and what not, do not use this as to safeguard anything
// because the RLS policies should be doing the heavy lifting of safeguarding the data and making sure that the user
// is only accessing the data from his company and not from other companies data
