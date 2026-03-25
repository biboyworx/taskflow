-- Taskflow schema for Supabase (custom columns + full task data)

create extension if not exists "pgcrypto";

-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  initials text,
  color text,
  role text default 'member',
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, email, initials, color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    upper(substr(coalesce(new.raw_user_meta_data->>'full_name', new.email, ''), 1, 2)),
    '#14b8a6'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  color text default '#14b8a6',
  emoji text default '📁',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table projects
  alter column owner_id set default auth.uid();

create or replace function public.set_project_owner()
returns trigger
language plpgsql
security definer
as $$
begin
  new.owner_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists set_project_owner on projects;
create trigger set_project_owner
  before insert on projects
  for each row execute procedure public.set_project_owner();

create table if not exists project_members (
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text default 'member',
  created_at timestamptz default now(),
  primary key (project_id, user_id)
);

-- Columns
create table if not exists columns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  color text not null,
  dot_color text not null,
  header_bg text not null,
  position integer not null,
  created_at timestamptz default now()
);

-- Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  column_id uuid not null references columns(id) on delete cascade,
  title text not null,
  description text default '',
  priority text not null check (priority in ('urgent', 'high', 'medium', 'low')),
  due_date date,
  order_index integer not null default 0,
  cover_color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists task_assignees (
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (task_id, user_id)
);

-- Tags
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  label text not null,
  color text not null,
  created_at timestamptz default now(),
  unique (project_id, label)
);

create table if not exists task_tags (
  task_id uuid not null references tasks(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

-- Checklist + comments + attachments
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  text text not null,
  done boolean default false,
  position integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  name text not null,
  size text not null,
  type text not null,
  url text not null,
  uploaded_at timestamptz default now()
);

-- Invites (used by /api/invite)
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  email text not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  role text default 'member',
  status text default 'sent',
  created_at timestamptz default now(),
  unique (project_id, email)
);

-- Activity feed
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target text not null,
  created_at timestamptz default now()
);

-- Relationships for PostgREST profile joins
alter table project_members
  drop constraint if exists project_members_user_id_fkey,
  add constraint project_members_user_id_fkey
    foreign key (user_id) references profiles(id) on delete cascade;

alter table task_assignees
  drop constraint if exists task_assignees_user_id_fkey,
  add constraint task_assignees_user_id_fkey
    foreign key (user_id) references profiles(id) on delete cascade;

alter table comments
  drop constraint if exists comments_author_id_fkey,
  add constraint comments_author_id_fkey
    foreign key (author_id) references profiles(id) on delete cascade;

alter table activities
  drop constraint if exists activities_actor_id_fkey,
  add constraint activities_actor_id_fkey
    foreign key (actor_id) references profiles(id) on delete cascade;

-- RLS helpers
create or replace function public.is_project_member(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from project_members pm
    where pm.project_id = pid
      and pm.user_id = auth.uid()
  );
$$;

create or replace function public.is_project_owner(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from projects p
    where p.id = pid
      and p.owner_id = auth.uid()
  );
$$;

create or replace function public.is_project_owner(pid text)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.is_project_owner(pid::uuid);
$$;

create or replace function public.can_accept_invite(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from invites i
    where i.project_id::uuid = pid
      and lower(i.email) = lower(auth.email())
      and i.status = 'sent'
  );
$$;

-- RLS policies
alter table profiles enable row level security;
create policy "profiles:self_read" on profiles
  for select using (id = auth.uid());
create policy "profiles:self_insert" on profiles
  for insert with check (id = auth.uid());
create policy "profiles:member_read" on profiles
  for select using (
    exists (
      select 1
      from project_members pm_self
      join project_members pm_other
        on pm_self.project_id = pm_other.project_id
      where pm_self.user_id = auth.uid()
        and pm_other.user_id = profiles.id
    )
  );
create policy "profiles:self_update" on profiles
  for update using (id = auth.uid());

alter table projects enable row level security;
create policy "projects:member_select" on projects
  for select using (public.is_project_member(id));
create policy "projects:owner_select" on projects
  for select using (owner_id = auth.uid());
create policy "projects:invitee_select" on projects
  for select using (public.can_accept_invite(id));
create policy "projects:insert" on projects
  for insert with check (auth.role() = 'authenticated');
create policy "projects:owner_update" on projects
  for update using (public.is_project_owner(id));
create policy "projects:owner_delete" on projects
  for delete using (owner_id = auth.uid());

alter table project_members enable row level security;
create policy "members:project_select" on project_members
  for select using (public.is_project_member(project_id));
create policy "members:owner_insert" on project_members
  for insert with check (
    exists (
      select 1 from projects p
      where p.id = project_members.project_id
        and p.owner_id = auth.uid()
    )
  );
create policy "members:invite_accept" on project_members
  for insert with check (public.can_accept_invite(project_id) and user_id = auth.uid());
create policy "members:owner_delete" on project_members
  for delete using (
    exists (
      select 1 from projects p
      where p.id = project_members.project_id
        and p.owner_id = auth.uid()
    )
  );

alter table columns enable row level security;
create policy "columns:member_select" on columns
  for select using (public.is_project_member(project_id));
create policy "columns:owner_write" on columns
  for insert with check (public.is_project_owner(project_id));
create policy "columns:owner_update" on columns
  for update using (public.is_project_owner(project_id));
