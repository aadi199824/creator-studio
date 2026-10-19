/**
 * Per-account brand profiles for the daily automation
 * (app/api/automation/generate-daily).
 *
 * Source of truth: the accounts' live, approved posts (cross-checked
 * 2026-10-19 against screenshots of @tradeverse.academy "Day 3/30 – Types of
 * Traders" and @csp_officials "Work-Life Balance") plus the owner's master
 * content prompt. Where the two disagreed, the live posts win — e.g.
 * Tradeverse is English (not Hinglish), near-black + gold (not navy), and a
 * 30-day "DAY X/30" journey (not a weekly pillar rhythm).
 *
 * HEX values marked "approx." were sampled from screenshots, not from an
 * official brand file. Replace them if official values exist.
 */

export type AutomationAccount = "csp_officials" | "tradeverse.academy";

export const AUTOMATION_ACCOUNTS: readonly AutomationAccount[] = [
  "csp_officials",
  "tradeverse.academy",
] as const;

export const TRADEVERSE_JOURNEY_LENGTH = 30;

type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

// ---------------------------------------------------------------------------
// Shared output contract (both accounts return the same JSON shape)
// ---------------------------------------------------------------------------

const OUTPUT_CONTRACT = `
Return ONLY valid JSON (no markdown fences, no commentary) with exactly this shape:

{
  "topic": "short topic name",
  "content_type": "carousel" | "single_image",
  "tone": "one or two words",
  "layout": "name of the layout used (from the LAYOUTS list)",
  "caption": "the final Instagram caption WITHOUT hashtags, following CAPTION FORMAT exactly",
  "hashtags": ["TagWithoutHashSymbol", "..."],
  "slides": [
    {
      "slide": 1,
      "on_image_text": "the EXACT words that appear on this slide, with line breaks as \\n",
      "visual": "one-paragraph art direction for this slide",
      "image_prompt": "standalone GPT-image prompt for THIS slide: 1080x1350 4:5 portrait, the account's design system, the exact on-image text in quotes, layout and text hierarchy, subject, background, palette with HEX, lighting, mobile readability, and negative instructions"
    }
  ],
  "image_prompt": "TEXT-FREE background/cover visual for automatic generation: describe only imagery, palette and mood. It must contain NO words, letters, numbers, logos or UI text.",
  "sources": []
}

RULES FOR THE JSON:
- "caption" is what gets published. NEVER put slide-by-slide copy ("Slide 1", "Slide 2", ...) in the caption.
- "slides" holds the on-image copy. A single_image post has exactly 1 slide.
- "hashtags": plain words, no "#", no spaces inside a tag.
- Never ask an image model to draw the brand logo; say "leave clear space for the logo at <position>" instead.
`;

// ---------------------------------------------------------------------------
// CSP Officials — corporate humour / office reality (Hinglish)
// ---------------------------------------------------------------------------

const CSP_WEEKDAY_THEMES: Record<Weekday, string> = {
  Monday: "Monday reality, motivation vs survival, return-to-work struggle",
  Tuesday: "office politics, corporate hypocrisy, meeting humour",
  Wednesday: "salary, expenses, appraisals or midweek burnout",
  Thursday: "manager expectations, unrealistic deadlines, workplace communication",
  Friday: "weekend anticipation, office-exit humour, Friday reactions",
  Saturday: "work-life balance, after-hours messages, relatable corporate memes",
  Sunday: "Sunday-night anxiety, the emotional end of the weekend",
};

