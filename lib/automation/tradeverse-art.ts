import type { TradeverseAccent, TradeverseSlide } from "@/lib/automation/tradeverse-content";
import {
  ImageGenerationService,
  tradeverseArtPrompt,
} from "@/lib/services/image-generation.service";

/** Same order as the cover columns in lib/render/tradeverse-slides.tsx. */
const COVER_ACCENTS: TradeverseAccent[] = ["cyan", "orange", "green", "purple"];

/**
 * AI artwork for one slide, in the slot order the template expects
 * (cover: one per item; concept/checklist: [hero]). Empty / null entries
 * make the template use its code-drawn illustration instead.
 */
export async function generateSlideArt(slide: TradeverseSlide): Promise<(string | null)[]> {
  if (!ImageGenerationService.isConfigured()) return [];

  if (slide.type === "cover") {
    return Promise.all(
      slide.items.map((item, index) =>
        item.visual
          ? ImageGenerationService.generate(tradeverseArtPrompt(item.visual, COVER_ACCENTS[index % 4]))
          : Promise.resolve(null)
      )
    );
  }

  return [
    slide.visual
      ? await ImageGenerationService.generate(tradeverseArtPrompt(slide.visual, slide.accent))
      : null,
  ];
}
