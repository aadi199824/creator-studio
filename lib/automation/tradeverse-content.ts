/**
 * Structured slide content for @tradeverse.academy carousels.
 *
 * Gemini fills these fields; the fixed layout lives in
 * lib/render/tradeverse-slides.tsx. Gemini never controls layout, colours or
 * fonts — only words, chart shape and which code-drawn illustration to show
 * (from a fixed list) — which keeps every post visually consistent.
 */

import { ILLUSTRATIONS, type Illustration } from "@/lib/render/illustrations";

export const TRADEVERSE_ACCENTS = ["cyan", "orange", "green", "purple", "gold"] as const;
export type TradeverseAccent = (typeof TRADEVERSE_ACCENTS)[number];

export const TRADEVERSE_CHART_SHAPES = [
  "uptrend",
  "downtrend",
  "range",
  "breakout",
  "volatile",
] as const;
export type TradeverseChartShape = (typeof TRADEVERSE_CHART_SHAPES)[number];

export type RowTone = "neutral" | "good" | "bad";

export type CoverItem = {
  name: string;
  value: string;
  timeframe: string;
  /** Subject for the AI artwork (Cloudflare FLUX); text-free scene description. */
  visual: string;
  /** Code-drawn fallback used when AI artwork is unavailable. */
  illustration: Illustration;
  /** Optional small icon overlapping the fallback illustration. */
  badge: Illustration | null;
};

export type CoverSlide = {
  type: "cover";
  title_line1: string;
  title_line2: string;
  items: CoverItem[];
  cta_title: string;
  cta_subtitle: string;
  tip: string;
};

export type ConceptSlide = {
  type: "concept";
  title_line1: string;
  title_line2: string;
  accent: TradeverseAccent;
  rows: { label: string; value: string; tone: RowTone }[];
  chart: TradeverseChartShape;
  timeframe: string;
  /** Subject for the AI hero artwork; text-free scene description. */
  visual: string;
  /** Small icon overlapping the fallback chart monitor (e.g. alarm_clock). */
  badge: Illustration | null;
  cta_title: string;
  cta_subtitle: string;
  tip: string;
};

export type ChecklistSlide = {
  type: "checklist";
  title_line1: string;
  title_line2: string;
  accent: TradeverseAccent;
  points: { text: string; tone: RowTone }[];
  /** Subject for the AI hero artwork; text-free scene description. */
  visual: string;
  /** Code-drawn fallback used when AI artwork is unavailable. */
  illustration: Illustration;
  cta_title: string;
  cta_subtitle: string;
  tip: string;
};

export type TradeverseSlide = CoverSlide | ConceptSlide | ChecklistSlide;

export type TradeversePost = {
  topic: string;
  content_type: "carousel";
  tone: string;
  caption: string;
  hashtags: string[];
  slides: TradeverseSlide[];
};

// --- sanitising helpers ----------------------------------------------------
// Gemini output is untrusted: clamp lengths and counts so a long line can't
// overflow the fixed layout, and fall back to safe defaults instead of
// failing the whole draft on one bad field.

function str(value: unknown, max: number, fallback = ""): string {
  // Emoji are stripped: the slide fonts have no emoji glyphs (they would
  // render as blank boxes).
  const text =
    typeof value === "string"
      ? value
          .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
          .replace(/\s+/g, " ")
          .trim()
      : "";
  if (!text) return fallback;
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function tone(value: unknown): RowTone {
  return oneOf(value, ["neutral", "good", "bad"] as const, "neutral");
}

function optionalIllustration(value: unknown): Illustration | null {
  return typeof value === "string" && (ILLUSTRATIONS as readonly string[]).includes(value)
    ? (value as Illustration)
    : null;
}

function arr(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> => Boolean(item) && typeof item === "object"
      )
    : [];
}

