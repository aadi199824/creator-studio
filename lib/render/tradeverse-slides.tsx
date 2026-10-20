/**
 * Fixed @tradeverse.academy slide layout, rendered to PNG with next/og
 * (Satori under the hood — ships with Next.js, no extra dependency).
 *
 * Layout, colours and fonts are hard-coded here to match the live feed;
 * only the words, chart shape and illustration choice come from the daily
 * content. Artwork is AI-generated without text (Cloudflare FLUX, see
 * lib/services/image-generation.service.ts) and falls back to code-drawn
 * illustrations (lib/render/illustrations.ts) when unavailable.
 *
 * Satori rules to keep in mind when editing:
 * - every element with more than one child needs display:flex
 * - flexbox only (no grid), no pseudo-elements, no CSS files
 * - fonts must be passed explicitly (see loadFonts)
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";
import type { ReactNode } from "react";

import type {
  ChecklistSlide,
  ConceptSlide,
  CoverSlide,
  RowTone,
  TradeverseAccent,
  TradeverseSlide,
} from "@/lib/automation/tradeverse-content";
import {
  type ChartShape,
  type Illustration,
  illustrationSvg,
  svgToDataUrl,
} from "@/lib/render/illustrations";

export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1350;
const CONTENT_WIDTH = SLIDE_WIDTH - 2 * 56;

const COLORS = {
  bg: "#07090D",
  card: "#0D1017",
  gold: "#D6B15E",
  headline: "#FFB21E",
  white: "#FFFFFF",
  grey: "#9CA7B8",
  up: "#20B486",
  down: "#EF5350",
};

const ACCENT_HEX: Record<TradeverseAccent, string> = {
  cyan: "#1EA7FF",
  orange: "#FF8A00",
  green: "#22C55E",
  purple: "#A855F7",
  gold: "#FFB21E",
};

/** Cover columns cycle through these, matching the live "Types of Traders" post. */
const COVER_ACCENTS: TradeverseAccent[] = ["cyan", "orange", "green", "purple"];

const TONE_HEX: Record<RowTone, string | null> = {
  neutral: null,
  good: COLORS.up,
  bad: COLORS.down,
};

// --- assets ---------------------------------------------------------------

type Assets = {
  fonts: { name: string; data: Buffer; weight: 600 | 800 | 900; style: "normal" }[];
  logoDataUrl: string | null;
};

let assetsPromise: Promise<Assets> | null = null;

function loadAssets(): Promise<Assets> {
  assetsPromise ??= (async () => {
    const fontDir = path.join(process.cwd(), "lib/render/fonts");
    const [black, extraBold, semiBold] = await Promise.all([
      readFile(path.join(fontDir, "Inter-Black.otf")),
      readFile(path.join(fontDir, "Inter-ExtraBold.otf")),
      readFile(path.join(fontDir, "Inter-SemiBold.otf")),
    ]);

    let logoDataUrl: string | null = null;
    try {
      const logo = await readFile(path.join(process.cwd(), "public/brand/tradeverse-logo.jpg"));
      logoDataUrl = `data:image/jpeg;base64,${logo.toString("base64")}`;
    } catch {
      console.warn("Tradeverse logo not found at public/brand/tradeverse-logo.jpg — rendering without it.");
    }

    return {
      fonts: [
        { name: "Inter", data: black, weight: 900, style: "normal" },
        { name: "Inter", data: extraBold, weight: 800, style: "normal" },
        { name: "Inter", data: semiBold, weight: 600, style: "normal" },
      ],
      logoDataUrl,
    };
  })();

  return assetsPromise;
}

// --- small helpers ----------------------------------------------------------

/** Shrinks a headline until it fits one line of the content width. */
function fitFontSize(text: string, maxSize: number, width = CONTENT_WIDTH, widthPerChar = 0.7): number {
  const fitted = Math.floor(width / (Math.max(text.length, 1) * widthPerChar));
  return Math.max(48, Math.min(maxSize, fitted));
}

/**
 * Code-drawn illustration with an optional smaller "badge" icon overlapping
 * its bottom corner — the composition used in the live ChatGPT posts
 * (laptop + stopwatch, monitor + clock).
 */
