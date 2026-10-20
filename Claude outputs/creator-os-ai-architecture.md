# Creator AI Studio — Architecture & Structure Reference

This is a snapshot of the current implementation, meant to be handed to another AI/developer picking up the project. It reflects what actually exists in the repo, not the original plan.

## Repo location

- Local path: `~/Desktop/AI-Projects/creator-os-ai`
- GitHub: `github.com/aadi199824/creator-studio`
- Deployed: Vercel, production URL `https://creator-studio-khaki.vercel.app`

## Stack

- **Framework:** Next.js 16.2.10, App Router. Note: this version has breaking changes vs older Next — `proxy.ts` replaces `middleware.ts`, and dynamic route `params` are `Promise`-wrapped.
- **UI:** React 19.2.4, TypeScript, Tailwind CSS v4.
- **Component library:** shadcn/ui built on `@base-ui/react` (**not** Radix UI). Critical: base-ui uses a `render={<Element/>}` prop for polymorphic composition instead of Radix's `asChild` boolean prop. Mixing these up breaks the production build.
- **Backend/data:** Supabase — Postgres, Auth (email/password), Storage, Row Level Security. Client access via `@supabase/ssr` (browser + server cookie-based clients) and `@supabase/supabase-js` (service-role admin client for trusted server routes).
- **AI:** Google Gemini via `@google/genai` (`^2.15.0`).
  - Text generation: `gemini-3.6-flash` (this model string was inherited from earlier work and has not been independently re-verified this session — flag it if issues appear).
  - Image generation: `gemini-2.5-flash-image`, verified against current Google AI docs. Called via `ai.interactions.create({ model, input })`, image bytes read from `interaction.output_image.data` (base64).
- **Forms/validation:** `react-hook-form` + `zod` (`@hookform/resolvers`).
- **Notifications:** `sonner` (toasts).
- **Calendar:** `@fullcalendar/*`.
- **Package manager:** npm.

## Directory structure (key paths)

```
app/
  dashboard/                  — authenticated app shell (layout.tsx does the auth guard + redirect)
    page.tsx                  — dashboard home: real stats, recent posts, quick actions
    brands/                   — brand CRUD UI
      id/edit/page.tsx        — NOTE: literal folder name "id", not "[id]" — can't rename without
                                 filesystem access; uses ?id= query param instead of a real dynamic route
    media/, settings/, templates/, team/ — feature pages (templates/team are "coming soon" stubs)
  api/
    ai/generate/route.ts      — authenticated single-post AI text generation (IDOR-fixed: scoped to user_id)
    instagram/
      connect/route.ts        — kicks off OAuth for either provider (?provider=facebook_graph|instagram_direct)
      callback/route.ts       — Facebook Graph OAuth callback (Pages → linked IG Business account)
      direct/callback/route.ts— Instagram Business Login (direct) OAuth callback
      accounts/route.ts       — list connected accounts (includes auth_provider)
      disconnect/route.ts     — real delete, scoped to user
      publish/route.ts        — publishes a single image post to Instagram
    automation/
      daily-draft/route.ts    — POST, secret-gated (x-automation-secret), generates+stores an image and
                                 inserts a status:"draft" row in ai_generations. Never publishes.
      recent-topics/route.ts  — GET, secret-gated, returns recent topics for a handle (anti-repeat check)
components/
  brands/, generator/, dashboard/, instagram/, layout/, media/, publishing/, ui/
lib/
  services/    — one class per domain, e.g. BrandService, ContentService, SocialService, CalendarService,
                 AnalyticsService, InstagramService, AIService, AutomationService, StorageService
  instagram/   — facebook-auth.ts, auth.ts (direct), publisher.ts, profile-picture.ts, validation.ts, types.ts
  supabase/    — client.ts (browser), server.ts (SSR/cookies), admin.ts (service-role, server-only)
  types/, validations/ — per-entity TS types and zod schemas
supabase/
  migrations/  — 0001_multi_tenant_and_providers.sql, 0002_automation_image_column.sql
```

## Data model (Postgres via Supabase)

- **users** — Supabase Auth, not a custom table.
- **brands** — `id, user_id, name, description, icon, color, created_at`. Multi-tenant: RLS scoped to `auth.uid() = user_id`.
- **social_accounts** — `id, user_id, platform, account_name, account_id, access_token, refresh_token, auth_provider ('facebook_graph'|'instagram_direct'), page_id, profile_picture, created_at`. RLS scoped to owner.
- **ai_generations** (doubles as the "content" table) — `id, user_id, brand_id, platform, content_type, tone, topic, prompt, generated_content, image_url, status, scheduled_at, created_at`. Status values in use: `draft` → `scheduled` → (presumably `completed`/`published`/`failed`, not all enforced by a DB constraint — `status` is free-text). RLS scoped to owner.
- **published_posts** — tracks what was actually posted (RLS enabled).
- **media_assets** — `id, user_id, url, file_name, file_type, file_size, created_at`. RLS scoped to owner.

