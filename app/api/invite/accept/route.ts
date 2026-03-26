import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";

export async function POST() {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

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
    .upsert(membershipRows, { onConflict: "project_id,user_id" });

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
