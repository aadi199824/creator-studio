/**
 * Structured content for the @csp_officials post formats
 * (lib/render/csp/*). Gemini writes only the words; layout, colours and
 * fonts are fixed in code.
 *
 * Formats rotate one per day (see getCspFormatForDate) so the feed mixes
 * familiar and new templates:
 * - dictionary     — "Corporate Dictionary": office phrase → real meaning
 * - chat           — late-night chat with "Manager" on a generic phone screen
 * - notifications  — Sunday-night lock screen full of work notifications
 * - poster         — the original big Hinglish headline + ❌ panels + 💡 tip
 * - versus         — Expectation vs Reality, two columns
 * - payslip        — fake payslip: salary credited, funny deductions
 * - battery        — employee energy battery, Monday → Friday
 * - calendar       — a day packed with meetings, 15 min of actual work
 * - ticket         — "CSP Airways" boarding pass, MON → FRI, delayed
 * - olympics       — "Corporate Olympics": 4 office "events" with medals
 *
 * Highlight syntax: wrap words in **double asterisks** to render them in
 * the brand yellow.
 */

// Order = rotation order. Similar formats are spaced apart.
export const CSP_FORMATS = [
  "dictionary",
  "chat",
  "payslip",
  "notifications",
  "poster",
  "battery",
  "olympics",
  "versus",
  "calendar",
  "ticket",
] as const;
export type CspFormat = (typeof CSP_FORMATS)[number];

/** Human-readable names for the format picker in the Content Library. */
export const CSP_FORMAT_LABELS: Record<CspFormat, string> = {
  dictionary: "Corporate Dictionary",
  chat: "Late-night Chat",
  payslip: "Fake Payslip",
  notifications: "Sunday Notifications",
  poster: "Headline Poster",
  battery: "Weekly Battery",
  versus: "Expectation vs Reality",
  calendar: "Calendar Overload",
  ticket: "Boarding Pass",
  olympics: "Hand-drawn List (Olympics style)",
};

export type CspLineColor = "white" | "red" | "yellow";

export type CspDictionary = {
  format: "dictionary";
  title_white: string;
  title_red: string;
  subtitle: string;
  entries: { phrase: string; meaning: string }[];
  footer: string;
};

export type CspChat = {
  format: "chat";
  headline: string;
  subheadline: string;
  contact: string;
  messages: { from: "them" | "me"; text: string; time: string }[];
  stamp: string;
};

export type CspNotifications = {
  format: "notifications";
  headline: string;
  subheadline: string;
  time: string;
  date: string;
  notifications: { app: string; text: string; ago: string }[];
};

export type CspPoster = {
  format: "poster";
  headline: { text: string; color: CspLineColor }[];
  left_panel: string;
  right_panel: string;
  tip: string;
};

export type CspVersus = {
  format: "versus";
  topic: string;
  left_title: string;
  right_title: string;
  left_points: string[];
  right_points: string[];
  footer: string;
};

export type CspPayslip = {
  format: "payslip";
  headline: string;
  subheadline: string;
  employee_line: string;
  earnings: { label: string; amount: string }[];
  deductions: { label: string; amount: string }[];
  net_amount: string;
  stamp: string;
};

export type CspBattery = {
  format: "battery";
  headline: string;
  subheadline: string;
  days: { day: string; percent: number; label: string }[];
};

export type CspCalendarEvent = { time: string; title: string; kind: "meeting" | "work" | "break"; long: boolean };

export type CspCalendar = {
  format: "calendar";
  headline: string;
  subheadline: string;
  day_label: string;
  summary: string;
  events: CspCalendarEvent[];
};

export type CspTicketField = { label: string; value: string; color: CspLineColor };

export type CspTicket = {
  format: "ticket";
  headline: string;
  subheadline: string;
  from_code: string;
  from_time: string;
  to_code: string;
  to_time: string;
  fields: CspTicketField[];
  stub: { label: string; value: string }[];
  footer: string;
};

export const CSP_OLYMPICS_ICONS = ["dodge", "email", "speech", "laptop", "coffee", "clock", "calendar", "meeting"] as const;
export type CspOlympicsIcon = (typeof CSP_OLYMPICS_ICONS)[number];

export type CspOlympics = {
  format: "olympics";
  title_top: string;
  title_highlight: string;
  edition: string;
  annotation: string;
  events: { name: string; text: string; icon: CspOlympicsIcon }[];
  footer: string;
};

