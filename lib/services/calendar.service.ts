import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export class CalendarService {
  static async getScheduledContent() {
    return await supabase
      .from("ai_generations")
      .select(
        `
          *,
          brands(name)
        `
      )
      .not("scheduled_at", "is", null)
      .order("scheduled_at", { ascending: true });
  }

  static async scheduleContent(
    id: string,
    scheduled_at: string
  ) {
    return await supabase
      .from("ai_generations")
      .update({
        scheduled_at,
        status: "scheduled",
      })
      .eq("id", id);
  }

  static async unscheduleContent(id: string) {
    return await supabase
      .from("ai_generations")
      .update({
        scheduled_at: null,
        status: "draft",
      })
      .eq("id", id);
  }
}