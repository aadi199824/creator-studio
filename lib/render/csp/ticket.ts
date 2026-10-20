import type { CspLineColor, CspTicket } from "@/lib/automation/csp-content";

import {
  COLORS,
  CSP_HEIGHT,
  CSP_WIDTH,
  type Layer,
  type RenderedText,
  markup,
  pushBrand,
  pushFooter,
  pushHeadline,
  renderText,
  svg,
  toBuffer,
} from "./common";

const TICKET_LEFT = 70;
const TICKET_WIDTH = CSP_WIDTH - 2 * TICKET_LEFT;
const STUB_WIDTH = 250;
const MAIN_WIDTH = TICKET_WIDTH - STUB_WIDTH;
const PAD = 44;
const LABEL_GAP = 10;

const VALUE_COLORS: Record<CspLineColor, string> = {
  white: COLORS.white,
  red: COLORS.red,
  yellow: COLORS.yellow,
};

function barcodeSvg(width: number, height: number): Buffer {
  const bars = [4, 2, 5, 3, 2, 6, 3, 2, 4, 5, 2, 3, 6, 2, 4, 3, 5, 2, 3, 4, 2, 6, 3, 5, 2, 4];
  let x = 0;
  let body = "";
  for (const [index, bar] of bars.entries()) {
    if (x >= width) break;
    if (index % 2 === 0) body += `<rect x="${x}" y="0" width="${bar}" height="${height}" fill="#080808"/>`;
    x += bar + 2;
  }
  return svg(width, height, body);
}

