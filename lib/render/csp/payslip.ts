import type { CspPayslip } from "@/lib/automation/csp-content";

import {
  COLORS,
  CSP_HEIGHT,
  CSP_WIDTH,
  type Layer,
  composeOn,
  markup,
  pushBrand,
  pushHeadline,
  renderText,
  rotated,
  roundedRectSvg,
  svg,
  toBuffer,
} from "./common";

const PAPER = "#F5F1E8";
const INK = "#1A1A1A";
const NEG = "#C40812";
const SLIP_WIDTH = 860;
const PAD = 46;

/** Torn-paper zig-zag edge (top or bottom) for the payslip. */
function paperSvg(width: number, height: number): Buffer {
  const tooth = 16;
  let top = `M0 ${tooth}`;
  for (let x = 0; x < width; x += tooth) top += ` L${x + tooth / 2} 0 L${Math.min(x + tooth, width)} ${tooth}`;
  let bottom = "";
  for (let x = width; x > 0; x -= tooth) bottom += ` L${x - tooth / 2} ${height} L${Math.max(x - tooth, 0)} ${height - tooth}`;
  return svg(width, height, `<path d="${top} L${width} ${height - tooth}${bottom} Z" fill="${PAPER}"/>`);
}

/** Fake payslip: salary credited, then funny deductions, tilted like a real slip. */
export async function renderPayslip(content: CspPayslip): Promise<Buffer> {
  const layers: Layer[] = [];

  let y = 46;
  if (content.headline) y += (await pushHeadline(layers, content.headline, COLORS.white, 88, y)) + 4;
  if (content.subheadline) y += await pushHeadline(layers, content.subheadline, COLORS.red, 56, y, COLORS.white);

  // --- build the slip as its own image, then tilt it -----------------------------
  const inner: Layer[] = [];
  const contentWidth = SLIP_WIDTH - 2 * PAD;
  let sy = 44;

  const title = await renderText(markup("CSP PAYSLIP", INK), 36, { align: "left" });
  const employee = await renderText(markup(content.employee_line, "#555555"), 22, { align: "left" });
  const tag = await renderText(markup("CONFIDENTIAL", COLORS.white), 22);
  inner.push(
    { input: title.buffer, left: PAD, top: sy },
    { input: employee.buffer, left: PAD, top: sy + title.height + 10 },
    { input: roundedRectSvg(tag.width + 28, tag.height + 12, { fill: COLORS.red, radius: 8 }), left: SLIP_WIDTH - PAD - tag.width - 28, top: sy },
    { input: tag.buffer, left: SLIP_WIDTH - PAD - tag.width - 14, top: sy + 6 }
  );
  sy += title.height + 10 + employee.height + 22;
  inner.push({ input: svg(contentWidth, 4, `<line x1="0" y1="2" x2="${contentWidth}" y2="2" stroke="#999" stroke-width="3" stroke-dasharray="10 8"/>`), left: PAD, top: sy });
  sy += 16;

  async function section(label: string, rows: { label: string; amount: string }[], negative: boolean) {
    const head = await renderText(markup(label, "#777777"), 21, { align: "left" });
    inner.push({ input: head.buffer, left: PAD, top: sy + 6 });
    sy += head.height + 18;
    for (const row of rows) {
      // Text images are cropped to the ink, so centre both sides in the row.
      const left = await renderText(markup(row.label, INK), 30, { width: contentWidth - 220, align: "left" });
      const right = await renderText(markup((negative ? "− " : "") + row.amount, negative ? NEG : INK), 30, { align: "right" });
      const rowHeight = Math.max(left.height, right.height) + 30;
      inner.push(
        { input: left.buffer, left: PAD, top: sy + Math.round((rowHeight - left.height) / 2) },
        { input: right.buffer, left: SLIP_WIDTH - PAD - right.width, top: sy + Math.round((rowHeight - right.height) / 2) },
        { input: svg(contentWidth, 2, `<rect width="${contentWidth}" height="1" fill="#DDDDDD"/>`), left: PAD, top: sy + rowHeight }
      );
      sy += rowHeight + 2;
    }
    sy += 10;
  }

  await section("EARNINGS", content.earnings, false);
  await section("DEDUCTIONS", content.deductions, true);

  // Net in hand bar.
  const netLabel = await renderText(markup("NET IN HAND", COLORS.white), 32, { align: "left" });
  const netAmount = await renderText(markup(content.net_amount || "₹0", COLORS.yellow), 46, { align: "right" });
  const netHeight = Math.max(netLabel.height, netAmount.height) + 28;
  inner.push(
    { input: roundedRectSvg(contentWidth, netHeight, { fill: "#111111", radius: 12 }), left: PAD, top: sy },
    { input: netLabel.buffer, left: PAD + 22, top: sy + Math.round((netHeight - netLabel.height) / 2) },
    { input: netAmount.buffer, left: SLIP_WIDTH - PAD - 22 - netAmount.width, top: sy + Math.round((netHeight - netAmount.height) / 2) }
  );
  sy += netHeight + 44;
  const slipHeight = sy;

  let slip = await composeOn(SLIP_WIDTH, slipHeight, paperSvg(SLIP_WIDTH, slipHeight), inner);

  // Red rubber stamp across the lower right.
  if (content.stamp) {
    const stampText = await renderText(markup(content.stamp, NEG), 34);
    const w = stampText.width + 36;
    const h = stampText.height + 16;
    const stamp = await composeOn(w, h, roundedRectSvg(w, h, { fill: PAPER, fillOpacity: 0, stroke: NEG, strokeWidth: 5, radius: 10 }), [
      { input: stampText.buffer, left: 18, top: 8 },
    ]);
    const tilted = await rotated(stamp, -14);
    // Sits over the right half of the employee line, like a hand stamp.
    slip = await composeOn(SLIP_WIDTH, slipHeight, slip, [
      { input: tilted.buffer, left: SLIP_WIDTH - PAD - tilted.width - 10, top: 44 + title.height + 4 },
    ]);
  }

  const tiltedSlip = await rotated(slip, -1.5);
  // Centre the slip between the headline and the brand row.
  const space = CSP_HEIGHT - 110 - (y + 30);
  layers.push({
    input: tiltedSlip.buffer,
    left: Math.round((CSP_WIDTH - tiltedSlip.width) / 2),
    top: y + 30 + Math.max(0, Math.round((space - tiltedSlip.height) / 2)),
  });

  await pushBrand(layers);
  return toBuffer(layers);
}
