import type { CspLineColor, CspPoster } from "@/lib/automation/csp-content";

import {
  COLORS,
  CONTENT_WIDTH,
  CSP_HEIGHT,
  CSP_WIDTH,
  type Layer,
  MARGIN,
  markup,
  pushBrand,
  renderFitted,
  renderText,
  roundedRectSvg,
  svg,
  toBuffer,
} from "./common";

const LINE_COLORS: Record<CspLineColor, string> = {
  white: COLORS.white,
  red: COLORS.red,
  yellow: COLORS.yellow,
};

function lineSize(text: string): number {
  const plain = text.replace(/\*\*/g, "");
  return Math.max(70, Math.min(150, Math.floor(CONTENT_WIDTH / (plain.length * 0.56))));
}

/**
 * The original live-post layout (without the mascot): oversized stacked
 * Hinglish headline, two ❌ panels, and the 💡 "याद रखो" tip box.
 */
export async function renderPoster(content: CspPoster): Promise<Buffer> {
  const layers: Layer[] = [];

  // Headline block, vertically centred in the upper area.
  const scale = content.headline.length >= 5 ? 0.82 : content.headline.length === 4 ? 0.92 : 1;
  const lines = [];
  for (const line of content.headline) {
    const size = Math.round(lineSize(line.text) * scale);
    const base = LINE_COLORS[line.color];
    const highlight = line.color === "yellow" ? COLORS.white : COLORS.yellow;
    const front = await renderFitted(markup(line.text, base, highlight), size, CONTENT_WIDTH);
    const shadow = await renderFitted(markup(line.text, COLORS.black, COLORS.black), size, CONTENT_WIDTH);
    lines.push({ front, shadow, step: front.height - Math.round(size * 0.05) });
  }
  const blockHeight = lines.reduce((sum, line) => sum + line.step, 0);
  let y = Math.max(40, Math.round((760 - blockHeight) / 2));
  for (const line of lines) {
    const left = Math.round((CSP_WIDTH - line.front.width) / 2);
    layers.push({ input: line.shadow.buffer, left: left + 6, top: y + 7 }, { input: line.front.buffer, left, top: y });
    y += line.step;
  }

  // ❌ panels side by side.
  const panelTop = Math.max(y + 50, 800);
  const panelWidth = Math.round((CONTENT_WIDTH - 40) / 2);
  for (const [text, left] of [
    [content.left_panel, MARGIN],
    [content.right_panel, MARGIN + panelWidth + 40],
  ] as const) {
    if (!text) continue;
    const label = await renderText(markup(text, COLORS.white), 34, { width: panelWidth - 50 });
    const height = label.height + 70;
    layers.push(
      {
        input: svg(
          panelWidth,
          height + 30,
          `<rect x="2" y="30" width="${panelWidth - 4}" height="${height - 4}" rx="18" fill="#0B0B0B" fill-opacity="0.9" stroke="${COLORS.red}" stroke-width="3"/>
           <circle cx="${panelWidth / 2}" cy="30" r="26" fill="${COLORS.red}" stroke="#FFFFFF" stroke-width="3"/>
           <path d="M${panelWidth / 2 - 10} 20 L${panelWidth / 2 + 10} 40 M${panelWidth / 2 + 10} 20 L${panelWidth / 2 - 10} 40" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>`
        ),
        left,
        top: panelTop - 30,
      },
      { input: label.buffer, left: left + Math.round((panelWidth - label.width) / 2), top: panelTop + 38 }
    );
  }

  // 💡 tip box above the brand row.
  if (content.tip) {
    const boxWidth = CONTENT_WIDTH;
    const title = await renderText(markup("याद रखो:", COLORS.yellow), 36, { align: "left" });
    const body = await renderText(markup(content.tip, COLORS.white), 32, { width: boxWidth - 150, align: "left" });
    const boxHeight = title.height + body.height + 44;
    const boxTop = CSP_HEIGHT - 120 - boxHeight;
    layers.push(
      {
        input: roundedRectSvg(boxWidth, boxHeight, { fill: "#0B0B0B", fillOpacity: 0.9, stroke: COLORS.yellow, strokeWidth: 3, radius: 16, dash: "10 6" }),
        left: MARGIN,
        top: boxTop,
      },
      {
        input: svg(
          70,
          80,
          `<path d="M35 6 C18 6 9 19 9 32 C9 43 15 49 20 55 C23 59 24 62 24 66 H46 C46 62 47 59 50 55 C55 49 61 43 61 32 C61 19 52 6 35 6 Z" fill="${COLORS.yellow}"/>
           <rect x="24" y="68" width="22" height="7" rx="2" fill="#D1D5DB"/>`
        ),
        left: MARGIN + 30,
        top: boxTop + Math.round((boxHeight - 80) / 2),
      },
      { input: title.buffer, left: MARGIN + 120, top: boxTop + 22 },
      { input: body.buffer, left: MARGIN + 120, top: boxTop + 22 + title.height }
    );
  }

  await pushBrand(layers);
  return toBuffer(layers);
}