function Art(props: {
  /** AI artwork data URL; when present it replaces the code-drawn illustration. */
  imageUrl?: string | null;
  name: Illustration;
  size: number;
  accent: string;
  badge?: Illustration | null;
  badgeAccent?: string;
  badgeSide?: "left" | "right";
  shape?: ChartShape;
  seed?: number;
}) {
  const { name, size, accent, badge, shape, seed } = props;
  const badgeSize = Math.round(size * 0.46);

  if (props.imageUrl) {
    return (
      <div
        style={{
          display: "flex",
          width: size,
          height: size,
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: `0 0 46px ${accent}55`,
          border: `2px solid ${accent}66`,
        }}
      >
        <img src={props.imageUrl} width={size - 4} height={size - 4} style={{ objectFit: "cover", borderRadius: 20 }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", position: "relative", width: size, height: size }}>
      <img src={svgToDataUrl(illustrationSvg(name, accent, shape, seed))} width={size} height={size} />
      {badge ? (
        <img
          src={svgToDataUrl(illustrationSvg(badge, props.badgeAccent ?? accent, shape, seed))}
          width={badgeSize}
          height={badgeSize}
          style={{
            position: "absolute",
            bottom: -Math.round(size * 0.04),
            ...(props.badgeSide === "left"
              ? { left: -Math.round(size * 0.06) }
              : { right: -Math.round(size * 0.06) }),
          }}
        />
      ) : null}
    </div>
  );
}

function IconCircle(props: { color: string; kind: "dot" | "check" | "cross" | "arrow" | "target" }) {
  const { color, kind } = props;
  const paths: Record<typeof kind, ReactNode> = {
    dot: <circle cx={12} cy={12} r={4} fill={color} />,
    check: <path d="M6 12.5l4 4 8-9" stroke={color} strokeWidth={3} fill="none" />,
    cross: <path d="M7 7l10 10M17 7L7 17" stroke={color} strokeWidth={3} fill="none" />,
    arrow: <path d="M5 12h13M13 6l6 6-6 6" stroke={color} strokeWidth={3} fill="none" />,
    target: (
      <g>
        <circle cx={12} cy={12} r={8} stroke={color} strokeWidth={2.5} fill="none" />
        <circle cx={12} cy={12} r={3} fill={color} />
      </g>
    ),
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 60,
        height: 60,
        flexShrink: 0,
        borderRadius: 30,
        border: `3px solid ${color}`,
        backgroundColor: COLORS.card,
      }}
    >
      <svg width={30} height={30} viewBox="0 0 24 24">
        {paths[kind]}
      </svg>
    </div>
  );
}

function Header(props: { day: string; logoDataUrl: string | null }) {
  return (
    <div style={{ display: "flex", position: "relative", height: 150, justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 0,
          top: 10,
          alignItems: "center",
          gap: 12,
          border: `3px solid ${COLORS.gold}`,
          borderRadius: 16,
          padding: "10px 18px",
          backgroundColor: COLORS.card,
        }}
      >
        <svg width={36} height={36} viewBox="0 0 24 24">
          <rect x={3} y={5} width={18} height={16} rx={2} stroke={COLORS.gold} strokeWidth={2} fill="none" />
          <path d="M3 10h18M8 3v4M16 3v4" stroke={COLORS.gold} strokeWidth={2} fill="none" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span style={{ fontSize: 26, fontWeight: 900 }}>DAY</span>
          <span style={{ fontSize: 40, fontWeight: 900 }}>{props.day}</span>
        </div>
      </div>
      {props.logoDataUrl ? (
        <img src={props.logoDataUrl} width={150} height={150} style={{ borderRadius: 75 }} />
      ) : (
        <span style={{ fontSize: 40, fontWeight: 900, color: COLORS.gold }}>TRADEVERSE ACADEMY</span>
      )}
    </div>
  );
}

function Headline(props: {
  line1: string;
  line2: string;
  color: string;
  align: "center" | "left";
  big?: boolean;
  width?: number;
}) {
  const line1 = props.line1.toUpperCase();
  const line2 = props.line2.toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: props.align === "center" ? "center" : "flex-start",
        marginTop: 6,
        lineHeight: 1,
      }}
    >
      {line1 ? (
        <span style={{ fontSize: fitFontSize(line1, props.big ? 110 : 84, props.width), fontWeight: 900, color: COLORS.white }}>
          {line1}
        </span>
      ) : null}
      <span
        style={{
          fontSize: fitFontSize(line2, props.big ? 150 : 110, props.width),
          fontWeight: 900,
          color: props.color,
          textShadow: "0 6px 0 rgba(0,0,0,0.55)",
        }}
      >
        {line2}
      </span>
    </div>
  );
}

