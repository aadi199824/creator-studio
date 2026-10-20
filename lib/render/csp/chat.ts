import type { CspChat } from "@/lib/automation/csp-content";

import {
  COLORS,
  CSP_HEIGHT,
  CSP_WIDTH,
  type Layer,
  composeOn,
  markup,
  phoneFrameSvg,
  pushBrand,
  pushHeadline,
  renderText,
  rotated,
  roundedRectSvg,
  svg,
  toBuffer,
} from "./common";

const PHONE_WIDTH = 740;
const BUBBLE_MAX_TEXT = 470;

/**
 * Late-night chat with "Manager" on a generic phone screen (deliberately not
 * any real messaging app's design), headline on top, yellow stamp punchline.
 */
export async function renderChat(content: CspChat): Promise<Buffer> {
  const layers: Layer[] = [];

  let y = 44;
  if (content.headline) y += (await pushHeadline(layers, content.headline, COLORS.white, 84, y)) + 4;
  if (content.subheadline) y += await pushHeadline(layers, content.subheadline, COLORS.red, 54, y, COLORS.yellow);

  // Build bubbles first so the phone can be sized to fit them.
  const bubbles = [];
  for (const message of content.messages) {
    const text = await renderText(markup(message.text, COLORS.white), 32, { width: BUBBLE_MAX_TEXT, align: "left" });
    const time = await renderText(
      markup(message.time + (message.from === "me" ? "  ✓✓" : ""), COLORS.grey),
      18,
      { align: "left" }
    );
    const width = Math.max(text.width, time.width) + 48;
    const height = text.height + time.height + 34;
    bubbles.push({ message, text, time, width, height });
  }

  const headerHeight = 112;
  const gap = 18;
  const chatHeight = bubbles.reduce((sum, bubble) => sum + bubble.height, 0) + gap * (bubbles.length - 1);
  const phoneTop = Math.max(y + 40, 300);
  const phoneHeight = Math.min(CSP_HEIGHT - 130 - phoneTop, headerHeight + 40 + chatHeight + 40);
  const phoneLeft = Math.round((CSP_WIDTH - PHONE_WIDTH) / 2);

  layers.push({ input: phoneFrameSvg(PHONE_WIDTH, phoneHeight, "#111111"), left: phoneLeft, top: phoneTop });

  // Header: avatar initial, contact name, "online".
  layers.push({
    input: svg(
      PHONE_WIDTH - 12,
      headerHeight,
      `<rect width="100%" height="100%" rx="50" fill="#1B1B1B"/><rect y="${headerHeight - 2}" width="100%" height="2" fill="#262626"/>
       <circle cx="70" cy="${headerHeight / 2}" r="34" fill="${COLORS.red}"/>`
    ),
    left: phoneLeft + 6,
    top: phoneTop + 6,
  });
  const initial = await renderText(markup(content.contact.charAt(0).toUpperCase(), COLORS.white), 34);
  const name = await renderText(markup(content.contact, COLORS.white), 32, { align: "left" });
  const status = await renderText(markup("online", COLORS.green), 22, { align: "left" });
  layers.push(
    { input: initial.buffer, left: phoneLeft + 76 - Math.round(initial.width / 2), top: phoneTop + 6 + Math.round((headerHeight - initial.height) / 2) },
    { input: name.buffer, left: phoneLeft + 130, top: phoneTop + 22 },
    { input: status.buffer, left: phoneLeft + 130, top: phoneTop + 22 + name.height }
  );

  // Bubbles: theirs on the left (grey), mine on the right (dark red).
  let by = phoneTop + headerHeight + 30;
  for (const bubble of bubbles) {
    if (by + bubble.height > phoneTop + phoneHeight - 20) break;
    const mine = bubble.message.from === "me";
    const left = mine ? phoneLeft + PHONE_WIDTH - 34 - bubble.width : phoneLeft + 34;
    layers.push(
      { input: roundedRectSvg(bubble.width, bubble.height, { fill: mine ? "#7A0A0F" : "#262626", radius: 22 }), left, top: by },
      { input: bubble.text.buffer, left: left + 24, top: by + 16 },
      { input: bubble.time.buffer, left: left + bubble.width - 24 - bubble.time.width, top: by + 18 + bubble.text.height }
    );
    by += bubble.height + gap;
  }

  // Yellow stamp punchline, tilted, overlapping the phone's lower edge.
  if (content.stamp) {
    const stampText = await renderText(markup(content.stamp, COLORS.yellow), 40);
    const stampWidth = stampText.width + 48;
    const stampHeight = stampText.height + 24;
    const stamp = await composeOn(
      stampWidth,
      stampHeight,
      roundedRectSvg(stampWidth, stampHeight, { fill: "#080808", fillOpacity: 0.9, stroke: COLORS.yellow, strokeWidth: 6, radius: 12 }),
      [{ input: stampText.buffer, left: 24, top: 12 }]
    );
    const tilted = await rotated(stamp, -8);
    layers.push({
      input: tilted.buffer,
      left: Math.min(CSP_WIDTH - 20 - tilted.width, phoneLeft + PHONE_WIDTH - tilted.width + 60),
      top: Math.min(CSP_HEIGHT - 110 - tilted.height, phoneTop + phoneHeight - Math.round(tilted.height / 2)),
    });
  }

  await pushBrand(layers);
  return toBuffer(layers);
}
