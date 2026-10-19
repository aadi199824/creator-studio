// Instagram captions are capped at 2,200 characters. Since 2026-10-19 the
// daily automation stores only the real caption + hashtags in
// generated_content (slide copy lives in the draft's production plan), but
// older drafts and manual posts may still contain full slide scripts, so
// both the manual "Publish Now" route and the scheduled-publish worker still
// truncate here rather than letting Instagram's API reject the request.
export const INSTAGRAM_CAPTION_LIMIT = 2200;

export function buildInstagramCaption(generatedContent: string): string {
  if (generatedContent.length <= INSTAGRAM_CAPTION_LIMIT) {
    return generatedContent;
  }

  return (
    generatedContent.slice(0, INSTAGRAM_CAPTION_LIMIT - 3).trimEnd() + "..."
  );
}

/**
 * Appends a normalised hashtag line to a caption. Every tag gets exactly one
 * leading "#" and no internal spaces/punctuation — fixes drafts where some
 * tags were emitted as bare words (e.g. "CorporateTruth" instead of
 * "#CorporateTruth") and therefore weren't clickable hashtags. Duplicates are
 * removed case-insensitively.
 */
export function buildCaptionWithHashtags(
  caption: string,
  hashtags: string[]
): string {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const raw of hashtags) {
    const tag = raw.replace(/^#+/, "").replace(/[^\p{L}\p{M}\p{N}_]/gu, "");
    const key = tag.toLowerCase();

    if (tag.length === 0 || seen.has(key)) continue;

    seen.add(key);
    tags.push(`#${tag}`);
  }

  const body = caption.trim();

  return tags.length > 0 ? `${body}\n\n${tags.join(" ")}` : body;
}
