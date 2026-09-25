import { createClient } from "@/lib/supabase/client";
import { Content } from "@/lib/types/content";

const supabase = createClient();

export class ContentService {
  static async getAll() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: [], error: new Error("Not authenticated") };
    }

    return await supabase
      .from("ai_generations")
      .select(
        `
        *,
        brands(name)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
  }

  static async update(id: string, values: Partial<Content>) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    return await supabase
      .from("ai_generations")
      .update(values)
      .eq("id", id)
      .eq("user_id", user.id);
  }

  static async delete(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: new Error("Not authenticated") };
    }

    return await supabase
      .from("ai_generations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
  }

  static async duplicate(
    data: Omit<Content, "id" | "created_at" | "brands">
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    return await supabase
      .from("ai_generations")
      .insert({ ...data, user_id: user.id })
      .select(
        `
        *,
        brands(name)
      `
      )
      .single();
  }
}
