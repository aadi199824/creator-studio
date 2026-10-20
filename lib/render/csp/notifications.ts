import type { CspNotifications } from "@/lib/automation/csp-content";

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

const PHONE_WIDTH = 700;
const ICON_COLORS = [COLORS.red, COLORS.yellow, COLORS.green, "#1EA7FF", "#A855F7"];

/** Lock screen full of work notifications (Sunday-night dread). */
export async function renderNotifications(content: CspNotifications): Promise<Buffer> {
  const layers: Layer[] = [];

  let y = 44;
  if (content.headline) y += (await pushHeadline(layers, content.headline, COLORS.white, 86, y, COLORS.red)) + 4;
  if (content.subheadline) y += await pushHeadline(layers, content.subheadline, COLORS.white, 54, y);

  const phoneTop = Math.max(y + 40, 290);
  const phoneLeft = Math.round((CSP_WIDTH - PHONE_WIDTH) / 2);
  const cardWidth = PHONE_WIDTH - 60;
  const textWidth = cardWidth - 150;

  // Render text first so the phone is only as tall as its content.
  const clock = await renderText(markup(content.time, COLORS.white), 150);
  const date = await renderText(markup(content.date, COLORS.white), 30);
  const cards = [];
  for (const item of content.notifications) {
    const app = await renderText(markup(item.app, COLORS.white), 28, { align: "left" });
    const body = await renderText(markup(item.text, "#E5E7EB"), 27, { width: textWidth, align: "left" });
    const ago = await renderText(markup(item.ago, COLORS.grey), 20, { align: "right" });
    cards.push({ item, app, body, ago, height: Math.max(app.height + body.height + 34, 100) });
  }
  const contentHeight =
    40 + clock.height + date.height + 30 + cards.reduce((sum, card) => sum + card.height + 18, 0) + 30;
  const phoneHeight = Math.min(CSP_HEIGHT - 120 - phoneTop, contentHeight);

  layers.push({
    input: svg(
      PHONE_WIDTH,
      phoneHeight,
      `<defs><radialGradient id="s" cx="0.3" cy="0.15" r="0.9"><stop offset="0" stop-color="#4A0609"/><stop offset="1" stop-color="#120203"/></radialGradient></defs>
       <rect x="3" y="3" width="${PHONE_WIDTH - 6}" height="${phoneHeight - 6}" rx="56" fill="url(#s)" stroke="#2A2A2A" stroke-width="6"/>`
    ),
    left: phoneLeft,
    top: phoneTop,
  });

  let ny = phoneTop + 40;
  layers.push({ input: clock.buffer, left: phoneLeft + Math.round((PHONE_WIDTH - clock.width) / 2), top: ny });
  ny += clock.height;
  layers.push({ input: date.buffer, left: phoneLeft + Math.round((PHONE_WIDTH - date.width) / 2), top: ny });
  ny += date.height + 30;

  for (const [index, { item, app, body, ago, height: cardHeight }] of cards.entries()) {
    if (ny + cardHeight > phoneTop + phoneHeight - 24) break;

    const left = phoneLeft + 30;
    const color = ICON_COLORS[index % ICON_COLORS.length];
    const letter = await renderText(markup(item.app.charAt(0).toUpperCase(), color === COLORS.yellow ? COLORS.black : COLORS.white), 28);

    layers.push(
      { input: roundedRectSvg(cardWidth, cardHeight, { fill: "#1F1F1F", fillOpacity: 0.92, radius: 26 }), left, top: ny },
      { input: svg(54, 54, `<rect width="54" height="54" rx="14" fill="${color}"/>`), left: left + 22, top: ny + 18 },
      { input: letter.buffer, left: left + 22 + Math.round((54 - letter.width) / 2), top: ny + 18 + Math.round((54 - letter.height) / 2) },
      { input: app.buffer, left: left + 94, top: ny + 16 },
      { input: body.buffer, left: left + 94, top: ny + 16 + app.height },
      { input: ago.buffer, left: left + cardWidth - 20 - ago.width, top: ny + 18 }
    );
    ny += cardHeight + 18;
  }

  await pushBrand(layers);
  return toBuffer(layers);
}
