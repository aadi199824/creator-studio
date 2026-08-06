import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  return NextResponse.json({
    message: "AI Generate API is working!",
  });
}

export async function POST(request: NextRequest) {
  try {
    const { generationId } = await request.json();

    if (!generationId) {
      return NextResponse.json(
        { error: "Generation ID is required." },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get generation record
    const { data: generation, error } = await supabase
      .from("ai_generations")
      .select("*")
      .eq("id", generationId)
      .single();

    if (error || !generation) {
      return NextResponse.json(
        { error: "Generation not found." },
        { status: 404 }
      );
    }

    // Generate AI content
    const content = await AIService.generateContent(
      generation.prompt
    );

    // Save generated content
    const { error: updateError } = await supabase
      .from("ai_generations")
      .update({
        generated_content: content,
        status: "completed",
      })
      .eq("id", generationId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}