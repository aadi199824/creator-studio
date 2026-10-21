import { existsSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import type { CspOlympics, CspOlympicsIcon } from "@/lib/automation/csp-content";

import {
  CSP_HEIGHT,
  CSP_WIDTH,
  type CspFont,
  type Layer,
  LOGO_SIZE,
  type RenderedText,
  loadLogo,
  markup,
  renderFitted,
  renderText,
  rotated,
  svg,
  toBuffer,
} from "./common";

/**
 * "CORPORATE OLYMPIC EVENTS" — light editorial style (cream paper, navy
 * hand-lettering, blue brush highlight, flat medals, doodle icons) with the
 * CSP mascot reclining bottom-right (public/brand/csp-olympics-character.png,
 * cut out of the owner's reference artwork).
 *
 * Template text is English (owner's choice for this format).
 * Font: Kalam (hand-written) from lib/render/fonts; falls back to Poppins
 * Bold if the files are missing. Medal numbers use Poppins.
 */

const INK = "#111111";
const NAVY = "#15233B";
const BLUE = "#9DCCFF";
const BLUE_DARK = "#3B82F6";
const CREAM = "#FCF9F1";
const ALERT = "#F2542D";

const MEDALS = ["#FFC857", "#C8CDD3", "#D99568", "#B9A2F5"];

const FONT_DIR = path.join(process.cwd(), "lib/render/fonts");
const KALAM_BOLD = path.join(FONT_DIR, "Kalam-Bold.ttf");
const KALAM_REGULAR = path.join(FONT_DIR, "Kalam-Regular.ttf");
const HAND_BOLD: CspFont | undefined = existsSync(KALAM_BOLD) ? { name: "Kalam Bold", file: KALAM_BOLD } : undefined;
const HAND_REGULAR: CspFont | undefined = existsSync(KALAM_REGULAR)
  ? { name: "Kalam", file: KALAM_REGULAR }
  : HAND_BOLD;

const CHARACTER_FILE = path.join(process.cwd(), "public/brand/csp-olympics-character.png");

// Layout (1080 × 1350).
const LEFT = 80;
const MEDAL = 72;
const TEXT_LEFT = 178;
const TEXT_WIDTH = 380;
const ICON = 120;
const ICON_LEFT = 572;
const LIST_RIGHT = 712;
const LIST_TOP = 380;
const LIST_BOTTOM = 955;

// --- doodles -------------------------------------------------------------------------

const lineW = (width: number) =>
  `stroke="${NAVY}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
const line = lineW(4.5);
const pop = `stroke="${ALERT}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
const solid = `fill="${NAVY}"`;

const ICONS: Record<CspOlympicsIcon, string> = {
  // Running figure leaning back, speed lines, an email whizzing past.
  dodge: `<circle cx="80" cy="22" r="10" ${solid}/>
    <path d="M76 34 L60 62 L80 82 L76 104 M60 62 L40 74 L30 100 M70 44 L94 52 M68 46 L50 36" ${lineW(7)}/>
    <path d="M6 30 Q30 24 48 30 M14 44 H38" ${line}/>
    <rect x="4" y="54" width="26" height="18" rx="3" ${pop}/><path d="M4 56 L17 65 L30 56" ${pop}/>`,
  // Envelope with an explosion burst.
  email: `<rect x="26" y="40" width="68" height="48" rx="5" ${line}/><path d="M26 44 L60 68 L94 44" ${line}/>
    <path d="M14 26 L24 36 M60 10 V26 M106 26 L96 36 M8 66 H20 M112 66 H100 M16 98 L26 90 M104 98 L94 90" ${pop}/>`,
  // Deadpan face + speech bubble with dots.
  speech: `<circle cx="38" cy="72" r="30" ${line}/><path d="M24 64 H34 M44 64 H54 M28 84 H48" ${line}/>
    <path d="M62 14 H114 V50 H82 L70 62 V50 H62 Z" ${line}/>
    <circle cx="78" cy="32" r="3.5" ${solid}/><circle cx="88" cy="32" r="3.5" ${solid}/><circle cx="98" cy="32" r="3.5" ${solid}/>`,
  // Furious typing at a laptop while someone walks past.
  laptop: `<circle cx="34" cy="46" r="11" ${solid}/><path d="M18 82 Q34 58 50 82 Z" ${solid}/>
    <path d="M48 66 H72 L66 86 H44" ${line}/><path d="M8 90 H80" ${lineW(6)}/>
    <path d="M18 28 L22 34 M34 20 V28 M50 28 L46 34" ${pop}/>
    <circle cx="98" cy="22" r="8" ${solid}/><path d="M98 32 L94 60 L102 88 M94 60 L86 90 M96 40 L108 54 M96 40 L86 52" ${lineW(6)}/>
    <path d="M74 34 H84 M72 44 H82" ${line}/>`,
  // Mug with steam.
  coffee: `<path d="M24 44 H76 V82 Q76 98 60 98 H40 Q24 98 24 82 Z" ${line}/><path d="M76 52 H86 Q98 52 98 64 Q98 76 86 76 H76" ${line}/>
    <path d="M38 34 Q32 26 38 18 M52 34 Q46 26 52 18 M66 34 Q60 26 66 18" ${pop}/>`,
  // Clock at almost 6.
  clock: `<circle cx="60" cy="60" r="40" ${line}/><path d="M60 60 V32 M60 60 L78 72" ${pop}/>
    <path d="M60 24 V28 M96 60 H92 M60 96 V92 M24 60 H28" ${line}/>`,
  // Calendar full of meetings.
  calendar: `<rect x="18" y="26" width="84" height="74" rx="6" ${line}/><path d="M18 44 H102 M38 16 V32 M82 16 V32" ${line}/>
    <rect x="28" y="54" width="18" height="14" fill="${ALERT}"/><rect x="51" y="54" width="18" height="14" fill="${ALERT}"/>
    <rect x="74" y="54" width="18" height="14" fill="${ALERT}"/><rect x="28" y="76" width="18" height="14" fill="${ALERT}"/>
    <rect x="51" y="76" width="18" height="14" fill="${BLUE}"/>`,
  // Two heads across a table.
  meeting: `<circle cx="32" cy="38" r="12" ${solid}/><circle cx="88" cy="38" r="12" ${solid}/>
    <path d="M14 74 Q32 54 50 74 Z M70 74 Q88 54 106 74 Z" ${solid}/><path d="M6 84 H114" ${lineW(6)}/>
    <path d="M48 22 Q60 12 72 22" ${pop}/>`,
};

function iconSvg(icon: CspOlympicsIcon): Buffer {
  return svg(ICON, ICON, ICONS[icon]);
}

function medalSvg(index: number): Buffer {
  const fill = MEDALS[index % MEDALS.length];
  const c = MEDAL / 2;
  return svg(
    MEDAL,
    MEDAL,
    `<circle cx="${c}" cy="${c}" r="${c - 1}" fill="${fill}"/>
     <circle cx="${c}" cy="${c}" r="${c - 1}" fill="#000" fill-opacity="0.08" transform="translate(2 3)"/>
     <circle cx="${c}" cy="${c}" r="${c - 4}" fill="${fill}"/>
     <path d="M${c - 22} ${c - 10} Q${c - 14} ${c - 24} ${c} ${c - 26}" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="4" fill="none" stroke-linecap="round"/>`
  );
}

/** Soft watercolour-style blue brushstroke behind the highlighted line. */
function brushSvg(width: number, height: number): Buffer {
  const w = width;
  const h = height;
  return svg(
    w,
    h,
    `<path d="M6 ${h * 0.42} Q${w * 0.25} ${h * 0.2} ${w * 0.6} ${h * 0.26} T${w - 4} ${h * 0.3}
       L${w - 10} ${h * 0.86} Q${w * 0.6} ${h * 0.96} ${w * 0.3} ${h * 0.9} T10 ${h * 0.92} Z"
       fill="${BLUE}" fill-opacity="0.8"/>
     <path d="M${w * 0.04} ${h * 0.55} Q${w * 0.4} ${h * 0.48} ${w * 0.9} ${h * 0.56}" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="6" fill="none"/>`
  );
}

function crownSvg(): Buffer {
  return svg(
    80,
    62,
    `<path d="M10 50 L6 16 L26 32 L40 6 L54 32 L74 16 L70 50 Z" fill="none" stroke="${BLUE_DARK}" stroke-width="5" stroke-linejoin="round"/>
     <circle cx="6" cy="14" r="4" fill="${BLUE_DARK}"/><circle cx="40" cy="5" r="4" fill="${BLUE_DARK}"/><circle cx="74" cy="14" r="4" fill="${BLUE_DARK}"/>`
  );
}

/** Curved doodle arrow pointing down-left. */
function arrowSvg(): Buffer {
  return svg(90, 90, `<path d="M74 6 Q70 56 18 76" ${line}/><path d="M24 58 L14 78 L36 84" ${line}/>`);
}

/**
 * Faux bold: Kalam Bold is lighter than a marker pen, so stack the text a
 * few pixels apart (like a thicker nib). Keeps colours and highlights.
 */
async function thicken(text: RenderedText, px: number): Promise<RenderedText> {
  if (px <= 0) return text;
  const width = text.width + px;
  const height = text.height + px;
  const offsets: [number, number][] = [];
  for (let dx = 0; dx <= px; dx++) for (let dy = 0; dy <= px; dy++) offsets.push([dx, dy]);
  const buffer = await sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(offsets.map(([left, top]) => ({ input: text.buffer, left, top })))
    .png()
    .toBuffer();
  return { buffer, width, height };
}

function backgroundSvg(): Buffer {
  return svg(
    CSP_WIDTH,
    CSP_HEIGHT,
    `<defs><filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>
       <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0.05 0"/></filter></defs>
     <rect width="100%" height="100%" fill="${CREAM}"/>
     <rect width="100%" height="100%" filter="url(#paper)"/>`
  );
}

let characterPromise: Promise<{ input: Buffer; width: number; height: number } | null> | null = null;

function loadCharacter() {
  characterPromise ??= (async () => {
    try {
      const width = 722; // ≈ reference scale (750 px at 1122 wide → 1080 wide)
      const input = await sharp(CHARACTER_FILE).resize({ width }).png().toBuffer();
      const meta = await sharp(input).metadata();
      return { input, width: meta.width ?? width, height: meta.height ?? 0 };
    } catch {
      console.warn("CSP Olympics character not found at public/brand/csp-olympics-character.png — drawing without it.");
      return null;
    }
  })();
  return characterPromise;
}

export async function renderOlympics(content: CspOlympics): Promise<Buffer> {
  const layers: Layer[] = [];

  // --- headline --------------------------------------------------------------------
  layers.push({ input: crownSvg(), left: 66, top: 34 });

  const line1 = await thicken(await renderFitted(markup(content.title_top, INK), 92, 560, HAND_BOLD), 3);
  const line2 = await thicken(await renderFitted(markup(content.title_highlight, INK), 92, 620, HAND_BOLD), 3);
  const line3 = content.edition ? await thicken(await renderFitted(markup(`${content.edition}:`, INK), 92, 400, HAND_BOLD), 3) : null;

  const tilt = -4;
  const l1 = await rotated(line1.buffer, tilt);
  const l2 = await rotated(line2.buffer, tilt);
  let headY = 92;
  layers.push({ input: l1.buffer, left: LEFT + 6, top: headY });
  headY += l1.height - 14;

  const brush = await rotated(brushSvg(line2.width + 50, line2.height + 30), tilt);
  layers.push({ input: brush.buffer, left: LEFT - 22, top: headY - 10 });
  layers.push({ input: l2.buffer, left: LEFT, top: headY });
  headY += l2.height + 4;

  if (line3) {
    layers.push({ input: line3.buffer, left: LEFT + 10, top: headY });
    headY += line3.height;
  }
  const listTop = Math.max(LIST_TOP, headY + 30);

  // Hand-note top right, with an arrow toward the headline.
  if (content.annotation) {
    const note = await renderText(markup(content.annotation, NAVY, BLUE_DARK), 31, {
      width: 230,
      align: "left",
      font: HAND_REGULAR,
    });
    const tiltedNote = await rotated(note.buffer, -9);
    layers.push({ input: tiltedNote.buffer, left: CSP_WIDTH - 56 - tiltedNote.width, top: 170 });
    layers.push({ input: arrowSvg(), left: CSP_WIDTH - 56 - tiltedNote.width - 10, top: 170 + tiltedNote.height + 2 });
  }

  // --- events ---------------------------------------------------------------------
  // Shrink the event text until all four rows fit above the mascot.
  let rows: { text: RenderedText; number: RenderedText; height: number }[] = [];
  for (const size of [32, 30, 28, 26]) {
    rows = [];
    for (const [index, event] of content.events.entries()) {
      const text = await thicken(
        await renderText(markup(event.text, NAVY, BLUE_DARK), size, { width: TEXT_WIDTH, align: "left", font: HAND_BOLD }),
        1
      );
      const number = await renderText(markup(String(index + 1), INK), 36);
      rows.push({ text, number, height: Math.max(text.height + 16, ICON - 10) });
    }
    const needed = rows.reduce((sum, row) => sum + row.height, 0) + 20 * (rows.length - 1);
    if (needed <= LIST_BOTTOM - listTop) break;
  }

  const total = rows.reduce((sum, row) => sum + row.height, 0);
  const gap = Math.max(16, Math.floor((LIST_BOTTOM - listTop - total) / Math.max(1, rows.length - 1)));
  let y = listTop;

  for (const [index, row] of rows.entries()) {
    const medalTop = y + Math.round((row.height - MEDAL) / 2);
    layers.push(
      { input: medalSvg(index), left: LEFT, top: medalTop },
      {
        input: row.number.buffer,
        left: LEFT + Math.round((MEDAL - row.number.width) / 2),
        top: medalTop + Math.round((MEDAL - row.number.height) / 2),
      },
      { input: row.text.buffer, left: TEXT_LEFT, top: y + Math.round((row.height - row.text.height) / 2) },
      { input: iconSvg(content.events[index].icon), left: ICON_LEFT, top: y + Math.round((row.height - ICON) / 2) }
    );

    y += row.height;
    if (index < rows.length - 1) {
      const sepTop = y + Math.round(gap / 2) - 3;
      layers.push({
        input: svg(LIST_RIGHT - LEFT, 8, `<path d="M3 6 Q${(LIST_RIGHT - LEFT) / 2} 1 ${LIST_RIGHT - LEFT - 3} 3" stroke="${BLUE}" stroke-width="3" fill="none" stroke-linecap="round"/>`),
        left: LEFT + 20,
        top: sepTop,
      });
      y += gap;
    }
  }

  // --- mascot ---------------------------------------------------------------------
  const character = await loadCharacter();
  if (character) {
    layers.push({ input: character.input, left: CSP_WIDTH - character.width, top: CSP_HEIGHT - character.height });
  }

  // --- bottom-left: closing note + brand -------------------------------------------
  if (content.footer) {
    const note = await renderText(markup(content.footer, NAVY, BLUE_DARK), 30, { width: 290, align: "left", font: HAND_REGULAR });
    const tiltedNote = await rotated(note.buffer, -6);
    const top = 1012;
    layers.push({ input: tiltedNote.buffer, left: 64, top });
    layers.push({
      input: svg(200, 14, `<path d="M4 10 Q90 0 196 6" stroke="${NAVY}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`),
      left: 92,
      top: top + tiltedNote.height + 6,
    });
  }

  const logo = await loadLogo();
  const handle = await renderText(markup("@csp_officials", NAVY), 26, { align: "left" });
  const brandTop = CSP_HEIGHT - 36 - LOGO_SIZE;
  if (logo) layers.push({ input: logo, left: 48, top: brandTop });
  layers.push({
    input: handle.buffer,
    left: 48 + (logo ? LOGO_SIZE + 14 : 0),
    top: brandTop + Math.round((LOGO_SIZE - handle.height) / 2),
  });

  return toBuffer(layers, backgroundSvg());
}
