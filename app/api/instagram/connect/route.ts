import { NextResponse } from "next/server";
import { getInstagramOAuthUrl } from "@/lib/instagram/auth";

export async function GET() {
  return NextResponse.redirect(getInstagramOAuthUrl());
}