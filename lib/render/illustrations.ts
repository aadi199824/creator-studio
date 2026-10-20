/**
 * Code-drawn illustrations for Tradeverse slides.
 *
 * Why not stock photos or an image model: stock search can't guarantee the
 * picture matches the lesson ("swing trading" returned a VPN tablet), and
 * image models drift in style. These are drawn from a fixed set, so every
 * icon is on-topic, on-brand and identical in style every day — the same
 * idea as the live ChatGPT posts (stopwatch, calendar, bank, chart monitor)
 * plus the competitor's cinematic glow and reflective floor.
 *
 * Each function returns a standalone SVG string (240×240 viewBox). The slide
 * renderer embeds it as an <img> data URL, which avoids Satori's partial
 * support for inline SVG attributes.
 */

export const ILLUSTRATIONS = [
  "stopwatch",
  "alarm_clock",
  "calendar",
  "bank",
  "laptop_chart",
  "monitor_chart",
  "candles",
  "growth_arrow",
  "shield",
  "target",
  "scales",
  "lightbulb",
  "hourglass",
  "journal",
  "warning",
  "checklist",
  "magnifier",
] as const;

export type Illustration = (typeof ILLUSTRATIONS)[number];

export type ChartShape = "uptrend" | "downtrend" | "range" | "breakout" | "volatile";

const UP = "#20B486";
const DOWN = "#EF5350";

