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
 *
 * Highlight syntax: wrap words in **double asterisks** to render them in
 * the brand yellow.
 */

export const CSP_FORMATS = ["dictionary", "chat", "notifications", "poster", "versus"] as const;
export type CspFormat = (typeof CSP_FORMATS)[number];

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

export type CspTemplateContent = CspDictionary | CspChat | CspNotifications | CspPoster | CspVersus;

// --- format rotation ----------------------------------------------------------

/**
 * One format per IST calendar day, cycling through CSP_FORMATS so the same
 * template never appears two days running. Deterministic — no DB needed.
 */
export function getCspFormatForDate(date: Date = new Date()): CspFormat {
  const istDay = Math.floor((date.getTime() + 5.5 * 60 * 60 * 1000) / 86_400_000);
  return CSP_FORMATS[istDay % CSP_FORMATS.length];
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
        subtitle: clean(t.subtitle, 40, "Office की भाषा → असली मतलब"),
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
  }
}
