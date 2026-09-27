-- Backs real publishing (manual "Publish Now" and the scheduled-publish
-- worker): both need to know exactly which connected Instagram account a
-- draft belongs to, and a place to record why an automated publish failed.

alter table public.ai_generations
  add column if not exists social_account_id uuid references public.social_accounts(id) on delete set null,
  add column if not exists publish_error text;

comment on column public.ai_generations.social_account_id is
  'Which connected social_accounts row this post publishes to. Set automatically for automation-generated drafts; may be null for older/manual drafts until a account is chosen at publish time.';

comment on column public.ai_generations.publish_error is
  'Last publish error message, if a Publish Now click or the scheduled-publish worker failed. Cleared on success.';
