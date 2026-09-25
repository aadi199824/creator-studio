-- Creator Studio AI — multi-tenant + dual Instagram provider migration
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS guards.

-- =========================================================================
-- 1. BRANDS — add ownership, enable RLS
-- =========================================================================
alter table public.brands
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists brands_user_id_idx on public.brands(user_id);

alter table public.brands enable row level security;

drop policy if exists brands_select_own on public.brands;
create policy brands_select_own on public.brands
  for select using (auth.uid() = user_id);

drop policy if exists brands_insert_own on public.brands;
create policy brands_insert_own on public.brands
  for insert with check (auth.uid() = user_id);

drop policy if exists brands_update_own on public.brands;
create policy brands_update_own on public.brands
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists brands_delete_own on public.brands;
create policy brands_delete_own on public.brands
  for delete using (auth.uid() = user_id);

-- NOTE: any existing brand rows created before this migration will have a
-- NULL user_id and will become invisible to everyone (RLS hides them,
-- it does not delete them). If you want to keep your existing demo brands,
-- run this once with your own user id (find it under Authentication > Users):
--   update public.brands set user_id = '00000000-0000-0000-0000-000000000000' where user_id is null;

-- =========================================================================
-- 2. AI_GENERATIONS (content) — add ownership, enable RLS
-- =========================================================================
alter table public.ai_generations
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists ai_generations_user_id_idx on public.ai_generations(user_id);

alter table public.ai_generations enable row level security;

drop policy if exists ai_generations_select_own on public.ai_generations;
create policy ai_generations_select_own on public.ai_generations
  for select using (auth.uid() = user_id);

drop policy if exists ai_generations_insert_own on public.ai_generations;
create policy ai_generations_insert_own on public.ai_generations
  for insert with check (auth.uid() = user_id);

drop policy if exists ai_generations_update_own on public.ai_generations;
create policy ai_generations_update_own on public.ai_generations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists ai_generations_delete_own on public.ai_generations;
create policy ai_generations_delete_own on public.ai_generations
  for delete using (auth.uid() = user_id);

-- Same note as above applies to any pre-existing demo generations.

-- =========================================================================
-- 3. SOCIAL_ACCOUNTS — support two Instagram connection providers
-- =========================================================================
alter table public.social_accounts
  add column if not exists auth_provider text
    check (auth_provider in ('facebook_graph', 'instagram_direct'))
    default 'instagram_direct';

alter table public.social_accounts
  add column if not exists page_id text;

alter table public.social_accounts
  add column if not exists refresh_token text;

alter table public.social_accounts
  add column if not exists profile_picture text;

create index if not exists social_accounts_user_id_idx on public.social_accounts(user_id);

alter table public.social_accounts enable row level security;

drop policy if exists social_accounts_select_own on public.social_accounts;
create policy social_accounts_select_own on public.social_accounts
  for select using (auth.uid() = user_id);

drop policy if exists social_accounts_insert_own on public.social_accounts;
create policy social_accounts_insert_own on public.social_accounts
  for insert with check (auth.uid() = user_id);

drop policy if exists social_accounts_update_own on public.social_accounts;
create policy social_accounts_update_own on public.social_accounts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists social_accounts_delete_own on public.social_accounts;
create policy social_accounts_delete_own on public.social_accounts
  for delete using (auth.uid() = user_id);

-- =========================================================================
-- 4. PUBLISHED_POSTS — confirm RLS matches existing app-level filtering
-- =========================================================================
alter table public.published_posts enable row level security;

drop policy if exists published_posts_select_own on public.published_posts;
create policy published_posts_select_own on public.published_posts
  for select using (auth.uid() = user_id);

drop policy if exists published_posts_insert_own on public.published_posts;
create policy published_posts_insert_own on public.published_posts
  for insert with check (auth.uid() = user_id);

-- =========================================================================
-- 5. MEDIA_ASSETS — new table backing the Media Library page
-- =========================================================================
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  file_name text,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

create index if not exists media_assets_user_id_idx on public.media_assets(user_id);

alter table public.media_assets enable row level security;

drop policy if exists media_assets_select_own on public.media_assets;
create policy media_assets_select_own on public.media_assets
  for select using (auth.uid() = user_id);

drop policy if exists media_assets_insert_own on public.media_assets;
create policy media_assets_insert_own on public.media_assets
  for insert with check (auth.uid() = user_id);

drop policy if exists media_assets_delete_own on public.media_assets;
create policy media_assets_delete_own on public.media_assets
  for delete using (auth.uid() = user_id);
