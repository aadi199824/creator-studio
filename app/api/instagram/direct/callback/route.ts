import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Instagram returned an OAuth error
    if (error) {
      console.error("Instagram OAuth error:", {
        error,
        errorDescription,
      });

      return NextResponse.redirect(
        new URL(
          `/dashboard/instagram?error=${encodeURIComponent(
            errorDescription || error
          )}`,
          request.url
        )
      );
    }

    // Authorization code missing
    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/instagram?error=missing_authorization_code",
          request.url
        )
      );
    }

    console.log("Instagram authorization code received");

    // SUCCESS
    return NextResponse.redirect(
      new URL(
        "/dashboard/instagram?oauth=success",
        request.url
      )
    );
  } catch (error) {
    console.error("Instagram callback error:", error);

    return NextResponse.redirect(
      new URL(
        "/dashboard/instagram?error=callback_failed",
        request.url
      )
    );
  }
}