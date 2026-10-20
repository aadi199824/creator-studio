-- Approval notifications for automation drafts
-- (lib/automation/draft-notifications.ts): 10:00 IST phone notification per
-- account, hourly reminders until 20:00 IST while the draft is unpublished.
-- Phone subscriptions live in push_subscriptions (0005).

alter table public.ai_generations
  add column if not exists notified_at timestamptz,
  add column if not exists last_reminded_at timestamptz,
  add column if not exists reminder_count integer not null default 0,
  add column if not exists skipped_at timestamptz;

comment on column public.ai_generations.notified_at is
  'When the first approval notification for this draft was sent.';
comment on column public.ai_generations.last_reminded_at is
  'When the most recent reminder was sent.';
comment on column public.ai_generations.reminder_count is
  'How many reminders have been sent for this draft.';
comment on column public.ai_generations.skipped_at is
  'Set when the owner taps "Skip today" — no more reminders.';