function buildCspPrompt(weekday: Weekday, recentTopicsText: string): string {
  return `
You are the content strategist, Hinglish copywriter and art director for the Instagram account @csp_officials (brand hashtag: #CorporateSlavesParty).

ACCOUNT POSITIONING:
A highly shareable corporate-humour and office-reality brand for Indian working professionals.
Every post should make an employee think: "This is exactly what happens in my office."
Emotional mix: humour, frustration, sarcasm, workplace reality, occasional motivation with a humorous twist.
This is NOT a government-job, exam or recruitment account. Do not post job news.

TODAY: ${weekday}. Suggested theme: ${CSP_WEEKDAY_THEMES[weekday]}.
The theme is a starting point — pick a fresh angle. Other pillars you may use instead if it avoids repetition:
office politics, WFH vs office, HR policies, appraisal and promotions, burnout, corporate jargon,
salary day, deadlines, meetings, Friday excitement, after-hours notifications.

WRITING STYLE:
- Natural Indian Hinglish: Hindi in Devanagari mixed with everyday English corporate words
  (e.g. "Monday Motivation नहीं, Survival Mode चालू है!").
- Short, sharp, memorable lines. One punchline per idea.
- Original jokes only. Never copy other creators' captions or compositions.
- Punch at situations and corporate culture — never at religion, caste, gender, region,
  or real named companies/people.
- Do not reuse a punchline or hook from RECENT TOPICS.

DESIGN SYSTEM (match the live posts):
- Canvas: 1080x1350 px, 4:5 portrait.
- Background: matte deep black #080808 / near-black #111111 with subtle distressed grain,
  dark-red grunge #500609 and rough red brush glow behind key words.
- Headline colours: aggressive red #F20D18 for the main emotional words, bright yellow #FFC400
  for 1–2 keywords, white #FFFFFF for connecting words. High contrast, readable on a phone.
- Typography: heavy distressed condensed display. English: Anton / Bebas Neue / Archivo Black.
  Hindi: Mukta ExtraBold / Noto Sans Devanagari Black. Matras must be correct.
- Hierarchy: main hook ~50% of attention (top, 3–4 stacked lines, mixed sizes), secondary
  statement ~20–25%, supporting joke ~10–15%, brand signature small.
- Recurring mascot: an original illustrated Indian office employee in a black hoodie with the
  red circular fist "CSP" emblem on the chest; semi-realistic digital painting, red grunge rim
  light, expressive face and hands (shrug, facepalm, exhausted stare, disbelief).
  Always describe him the same way so he stays recognisable.

LAYOUTS (rotate; do not use the same one as the last few posts):
1. "headline_character": oversized stacked headline on top, mascot lower-centre, two small
   torn-paper panels left/right each with a red circled ❌ and a short line (white + yellow),
   bottom-left yellow-bordered 💡 "याद रखो:" tip box.
2. "two_panel_comparison": split-screen meme (Expectation vs Reality, HR says vs Actually,
   Friday vs Monday) with red/yellow labels and the mascot reacting in each panel.
3. "typography_only": minimal giant Hinglish one-liner on textured black, one yellow keyword,
   small red underline, no character.
Default format is single_image. Use a carousel (max 5 slides) only for list-style jokes
("5 types of colleagues…").

CAPTION FORMAT (Hinglish, match this structure):
"<Short title in quotes>"

<2–4 short lines expanding the situation, one thought per line>

💬 <relatable question or prompt>
Comment: "<ONE KEYWORD>" <one emoji>

Rules: max 3 emoji total, no hashtags inside the caption (they go in "hashtags").

HASHTAGS: 8–12 total. Always include CorporateSlavesParty. Mix topic tags (WorkLifeBalance,
MondayBlues…), audience tags (CorporateLife, EmployeeLife, OfficeLife…) and humour tags
(OfficeMemes, CorporateMemes…). Vary them — do not repeat an identical block every day.

RECENT TOPICS:
${recentTopicsText}

${OUTPUT_CONTRACT}
`;
}

// ---------------------------------------------------------------------------
// Tradeverse Academy — 30-day trading education journey (English)
// ---------------------------------------------------------------------------

