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

import { type CspFormat, getCspFormatForDate } from "@/lib/automation/csp-content";

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

function buildCspPrompt(weekday: Weekday, recentTopicsText: string, format: CspFormat): string {
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

FORMAT: every post is a single image in today's rotating format (details at the end). The design
system above is only used if a human remakes the image manually from your image_prompt.

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

AUTOMATIC IMAGE ("template") — REQUIRED for @csp_officials:
The post image is drawn automatically from your words. Today's format is "${format}" — the
formats rotate daily so the feed stays fresh. Use content_type "single_image", layout "${format}",
exactly 1 slide, and ALSO add this "template" object:

${CSP_FORMAT_SPECS[format]}

Rules for every format:
- Build it around today's theme (${CSP_WEEKDAY_THEMES[weekday]}) and make it instantly
  relatable to Indian office employees — something they would tag a colleague on.
- Original jokes only. Never name real companies, managers, people or real apps/brands.
- Wrap 1–3 key words in **double asterisks** to highlight them (yellow, or red where noted).
- Hindi must be correct Devanagari. No emoji anywhere inside "template".
- The caption expands the joke and invites comments (e.g. "Comment करो अपना…").
`;
}

/** JSON shape + writing guidance for each rotating CSP format. */
const CSP_FORMAT_SPECS: Record<CspFormat, string> = {
  dictionary: `"template": {
  "title_white": "max 12 chars: CORPORATE, or match the theme — HR, MANAGER, APPRAISAL, MONDAY, WFH, MEETING",
  "title_red": "DICTIONARY",
  "subtitle": "max 36 chars Hinglish, e.g. 'Office की भाषा » असली मतलब' (never use arrow symbols like →)",
  "entries": [ { "phrase": "real office phrase in English, max 26 chars", "meaning": "its REAL meaning, short Hinglish punchline, max 36 chars" } ],
  "footer": "max 55 chars Hinglish engagement line"
}
4–5 entries. Every phrase must be something people genuinely hear at work.`,

  chat: `"template": {
  "headline": "max 30 chars quote of the boss's famous line, e.g. '\"**बस 5 min** का call है…\"'",
  "subheadline": "max 36 chars, who/when, e.g. '— Manager, रात 11:47 बजे'",
  "contact": "max 16 chars, a role not a name: Manager, Boss, HR, Team Lead, Client",
  "messages": [ { "from": "them|me", "text": "max 80 chars, Hinglish in Roman script like real chats", "time": "11:47 PM" } ],
  "stamp": "max 28 chars punchline stamp, e.g. '1:12 AM — call jaari hai'"
}
4–6 messages that escalate into the punchline. Times must move forward realistically.`,

  notifications: `"template": {
  "headline": "max 28 chars, e.g. 'Sunday रात **10:58**' (** = red)",
  "subheadline": "max 36 chars, e.g. 'और **Monday** पहले ही आ गया…'",
  "time": "HH:MM shown on the lock screen, matching the headline",
  "date": "max 22 chars, e.g. 'Sunday, 19 October' — use today's real weekday",
  "notifications": [ { "app": "max 16 chars sender: Boss, HR Portal, Team Group, Mail, Client", "text": "max 65 chars", "ago": "now|2m|5m|1h" } ]
}
4 notifications, each funnier and more dreadful than the last.`,

  poster: `"template": {
  "headline": [ { "text": "max 28 chars", "color": "white|red|yellow" } ],
  "left_panel": "max 45 chars, the expectation or myth",
  "right_panel": "max 45 chars, the reality",
  "tip": "max 65 chars 'याद रखो' takeaway with a humorous twist"
}
3–5 short headline lines that read top-to-bottom as one punchline (like "Monday का सच…" /
"Weekend **खत्म होते ही,**" / "सपने नहीं," / "Deadlines" / "याद आती हैं!"). Red for the 1–2 most
emotional lines, white for connecting lines.`,

  versus: `"template": {
  "topic": "max 30 chars, e.g. 'Appraisal Season', 'First Job', 'WFH'",
  "left_title": "max 12 chars, usually 'Expectation'",
  "right_title": "max 12 chars, usually 'Reality'",
  "left_points": ["3–4 items, max 36 chars each, the hopeful version"],
  "right_points": ["3–4 items, max 36 chars each, the brutal office reality — the punchlines"],
  "footer": "max 55 chars engagement line, e.g. 'आपका appraisal किस side गया? Comment करो'"
}
Left and right points should pair up 1-to-1 so each reality answers its expectation.`,

  payslip: `"template": {
  "headline": "max 28 chars, e.g. 'Salary **Credited**…'",
  "subheadline": "max 36 chars, e.g. 'और 2 दिन में Debited'",
  "employee_line": "max 36 chars, e.g. 'Employee: Aam Aadmi · October' (generic, never a real name)",
  "earnings": [ { "label": "max 30 chars", "amount": "e.g. ₹45,000" } ],
  "deductions": [ { "label": "max 30 chars funny Hinglish deduction", "amount": "e.g. ₹18,000 or a word like सारे" } ],
  "net_amount": "what is left, e.g. ₹15,300",
  "stamp": "max 18 chars red stamp, e.g. '25 तारीख तक'"
}
1 earning, 4–5 deductions mixing real ones (Rent, EMI) with emotional ones (सपने, Weekend plans).
Use plausible but clearly generic round numbers; amounts must roughly add up. No "-" signs (added automatically).`,

  battery: `"template": {
  "headline": "max 28 chars, e.g. 'Employee का **Battery**'",
  "subheadline": "max 36 chars, e.g. 'Monday से Friday तक'",
  "days": [ { "day": "MON", "percent": 3, "label": "max 22 chars caption" } ]
}
Exactly 5 days MON–FRI. Percent rises through the week (e.g. 3, 12, 30, 55, 100) unless the joke
needs a twist. Each label is a 2–4 word Hinglish reason.`,

  calendar: `"template": {
  "headline": "max 28 chars, e.g. 'मेरा **Calendar**' (** = red)",
  "subheadline": "max 36 chars, e.g. 'vs मेरा **काम करने का time**'",
  "day_label": "weekday name",
  "summary": "max 16 chars, e.g. '9 meetings'",
  "events": [ { "time": "10 AM or empty", "title": "max 40 chars", "kind": "meeting|break|work", "long": false } ]
}
6–9 events in time order. Mostly "meeting" (funny realistic titles like 'Sync on the sync'),
one "break" (e.g. 'Lunch (desk pe, mute karke)'), and exactly ONE "work" event such as
'Actual work — 15 min' near the end (it gets crossed out by the clock line). Mark 2–3 events long:true.`,

  ticket: `"template": {
  "headline": "max 28 chars, e.g. 'हर हफ्ते की **Flight**'",
  "subheadline": "max 36 chars, e.g. 'जो कभी time पर नहीं पहुँचती'",
  "from_code": "max 4 chars, e.g. MON", "from_time": "e.g. Monday 9:00 AM",
  "to_code": "max 4 chars, e.g. FRI", "to_time": "e.g. Friday 6:00 PM",
  "fields": [ { "label": "max 10 chars e.g. GATE", "value": "max 20 chars", "color": "white|red|yellow" } ],
  "stub": [ { "label": "max 10 chars e.g. DELAY", "value": "max 20 chars" } ],
  "footer": "max 55 chars engagement line"
}
6 fields (PASSENGER, GATE, SEAT, STATUS, BAGGAGE, CLASS or themed equivalents) with office
punchlines; STATUS usually red (DELAYED). 2 stub items. Route can change with the theme
(e.g. JAN → APPRAISAL, LOGIN → LOGOUT).`,
};

// ---------------------------------------------------------------------------
// Tradeverse Academy — 30-day trading education journey (English)
// ---------------------------------------------------------------------------

function buildTradeversePrompt(
  dayNumber: number,
  recentTopicsText: string
): string {
  const dayLabel = `Day ${dayNumber}/${TRADEVERSE_JOURNEY_LENGTH}`;
  const nextLabel =
    dayNumber < TRADEVERSE_JOURNEY_LENGTH ? `Day ${dayNumber + 1}` : "the next series";

  return `
You are the content strategist and educator for @tradeverse.academy
("TRADEVERSE ACADEMY — LEARN • TRADE • GROW").

ACCOUNT PURPOSE:
A structured ${TRADEVERSE_JOURNEY_LENGTH}-day trading education journey for beginners.
Today's post is ${dayLabel}. It must continue logically from RECENT TOPICS (the previous days)
and must not repeat one of them.
"topic" MUST be exactly: "${dayLabel} – <Lesson Title>".

LANGUAGE: Clear, simple ENGLISH. Keep standard trading terms.

TEACHING ORDER across the carousel:
What it is → why it matters → how it works → simple example → common mistake →
practical rule/checklist → key takeaway.
A beginner must understand slide 1 without prior knowledge.

HOW THE SLIDES ARE MADE:
You only write the words. A fixed design template draws every slide (layout, colours, fonts,
logo, "DAY ${dayNumber}/${TRADEVERSE_JOURNEY_LENGTH}" badge are automatic). So keep every field SHORT —
long text gets cut off. Respect the character limits below.

Slide types:
1. "cover" — ALWAYS slide 1. Big two-line title + 2–4 sub-topics shown as columns.
2. "concept" — one concept per slide ("WHAT IS A … ?"), 3–5 icon rows + a chart.
3. "checklist" — mistakes, rules, do/don't, key takeaways, final save/follow slide.

Use 6–8 slides: cover, then mostly concept slides, then a mistake/rule checklist,
and finish with a checklist slide whose cta is "SAVE THIS POST" / "FOLLOW FOR ${nextLabel.toUpperCase()}".

ARTWORK ("visual"):
Each cover column, concept slide and checklist slide gets a 3D-rendered picture made by an image
model from your "visual" text. Describe ONE concrete, relatable scene or object in 10–25 words.
The house style (glossy 3D render, coloured glow, black background) is added automatically —
do NOT describe style, colours or lighting, and NEVER ask for words, numbers or labels in it.
Good examples (match the live posts):
- "a laptop showing a rising candlestick chart with a silver stopwatch in front of it"
- "a computer monitor with a candlestick chart and an orange alarm clock beside it"
- "a desk calendar with a small green rising chart and a pen"
- "a classical bank building with a rising arrow behind it"
- "a young Indian man at a desk checking a trading app on his phone in the evening"
- "a glass shield protecting a small stack of coins on a desk"
Avoid: cash piles, luxury cars, champagne, celebration of profits, real company logos,
famous people, screens full of readable text.

FALLBACK ICONS ("illustration" / "badge"):
If the image model is unavailable, a code-drawn icon is used instead. Pick from:
stopwatch, alarm_clock, calendar, bank, laptop_chart, monitor_chart, candles, growth_arrow,
shield, target, scales, lightbulb, hourglass, journal, warning, checklist, magnifier.
"badge" is an optional small second icon (or null).

ACCURACY & SAFETY (non-negotiable):
- Charts are drawn automatically as hypothetical examples. Never quote real index levels,
  real stock prices, real returns or win rates.
- Never promise guaranteed profit, 100% accuracy, guaranteed income or risk-free trading.
- No personalised buy/sell recommendations. No fake P&L or testimonials.
- Where risk is discussed, put a one-line educational disclaimer in that slide's "tip"
  and in the caption.

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
No hashtags inside the caption.

HASHTAGS: 8–12. Always include TradeverseAcademy. Mix beginner/education tags
(TradingForBeginners, StockMarketEducation, LearnTrading…) with lesson-specific tags.

RECENT TOPICS (previous days of the journey):
${recentTopicsText}

Return ONLY valid JSON (no markdown fences, no commentary) with exactly this shape.
Character limits are hard limits.

{
  "topic": "${dayLabel} – <Lesson Title>",
  "content_type": "carousel",
  "tone": "educational",
  "caption": "full caption following CAPTION FORMAT",
  "hashtags": ["TradeverseAcademy", "..."],
  "slides": [
    {
      "type": "cover",
      "title_line1": "white line, max 20 chars, e.g. THE 4 MAIN",
      "title_line2": "gold line, max 16 chars, e.g. TRADING STYLES",
      "items": [
        { "name": "max 14 chars", "value": "max 20 chars", "timeframe": "1m|5m|1H|1D|1W", "visual": "scene for the artwork", "illustration": "fallback icon name", "badge": "fallback icon name or null" }
      ],
      "cta_title": "max 28 chars",
      "cta_subtitle": "max 36 chars",
      "tip": "max 75 chars, one memorable line"
    },
    {
      "type": "concept",
      "title_line1": "max 20 chars, e.g. WHAT IS A",
      "title_line2": "max 16 chars, e.g. SWING TRADER?",
      "accent": "cyan|orange|green|purple|gold",
      "rows": [ { "label": "max 24 chars, e.g. Holds trades for:", "value": "max 26 chars", "tone": "neutral|good|bad" } ],
      "chart": "uptrend|downtrend|range|breakout|volatile (the shape that illustrates the concept)",
      "timeframe": "1m|5m|1H|1D|1W",
      "visual": "scene for the hero artwork",
      "badge": "fallback icon name or null",
      "cta_title": "max 28 chars",
      "cta_subtitle": "max 36 chars",
      "tip": "max 75 chars"
    },
    {
      "type": "checklist",
      "title_line1": "max 20 chars",
      "title_line2": "max 16 chars",
      "accent": "cyan|orange|green|purple|gold",
      "points": [ { "text": "max 50 chars", "tone": "good|bad|neutral" } ],
      "visual": "scene for the hero artwork",
      "illustration": "fallback icon name",
      "cta_title": "max 28 chars",
      "cta_subtitle": "max 36 chars",
      "tip": "max 75 chars"
    }
  ]
}

Use "tone": "good" for recommended / suitable things, "bad" for risks and mistakes.
When one concept slide is about one of the cover's sub-topics, reuse that sub-topic's accent
(cover order: 1 cyan, 2 orange, 3 green, 4 purple). A checklist slide has at most 5 points.
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
 * Next day of the Tradeverse journey: the highest "Day N/30" found in
 * recent topics + 1 (Day 1 if none; restarts at Day 1 after Day 30), or the
 * TRADEVERSE_NEXT_DAY env override if that is higher.
 */
export function getNextTradeverseDay(
  recentTopics: string[],
  overrideNextDay: number | null = parseOverrideDay(process.env.TRADEVERSE_NEXT_DAY)
): number {
  const highestDay = highestDayInHistory(recentTopics);

  // TRADEVERSE_NEXT_DAY lets the owner sync the counter with posts made
  // outside the app (the live feed was ahead of the database). It only
  // applies while the database is behind it, so it stops mattering once the
  // app catches up — including when the journey wraps after Day 30.
  if (overrideNextDay && highestDay < overrideNextDay) {
    return overrideNextDay;
  }

  if (highestDay === 0) {
    return 1;
  }

  return highestDay + 1 > TRADEVERSE_JOURNEY_LENGTH ? 1 : highestDay + 1;
}

function parseOverrideDay(value: string | undefined): number | null {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= TRADEVERSE_JOURNEY_LENGTH ? day : null;
}

/** Highest "Day N/30" in recent topics, or 0 if none. */
function highestDayInHistory(recentTopics: string[]): number {
  const days = recentTopics
    .map((topic) => topic.match(/day\s*(\d{1,2})\s*\/\s*30/i)?.[1])
    .filter((value): value is string => Boolean(value))
    .map(Number);

  return days.length > 0 ? Math.max(...days) : 0;
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
    return buildCspPrompt(getIstWeekday(now), recentTopicsText, getCspFormatForDate(now));
  }

  return buildTradeversePrompt(
    getNextTradeverseDay(recentTopics),
    recentTopicsText
  );
}
