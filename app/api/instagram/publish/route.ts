import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { publishInstagramImage } from "@/lib/instagram/publisher";
import { instagramPublishSchema } from "@/lib/instagram/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = instagramPublishSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request." },
        { status: 400 }
      );
    }

    const { accountId, imageUrl, caption } = parsed.data;

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: account, error } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .eq("platform", "instagram")
      .single();

    if (error || !account) {
      return NextResponse.json(
        { error: "Instagram account not found." },
        { status: 404 }
      );
    }

    const mediaId = await publishInstagramImage(
      account.account_id,
      account.access_token,
      imageUrl,
      caption,
      account.auth_provider ?? "instagram_direct"
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
      console.error("Failed to save publishing history:", saveError);

      return NextResponse.json(
        {
          error:
            "Post published, but history could not be saved.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mediaId,
      account: account.account_name,
    });
  } catch (err: any) {
    console.error("Instagram publish error:", err);

    return NextResponse.json(
      {
        error:
          err?.message ||
          "We couldn't publish this post to Instagram. Please reconnect your account and try again.",
      },
      { status: 500 }
    );
  }
}
