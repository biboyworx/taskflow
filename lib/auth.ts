import { supabase } from "@/lib/supabase";
import type { LoginFormValues, SignUpFormValues } from "@/types/auth";

/**
 * Sign in with email & password.
 * Returns the Supabase session data.
 */
export async function loginWithEmail({ email, password }: LoginFormValues) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Create a new account with email, password & metadata.
 * Returns the Supabase session data.
 */
export async function signUpWithEmail({
  email,
  password,
  fullName,
}: Omit<SignUpFormValues, "confirmPassword">) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw error;
}

/**
 * Retrieve the current session (null when unauthenticated).
 */
export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Retrieve the currently authenticated user (null when unauthenticated).
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// used for
// Buffer time (in seconds) before token expiry to proactively refresh the session
// This is to avoid any JWT expiry issues during active use, especially for longer sessions.

const TOKEN_REFRESH_BUFFER_SECONDS = 60;

function isSessionExpiringSoon(expiresAt?: number | null) {
  if (!expiresAt) return true;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return expiresAt - nowInSeconds <= TOKEN_REFRESH_BUFFER_SECONDS;
}

/**
 * Returns a valid access token for outgoing authenticated requests.
 * Refreshes the session when it is missing or near expiry.
 */
export async function getValidAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;

  if (session && !isSessionExpiringSoon(session.expires_at)) {
    return session.access_token;
  }

  const {
    data: { session: refreshedSession },
    error: refreshError,
  } = await supabase.auth.refreshSession();

  if (refreshError) throw refreshError;
  if (!refreshedSession?.access_token) {
    throw new Error("Admin is not authenticated");
  }

  return refreshedSession.access_token;
}