function common(raw: Record<string, unknown>) {
  return {
    title_line1: str(raw.title_line1, 22),
    title_line2: str(raw.title_line2, 22, "Lesson"),
    cta_title: str(raw.cta_title, 32),
    cta_subtitle: str(raw.cta_subtitle, 40),
    tip: str(raw.tip, 80, "Educational content only. Trading carries financial risk."),
  };
}

function parseSlide(raw: Record<string, unknown>): TradeverseSlide | null {
  if (raw.type === "cover") {
    const items = arr(raw.items)
      .slice(0, 4)
      .map((item) => ({
        name: str(item.name, 16),
        value: str(item.value, 22),
        timeframe: str(item.timeframe, 4, "1D"),
        visual: str(item.visual, 300),
        illustration: oneOf(item.illustration, ILLUSTRATIONS, "monitor_chart"),
        badge: optionalIllustration(item.badge),
      }))
      .filter((item) => item.name);

    if (items.length < 2) return null;
    return { type: "cover", ...common(raw), items };
  }

  if (raw.type === "concept") {
    const rows = arr(raw.rows)
      .slice(0, 5)
      .map((row) => ({
        label: str(row.label, 28),
        value: str(row.value, 30),
        tone: tone(row.tone),
      }))
      .filter((row) => row.label && row.value);

    if (rows.length === 0) return null;
    return {
      type: "concept",
      ...common(raw),
      accent: oneOf(raw.accent, TRADEVERSE_ACCENTS, "gold"),
      rows,
      chart: oneOf(raw.chart, TRADEVERSE_CHART_SHAPES, "uptrend"),
      timeframe: str(raw.timeframe, 4, "1D"),
      visual: str(raw.visual, 300),
      badge: optionalIllustration(raw.badge),
    };
  }

  if (raw.type === "checklist") {
    const points = arr(raw.points)
      .slice(0, 5)
      .map((point) => ({ text: str(point.text, 60), tone: tone(point.tone) }))
      .filter((point) => point.text);

    if (points.length === 0) return null;
    return {
      type: "checklist",
      ...common(raw),
      accent: oneOf(raw.accent, TRADEVERSE_ACCENTS, "gold"),
      points,
      visual: str(raw.visual, 300),
      illustration: oneOf(raw.illustration, ILLUSTRATIONS, "checklist"),
    };
  }

  return null;
}

export function parseTradeversePost(parsed: Record<string, unknown>): TradeversePost {
  if (typeof parsed.topic !== "string" || typeof parsed.caption !== "string") {
    throw new Error("Gemini returned an invalid Tradeverse post (missing topic or caption).");
  }

  const slides = arr(parsed.slides)
    .map(parseSlide)
    .filter((slide): slide is TradeverseSlide => slide !== null)
    .slice(0, 10); // Instagram carousel API limit is 10 items

  if (slides.length === 0) {
    throw new Error("Gemini returned no usable Tradeverse slides.");
  }

  return {
    topic: parsed.topic.trim(),
    content_type: "carousel",
    tone: typeof parsed.tone === "string" ? parsed.tone : "educational",
    caption: parsed.caption.trim(),
    hashtags: Array.isArray(parsed.hashtags)
      ? parsed.hashtags.filter((tag): tag is string => typeof tag === "string")
      : [],
    slides,
  };
}

/** Plain-text version of a slide, for the human-readable production plan. */
export function describeTradeverseSlide(slide: TradeverseSlide, index: number): string {
  const head = `--- Slide ${index + 1} (${slide.type}) ---\n${slide.title_line1} / ${slide.title_line2}`;
  const body =
    slide.type === "cover"
      ? slide.items.map((item) => `• ${item.name}: ${item.value}`).join("\n")
      : slide.type === "concept"
        ? slide.rows.map((row) => `• ${row.label} ${row.value}`).join("\n")
        : slide.points.map((point) => `• ${point.text}`).join("\n");
  const cta = slide.cta_title ? `\nCTA: ${slide.cta_title} — ${slide.cta_subtitle}` : "";
  return `${head}\n${body}${cta}\nTip: ${slide.tip}`;
}
