/**
 * Shared drawing helpers for the @csp_officials post formats
 * (lib/render/csp/*). All posts are 1080×1350 PNGs composed with sharp.
 *
 * Why sharp instead of next/og (used for Tradeverse): Hindi needs proper
 * Devanagari shaping (e.g. the ि matra drawn before its consonant).
 * sharp's text rendering goes through Pango + HarfBuzz, which shapes it
 * correctly; Satori does not reliably. sharp already ships with Next.js.
 *
 * Font: Poppins Bold (OFL, lib/render/fonts) — covers Latin + Devanagari.
 */

import path from "node:path";

import sharp from "sharp";

export const CSP_WIDTH = 1080;
export const CSP_HEIGHT = 1350;
export const MARGIN = 60;
export const CONTENT_WIDTH = CSP_WIDTH - 2 * MARGIN;

export const COLORS = {
  white: "#FFFFFF",
  red: "#F20D18",
  yellow: "#FFC400",
  green: "#22C55E",
  grey: "#9CA3AF",
  black: "#000000",
  background: "#080808",
  card: "#111111",
  cardBorder: "#2B2B2B",
};

const FONT_FILE = path.join(process.cwd(), "lib/render/fonts/Poppins-Bold.ttf");
const FONT_NAME = "Poppins Bold";

export type Layer = { input: Buffer; left: number; top: number };
export type RenderedText = { buffer: Buffer; width: number; height: number };

// --- text -------------------------------------------------------------------

/**
 * Poppins has no glyphs for arrows, check marks, dingbats or emoji, and the
 * Vercel runtime has no fallback font — such characters would render as
 * empty boxes. Swap the common ones for supported equivalents and drop the
 * rest.
 */
function replaceUnsupportedGlyphs(text: string): string {
  return text
    .replace(/[→⟶➜➔➡]/g, "»")
    .replace(/[←⟵⬅]/g, "«")
    .replace(/[\u2190-\u21FF\u2600-\u27BF\u2B00-\u2BFF\u{1F000}-\u{1FAFF}\uFE0F\u200D]/gu, "")
    .replace(/ {2,}/g, " ");
}

function escapeMarkup(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Pango markup; text inside **double asterisks** switches to `highlight`. */
export function markup(text: string, base: string, highlight: string = COLORS.yellow): string {
  return escapeMarkup(replaceUnsupportedGlyphs(text))
    .split("**")
    .map((part, index) =>
      part ? `<span foreground="${index % 2 === 1 ? highlight : base}">${part}</span>` : ""
    )
    .join("");
}

export async function renderText(
  markupText: string,
  sizePx: number,
  options: { width?: number; align?: "left" | "centre" | "right" } = {}
): Promise<RenderedText> {
  const buffer = await sharp({
    text: {
      text: markupText,
      font: `${FONT_NAME} ${sizePx}`,
      fontfile: FONT_FILE,
      rgba: true,
      dpi: 72, // 1pt = 1px, so sizePx is the real pixel size
      align: options.align ?? "centre",
      ...(options.width ? { width: options.width, wrap: "word" as const } : {}),
    },
  })
    .png()
    .toBuffer();

  const meta = await sharp(buffer).metadata();
  return { buffer, width: meta.width ?? 0, height: meta.height ?? 0 };
}

/** Single-line text, shrunk to fit maxWidth if needed. */
export async function renderFitted(
  markupText: string,
  sizePx: number,
  maxWidth: number
): Promise<RenderedText> {
  const rendered = await renderText(markupText, sizePx);
  if (rendered.width <= maxWidth) return rendered;

  const buffer = await sharp(rendered.buffer).resize({ width: maxWidth }).png().toBuffer();
  const meta = await sharp(buffer).metadata();
  return { buffer, width: meta.width ?? maxWidth, height: meta.height ?? rendered.height };
}

/** Centred headline with a hard drop shadow (the live-post look). Returns its height. */
export async function pushHeadline(
  layers: Layer[],
  text: string,
  base: string,
  sizePx: number,
  top: number,
  highlight: string = COLORS.yellow
): Promise<number> {
  const front = await renderFitted(markup(text, base, highlight), sizePx, CONTENT_WIDTH);
  const shadow = await renderFitted(markup(text, COLORS.black, COLORS.black), sizePx, CONTENT_WIDTH);
  const left = Math.round((CSP_WIDTH - front.width) / 2);
  layers.push({ input: shadow.buffer, left: left + 5, top: top + 6 }, { input: front.buffer, left, top });
  return front.height;
}

// --- shapes (SVG, no text) ----------------------------------------------------

export function svg(width: number, height: number, body: string): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`
  );
}

export function backgroundSvg(): Buffer {
  return svg(
    CSP_WIDTH,
    CSP_HEIGHT,
    `<defs>
      <radialGradient id="top" cx="0.5" cy="0.12" r="0.6"><stop offset="0" stop-color="#5A070B" stop-opacity="0.85"/><stop offset="1" stop-color="#5A070B" stop-opacity="0"/></radialGradient>
      <radialGradient id="bottom" cx="0.5" cy="1" r="0.6"><stop offset="0" stop-color="#3A0507" stop-opacity="0.9"/><stop offset="1" stop-color="#3A0507" stop-opacity="0"/></radialGradient>
      <pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1" height="6" fill="#FFFFFF" fill-opacity="0.05"/></pattern>
    </defs>
    <rect width="100%" height="100%" fill="${COLORS.background}"/>
    <rect width="100%" height="100%" fill="url(#top)"/>
    <rect width="100%" height="100%" fill="url(#bottom)"/>
    <rect width="100%" height="100%" fill="url(#grain)"/>`
  );
}

export function roundedRectSvg(
  width: number,
  height: number,
  options: { fill?: string; fillOpacity?: number; stroke?: string; strokeWidth?: number; radius?: number; dash?: string } = {}
): Buffer {
  const strokeWidth = options.strokeWidth ?? 0;
  const inset = strokeWidth / 2;
  return svg(
    width,
    height,
    `<rect x="${inset}" y="${inset}" width="${width - strokeWidth}" height="${height - strokeWidth}" rx="${options.radius ?? 18}"
      fill="${options.fill ?? COLORS.card}" fill-opacity="${options.fillOpacity ?? 1}"
      ${options.stroke ? `stroke="${options.stroke}" stroke-width="${strokeWidth}"` : ""}
      ${options.dash ? `stroke-dasharray="${options.dash}"` : ""}/>`
  );
}

/** Circle icon with a ✓ (good) or ✕ (bad) mark. */
export function markIconSvg(kind: "good" | "bad", size = 52): Buffer {
  const color = kind === "good" ? COLORS.yellow : COLORS.red;
  const c = size / 2;
  const mark =
    kind === "good"
      ? `<path d="M${c - 11} ${c} L${c - 3} ${c + 8} L${c + 12} ${c - 8}" stroke="${COLORS.black}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<path d="M${c - 9} ${c - 9} L${c + 9} ${c + 9} M${c + 9} ${c - 9} L${c - 9} ${c + 9}" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>`;
  return svg(size, size, `<circle cx="${c}" cy="${c}" r="${c - 2}" fill="${color}"/>${mark}`);
}

