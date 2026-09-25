import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get generation record — scoped to the requesting user so nobody can
    // trigger generation against, or read, another user's draft.
    const { data: generation, error } = await supabase
      .from("ai_generations")
      .select("*")
      .eq("id", generationId)
      .eq("user_id", user.id)
      .single();

    if (error || !generation) {
      return NextResponse.json(
        { error: "Generation not found." },
        { status: 404 }
      );
    }

    // Generate AI content
    const content = await AIService.generateContent(generation.prompt);

    // Save generated content
    const { error: updateError } = await supabase
      .from("ai_generations")
      .update({
        generated_content: content,
        status: "completed",
      })
      .eq("id", generationId)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error: any) {
    console.error("AI generate error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "We couldn't generate this content. Please try again.",
      },
      { status: 500 }
    );
  }
}
