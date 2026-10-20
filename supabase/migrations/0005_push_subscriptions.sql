-- Phone (web push) notifications for automation drafts
-- (lib/services/push.service.ts, lib/automation/draft-notifications.ts).
--
-- One row per browser/phone that allowed notifications in Settings. The
-- server sends to every row of the draft owner's user_id; rows the push
-- service reports as expired (404/410) are deleted automatically.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_success_at timestamptz
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage their own push subscriptions" on public.push_subscriptions;
create policy "Users manage their own push subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- The Telegram approach was replaced before going live; drop its column if
-- an earlier version of 0004 already added it.
alter table public.ai_generations drop column if exists telegram_message_id;