export function phoneFrameSvg(width: number, height: number, screen: string): Buffer {
  return svg(
    width,
    height,
    `<rect x="3" y="3" width="${width - 6}" height="${height - 6}" rx="56" fill="${screen}" stroke="#2A2A2A" stroke-width="6"/>`
  );
}

export async function toBuffer(layers: Layer[]): Promise<Buffer> {
  return sharp(backgroundSvg()).composite(layers).png().toBuffer();
}

export async function rotated(buffer: Buffer, degrees: number): Promise<RenderedText> {
  const out = await sharp(buffer)
    .rotate(degrees, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const meta = await sharp(out).metadata();
  return { buffer: out, width: meta.width ?? 0, height: meta.height ?? 0 };
}

/** Composes smaller layers into one transparent image (used for stamps/cards). */
export async function composeOn(
  width: number,
  height: number,
  base: Buffer,
  layers: Layer[]
): Promise<Buffer> {
  return sharp(base).resize(width, height).composite(layers).png().toBuffer();
}

// --- brand ------------------------------------------------------------------------

const LOGO_FILE = path.join(process.cwd(), "public/brand/csp-logo.jpg");
const LOGO_SIZE = 84;
let logoPromise: Promise<Buffer | null> | null = null;

/** The CSP logo cropped to a circle with a thin white ring (null if the file is missing). */
function loadLogo(): Promise<Buffer | null> {
  logoPromise ??= (async () => {
    try {
      const mask = svg(LOGO_SIZE, LOGO_SIZE, `<circle cx="${LOGO_SIZE / 2}" cy="${LOGO_SIZE / 2}" r="${LOGO_SIZE / 2}" fill="#fff"/>`);
      const ring = svg(
        LOGO_SIZE,
        LOGO_SIZE,
        `<circle cx="${LOGO_SIZE / 2}" cy="${LOGO_SIZE / 2}" r="${LOGO_SIZE / 2 - 1.5}" fill="none" stroke="#FFFFFF" stroke-width="3"/>`
      );
      return await sharp(LOGO_FILE)
        .resize(LOGO_SIZE, LOGO_SIZE, { fit: "cover" })
        .composite([{ input: mask, blend: "dest-in" }, { input: ring }])
        .png()
        .toBuffer();
    } catch {
      console.warn("CSP logo not found at public/brand/csp-logo.jpg — using the plain badge.");
      return null;
    }
  })();
  return logoPromise;
}

/** CSP logo + name bottom-left, handle bottom-right, on every format. */
export async function pushBrand(layers: Layer[]): Promise<void> {
  const top = CSP_HEIGHT - 28 - LOGO_SIZE;
  const centre = top + LOGO_SIZE / 2;
  const logo = await loadLogo();
  const name = await renderText(markup("Corporate Slaves Party", COLORS.white), 26, { align: "left" });
  const handle = await renderText(markup("@csp_officials", COLORS.white), 26, { align: "left" });

  if (logo) {
    layers.push({ input: logo, left: 40, top });
  } else {
    const label = await renderText(markup("CSP", COLORS.white), 18);
    layers.push(
      {
        input: svg(LOGO_SIZE, LOGO_SIZE, `<circle cx="${LOGO_SIZE / 2}" cy="${LOGO_SIZE / 2}" r="${LOGO_SIZE / 2 - 3}" fill="${COLORS.red}" stroke="#FFFFFF" stroke-width="3"/>`),
        left: 40,
        top,
      },
      { input: label.buffer, left: 40 + Math.round((LOGO_SIZE - label.width) / 2), top: Math.round(centre - label.height / 2) }
    );
  }

  layers.push(
    { input: name.buffer, left: 40 + LOGO_SIZE + 16, top: Math.round(centre - name.height / 2) },
    { input: handle.buffer, left: CSP_WIDTH - 40 - handle.width, top: Math.round(centre - handle.height / 2) }
  );
}

/** Bottom engagement line just above the brand row. */
export async function pushFooter(layers: Layer[], text: string): Promise<void> {
  if (!text) return;
  const footer = await renderText(markup(text, COLORS.white), 36, { width: CONTENT_WIDTH });
  layers.push({
    input: footer.buffer,
    left: Math.round((CSP_WIDTH - footer.width) / 2),
    top: CSP_HEIGHT - 120 - footer.height,
  });
}
