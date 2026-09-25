import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Instagram/Facebook profile picture URLs returned by the Graph API are
 * short-lived, signed CDN links — they typically stop working within
 * hours to a couple of days. Rather than storing that URL directly (which
 * is why previously-connected accounts eventually showed a broken image),
 * we download the image once at connect time and keep our own permanent
 * copy in Supabase Storage.
 *
 * Returns the permanent public URL, or null if the picture couldn't be
 * fetched/cached (connecting the account still succeeds either way — this
 * is best-effort).
 */
export async function cacheProfilePicture(
  supabase: SupabaseClient,
  sourceUrl: string | undefined | null,
  userId: string
): Promise<string | null> {
  if (!sourceUrl) return null;

  try {
    const response = await fetch(sourceUrl);

    if (!response.ok) {
      console.error(
        "Profile picture fetch failed:",
        response.status,
        response.statusText
      );
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const extension = contentType.includes("png") ? "png" : "jpg";
    const bytes = await response.arrayBuffer();

    const path = `${userId}/avatars/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, bytes, {
        contentType,
        cacheControl: "31536000", // 1 year — this is our own permanent copy
        upsert: true,
      });

    if (uploadError) {
      console.error("Profile picture cache upload failed:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error("Profile picture caching error:", error);
    return null;
  }
}
