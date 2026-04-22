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
 * Update the current user's profile.
 * Updates both auth metadata and the profiles table to ensure consistency.
 * Note: email changes may require confirmation depending on Supabase settings.
 */
export async function updateUserProfile({
  fullName,
  email,
}: {
  fullName?: string;
  email?: string;
}) {
  // Get current user first
  const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!currentUser) throw new Error("Not authenticated");

  // Update auth user
  const { data, error } = await supabase.auth.updateUser({
    email,
    data: fullName ? { full_name: fullName } : undefined,
  });
  if (error) throw error;

  // Also update the profiles table to keep it in sync
  // Build update object with only the fields that are being changed
  const profileUpdate: Record<string, any> = {};
  if (fullName !== undefined) profileUpdate.full_name = fullName;
  if (email !== undefined) profileUpdate.email = email;

  // Only update if there are fields to update
  if (Object.keys(profileUpdate).length > 0) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", currentUser.id);

    if (profileError) throw profileError;
  }

  return data;
}

/**
 * Sign in with Google OAuth.
 */
export async function signInWithGoogle(redirectTo?: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      ...(redirectTo ? { redirectTo } : {}),
      scopes: "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) throw error;
  return data;
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
