import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { publishInstagramImage } from "@/lib/instagram/publisher";

export async function POST(request: NextRequest) {
  try {
    const {
      accountId,
      imageUrl,
      caption,
    } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        {
          error: "Instagram account is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          error: "Image URL is required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Load the selected Instagram account.
     */
    const {
      data: account,
      error,
    } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .eq("platform", "instagram")
      .single();

    if (error || !account) {
      return NextResponse.json(
        {
          error:
            "Instagram account not found.",
        },
        {
          status: 404,
        }
      );
    }

    console.log("Publishing to:");
    console.log(account.account_name);

    const mediaId =
      await publishInstagramImage(
        account.account_id,
        account.access_token,
        imageUrl,
        caption
      );

    const {
      error: saveError,
    } = await supabase
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
      console.error(saveError);

      return NextResponse.json(
        {
          error:
            "Post published, but history could not be saved.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      mediaId,
      account: account.account_name,
    });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          err.message ??
          "Failed to publish.",
      },
      {
        status: 500,
      }
    );
  }
}