No formal enum/check constraints on `status` — it's convention-based, so any new code should match existing values rather than invent new ones.

## Authentication & authorization model

- Supabase Auth (email/password) for end users, cookie-based sessions via `@supabase/ssr`.
- Every service method fetches `supabase.auth.getUser()` and filters by `user_id` **in addition to** RLS (defense in depth).
- `app/dashboard/layout.tsx` is a server component that redirects unauthenticated users to `/login`.
- Automation endpoints (`/api/automation/*`) use a **separate** auth model: a shared secret header (`x-automation-secret`, compared to `process.env.AUTOMATION_SECRET`) since they're called by an unattended scheduled process, not a logged-in browser session. They use `lib/supabase/admin.ts` (service-role client, bypasses RLS) and resolve the target user server-side from the Instagram handle — the caller never supplies a user_id directly. Blast radius is intentionally narrow: these two endpoints can only create draft posts, nothing else (no publish, no reads of unrelated data).

## Social platform integration (Instagram, dual-provider)

Two independent OAuth paths, both fully wired:

1. **Facebook Graph API via Pages** (`auth_provider: "facebook_graph"`) — user connects a Facebook Page that has a linked Instagram Business account. Uses `graph.facebook.com`.
2. **Instagram Business Login (direct)** (`auth_provider: "instagram_direct"`) — connects directly via `graph.instagram.com`.

`lib/instagram/publisher.ts` picks the correct Graph API base URL per-account based on `auth_provider`. Users choose either at connect time via a dropdown (`components/publishing/connect-button.tsx`); both are supported long-term (SaaS — any user may pick either).

Profile pictures from Meta's CDN are short-lived signed URLs — `lib/instagram/profile-picture.ts` downloads and re-uploads them to Supabase Storage on connect so they don't expire. `components/instagram/instagram-avatar.tsx` gracefully falls back to initials if an image ever 404s.

## AI content generation flow

- Manual: user picks a brand + platform + tone/topic in the generator UI → `POST /api/ai/generate` → `AIService.generateContent` (Gemini text) → saved to `ai_generations` with `status: "completed"`.
- **Automated (new, this session):** a daily scheduled task (external to the app, see below) researches a topic, writes the full post, and calls:
  1. `GET /api/automation/recent-topics?instagram_username=<handle>` — avoid repeating recent topics.
  2. `POST /api/automation/daily-draft` — generates a cover image via `AIService.generateImage` (Gemini `gemini-2.5-flash-image`), uploads it to the `media` Supabase Storage bucket, and inserts an `ai_generations` row with `status: "draft"`. **Never auto-publishes** — a human reviews and publishes manually from the Content Library, same as any other draft.

## Environment variables in use

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY      (browser/server anon key)
SUPABASE_SERVICE_ROLE_KEY                 (server-only, added this session — never expose to client)
GEMINI_API_KEY
META_APP_ID / META_APP_SECRET / META_APP_REDIRECT_URI      (Facebook Graph path)
INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET / INSTAGRAM_REDIRECT_URI  (direct Instagram Login path)
AUTOMATION_SECRET                         (server-only, added this session — gates /api/automation/*)
```

`.env*` is gitignored; all of the above must be set manually in Vercel's dashboard as well as any local `.env.local`.

## The daily automation (external scheduling)

Not a Vercel Cron job — it's a scheduled task running in a separate Claude session (outside this codebase), configured to fire daily and call the two `/api/automation/*` endpoints above for two Instagram accounts (`@csp_officials`, `@tradeverse.academy`), each with its own hard content-safety constraints (e.g., never fabricate government recruitment facts/dates, never promise trading profits). This is intentionally **decoupled from app code** — the app only needs to expose the two secret-gated endpoints; anything can drive them.

## Known rough edges / tech debt

- `app/dashboard/brands/id/edit/page.tsx` — literal `id` folder instead of a real `[id]` dynamic route (needs a manual rename by whoever has filesystem access; currently worked around via `?id=` query param + `Suspense` boundary for `useSearchParams`).
- A stray empty `route.ts` at the repo root — harmless but should be deleted.
- No formal DB constraint on `ai_generations.status` — it's convention, not enforced.
- `gemini-3.6-flash` (text model) has not been re-verified this session; if text generation errors appear, check the current valid Gemini model list first.
- Engagement Rate on the dashboard is intentionally left as a "coming soon" placeholder — never fabricated, since there's no real analytics data source wired up yet.