/** "CSP Airways" boarding pass: MON → FRI, status DELAYED. */
export async function renderTicket(content: CspTicket): Promise<Buffer> {
  const layers: Layer[] = [];

  let y = 46;
  if (content.headline) y += (await pushHeadline(layers, content.headline, COLORS.white, 88, y)) + 4;
  if (content.subheadline) y += await pushHeadline(layers, content.subheadline, COLORS.red, 54, y, COLORS.white);


  // Pre-render text to size the ticket.
  const airline = await renderText(markup("CSP AIRWAYS  ·  BOARDING PASS", COLORS.yellow), 24, { align: "left" });
  const fromCode = await renderText(markup(content.from_code, COLORS.white), 96, { align: "left" });
  const toCode = await renderText(markup(content.to_code, COLORS.white), 96, { align: "right" });
  const fromTime = await renderText(markup(content.from_time, "#AAAAAA"), 26, { align: "left" });
  const toTime = await renderText(markup(content.to_time, "#AAAAAA"), 26, { align: "right" });

  const fieldWidth = Math.floor((MAIN_WIDTH - 2 * PAD) / 3);
  const fields: { label: RenderedText; value: RenderedText }[] = [];
  for (const field of content.fields) {
    const label = await renderText(markup(field.label, "#999999"), 20, { align: "left" });
    const value = await renderText(markup(field.value, VALUE_COLORS[field.color]), 32, { width: fieldWidth - 16, align: "left" });
    fields.push({ label, value });
  }
  const rows = Math.ceil(fields.length / 3);
  const rowHeights = Array.from({ length: rows }, (_, row) =>
    Math.max(...fields.slice(row * 3, row * 3 + 3).map((f) => f.label.height + LABEL_GAP + f.value.height)) + 34
  );

  // Text images are cropped to the ink, so stacked text needs explicit gaps.
  const routeTop = PAD + airline.height + 36;
  const fieldsTop = routeTop + fromCode.height + 14 + fromTime.height + 40;
  const ticketHeight = fieldsTop + rowHeights.reduce((a, b) => a + b, 0) + PAD - 20;

  // Centre the ticket between the headline and the footer line.
  const space = CSP_HEIGHT - (content.footer ? 230 : 130) - (y + 30);
  const top = y + 30 + Math.max(0, Math.round((space - ticketHeight) / 2));

  // Ticket body: dark main part + red stub, notches at the tear line.
  layers.push({
    input: svg(
      TICKET_WIDTH,
      ticketHeight,
      `<defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1C1C1C"/><stop offset="1" stop-color="#0F0F0F"/></linearGradient></defs>
       <rect x="1" y="1" width="${MAIN_WIDTH + 30}" height="${ticketHeight - 2}" rx="28" fill="url(#m)" stroke="#333" stroke-width="2"/>
       <rect x="${MAIN_WIDTH}" y="0" width="${STUB_WIDTH}" height="${ticketHeight}" rx="28" fill="${COLORS.red}"/>
       <rect x="${MAIN_WIDTH}" y="0" width="30" height="${ticketHeight}" fill="${COLORS.red}"/>
       <line x1="${MAIN_WIDTH}" y1="24" x2="${MAIN_WIDTH}" y2="${ticketHeight - 24}" stroke="#080808" stroke-width="4" stroke-dasharray="12 10"/>
       <circle cx="${MAIN_WIDTH}" cy="0" r="22" fill="#080808"/><circle cx="${MAIN_WIDTH}" cy="${ticketHeight}" r="22" fill="#080808"/>`
    ),
    left: TICKET_LEFT,
    top,
  });

  const x0 = TICKET_LEFT + PAD;
  const mainRight = TICKET_LEFT + MAIN_WIDTH - PAD;
  layers.push({ input: airline.buffer, left: x0, top: top + PAD });

  // Route: FROM - - - ✈ TO
  layers.push(
    { input: fromCode.buffer, left: x0, top: top + routeTop },
    { input: toCode.buffer, left: mainRight - toCode.width, top: top + routeTop },
    { input: fromTime.buffer, left: x0, top: top + routeTop + fromCode.height + 14 },
    { input: toTime.buffer, left: mainRight - toTime.width, top: top + routeTop + toCode.height + 14 }
  );
  const lineLeft = x0 + fromCode.width + 24;
  const lineWidth = mainRight - toCode.width - 24 - lineLeft;
  if (lineWidth > 40) {
    layers.push({
      input: svg(
        lineWidth,
        30,
        `<line x1="0" y1="15" x2="${lineWidth - 30}" y2="15" stroke="#555" stroke-width="4" stroke-dasharray="10 8"/>
         <polygon points="${lineWidth - 28},3 ${lineWidth},15 ${lineWidth - 28},27" fill="${COLORS.yellow}"/>`
      ),
      left: lineLeft,
      top: top + routeTop + Math.round(fromCode.height / 2) - 15,
    });
  }

  // Detail fields in a 3-column grid.
  let fy = top + fieldsTop;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < 3; col++) {
      const field = fields[row * 3 + col];
      if (!field) continue;
      const fx = x0 + col * fieldWidth;
      layers.push({ input: field.label.buffer, left: fx, top: fy }, { input: field.value.buffer, left: fx, top: fy + field.label.height + LABEL_GAP });
    }
    fy += rowHeights[row];
  }

  // Stub: two label/value pairs + barcode.
  const stubLeft = TICKET_LEFT + MAIN_WIDTH + 28;
  let sy = top + PAD;
  for (const item of content.stub) {
    const label = await renderText(markup(item.label, "#FFD6D8"), 20, { align: "left" });
    const value = await renderText(markup(item.value, COLORS.white), 36, { width: STUB_WIDTH - 50, align: "left" });
    layers.push({ input: label.buffer, left: stubLeft, top: sy }, { input: value.buffer, left: stubLeft, top: sy + label.height + LABEL_GAP });
    sy += label.height + LABEL_GAP + value.height + 34;
  }
  const barcodeHeight = 80;
  layers.push({ input: barcodeSvg(STUB_WIDTH - 56, barcodeHeight), left: stubLeft, top: top + ticketHeight - PAD - barcodeHeight });

  await pushFooter(layers, content.footer);
  await pushBrand(layers);
  return toBuffer(layers);
}
