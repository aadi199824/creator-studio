// Instagram captions are capped at 2,200 characters. Our drafts are full
// multi-slide carousel scripts (Slide 1, Slide 2, ...); until real
// multi-image carousel publishing is built, both the manual "Publish Now"
// route and the scheduled-publish worker publish the single generated cover
// image with this text as the caption, truncated if it runs long rather
// than letting Instagram's API reject the whole request.
export const INSTAGRAM_CAPTION_LIMIT = 2200;

export function buildInstagramCaption(generatedContent: string): string {
  if (generatedContent.length <= INSTAGRAM_CAPTION_LIMIT) {
    return generatedContent;
  }

  return (
    generatedContent.slice(0, INSTAGRAM_CAPTION_LIMIT - 3).trimEnd() + "..."
  );
}
