import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { publishInstagramImage } from "@/lib/instagram/publisher";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, caption } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required." },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: account, error } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "instagram")
      .single();

    if (error || !account) {
      return NextResponse.json(
        { error: "Instagram account not connected." },
        { status: 404 }
      );
    }

    const mediaId = await publishInstagramImage(
      account.account_id,
      account.access_token,
      imageUrl,
      caption
    );
    const { error: saveError } = await supabase
  .from("published_posts")
  .insert({
    user_id: user.id,
    social_account_id: account.id,
    platform: "instagram",
    media_id: mediaId,
    image_url: imageUrl,
    caption,
    status: "published",
  });

if (saveError) {
  console.error("Failed to save published post:", saveError);

  return NextResponse.json(
    {
      error: "Post was published to Instagram, but failed to save publishing history.",
    },
    {
      status: 500,
    }
  );
}
    return NextResponse.json({
      success: true,
      mediaId,
    });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}