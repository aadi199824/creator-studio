import type { CspBattery } from "@/lib/automation/csp-content";

import {
  COLORS,
  CONTENT_WIDTH,
  CSP_HEIGHT,
  type Layer,
  MARGIN,
  markup,
  pushBrand,
  pushHeadline,
  renderText,
  svg,
  toBuffer,
} from "./common";

function levelColor(percent: number): string {
  if (percent < 25) return COLORS.red;
  if (percent < 70) return COLORS.yellow;
  return COLORS.green;
}

function batterySvg(width: number, height: number, percent: number, color: string, full: boolean): Buffer {
  const capWidth = Math.round(width * 0.34);
  const bodyTop = 22;
  const bodyHeight = height - bodyTop;
  const innerHeight = bodyHeight - 30;
  const fillHeight = Math.max(6, Math.round((innerHeight * percent) / 100));
  const border = full ? COLORS.green : "#DDDDDD";
  return svg(
    width + 40,
    height + 40,
    `<defs>
       <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.35"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
       ${full ? `<filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>` : ""}
     </defs>
     ${full ? `<rect x="20" y="${20 + bodyTop}" width="${width}" height="${bodyHeight}" rx="22" fill="${COLORS.green}" opacity="0.45" filter="url(#f)"/>` : ""}
     <rect x="${20 + (width - capWidth) / 2}" y="20" width="${capWidth}" height="${bodyTop}" rx="6" fill="${border}"/>
     <rect x="23.5" y="${23.5 + bodyTop}" width="${width - 7}" height="${bodyHeight - 7}" rx="22" fill="#0D0D0D" stroke="${border}" stroke-width="7"/>
     <rect x="35" y="${20 + bodyTop + 15 + innerHeight - fillHeight}" width="${width - 30}" height="${fillHeight}" rx="12" fill="${color}"/>
     <rect x="35" y="${20 + bodyTop + 15 + innerHeight - fillHeight}" width="${(width - 30) / 2.5}" height="${fillHeight}" rx="12" fill="url(#g)"/>`
  );
}

/** Employee energy battery from Monday to Friday. */
export async function renderBattery(content: CspBattery): Promise<Buffer> {
  const layers: Layer[] = [];

  let y = 46;
  if (content.headline) y += (await pushHeadline(layers, content.headline, COLORS.white, 90, y)) + 4;
  if (content.subheadline) y += await pushHeadline(layers, content.subheadline, COLORS.red, 54, y, COLORS.white);

  const count = content.days.length;
  const columnWidth = Math.floor(CONTENT_WIDTH / count);
  const batteryWidth = Math.min(124, columnWidth - 36);
  const top = y + 70;
  const labelsSpace = 230;
  const batteryHeight = CSP_HEIGHT - 130 - labelsSpace - top - 60;

  for (const [index, entry] of content.days.entries()) {
    const color = levelColor(entry.percent);
    const centre = MARGIN + columnWidth * index + Math.round(columnWidth / 2);

    const pct = await renderText(markup(`${entry.percent}%`, color), 40);
    layers.push({ input: pct.buffer, left: centre - Math.round(pct.width / 2), top });

    const battery = batterySvg(batteryWidth, batteryHeight, entry.percent, color, entry.percent >= 100);
    const batteryTop = top + pct.height + 14;
    layers.push({ input: battery, left: centre - Math.round(batteryWidth / 2) - 20, top: batteryTop - 20 });

    const day = await renderText(markup(entry.day, COLORS.white), 36);
    const dayTop = batteryTop + batteryHeight + 34;
    layers.push({ input: day.buffer, left: centre - Math.round(day.width / 2), top: dayTop });

    if (entry.label) {
      const label = await renderText(markup(entry.label, "#CCCCCC"), 22, { width: columnWidth - 14 });
      layers.push({ input: label.buffer, left: centre - Math.round(label.width / 2), top: dayTop + day.height + 14 });
    }
  }

  await pushBrand(layers);
  return toBuffer(layers);
}
