import { createClient } from "@/lib/supabase/client";
import { Content } from "@/lib/types/content";
const supabase = createClient();

export class ContentService {
  static async getAll() {
    return await supabase
      .from("ai_generations")
      .select(
        `
        *,
        brands(name)
      `
      )
      .order("created_at", {
        ascending: false,
      });
  }

  static async update(id: string, values: any) {
    return await supabase
      .from("ai_generations")
      .update(values)
      .eq("id", id);
  }

  static async delete(id: string) {
    return await supabase
      .from("ai_generations")
      .delete()
      .eq("id", id);
  }

  static async duplicate(data: Omit<Content, "id" | "created_at" | "brands">) {
  return await supabase
    .from("ai_generations")
    .insert(data)
    .select(`
      *,
      brands(name)
    `)
    .single();
}
}