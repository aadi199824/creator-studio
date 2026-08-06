import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing authorization code",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Instagram authorization successful",
  });
}