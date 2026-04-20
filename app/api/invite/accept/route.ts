import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { optimizeAvatarUrl } from "@/lib/utils";

// Helper to derive initials from name or email
function deriveInitials(name?: string | null, email?: string | null) {
  const base = (name || email || "User").split("@")[0];
  return (
    base
      .split(/[._\s-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

// Helper to ensure user profile exists
async function ensureProfile(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }
) {
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? null;
  const avatarUrl = optimizeAvatarUrl(
    (user.user_metadata?.avatar_url as string | undefined) ?? null,
    64,
  );
  const initials = deriveInitials(fullName, user.email ?? null);

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: fullName,
      email: user.email ?? null,
      avatar_url: avatarUrl,
      initials,
    });

  if (error) throw error;
}

export async function POST() {
  // FIXED: Await the client and pass 0 arguments
  const supabase = await createServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json(
      { error: "User email missing" },
      { status: 400 },
    );
  }

  // Ensure the user's profile exists
  try {
    await ensureProfile(supabase, user);
  } catch (error) {
    console.error("Failed to ensure profile:", error);
    // Continue anyway - the profile might already exist
  }

  const { data: invites, error: invitesError } = await supabase
    .from("invites")
    .select("id, project_id, role")
    .eq("email", email)
    .eq("status", "sent");

  if (invitesError) {
    return NextResponse.json(
      { error: invitesError.message },
      { status: 400 },
    );
  }

  if (!invites || invites.length === 0) {
    return NextResponse.json({ ok: true, accepted: 0 });
  }

  const membershipRows = invites.map((invite) => ({
    project_id: invite.project_id,
    user_id: user.id,
    role: invite.role ?? "member",
  }));

  const { error: memberError } = await supabase
    .from("project_members")
    .upsert(membershipRows, {
      onConflict: "project_id,user_id",
      ignoreDuplicates: true,
    });

  if (memberError) {
    return NextResponse.json(
      { error: memberError.message },
      { status: 400 },
    );
  }

  const inviteIds = invites.map((invite) => invite.id);
  const { error: updateError } = await supabase
    .from("invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .in("id", inviteIds);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, accepted: invites.length });
}