// --- helpers ----------------------------------------------------------------

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) + 255 * amount);
  const g = clamp(((n >> 8) & 255) + 255 * amount);
  const b = clamp((n & 255) + 255 * amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function linear(id: string, top: string, bottom: string): string {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;
}

/** Soft glow behind the object + reflective floor, used by every icon. */
function stage(accent: string): { defs: string; back: string; floor: string } {
  return {
    defs:
      `<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${accent}" stop-opacity="0.45"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="floor" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${accent}" stop-opacity="0.55"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>` +
      linear("metal", "#F4F6F9", "#8D97A6") +
      linear("dark", "#1A2236", "#05070B") +
      linear("acc", shade(accent, 0.18), shade(accent, -0.22)),
    back: `<circle cx="120" cy="118" r="110" fill="url(#glow)"/>`,
    floor: `<ellipse cx="120" cy="222" rx="96" ry="11" fill="url(#floor)"/>`,
  };
}

function wrap(accent: string, body: string, extraDefs = ""): string {
  const s = stage(accent);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><defs>${s.defs}${extraDefs}</defs>${s.back}${s.floor}${body}</svg>`;
}

function seededRandom(seed: number) {
  let state = (seed * 7919 + 13) % 2147483647;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}

const DRIFT: Record<ChartShape, (t: number) => number> = {
  uptrend: (t) => -0.55 * t,
  downtrend: (t) => 0.55 * t,
  range: (t) => 0.12 * Math.sin(t * Math.PI * 4),
  breakout: (t) => (t < 0.7 ? 0.08 * Math.sin(t * Math.PI * 6) : -1.6 * (t - 0.7)),
  volatile: (t) => 0.25 * Math.sin(t * Math.PI * 7),
};

/** Candles inside a box. Hypothetical shape only — never real market data. */
export function candlesSvg(
  x: number,
  y: number,
  width: number,
  height: number,
  shape: ChartShape,
  seed: number,
  step = 9
): string {
  const random = seededRandom(seed);
  const count = Math.max(6, Math.floor(width / step));
  const base = height * 0.62;
  const noise = shape === "volatile" ? 0.1 : 0.06;
  const bodyWidth = Math.max(3, step * 0.6);
  let previous = base;
  let out = "";

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const target = base + DRIFT[shape](t) * height;
    const close = Math.min(height * 0.92, Math.max(height * 0.08, target + (random() - 0.5) * noise * height));
    const open = previous;
    previous = close;
    const high = Math.min(open, close) - random() * height * 0.05;
    const low = Math.max(open, close) + random() * height * 0.05;
    const color = close <= open ? UP : DOWN;
    const cx = x + i * step + bodyWidth / 2;
    out +=
      `<line x1="${cx}" x2="${cx}" y1="${y + high}" y2="${y + low}" stroke="${color}" stroke-width="1.2"/>` +
      `<rect x="${cx - bodyWidth / 2}" y="${y + Math.min(open, close)}" width="${bodyWidth}" height="${Math.max(1.5, Math.abs(close - open))}" fill="${color}"/>`;
  }

  return out;
}

function gridLines(x: number, y: number, width: number, height: number, rows = 4): string {
  let out = "";
  for (let i = 1; i < rows; i++) {
    const ly = y + (i * height) / rows;
    out += `<line x1="${x}" x2="${x + width}" y1="${ly}" y2="${ly}" stroke="#FFFFFF" stroke-opacity="0.08"/>`;
  }
  return out;
}

// --- illustrations ----------------------------------------------------------

function stopwatch(accent: string): string {
  let ticks = "";
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const r1 = i % 3 === 0 ? 44 : 49;
    ticks += `<line x1="${120 + Math.sin(a) * r1}" y1="${136 - Math.cos(a) * r1}" x2="${120 + Math.sin(a) * 54}" y2="${136 - Math.cos(a) * 54}" stroke="${accent}" stroke-width="${i % 3 === 0 ? 4 : 2}" stroke-linecap="round"/>`;
  }
  return wrap(
    accent,
    `<rect x="108" y="44" width="24" height="18" rx="4" fill="url(#metal)"/>` +
      `<rect x="100" y="36" width="40" height="12" rx="5" fill="url(#metal)"/>` +
      `<rect x="168" y="66" width="18" height="12" rx="4" fill="url(#metal)" transform="rotate(40 177 72)"/>` +
      `<circle cx="120" cy="136" r="74" fill="url(#metal)"/>` +
      `<circle cx="120" cy="136" r="62" fill="url(#dark)"/>` +
      `<circle cx="120" cy="136" r="62" fill="none" stroke="${accent}" stroke-width="5" stroke-dasharray="290 400" transform="rotate(-90 120 136)" stroke-linecap="round"/>` +
      ticks +
      `<line x1="120" y1="136" x2="148" y2="104" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>` +
      `<circle cx="120" cy="136" r="7" fill="${accent}"/>`
  );
}

function alarmClock(accent: string): string {
  return wrap(
    accent,
    `<circle cx="70" cy="64" r="22" fill="url(#acc)"/><circle cx="170" cy="64" r="22" fill="url(#acc)"/>` +
      `<line x1="78" y1="196" x2="64" y2="214" stroke="#8D97A6" stroke-width="8" stroke-linecap="round"/>` +
      `<line x1="162" y1="196" x2="176" y2="214" stroke="#8D97A6" stroke-width="8" stroke-linecap="round"/>` +
      `<circle cx="120" cy="134" r="72" fill="url(#acc)"/>` +
      `<circle cx="120" cy="134" r="60" fill="#FFF8EE"/>` +
      `<circle cx="120" cy="134" r="60" fill="none" stroke="#000000" stroke-opacity="0.12" stroke-width="3"/>` +
      [0, 1, 2, 3]
        .map((i) => {
          const a = (i * Math.PI) / 2;
          return `<line x1="${120 + Math.sin(a) * 46}" y1="${134 - Math.cos(a) * 46}" x2="${120 + Math.sin(a) * 54}" y2="${134 - Math.cos(a) * 54}" stroke="#1F2937" stroke-width="5" stroke-linecap="round"/>`;
        })
        .join("") +
      `<line x1="120" y1="134" x2="120" y2="96" stroke="#1F2937" stroke-width="6" stroke-linecap="round"/>` +
      `<line x1="120" y1="134" x2="150" y2="146" stroke="#1F2937" stroke-width="5" stroke-linecap="round"/>` +
      `<circle cx="120" cy="134" r="6" fill="${accent}"/>`
  );
}

function calendar(accent: string): string {
  return wrap(
    accent,
    `<rect x="38" y="52" width="164" height="160" rx="18" fill="url(#paper)"/>` +
      `<rect x="38" y="52" width="164" height="44" rx="18" fill="url(#acc)"/>` +
      `<rect x="38" y="78" width="164" height="18" fill="url(#acc)"/>` +
      `<rect x="72" y="38" width="12" height="30" rx="6" fill="#4B5563"/><rect x="156" y="38" width="12" height="30" rx="6" fill="#4B5563"/>` +
      gridLines(52, 104, 136, 96, 4) +
      `<g opacity="0.95">${candlesSvg(56, 110, 128, 88, "uptrend", 7, 12)}</g>` +
      `<polyline points="58,186 96,166 124,174 176,118" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<polygon points="182,108 186,130 166,122" fill="${accent}"/>`,
    linear("paper", "#FFFFFF", "#D9DEE6")
  ).replace(/stroke="#FFFFFF" stroke-opacity="0.08"/g, 'stroke="#94A3B8" stroke-opacity="0.35"');
}

function bank(accent: string): string {
  const columns = [62, 94, 126, 158]
    .map((x) => `<rect x="${x}" y="104" width="20" height="84" rx="3" fill="url(#stone)"/>`)
    .join("");
  return wrap(
    accent,
    `<polygon points="120,40 210,92 30,92" fill="url(#stone)"/>` +
      `<rect x="40" y="92" width="160" height="12" fill="url(#stone)"/>` +
      columns +
      `<rect x="40" y="188" width="160" height="12" fill="url(#stone)"/><rect x="30" y="200" width="180" height="12" rx="2" fill="url(#stone)"/>` +
      `<polyline points="40,178 92,140 124,156 196,72" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<polygon points="206,58 210,96 178,80" fill="${accent}"/>`,
    linear("stone", "#F3F4F6", "#7B8494")
  );
}

function laptopChart(accent: string, shape: ChartShape = "uptrend", seed = 3): string {
  return wrap(
    accent,
    `<rect x="44" y="56" width="152" height="104" rx="10" fill="#0B1020" stroke="${accent}" stroke-width="4"/>` +
      gridLines(54, 66, 132, 84) +
      candlesSvg(56, 66, 128, 84, shape, seed, 8) +
      `<path d="M28 168 H212 L198 188 H42 Z" fill="url(#metal)"/>` +
      `<rect x="100" y="168" width="40" height="5" rx="2" fill="#6B7280"/>`
  );
}

function monitorChart(accent: string, shape: ChartShape = "uptrend", seed = 5): string {
  return wrap(
    accent,
    `<rect x="22" y="40" width="196" height="132" rx="12" fill="url(#dark)" stroke="${accent}" stroke-width="4"/>` +
      `<rect x="32" y="50" width="176" height="112" rx="6" fill="#070A12"/>` +
      gridLines(32, 50, 176, 112) +
      candlesSvg(36, 54, 168, 104, shape, seed, 8) +
      `<rect x="108" y="172" width="24" height="26" fill="url(#metal)"/>` +
      `<rect x="78" y="196" width="84" height="10" rx="5" fill="url(#metal)"/>`
  );
}

function candles(accent: string): string {
  const bars = [
    { x: 40, top: 120, bottom: 196, up: false },
    { x: 78, top: 92, bottom: 178, up: true },
    { x: 116, top: 108, bottom: 168, up: false },
    { x: 154, top: 60, bottom: 150, up: true },
  ];
  return wrap(
    accent,
    bars
      .map(
        (bar) =>
          `<line x1="${bar.x + 16}" x2="${bar.x + 16}" y1="${bar.top - 22}" y2="${bar.bottom + 16}" stroke="${bar.up ? UP : DOWN}" stroke-width="4"/>` +
          `<rect x="${bar.x}" y="${bar.top}" width="32" height="${bar.bottom - bar.top}" rx="5" fill="url(#${bar.up ? "upg" : "downg"})"/>` +
          `<rect x="${bar.x + 4}" y="${bar.top + 4}" width="8" height="${bar.bottom - bar.top - 8}" rx="3" fill="#FFFFFF" fill-opacity="0.25"/>`
      )
      .join(""),
    linear("upg", "#5EEAB0", "#0E7A57") + linear("downg", "#FF8A80", "#B3261E")
  );
}

function growthArrow(accent: string): string {
  const bars = [0, 1, 2, 3]
    .map((i) => {
      const h = 40 + i * 32;
      return `<rect x="${44 + i * 40}" y="${200 - h}" width="28" height="${h}" rx="5" fill="url(#acc)" fill-opacity="${0.45 + i * 0.15}"/>`;
    })
    .join("");
  return wrap(
    accent,
    bars +
      `<polyline points="36,170 92,128 128,142 192,66" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<polygon points="206,48 210,90 174,74" fill="#FFFFFF"/>`
  );
}

function shield(accent: string): string {
  return wrap(
    accent,
    `<path d="M120 30 L196 58 V118 C196 164 162 196 120 212 C78 196 44 164 44 118 V58 Z" fill="url(#acc)"/>` +
      `<path d="M120 46 L182 68 V118 C182 156 154 182 120 196 C86 182 58 156 58 118 V68 Z" fill="#000000" fill-opacity="0.18"/>` +
      `<polyline points="88,120 112,144 156,96" fill="none" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`
  );
}

function target(accent: string): string {
  return wrap(
    accent,
    `<circle cx="112" cy="128" r="80" fill="url(#acc)"/><circle cx="112" cy="128" r="60" fill="#F8FAFC"/>` +
      `<circle cx="112" cy="128" r="40" fill="url(#acc)"/><circle cx="112" cy="128" r="20" fill="#F8FAFC"/>` +
      `<circle cx="112" cy="128" r="9" fill="url(#acc)"/>` +
      `<line x1="112" y1="128" x2="196" y2="44" stroke="#E5E7EB" stroke-width="7" stroke-linecap="round"/>` +
      `<polygon points="196,44 212,40 208,56 200,52 192,60 188,48" fill="${accent}"/>`
  );
}

function scales(accent: string): string {
  return wrap(
    accent,
    `<rect x="114" y="54" width="12" height="140" rx="4" fill="url(#metal)"/>` +
      `<rect x="76" y="194" width="88" height="14" rx="6" fill="url(#metal)"/>` +
      `<line x1="44" y1="84" x2="196" y2="64" stroke="#D1D5DB" stroke-width="8" stroke-linecap="round"/>` +
      `<circle cx="120" cy="72" r="10" fill="${accent}"/>` +
      `<line x1="44" y1="84" x2="28" y2="142" stroke="#9CA3AF" stroke-width="2"/><line x1="44" y1="84" x2="60" y2="142" stroke="#9CA3AF" stroke-width="2"/>` +
      `<line x1="196" y1="64" x2="180" y2="122" stroke="#9CA3AF" stroke-width="2"/><line x1="196" y1="64" x2="212" y2="122" stroke="#9CA3AF" stroke-width="2"/>` +
      `<path d="M22 142 H66 A22 14 0 0 1 22 142 Z" fill="${DOWN}"/>` +
      `<path d="M174 122 H218 A22 14 0 0 1 174 122 Z" fill="${UP}"/>` +
      `<rect x="36" y="128" width="16" height="14" rx="3" fill="${DOWN}"/>` +
      `<rect x="182" y="98" width="28" height="24" rx="4" fill="${UP}"/>`
  );
}

function lightbulb(accent: string): string {
  return wrap(
    accent,
    `<path d="M120 34 C76 34 52 66 52 100 C52 128 68 144 82 160 C90 170 92 178 92 186 H148 C148 178 150 170 158 160 C172 144 188 128 188 100 C188 66 164 34 120 34 Z" fill="url(#acc)"/>` +
      `<path d="M96 78 C102 64 114 58 126 58" fill="none" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="8" stroke-linecap="round"/>` +
      `<rect x="92" y="186" width="56" height="12" rx="4" fill="url(#metal)"/><rect x="96" y="198" width="48" height="10" rx="4" fill="url(#metal)"/>` +
      `<rect x="104" y="208" width="32" height="8" rx="4" fill="#6B7280"/>`
  );
}

function hourglass(accent: string): string {
  return wrap(
    accent,
    `<rect x="56" y="30" width="128" height="16" rx="6" fill="url(#wood)"/><rect x="56" y="194" width="128" height="16" rx="6" fill="url(#wood)"/>` +
      `<path d="M72 46 H168 C168 92 128 104 128 120 C128 136 168 148 168 194 H72 C72 148 112 136 112 120 C112 104 72 92 72 46 Z" fill="#E0F2FE" fill-opacity="0.25" stroke="#CBD5E1" stroke-width="4"/>` +
      `<path d="M88 70 H152 C146 92 124 100 120 112 C116 100 94 92 88 70 Z" fill="url(#acc)"/>` +
      `<path d="M120 124 L122 176 H118 Z" fill="${accent}"/>` +
      `<path d="M84 190 C92 168 148 168 156 190 Z" fill="url(#acc)"/>`,
    linear("wood", "#C08A4A", "#7A4E22")
  );
}

function journal(accent: string): string {
  let lines = "";
  for (let i = 0; i < 6; i++) lines += `<line x1="82" x2="172" y1="${84 + i * 20}" y2="${84 + i * 20}" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>`;
  let rings = "";
  for (let i = 0; i < 6; i++) rings += `<rect x="54" y="${62 + i * 24}" width="22" height="8" rx="4" fill="#4B5563"/>`;
  return wrap(
    accent,
    `<rect x="60" y="44" width="128" height="168" rx="12" fill="url(#acc)"/>` +
      `<rect x="68" y="52" width="114" height="152" rx="8" fill="#F8FAFC"/>` +
      lines +
      rings +
      `<polyline points="90,184 110,170 128,176 160,150" fill="none" stroke="${UP}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<g transform="rotate(35 190 120)"><rect x="182" y="40" width="16" height="130" rx="4" fill="url(#metal)"/><polygon points="182,170 198,170 190,190" fill="#1F2937"/></g>`
  );
}

function warning(accent: string): string {
  return wrap(
    accent,
    `<path d="M120 34 L212 196 C216 204 210 212 202 212 H38 C30 212 24 204 28 196 Z" fill="url(#acc)"/>` +
      `<path d="M120 62 L190 192 H50 Z" fill="#000000" fill-opacity="0.15"/>` +
      `<rect x="110" y="94" width="20" height="66" rx="8" fill="#FFFFFF"/>` +
      `<circle cx="120" cy="182" r="11" fill="#FFFFFF"/>`
  );
}

function checklist(accent: string): string {
  const rows = [0, 1, 2]
    .map((i) => {
      const y = 88 + i * 40;
      return (
        `<rect x="70" y="${y}" width="24" height="24" rx="6" fill="${accent}"/>` +
        `<polyline points="${75},${y + 12} ${81},${y + 18} ${90},${y + 6}" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<rect x="104" y="${y + 7}" width="66" height="10" rx="5" fill="#94A3B8"/>`
      );
    })
    .join("");
  return wrap(
    accent,
    `<rect x="50" y="42" width="140" height="172" rx="14" fill="url(#board)"/>` +
      `<rect x="60" y="60" width="120" height="144" rx="8" fill="#F8FAFC"/>` +
      `<rect x="92" y="32" width="56" height="24" rx="8" fill="url(#metal)"/>` +
      rows,
    linear("board", "#C08A4A", "#7A4E22")
  );
}

function magnifier(accent: string): string {
  return wrap(
    accent,
    `<rect x="30" y="60" width="150" height="110" rx="10" fill="#0B1020" stroke="#334155" stroke-width="3"/>` +
      candlesSvg(38, 68, 134, 94, "breakout", 11, 9) +
      `<line x1="156" y1="160" x2="206" y2="210" stroke="url(#metal)" stroke-width="18" stroke-linecap="round"/>` +
      `<circle cx="128" cy="126" r="46" fill="${accent}" fill-opacity="0.18" stroke="url(#metal)" stroke-width="10"/>`
  );
}

const DRAWERS: Record<Illustration, (accent: string, shape?: ChartShape, seed?: number) => string> = {
  stopwatch,
  alarm_clock: alarmClock,
  calendar,
  bank,
  laptop_chart: laptopChart,
  monitor_chart: monitorChart,
  candles,
  growth_arrow: growthArrow,
  shield,
  target,
  scales,
  lightbulb,
  hourglass,
  journal,
  warning,
  checklist,
  magnifier,
};

export function illustrationSvg(
  name: Illustration,
  accent: string,
  shape?: ChartShape,
  seed?: number
): string {
  return DRAWERS[name](accent, shape, seed);
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
