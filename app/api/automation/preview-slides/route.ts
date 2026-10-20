import { NextRequest, NextResponse } from "next/server";

import { generateSlideArt } from "@/lib/automation/tradeverse-art";
import type { TradeverseSlide } from "@/lib/automation/tradeverse-content";
import { renderTradeverseSlide } from "@/lib/render/tradeverse-slides";

/**
 * GET /api/automation/preview-slides?slide=1|2|3[&ai=1]
 *
 * DEVELOPMENT ONLY (returns 404 in production). Renders the Tradeverse
 * template with fixed sample content — no Gemini call, nothing saved — so
 * the layout can be checked in a browser while editing
 * lib/render/tradeverse-slides.tsx. Add &ai=1 to generate the artwork with
 * Cloudflare FLUX (needs CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_AI_API_TOKEN).
 */

const SAMPLE_SLIDES: TradeverseSlide[] = [
  {
    type: "cover",
    title_line1: "The 4 Main",
    title_line2: "Trading Styles",
    items: [
      { name: "Scalping", value: "Seconds to Minutes", timeframe: "1m", visual: "a laptop showing a rising candlestick chart with a silver stopwatch in front of it", illustration: "laptop_chart", badge: "stopwatch" },
      { name: "Day Trading", value: "Intraday Focus", timeframe: "5m", visual: "a computer monitor with a candlestick chart and an orange alarm clock beside it", illustration: "monitor_chart", badge: "alarm_clock" },
      { name: "Swing Trading", value: "Days to Weeks", timeframe: "1D", visual: "a desk calendar with a small green rising chart and a pen", illustration: "calendar", badge: null },
      { name: "Investing", value: "Months to Years", timeframe: "1W", visual: "a classical bank building with a rising arrow behind it", illustration: "bank", badge: null },
    ],
    cta_title: "Find your trading style",
    cta_subtitle: "Learn smart. Trade your way.",
    tip: "Different styles, different timeframes — pick one that fits your schedule.",
  },
  {
    type: "concept",
    title_line1: "What is a",
    title_line2: "Swing Trader?",
    accent: "green",
    rows: [
      { label: "Holds trades for:", value: "Days to weeks", tone: "neutral" },
      { label: "Goal:", value: "Catch one price swing", tone: "neutral" },
      { label: "Time needed:", value: "30–60 min a day", tone: "neutral" },
      { label: "Suitable for:", value: "Working professionals", tone: "good" },
      { label: "Main risk:", value: "Overnight gaps", tone: "bad" },
    ],
    chart: "uptrend",
    timeframe: "1D",
    visual: "a young Indian man at a desk checking a candlestick chart on his laptop in the evening",
    badge: "calendar",
    cta_title: "Patience over speed.",
    cta_subtitle: "That's the swing trader's edge.",
    tip: "Educational content only. Trading carries financial risk.",
  },
  {
    type: "checklist",
    title_line1: "Beginner",
    title_line2: "Mistakes",
    accent: "orange",
    points: [
      { text: "Picking a style that doesn't fit your schedule", tone: "bad" },
      { text: "Trading without a stop-loss", tone: "bad" },
      { text: "Start with one style and a written plan", tone: "good" },
      { text: "Review every trade in a journal", tone: "good" },
    ],
    visual: "a yellow warning sign standing next to a laptop showing a falling red chart",
    illustration: "warning",
    cta_title: "Save this post",
    cta_subtitle: "Follow for Day 5",
    tip: "Educational content only. Trading carries financial risk.",
  },
];

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const index = Math.min(
    SAMPLE_SLIDES.length,
    Math.max(1, Number(request.nextUrl.searchParams.get("slide")) || 1)
  ) - 1;
  const slide = SAMPLE_SLIDES[index];
  const art = request.nextUrl.searchParams.get("ai") === "1" ? await generateSlideArt(slide) : [];
  const png = await renderTradeverseSlide(slide, { day: "4/30", seed: 42, art });

  return new NextResponse(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