function CtaBar(props: { title: string; subtitle: string; color: string }) {
  if (!props.title) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        alignSelf: "center",
        width: 780,
        marginTop: 28,
        padding: "16px 26px",
        border: `3px solid ${props.color}`,
        borderRadius: 18,
        backgroundColor: COLORS.card,
      }}
    >
      <IconCircle color={props.color} kind="target" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 32, fontWeight: 900 }}>{props.title.toUpperCase()}</span>
        <span style={{ fontSize: 24, fontWeight: 800, color: props.color }}>{props.subtitle.toUpperCase()}</span>
      </div>
    </div>
  );
}

function TipStrip(props: { tip: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginTop: "auto",
        padding: "12px 20px",
        border: `2px solid ${COLORS.gold}66`,
        borderRadius: 12,
        fontSize: 24,
        fontWeight: 600,
      }}
    >
      <svg width={28} height={28} viewBox="0 0 24 24">
        <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z" stroke="#FFC83D" strokeWidth={2} fill="none" />
      </svg>
      <span>{props.tip}</span>
    </div>
  );
}

function Frame(props: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        padding: "40px 56px 36px",
        backgroundColor: COLORS.bg,
        backgroundImage:
          "radial-gradient(circle at 75% 20%, rgba(40,70,130,0.35), rgba(7,9,13,0) 55%), radial-gradient(circle at 15% 95%, rgba(110,80,20,0.30), rgba(7,9,13,0) 45%)",
        color: COLORS.white,
        fontFamily: "Inter",
      }}
    >
      {props.children}
    </div>
  );
}

/** Vertically centres the slide body between the header and the tip strip. */
function Body(props: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", paddingBottom: 20 }}>
      {props.children}
    </div>
  );
}

// --- slide templates --------------------------------------------------------

type SlideContext = {
  day: string;
  logoDataUrl: string | null;
  seed: number;
  /** AI artwork per visual slot (cover: one per item; other slides: [hero]). */
  art: (string | null)[];
};

