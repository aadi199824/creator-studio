import type { CspCalendar, CspCalendarEvent } from "@/lib/automation/csp-content";

import {
  COLORS,
  CSP_HEIGHT,
  CSP_WIDTH,
  type Layer,
  markup,
  pushBrand,
  pushHeadline,
  renderText,
  roundedRectSvg,
  svg,
  toBuffer,
} from "./common";

const CAL_LEFT = 80;
const CAL_WIDTH = CSP_WIDTH - 2 * CAL_LEFT;
const TIME_COLUMN = 110;

const EVENT_STYLE: Record<CspCalendarEvent["kind"], { fill: string; bar: string; text: string }> = {
  meeting: { fill: "#5A0A0F", bar: COLORS.red, text: COLORS.white },
  break: { fill: "#3A3200", bar: COLORS.yellow, text: "#FFE27A" },
  work: { fill: "#3A3200", bar: COLORS.yellow, text: "#FFE27A" },
};

/** A calendar day packed with meetings; "actual work" gets crossed out by the now-line. */
export async function renderCalendar(content: CspCalendar): Promise<Buffer> {
  const layers: Layer[] = [];

  let y = 46;
  if (content.headline) y += (await pushHeadline(layers, content.headline, COLORS.white, 86, y, COLORS.red)) + 4;
  if (content.subheadline) y += await pushHeadline(layers, content.subheadline, COLORS.white, 52, y);

  const calTop = Math.max(y + 36, 270);
  const calHeight = CSP_HEIGHT - 130 - calTop;
  const headerHeight = 84;

  layers.push({ input: roundedRectSvg(CAL_WIDTH, calHeight, { fill: "#121212", stroke: "#2B2B2B", strokeWidth: 2, radius: 28 }), left: CAL_LEFT, top: calTop });
  layers.push({
    input: svg(CAL_WIDTH - 4, headerHeight, `<rect width="100%" height="100%" rx="26" fill="#1B1B1B"/><rect y="${headerHeight - 2}" width="100%" height="2" fill="#2B2B2B"/>`),
    left: CAL_LEFT + 2,
    top: calTop + 2,
  });
  const dayLabel = await renderText(markup(content.day_label, COLORS.white), 32, { align: "left" });
  const summary = await renderText(markup(content.summary, COLORS.red), 30, { align: "right" });
  layers.push(
    { input: dayLabel.buffer, left: CAL_LEFT + 30, top: calTop + Math.round((headerHeight - dayLabel.height) / 2) },
    { input: summary.buffer, left: CAL_LEFT + CAL_WIDTH - 30 - summary.width, top: calTop + Math.round((headerHeight - summary.height) / 2) }
  );

  // Fit events into the body: long events take two units.
  const bodyTop = calTop + headerHeight + 16;
  const bodyHeight = calHeight - headerHeight - 32;
  const units = content.events.reduce((sum, event) => sum + (event.long ? 2 : 1), 0);
  const gap = 8;
  const unit = Math.min(96, Math.floor((bodyHeight - gap * (content.events.length - 1)) / units));
  const eventLeft = CAL_LEFT + TIME_COLUMN;
  const eventWidth = CAL_WIDTH - TIME_COLUMN - 28;

  let ey = bodyTop;
  for (const event of content.events) {
    const height = unit * (event.long ? 2 : 1);
    const style = EVENT_STYLE[event.kind];

    if (event.time) {
      const time = await renderText(markup(event.time, "#777777"), 20, { align: "left" });
      layers.push(
        { input: svg(CAL_WIDTH - 4, 2, `<rect width="100%" height="1" fill="#262626"/>`), left: CAL_LEFT + 2, top: ey - 4 },
        { input: time.buffer, left: CAL_LEFT + 22, top: ey + 2 }
      );
    }

    layers.push({
      input: svg(
        eventWidth,
        height,
        `<rect width="${eventWidth}" height="${height}" rx="12" fill="${style.fill}"/><rect width="8" height="${height}" rx="3" fill="${style.bar}"/>`
      ),
      left: eventLeft,
      top: ey,
    });

    const size = height < 56 ? 22 : 25;
    const title = await renderText(markup(event.title, style.text), size, { width: eventWidth - 40, align: "left" });
    const titleTop = ey + Math.max(4, Math.round((height - title.height) / 2));
    layers.push({ input: title.buffer, left: eventLeft + 24, top: titleTop });

    // The yellow "now" line strikes through the actual-work slot — the punchline.
    if (event.kind === "work") {
      const lineY = ey + Math.round(height / 2);
      layers.push({
        input: svg(
          eventWidth + 40,
          20,
          `<circle cx="10" cy="10" r="9" fill="${COLORS.yellow}"/><rect x="10" y="8" width="${eventWidth + 26}" height="4" fill="${COLORS.yellow}"/>`
        ),
        left: eventLeft - 30,
        top: lineY - 10,
      });
    }

    ey += height + gap;
  }

  await pushBrand(layers);
  return toBuffer(layers);
}
