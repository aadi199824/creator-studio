import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    /*
     * STEP 1
     * Get currently authenticated Creator Studio user.
     */
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        "Instagram accounts auth error:",
        userError
      );

      return NextResponse.json(
        {
          accounts: [],
          error: userError.message,
        },
        {
          status: 401,
        }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          accounts: [],
          error: "User not authenticated.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * STEP 2
     * Load Instagram accounts belonging
     * only to the currently logged-in user.
     */
    const {
      data,
      error,
    } = await supabase
      .from("social_accounts")
      .select(`
        id,
        account_name,
        account_id,
        platform,
        profile_picture,
        expires_at,
        created_at
      `)
      .eq("user_id", user.id)
      .eq("platform", "instagram")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Instagram accounts query error:",
        error
      );

      return NextResponse.json(
        {
          accounts: [],
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * STEP 3
     * Convert database fields into the
     * format expected by the frontend.
     */
    const accounts =
      data?.map((account) => {
        const expired =
          account.expires_at
            ? new Date(account.expires_at).getTime() <
              Date.now()
            : false;

        return {
          id: account.id,

          username:
            account.account_name,

          account_id:
            account.account_id,

          platform:
            account.platform,

          profile_picture:
            account.profile_picture ?? null,

          expires_at:
            account.expires_at,

          is_active:
            !expired,
        };
      }) ?? [];

    /*
     * STEP 4
     * Return accounts.
     */
    return NextResponse.json({
      accounts,
    });
  } catch (error: unknown) {
    console.error(
      "Instagram accounts API error:",
      error
    );

    return NextResponse.json(
      {
        accounts: [],
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Instagram accounts.",
      },
      {
        status: 500,
      }
    );
  }
}