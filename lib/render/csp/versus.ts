import type { CspVersus } from "@/lib/automation/csp-content";

import {
  COLORS,
  CONTENT_WIDTH,
  CSP_HEIGHT,
  type Layer,
  MARGIN,
  markIconSvg,
  markup,
  pushBrand,
  pushFooter,
  pushHeadline,
  renderText,
  roundedRectSvg,
  toBuffer,
} from "./common";

/** Expectation vs Reality: two columns, yellow ✓ list vs red ✕ list. */
export async function renderVersus(content: CspVersus): Promise<Buffer> {
  const layers: Layer[] = [];

  let y = 50;
  y += (await pushHeadline(layers, `${content.left_title} **vs** ${content.right_title}`, COLORS.white, 84, y, COLORS.red)) + 6;
  if (content.topic) y += await pushHeadline(layers, content.topic, COLORS.yellow, 50, y, COLORS.white);

  const columnGap = 30;
  const columnWidth = Math.round((CONTENT_WIDTH - columnGap) / 2);
  const textWidth = columnWidth - 110;
  const top = y + 46;

  const columns = [
    { title: content.left_title, points: content.left_points, kind: "good" as const, color: COLORS.yellow, left: MARGIN },
    { title: content.right_title, points: content.right_points, kind: "bad" as const, color: COLORS.red, left: MARGIN + columnWidth + columnGap },
  ];

  // Render all text first, then lay out both cards at the same height.
  const rendered = [];
  for (const column of columns) {
    const title = await renderText(markup(column.title.toUpperCase(), column.color), 48);
    const points = [];
    for (const point of column.points) {
      points.push(await renderText(markup(point, COLORS.white), 36, { width: textWidth, align: "left" }));
    }
    rendered.push({ column, title, points });
  }

  const footerSpace = content.footer ? 230 : 140;
  // Cards fill the space down to the footer; points are spread evenly inside.
  const cardHeight = CSP_HEIGHT - footerSpace - top;

  for (const { column, title, points } of rendered) {
    layers.push(
      {
        input: roundedRectSvg(columnWidth, cardHeight, { fill: COLORS.card, stroke: column.color, strokeWidth: 4, radius: 24 }),
        left: column.left,
        top,
      },
      { input: title.buffer, left: column.left + Math.round((columnWidth - title.width) / 2), top: top + 40 }
    );

    const listTop = top + 40 + title.height + 30;
    const listSpace = top + cardHeight - 30 - listTop;
    const used = points.reduce((sum, p) => sum + Math.max(p.height, 52), 0);
    const spacing = Math.min(90, Math.max(20, Math.floor((listSpace - used) / Math.max(points.length, 1))));
    let py = listTop + Math.max(0, Math.floor((listSpace - used - spacing * (points.length - 1)) / 2));
    for (const point of points) {
      const rowHeight = Math.max(point.height, 52);
      if (py + rowHeight > top + cardHeight - 10) break;
      layers.push(
        { input: markIconSvg(column.kind), left: column.left + 28, top: py + Math.round((rowHeight - 52) / 2) },
        { input: point.buffer, left: column.left + 96, top: py + Math.round((rowHeight - point.height) / 2) }
      );
      py += rowHeight + spacing;
    }
  }

  await pushFooter(layers, content.footer);
  await pushBrand(layers);
  return toBuffer(layers);
}
