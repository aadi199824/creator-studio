import { NextRequest, NextResponse } from "next/server";

import { CSP_FORMATS, type CspFormat, type CspTemplateContent } from "@/lib/automation/csp-content";
import { renderCspPost } from "@/lib/render/csp-post";

/**
 * GET /api/automation/preview-csp?format=<one of CSP_FORMATS>
 *
 * DEVELOPMENT ONLY (404 in production). Renders a @csp_officials format
 * with fixed sample text — no Gemini call, nothing saved — to check layout
 * and Hindi rendering.
 */

const SAMPLES: Record<CspFormat, CspTemplateContent> = {
  olympics: {
    format: "olympics",
    title_top: "Corporate",
    title_highlight: "Olympic Events",
    edition: "2026",
    annotation: "Gold medals in survival, not **productivity**.",
    events: [
      { name: "Politics Dodge", text: "Dodging office politics like **Neo** in the Matrix.", icon: "dodge" },
      { name: "CC Throw", text: "Strategic use of the **\"CC\"** line as a weapon of mass destruction.", icon: "email" },
      { name: "Straight Face", text: "Saying **\"Per my last email\"** with a straight face.", icon: "speech" },
      { name: "VP Walk-By", text: "Pretending to look **busy** when the VP walks by.", icon: "laptop" },
    ],
    footer: "Same job, different kind of **competition**. :)",
  },
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
  payslip: {
    format: "payslip",
    headline: "Salary **Credited**…",
    subheadline: "और 2 दिन में **Debited**",
    employee_line: "Employee: Aam Aadmi · October",
    earnings: [{ label: "Basic Salary", amount: "₹45,000" }],
    deductions: [
      { label: "Rent", amount: "₹18,000" },
      { label: "EMI (Phone जो boss से बड़ा है)", amount: "₹6,500" },
      { label: "Weekend Swiggy therapy", amount: "₹4,200" },
      { label: "Office party contribution", amount: "₹1,000" },
      { label: "सपने", amount: "सारे" },
    ],
    net_amount: "₹15,300",
    stamp: "25 तारीख तक",
  },
  battery: {
    format: "battery",
    headline: "Employee का **Battery**",
    subheadline: "Monday से Friday तक",
    days: [
      { day: "MON", percent: 3, label: "Alarm ने मार दिया" },
      { day: "TUE", percent: 12, label: "5 meetings back to back" },
      { day: "WED", percent: 30, label: "आधा हफ्ता survive" },
      { day: "THU", percent: 55, label: "Weekend दिखने लगा" },
      { day: "FRI", percent: 100, label: "5:59 PM वाली energy" },
    ],
  },
  calendar: {
    format: "calendar",
    headline: "मेरा **Calendar**",
    subheadline: "vs मेरा **काम करने का time**",
    day_label: "Tuesday",
    summary: "9 meetings",
    events: [
      { time: "10 AM", title: "Daily Standup (15 min, chalega 45)", kind: "meeting", long: false },
      { time: "", title: "Sync on the sync", kind: "meeting", long: false },
      { time: "11 AM", title: 'Alignment call — "quick" hai', kind: "meeting", long: true },
      { time: "12 PM", title: "Brainstorm: Why are we behind?", kind: "meeting", long: true },
      { time: "1 PM", title: "Lunch (desk pe, mute karke)", kind: "break", long: false },
      { time: "2 PM", title: "Client call (camera on please)", kind: "meeting", long: true },
      { time: "4 PM", title: "Actual work — 15 min", kind: "work", long: false },
      { time: "", title: '"Can we connect EOD?"', kind: "meeting", long: false },
    ],
  },
  ticket: {
    format: "ticket",
    headline: "हर हफ्ते की **Flight**",
    subheadline: "जो कभी time पर नहीं पहुँचती",
    from_code: "MON",
    from_time: "Monday 9:00 AM",
    to_code: "FRI",
    to_time: "Friday 6:00 PM",
    fields: [
      { label: "PASSENGER", value: "Aam Employee", color: "white" },
      { label: "GATE", value: "Meeting Room 3", color: "white" },
      { label: "SEAT", value: "Hot Desk", color: "white" },
      { label: "STATUS", value: "DELAYED", color: "red" },
      { label: "BAGGAGE", value: "Pending Tasks", color: "white" },
      { label: "CLASS", value: "Overtime", color: "yellow" },
    ],
    stub: [
      { label: "DELAY", value: "Till Next Appraisal" },
      { label: "BOARDING", value: "Saturday Login" },
    ],
    footer: "आपकी flight कब land होती है? **Comment करो**",
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