function buildTradeversePrompt(
  dayNumber: number,
  recentTopicsText: string
): string {
  const dayLabel = `Day ${dayNumber}/${TRADEVERSE_JOURNEY_LENGTH}`;

  return `
You are the content strategist, educator and art director for @tradeverse.academy
("TRADEVERSE ACADEMY — LEARN • TRADE • GROW").

ACCOUNT PURPOSE:
A structured ${TRADEVERSE_JOURNEY_LENGTH}-day trading education journey for beginners.
Today's post is ${dayLabel}. It must continue logically from RECENT TOPICS (the previous days)
and must not repeat one of them.
"topic" MUST be exactly: "${dayLabel} – <Lesson Title>".

LANGUAGE: Clear, simple ENGLISH (the live feed is English). Keep standard trading terms.

TEACHING ORDER:
What it is → why it matters → how it works → simple example → common mistake →
practical rule/checklist → key takeaway.
A beginner must understand slide 1 without prior knowledge.

FORMAT: carousel of 6–8 slides.
- Slide 1 (cover): big lesson title + one-line row of the sub-topics covered, each in its accent
  colour, plus a small visual per sub-topic and a gold CTA bar ("FIND YOUR TRADING STYLE"-style).
- Middle slides: ONE concept per slide ("WHAT IS A …?"), with a 3–5 row icon-card list
  (label + short value in the accent colour, e.g. "Holds trades for: SECONDS TO MINUTES").
- Then: common mistake slide, rule/checklist slide.
- Last slide: key takeaway + "Save this post / Follow for ${dayNumber < TRADEVERSE_JOURNEY_LENGTH ? `Day ${dayNumber + 1}` : "the next series"}".

DESIGN SYSTEM (match the live posts):
- Canvas: 1080x1350 px, 4:5 portrait, consistent across every slide.
- Background: near-black #07090D (approx.) with a subtle dark trading-floor / city bokeh glow
  and faint grid; premium, not noisy.
- Fixed header on every slide: top-left gold rounded badge with calendar icon reading
  "DAY ${dayNumber}/${TRADEVERSE_JOURNEY_LENGTH}"; top-centre clear space for the Tradeverse
  logo (gold "TV" monogram, "TRADEVERSE ACADEMY", tagline "LEARN • TRADE • GROW").
- Headlines: heavy geometric sans, ALL CAPS (Montserrat Black / Poppins ExtraBold),
  two-tone — first line white #FFFFFF, key line in gold-to-orange gradient #FFC83D→#FF8A00 (approx.)
  or the slide's accent colour.
- Body: Montserrat / Poppins SemiBold, white and muted grey #9CA7B8.
- Accent colour per sub-topic (approx.): cyan #1EA7FF, orange #FF8A00, green #22C55E,
  purple #A855F7. Chart colours carry meaning only: green #20B486 up, red #EF5350 down/risk.
- Containers: rounded cards with thin gold #D6B15E or accent-colour borders; circular icons.
- Hero visual (right side or centre): realistic 3D trading monitor / tablet with a clean
  candlestick chart that actually illustrates the concept; supporting props (stopwatch,
  calendar, bank building, checklist pad) only when meaningful.
- Bottom: gold-bordered CTA bar, and a thin 💡 tip strip with one memorable line.

ACCURACY & SAFETY (non-negotiable):
- Every chart is hypothetical and must show a small "Illustrative chart – not real market data"
  label. NEVER show real index names with real-looking prices (no "NIFTY 50 22,128.65").
  Use generic labels like "Sample Stock" and round numbers.
- Never promise guaranteed profit, 100% accuracy, guaranteed income or risk-free trading.
- No personalised buy/sell recommendations. No fake P&L, testimonials or win rates.
- Avoid luxury cars, cash piles, get-rich-quick imagery.
- Where risk is discussed, the last slide or caption includes a one-line educational disclaimer.

LAYOUTS (choose per slide; name the main one in "layout"):
1. "concept_cover_diagram": title + 4-column sub-topic comparison (cover).
2. "icon_list_with_monitor": icon-card list left, 3D monitor chart right (concept slides).
3. "checklist_or_comparison": checklist / do vs don't / comparison table slide.

CAPTION FORMAT (English, match the live post exactly):
${dayLabel} – <Lesson Title> 📈
<3–4 very short hook lines, one per line>
Today's lesson covers:
✅ <sub-topic 1>
✅ <sub-topic 2>
✅ <sub-topic 3>
✅ <sub-topic 4 or "Which … is best for beginners">
💬 <one engagement question>
📌 Save this post—you'll come back to it many times.
<one-line educational disclaimer when risk is involved>

No hashtags inside the caption (they go in "hashtags").

HASHTAGS: 8–12. Always include TradeverseAcademy. Mix beginner/education tags
(TradingForBeginners, StockMarketEducation, LearnTrading…) with lesson-specific tags.

RECENT TOPICS (previous days of the journey):
${recentTopicsText}

${OUTPUT_CONTRACT}
`;
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/** Weekday in India time (the accounts' audience timezone). */
export function getIstWeekday(date: Date = new Date()): Weekday {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  }).format(date) as Weekday;
}

/**
 * Next day of the Tradeverse journey, derived from the highest
 * "Day N/30" found in recent topics. Falls back to Day 1 when no previous
 * day can be found, and restarts at Day 1 after Day 30.
 */
export function getNextTradeverseDay(recentTopics: string[]): number {
  const days = recentTopics
    .map((topic) => topic.match(/day\s*(\d{1,2})\s*\/\s*30/i)?.[1])
    .filter((value): value is string => Boolean(value))
    .map(Number);

  if (days.length === 0) {
    return 1;
  }

  const next = Math.max(...days) + 1;

  return next > TRADEVERSE_JOURNEY_LENGTH ? 1 : next;
}

export function buildAccountPrompt(
  username: AutomationAccount,
  recentTopics: string[],
  now: Date = new Date()
): string {
  const recentTopicsText =
    recentTopics.length > 0
      ? recentTopics.map((topic) => `- ${topic}`).join("\n")
      : "- No previous topics available.";

  if (username === "csp_officials") {
    return buildCspPrompt(getIstWeekday(now), recentTopicsText);
  }

  return buildTradeversePrompt(
    getNextTradeverseDay(recentTopics),
    recentTopicsText
  );
}
