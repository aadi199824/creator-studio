import { NextRequest, NextResponse } from "next/server";

import { CSP_FORMATS, type CspFormat, type CspTemplateContent } from "@/lib/automation/csp-content";
import { renderCspPost } from "@/lib/render/csp-post";

/**
 * GET /api/automation/preview-csp?format=dictionary|chat|notifications|poster|versus
 *
 * DEVELOPMENT ONLY (404 in production). Renders a @csp_officials format
 * with fixed sample text — no Gemini call, nothing saved — to check layout
 * and Hindi rendering.
 */

const SAMPLES: Record<CspFormat, CspTemplateContent> = {
  dictionary: {
    format: "dictionary",
    title_white: "CORPORATE",
    title_red: "DICTIONARY",
    subtitle: "Office की भाषा » असली मतलब",
    entries: [
      { phrase: "ASAP", meaning: "कल ही चाहिए था" },
      { phrase: "Quick call", meaning: "1 घंटे की **meeting**" },
      { phrase: "We are a family", meaning: "**Weekend** पर भी काम" },
      { phrase: "Let's take this offline", meaning: "अब ये तुम ही करोगे" },
    ],
    footer: "आपके office में कौनसा सबसे ज़्यादा चलता है?",
  },
  chat: {
    format: "chat",
    headline: '"**बस 5 min** का call है…"',
    subheadline: "— Manager, रात 11:47 बजे",
    contact: "Manager",
    messages: [
      { from: "them", text: "Free ho?", time: "11:47 PM" },
      { from: "them", text: "Bas 5 min ka call hai, quick sa", time: "11:47 PM" },
      { from: "me", text: "Sir, 11:47 PM ho gaye…", time: "11:48 PM" },
      { from: "them", text: "Haan toh? Client ko kal subah 9 baje deck chahiye", time: "11:48 PM" },
      { from: "me", text: "Ok sir", time: "11:49 PM" },
    ],
    stamp: "1:12 AM — call jaari hai",
  },
  notifications: {
    format: "notifications",
    headline: "Sunday रात **10:58**",
    subheadline: "और **Monday** पहले ही आ गया…",
    time: "10:58",
    date: "Sunday, 19 October",
    notifications: [
      { app: "Boss", text: "Kal ka plan ready hai na? Subah 9 baje discuss karte hain", ago: "now" },
      { app: "HR Portal", text: "Timesheet pending — submit before Monday 10 AM", ago: "2m" },
      { app: "Team Group", text: "47 new messages", ago: "5m" },
      { app: "Mail", text: '"Sorry to disturb on weekend, but…"', ago: "8m" },
    ],
  },
  poster: {
    format: "poster",
    headline: [
      { text: "Monday का सच…", color: "white" },
      { text: "Weekend **खत्म होते ही,**", color: "white" },
      { text: "सपने नहीं,", color: "red" },
      { text: "Deadlines", color: "red" },
      { text: "याद आती हैं!", color: "white" },
    ],
    left_panel: "**Monday** Motivation नहीं, **Survival** है।",
    right_panel: "**New** Week, Same **Pressure**, Same Drama.",
    tip: "Attitude सही रखो, **Monday** आसान लगेगा।",
  },
  versus: {
    format: "versus",
    topic: "Appraisal Season",
    left_title: "Expectation",
    right_title: "Reality",
    left_points: ["30% hike पक्का", "Promotion इस बार तो मिलेगा", "Manager ने तारीफ़ की थी"],
    right_points: ["**4%** hike + motivational speech", '"Next cycle में देखेंगे"', "Bell curve ने सब बिगाड़ दिया"],
    footer: "आपका appraisal किस side गया? Comment करो",
  },
};

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const requested = request.nextUrl.searchParams.get("format") ?? "dictionary";
  const format = (CSP_FORMATS as readonly string[]).includes(requested) ? (requested as CspFormat) : "dictionary";

  const png = await renderCspPost(SAMPLES[format]);

  return new NextResponse(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