export type CspTemplateContent =
  | CspDictionary
  | CspChat
  | CspNotifications
  | CspPoster
  | CspVersus
  | CspPayslip
  | CspBattery
  | CspCalendar
  | CspTicket
  | CspOlympics;

// --- format rotation ----------------------------------------------------------

/**
 * Today's format, by IST calendar day. The hand-drawn list ("olympics") is
 * CSP's main look and runs every other day (~3–4 days a week); the days in
 * between cycle through the dark formats so the feed stays varied.
 * Deterministic — no DB needed. Any format can still be picked manually.
 */
export function getCspFormatForDate(date: Date = new Date()): CspFormat {
  const istDay = Math.floor((date.getTime() + 5.5 * 60 * 60 * 1000) / 86_400_000);
  if (istDay % 2 === 0) return "olympics";
  const darkFormats = CSP_FORMATS.filter((format) => format !== "olympics");
  return darkFormats[Math.floor(istDay / 2) % darkFormats.length];
}

// --- sanitising ---------------------------------------------------------------

function clean(value: unknown, max: number, fallback = ""): string {
  // Emoji are stripped: the post font has no emoji glyphs.
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

function lineColor(value: unknown): CspLineColor {
  return (["white", "red", "yellow"] as const).includes(value as CspLineColor) ? (value as CspLineColor) : "white";
}

/** Money/label amount without any leading sign (the renderer adds "−"). */
function amount(value: unknown, max: number): string {
  return clean(value, max).replace(/^[-−–+\s]+/, "");
}

function objects(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    : [];
}

function strings(value: unknown, max: number, limit: number): string[] {
  return (Array.isArray(value) ? value : [])
    .map((item) => clean(item, max))
    .filter(Boolean)
    .slice(0, limit);
}

/**
 * Parses Gemini's "template" object for the expected format. Returns null
 * when it is missing/unusable — the caller then saves the draft without an
 * automatic image instead of failing.
 */
export function parseCspTemplate(
  parsed: Record<string, unknown>,
  format: CspFormat
): CspTemplateContent | null {
  const t =
    parsed.template && typeof parsed.template === "object"
      ? (parsed.template as Record<string, unknown>)
      : null;
  if (!t) return null;

  switch (format) {
    case "dictionary": {
      const entries = objects(t.entries)
        .map((entry) => ({
          phrase: clean(entry.phrase, 30).replace(/^["“”']+|["“”']+$/g, ""),
          meaning: clean(entry.meaning, 40),
        }))
        .filter((entry) => entry.phrase && entry.meaning)
        .slice(0, 5);
      if (entries.length < 3) return null;
      return {
        format,
        title_white: clean(t.title_white, 14, "CORPORATE").toUpperCase(),
        title_red: clean(t.title_red, 12, "DICTIONARY").toUpperCase(),
        subtitle: clean(t.subtitle, 40, "Office की भाषा » असली मतलब"),
        entries,
        footer: clean(t.footer, 60, "आपके office में कौनसा सबसे ज़्यादा चलता है?"),
      };
    }

    case "chat": {
      const messages = objects(t.messages)
        .map((message) => ({
          from: message.from === "me" ? ("me" as const) : ("them" as const),
          text: clean(message.text, 90),
          time: clean(message.time, 8),
        }))
        .filter((message) => message.text)
        .slice(0, 6);
      if (messages.length < 3) return null;
      return {
        format,
        headline: clean(t.headline, 34),
        subheadline: clean(t.subheadline, 40),
        contact: clean(t.contact, 18, "Manager"),
        messages,
        stamp: clean(t.stamp, 30),
      };
    }

    case "notifications": {
      const notifications = objects(t.notifications)
        .map((item) => ({
          app: clean(item.app, 18),
          text: clean(item.text, 70),
          ago: clean(item.ago, 6, "now"),
        }))
        .filter((item) => item.app && item.text)
        .slice(0, 5);
      if (notifications.length < 3) return null;
      return {
        format,
        headline: clean(t.headline, 30),
        subheadline: clean(t.subheadline, 40),
        time: clean(t.time, 5, "10:58"),
        date: clean(t.date, 24, "Sunday"),
        notifications,
      };
    }

    case "poster": {
      const headline = objects(t.headline)
        .map((line) => ({
          text: clean(line.text, 30),
          color: (["white", "red", "yellow"] as const).includes(line.color as CspLineColor)
            ? (line.color as CspLineColor)
            : "white",
        }))
        .filter((line) => line.text)
        .slice(0, 5);
      if (headline.length < 2) return null;
      return {
        format,
        headline,
        left_panel: clean(t.left_panel, 48),
        right_panel: clean(t.right_panel, 48),
        tip: clean(t.tip, 70),
      };
    }

    case "versus": {
      const left = strings(t.left_points, 40, 4);
      const right = strings(t.right_points, 40, 4);
      if (left.length < 2 || right.length < 2) return null;
      return {
        format,
        topic: clean(t.topic, 32),
        left_title: clean(t.left_title, 14, "Expectation"),
        right_title: clean(t.right_title, 14, "Reality"),
        left_points: left,
        right_points: right,
        footer: clean(t.footer, 60),
      };
    }

    case "payslip": {
      const toRows = (value: unknown, limit: number) =>
        objects(value)
          .map((row) => ({ label: clean(row.label, 34), amount: amount(row.amount, 14) }))
          .filter((row) => row.label && row.amount)
          .slice(0, limit);
      const earnings = toRows(t.earnings, 2);
      const deductions = toRows(t.deductions, 5);
      if (earnings.length === 0 || deductions.length < 3) return null;
      return {
        format,
        headline: clean(t.headline, 30),
        subheadline: clean(t.subheadline, 40),
        employee_line: clean(t.employee_line, 40, "Employee: Aam Aadmi"),
        earnings,
        deductions,
        net_amount: amount(t.net_amount, 14),
        stamp: clean(t.stamp, 20),
      };
    }

    case "battery": {
      const days = objects(t.days)
        .map((entry) => ({
          day: clean(entry.day, 4).toUpperCase(),
          percent: Math.max(1, Math.min(100, Math.round(Number(entry.percent) || 0))),
          label: clean(entry.label, 24),
        }))
        .filter((entry) => entry.day)
        .slice(0, 5);
      if (days.length < 4) return null;
      return { format, headline: clean(t.headline, 30), subheadline: clean(t.subheadline, 40), days };
    }

    case "calendar": {
      const events = objects(t.events)
        .map((event) => ({
          time: clean(event.time, 6),
          title: clean(event.title, 44),
          kind: (["meeting", "work", "break"] as const).includes(event.kind as CspCalendarEvent["kind"])
            ? (event.kind as CspCalendarEvent["kind"])
            : ("meeting" as const),
          long: event.long === true,
        }))
        .filter((event) => event.title)
        .slice(0, 9);
      if (events.length < 5) return null;
      return {
        format,
        headline: clean(t.headline, 30),
        subheadline: clean(t.subheadline, 40),
        day_label: clean(t.day_label, 14, "Tuesday"),
        summary: clean(t.summary, 18, `${events.length} meetings`),
        events,
      };
    }

    case "olympics": {
      const events = objects(t.events)
        .map((event, index) => ({
          name: clean(event.name, 26),
          text: clean(event.text, 80),
          icon: (CSP_OLYMPICS_ICONS as readonly string[]).includes(event.icon as string)
            ? (event.icon as CspOlympicsIcon)
            : CSP_OLYMPICS_ICONS[index % CSP_OLYMPICS_ICONS.length],
        }))
        .filter((event) => event.name && event.text)
        .slice(0, 4);
      if (events.length < 3) return null;
      return {
        format,
        title_top: clean(t.title_top, 12, "Corporate"),
        title_highlight: clean(t.title_highlight, 16, "Olympic Events"),
        edition: typeof t.edition === "string" ? clean(t.edition, 6) : String(new Date().getFullYear()),
        annotation: clean(t.annotation, 50),
        events,
        footer: clean(t.footer, 60),
      };
    }

    case "ticket": {
      const fields = objects(t.fields)
        .map((field) => ({ label: clean(field.label, 12).toUpperCase(), value: clean(field.value, 22), color: lineColor(field.color) }))
        .filter((field) => field.label && field.value)
        .slice(0, 6);
      const stub = objects(t.stub)
        .map((item) => ({ label: clean(item.label, 12).toUpperCase(), value: clean(item.value, 22) }))
        .filter((item) => item.label && item.value)
        .slice(0, 2);
      if (fields.length < 4) return null;
      return {
        format,
        headline: clean(t.headline, 30),
        subheadline: clean(t.subheadline, 40),
        from_code: clean(t.from_code, 4, "MON").toUpperCase(),
        from_time: clean(t.from_time, 22),
        to_code: clean(t.to_code, 4, "FRI").toUpperCase(),
        to_time: clean(t.to_time, 22),
        fields,
        stub,
        footer: clean(t.footer, 60),
      };
    }
  }
}