function CoverTemplate({ slide, ctx }: { slide: CoverSlide; ctx: SlideContext }) {
  const gap = 12;
  const columnWidth = Math.floor((CONTENT_WIDTH - (slide.items.length - 1) * gap) / slide.items.length);
  const artSize = Math.min(240, columnWidth - 10);

  return (
    <Frame>
      <Header day={ctx.day} logoDataUrl={ctx.logoDataUrl} />
      <Body>
      <Headline line1={slide.title_line1} line2={slide.title_line2} color={COLORS.headline} align="center" big />
      <div
        style={{
          display: "flex",
          alignSelf: "center",
          gap: 12,
          marginTop: 22,
          padding: "12px 26px",
          border: `3px solid ${COLORS.gold}`,
          borderRadius: 40,
          fontSize: slide.items.length > 3 ? 25 : 30,
          fontWeight: 900,
        }}
      >
        {slide.items.map((item, index) => (
          <span key={`pill${index}`} style={{ color: ACCENT_HEX[COVER_ACCENTS[index % 4]] }}>
            {`${index > 0 ? "• " : ""}${item.name.toUpperCase()}`}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap, marginTop: 30 }}>
        {slide.items.map((item, index) => {
          const accent = ACCENT_HEX[COVER_ACCENTS[index % 4]];
          return (
            <div
              key={`col${index}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: columnWidth,
                paddingBottom: 6,
                textAlign: "center",
                borderRight:
                  index < slide.items.length - 1 ? `2px solid ${accent}55` : "2px solid transparent",
              }}
            >
              <Art
                imageUrl={ctx.art[index]}
                name={item.illustration}
                badge={item.badge}
                size={artSize}
                accent={accent}
                shape="uptrend"
                seed={ctx.seed + index}
              />
              <span style={{ marginTop: 14, fontSize: 30, fontWeight: 900, color: accent }}>
                {item.name.toUpperCase()}
              </span>
              <span style={{ fontSize: 22, fontWeight: 600, color: "#E5E7EB" }}>{item.value}</span>
            </div>
          );
        })}
      </div>
      <CtaBar title={slide.cta_title} subtitle={slide.cta_subtitle} color={COLORS.gold} />
      </Body>
      <TipStrip tip={slide.tip} />
    </Frame>
  );
}

function ConceptTemplate({ slide, ctx }: { slide: ConceptSlide; ctx: SlideContext }) {
  const accent = ACCENT_HEX[slide.accent];

  return (
    <Frame>
      <Header day={ctx.day} logoDataUrl={ctx.logoDataUrl} />
      <Body>
      <Headline line1={slide.title_line1} line2={slide.title_line2} color={accent} align="left" />
      <div style={{ display: "flex", gap: 24, marginTop: 26 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 460 }}>
          {slide.rows.map((row, index) => {
            const color = TONE_HEX[row.tone] ?? accent;
            return (
              <div
                key={`row${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  minHeight: 96,
                  padding: "10px 14px",
                  border: "2px solid #FFFFFF22",
                  borderRadius: 14,
                  backgroundColor: "rgba(11,14,20,0.85)",
                }}
              >
                <IconCircle color={color} kind={row.tone === "good" ? "check" : row.tone === "bad" ? "cross" : "dot"} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 24, fontWeight: 800 }}>{row.label}</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color }}>{row.value.toUpperCase()}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexGrow: 1 }}>
          <Art
            imageUrl={ctx.art[0]}
            name="monitor_chart"
            badge={slide.badge}
            badgeSide="left"
            size={484}
            accent={accent}
            shape={slide.chart}
            seed={ctx.seed}
          />
          <span style={{ marginTop: 8, fontSize: 16, color: COLORS.grey }}>
            {ctx.art[0]
              ? "Illustrative image – not real market data"
              : `Illustrative chart (${slide.timeframe}) – not real market data`}
          </span>
        </div>
      </div>
      <CtaBar title={slide.cta_title} subtitle={slide.cta_subtitle} color={accent} />
      </Body>
      <TipStrip tip={slide.tip} />
    </Frame>
  );
}

function ChecklistTemplate({ slide, ctx }: { slide: ChecklistSlide; ctx: SlideContext }) {
  const accent = ACCENT_HEX[slide.accent];

  return (
    <Frame>
      <Header day={ctx.day} logoDataUrl={ctx.logoDataUrl} />
      <Body>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", width: 680 }}>
          <Headline line1={slide.title_line1} line2={slide.title_line2} color={accent} align="left" width={680} />
        </div>
        <Art imageUrl={ctx.art[0]} name={slide.illustration} size={260} accent={accent} seed={ctx.seed} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
        {slide.points.map((point, index) => {
          const color = TONE_HEX[point.tone] ?? accent;
          return (
            <div
              key={`pt${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "12px 16px",
                border: "2px solid #FFFFFF22",
                borderRadius: 14,
                backgroundColor: "rgba(11,14,20,0.85)",
              }}
            >
              <IconCircle color={color} kind={point.tone === "bad" ? "cross" : "check"} />
              <span style={{ fontSize: 30, fontWeight: 800 }}>{point.text}</span>
            </div>
          );
        })}
      </div>
      <CtaBar title={slide.cta_title} subtitle={slide.cta_subtitle} color={accent} />
      </Body>
      <TipStrip tip={slide.tip} />
    </Frame>
  );
}

// --- public API -------------------------------------------------------------

export async function renderTradeverseSlide(
  slide: TradeverseSlide,
  options: { day: string; seed: number; art?: (string | null)[] }
): Promise<Buffer> {
  const assets = await loadAssets();
  const ctx: SlideContext = { ...options, art: options.art ?? [], logoDataUrl: assets.logoDataUrl };

  const element =
    slide.type === "cover" ? (
      <CoverTemplate slide={slide} ctx={ctx} />
    ) : slide.type === "concept" ? (
      <ConceptTemplate slide={slide} ctx={ctx} />
    ) : (
      <ChecklistTemplate slide={slide} ctx={ctx} />
    );

  const response = new ImageResponse(element, {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    fonts: assets.fonts,
  });

  return Buffer.from(await response.arrayBuffer());
}