create policy "columns:owner_delete" on columns
  for delete using (public.is_project_owner(project_id));

alter table tasks enable row level security;
create policy "tasks:member_select" on tasks
  for select using (public.is_project_member(project_id));
create policy "tasks:member_write" on tasks
  for insert with check (public.is_project_member(project_id));
create policy "tasks:member_update" on tasks
  for update using (public.is_project_member(project_id));
create policy "tasks:member_delete" on tasks
  for delete using (public.is_project_member(project_id));

alter table task_assignees enable row level security;
create policy "task_assignees:member_select" on task_assignees
  for select using (
    exists (select 1 from tasks t where t.id = task_assignees.task_id and public.is_project_member(t.project_id))
  );
create policy "task_assignees:member_write" on task_assignees
  for insert with check (
    exists (select 1 from tasks t where t.id = task_assignees.task_id and public.is_project_member(t.project_id))
  );
create policy "task_assignees:member_delete" on task_assignees
  for delete using (
    exists (select 1 from tasks t where t.id = task_assignees.task_id and public.is_project_member(t.project_id))
  );

alter table tags enable row level security;
create policy "tags:member_select" on tags
  for select using (public.is_project_member(project_id));
create policy "tags:member_write" on tags
  for insert with check (public.is_project_member(project_id));
create policy "tags:member_update" on tags
  for update using (public.is_project_member(project_id));
create policy "tags:member_delete" on tags
  for delete using (public.is_project_member(project_id));

alter table task_tags enable row level security;
create policy "task_tags:member_select" on task_tags
  for select using (
    exists (select 1 from tasks t where t.id = task_tags.task_id and public.is_project_member(t.project_id))
  );
create policy "task_tags:member_write" on task_tags
  for insert with check (
    exists (select 1 from tasks t where t.id = task_tags.task_id and public.is_project_member(t.project_id))
  );
create policy "task_tags:member_delete" on task_tags
  for delete using (
    exists (select 1 from tasks t where t.id = task_tags.task_id and public.is_project_member(t.project_id))
  );

alter table checklist_items enable row level security;
create policy "checklist:member_select" on checklist_items
  for select using (
    exists (select 1 from tasks t where t.id = checklist_items.task_id and public.is_project_member(t.project_id))
  );
create policy "checklist:member_write" on checklist_items
  for insert with check (
    exists (select 1 from tasks t where t.id = checklist_items.task_id and public.is_project_member(t.project_id))
  );
create policy "checklist:member_update" on checklist_items
  for update using (
    exists (select 1 from tasks t where t.id = checklist_items.task_id and public.is_project_member(t.project_id))
  );
create policy "checklist:member_delete" on checklist_items
  for delete using (
    exists (select 1 from tasks t where t.id = checklist_items.task_id and public.is_project_member(t.project_id))
  );

alter table comments enable row level security;
create policy "comments:member_select" on comments
  for select using (
    exists (select 1 from tasks t where t.id = comments.task_id and public.is_project_member(t.project_id))
  );
create policy "comments:member_write" on comments
  for insert with check (
    exists (select 1 from tasks t where t.id = comments.task_id and public.is_project_member(t.project_id))
  );
create policy "comments:member_update" on comments
  for update using (
    exists (select 1 from tasks t where t.id = comments.task_id and public.is_project_member(t.project_id))
  );
create policy "comments:member_delete" on comments
  for delete using (
    exists (select 1 from tasks t where t.id = comments.task_id and public.is_project_member(t.project_id))
  );

alter table attachments enable row level security;
create policy "attachments:member_select" on attachments
  for select using (
    exists (select 1 from tasks t where t.id = attachments.task_id and public.is_project_member(t.project_id))
  );
create policy "attachments:member_write" on attachments
  for insert with check (
    exists (select 1 from tasks t where t.id = attachments.task_id and public.is_project_member(t.project_id))
  );
create policy "attachments:member_delete" on attachments
  for delete using (
    exists (select 1 from tasks t where t.id = attachments.task_id and public.is_project_member(t.project_id))
  );

alter table activities enable row level security;
create policy "activities:member_select" on activities
  for select using (public.is_project_member(project_id));
create policy "activities:member_write" on activities
  for insert with check (public.is_project_member(project_id));

alter table invites enable row level security;
create policy "invites:invitee_select" on invites
  for select using (lower(email) = lower(auth.email()));
create policy "invites:owner_select" on invites
  for select using (public.is_project_owner(project_id));
create policy "invites:invitee_update" on invites
  for update using (lower(email) = lower(auth.email()));

-- Grants (RLS still applies)
grant usage on schema public to authenticated;

grant select, insert, update, delete on profiles to authenticated;
grant select, insert, update, delete on projects to authenticated;
grant select, insert, update, delete on project_members to authenticated;
grant select, insert, update, delete on columns to authenticated;
grant select, insert, update, delete on tasks to authenticated;
grant select, insert, update, delete on task_assignees to authenticated;
grant select, insert, update, delete on tags to authenticated;
grant select, insert, update, delete on task_tags to authenticated;
grant select, insert, update, delete on checklist_items to authenticated;
grant select, insert, update, delete on comments to authenticated;
grant select, insert, update, delete on attachments to authenticated;
grant select, insert, update, delete on activities to authenticated;
grant select, insert, update, delete on invites to authenticated;
