-- AduanaDocs production schema for Supabase Postgres.
-- Apply with Supabase SQL editor/CLI after creating the project.
-- Security model: every business row belongs to a workspace. Access flows through workspace_members and auth.uid().

create extension if not exists pgcrypto;

create type public.workspace_role as enum ('owner', 'admin', 'operator', 'client_viewer');
create type public.operation_kind as enum ('importacion', 'exportacion', 'transito', 'temporal');
create type public.document_status as enum ('pending', 'received', 'observed');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  plan text not null default 'starter',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'operator',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  contact text not null default '',
  email text not null default '',
  phone text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table public.operations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  code text not null,
  kind public.operation_kind not null,
  lane text not null default '',
  due_date date not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (workspace_id, code)
);

create table public.operation_docs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  name text not null,
  required boolean not null default true,
  status public.document_status not null default 'pending',
  received_at timestamptz,
  observed_note text not null default '',
  unique (operation_id, name)
);

create table public.document_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  operation_doc_id uuid references public.operation_docs(id) on delete set null,
  file_name text not null,
  storage_path text not null unique,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

create table public.portal_shares (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_workspace_members_user on public.workspace_members(user_id);
create index idx_clients_workspace on public.clients(workspace_id);
create index idx_operations_workspace_due on public.operations(workspace_id, due_date);
create index idx_operations_workspace_client on public.operations(workspace_id, client_id);
create index idx_operation_docs_workspace_operation on public.operation_docs(workspace_id, operation_id);
create index idx_operation_docs_status on public.operation_docs(workspace_id, status);
create index idx_document_files_operation on public.document_files(workspace_id, operation_id);
create index idx_audit_events_workspace_created on public.audit_events(workspace_id, created_at desc);

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace and wm.user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(target_workspace uuid, allowed public.workspace_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace and wm.user_id = auth.uid() and wm.role = any(allowed)
  );
$$;

alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients enable row level security;
alter table public.operations enable row level security;
alter table public.operation_docs enable row level security;
alter table public.document_files enable row level security;
alter table public.portal_shares enable row level security;
alter table public.audit_events enable row level security;

create policy "members can read workspace" on public.workspaces for select using (public.is_workspace_member(id));
create policy "owners can update workspace" on public.workspaces for update using (public.has_workspace_role(id, array['owner','admin']::public.workspace_role[]));

create policy "users read own profile" on public.profiles for select using (id = auth.uid());
create policy "users update own profile" on public.profiles for update using (id = auth.uid());

create policy "members read memberships" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy "admins manage memberships" on public.workspace_members for all using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

create policy "members read clients" on public.clients for select using (public.is_workspace_member(workspace_id));
create policy "operators manage clients" on public.clients for all using (public.has_workspace_role(workspace_id, array['owner','admin','operator']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','operator']::public.workspace_role[]));

create policy "members read operations" on public.operations for select using (public.is_workspace_member(workspace_id));
create policy "operators manage operations" on public.operations for all using (public.has_workspace_role(workspace_id, array['owner','admin','operator']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','operator']::public.workspace_role[]));

create policy "members read operation docs" on public.operation_docs for select using (public.is_workspace_member(workspace_id));
create policy "operators manage operation docs" on public.operation_docs for all using (public.has_workspace_role(workspace_id, array['owner','admin','operator']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','operator']::public.workspace_role[]));

create policy "members read document files" on public.document_files for select using (public.is_workspace_member(workspace_id));
create policy "operators manage document files" on public.document_files for all using (public.has_workspace_role(workspace_id, array['owner','admin','operator']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','operator']::public.workspace_role[]));

create policy "members manage portal shares" on public.portal_shares for all using (public.has_workspace_role(workspace_id, array['owner','admin','operator']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','operator']::public.workspace_role[]));
create policy "portal token can read active share" on public.portal_shares for select using (revoked = false);

create policy "members read audit" on public.audit_events for select using (public.is_workspace_member(workspace_id));
create policy "system inserts audit" on public.audit_events for insert with check (public.is_workspace_member(workspace_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customs-documents', 'customs-documents', false, 52428800, array['application/pdf','image/png','image/jpeg','image/webp','text/csv'])
on conflict (id) do nothing;

create policy "workspace members can read document objects" on storage.objects
for select using (
  bucket_id = 'customs-documents'
  and public.is_workspace_member((split_part(name, '/', 1))::uuid)
);

create policy "operators can upload document objects" on storage.objects
for insert with check (
  bucket_id = 'customs-documents'
  and public.has_workspace_role((split_part(name, '/', 1))::uuid, array['owner','admin','operator']::public.workspace_role[])
);
