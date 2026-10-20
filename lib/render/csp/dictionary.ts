import type { CspDictionary } from "@/lib/automation/csp-content";

import {
  COLORS,
  CONTENT_WIDTH,
  CSP_HEIGHT,
  CSP_WIDTH,
  type Layer,
  MARGIN,
  markup,
  pushBrand,
  pushFooter,
  renderFitted,
  renderText,
  svg,
  toBuffer,
} from "./common";

/** "CORPORATE DICTIONARY": rows of "office phrase" → real meaning. */
export async function renderDictionary(content: CspDictionary): Promise<Buffer> {
  const layers: Layer[] = [];

  const titleText = `${content.title_white} **${content.title_red}**`;
  const title = await renderFitted(markup(titleText, COLORS.white, COLORS.red), 88, CONTENT_WIDTH);
  const shadow = await renderFitted(markup(titleText, COLORS.black, COLORS.black), 88, CONTENT_WIDTH);
  const titleLeft = Math.round((CSP_WIDTH - title.width) / 2);
  layers.push({ input: shadow.buffer, left: titleLeft + 5, top: 64 }, { input: title.buffer, left: titleLeft, top: 58 });

  const subtitle = await renderFitted(markup(content.subtitle, COLORS.yellow, COLORS.white), 46, CONTENT_WIDTH);
  let y = 58 + title.height + 8;
  layers.push({ input: subtitle.buffer, left: Math.round((CSP_WIDTH - subtitle.width) / 2), top: y });
  y += subtitle.height + 44;

  const phraseWidth = 380;
  const meaningWidth = CONTENT_WIDTH - phraseWidth - 110;
  const fontSize = content.entries.length >= 5 ? 38 : 42;
  const rowGap = content.entries.length >= 5 ? 20 : 26;

  const rows = [];
  for (const entry of content.entries) {
    const phrase = await renderText(markup(`"${entry.phrase}"`, COLORS.red), fontSize, { width: phraseWidth, align: "left" });
    const meaning = await renderText(markup(entry.meaning, COLORS.white), fontSize, { width: meaningWidth, align: "left" });
    rows.push({ phrase, meaning, height: Math.max(phrase.height, meaning.height) + 44 });
  }

  // Centre the rows between the subtitle and the footer.
  const footerTop = CSP_HEIGHT - 210;
  const rowsHeight = rows.reduce((sum, row) => sum + row.height, 0) + rowGap * (rows.length - 1);
  y = Math.max(y, Math.round(y + (footerTop - 30 - y - rowsHeight) / 2));

  const arrow = svg(
    44,
    30,
    `<path d="M2 15 H36 M24 4 L38 15 L24 26" stroke="${COLORS.yellow}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
  );

  for (const row of rows) {
    layers.push({
      input: svg(
        CONTENT_WIDTH,
        row.height,
        `<rect x="1" y="1" width="${CONTENT_WIDTH - 2}" height="${row.height - 2}" rx="18" fill="${COLORS.card}" stroke="${COLORS.cardBorder}" stroke-width="2"/>
         <rect x="0" y="0" width="10" height="${row.height}" rx="4" fill="${COLORS.red}"/>`
      ),
      left: MARGIN,
      top: y,
    });
    layers.push(
      { input: row.phrase.buffer, left: MARGIN + 34, top: y + Math.round((row.height - row.phrase.height) / 2) },
      { input: arrow, left: MARGIN + 34 + phraseWidth + 10, top: y + Math.round((row.height - 30) / 2) },
      {
        input: row.meaning.buffer,
        left: MARGIN + 34 + phraseWidth + 70,
        top: y + Math.round((row.height - row.meaning.height) / 2),
      }
    );
    y += row.height + rowGap;
  }

  await pushFooter(layers, content.footer);
  await pushBrand(layers);
  return toBuffer(layers);
}
