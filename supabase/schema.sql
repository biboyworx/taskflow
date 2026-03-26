-- Supabase schema for project members + profiles + invites
-- Run this in Supabase SQL editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  color text default '#14b8a6',
  initials text,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  color text default '#14b8a6',
  emoji text default '📁',
  created_by uuid references auth.users on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text default 'member',
  created_at timestamptz default now(),
  primary key (project_id, user_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  invited_by uuid references auth.users on delete set null,
  role text default 'member',
  status text default 'sent',
  created_at timestamptz default now(),
  accepted_at timestamptz
);

create index if not exists project_members_project_id_idx
  on public.project_members (project_id);

create index if not exists invites_project_id_idx
  on public.invites (project_id);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.invites enable row level security;

-- Profiles: anyone authenticated can read; only owner can insert/update
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Helper to avoid RLS recursion when checking membership
create or replace function public.is_project_member(project_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = is_project_member.project_id
      and pm.user_id = auth.uid()
  );
$$;

-- Project members: allow members of a project to read the roster
create policy "Project members can view their project roster"
  on public.project_members for select
  to authenticated
  using (public.is_project_member(project_members.project_id));

-- Projects: allow members to read; creators can insert/update/delete
create policy "Projects are viewable by members"
  on public.projects for select
  to authenticated
  using (public.is_project_member(projects.id));

create policy "Projects can be created by users"
  on public.projects for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Project owners can update"
  on public.projects for update
  to authenticated
  using (auth.uid() = created_by);

create policy "Project owners can delete"
  on public.projects for delete
  to authenticated
  using (auth.uid() = created_by);

-- Allow users to insert themselves (for invite acceptance)
create policy "Users can join projects they are invited to"
  on public.project_members for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Invites: allow invited user to read their invites by email
create policy "Invited users can read their invites"
  on public.invites for select
  to authenticated
  using (email = (auth.jwt() ->> 'email'));

-- Allow invited user to update their invite (accept)
create policy "Invited users can update their invite"
  on public.invites for update
  to authenticated
  using (email = (auth.jwt() ->> 'email'));

-- Keep a profile row in sync on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    upper(substr(coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), 1, 2))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
