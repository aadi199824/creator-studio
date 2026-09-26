-- Adds image storage for AI-generated content, and backs the new
-- daily-draft automation (server-only endpoints, gated by AUTOMATION_SECRET
-- and the Supabase service-role key — never exposed to the browser).

alter table public.ai_generations
  add column if not exists image_url text;

comment on column public.ai_generations.image_url is
  'Public Supabase Storage URL of an AI-generated image attached to this post, if any.';
