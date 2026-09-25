import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export class CalendarService {
  static async getScheduledContent() {
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
      .not("scheduled_at", "is", null)
      .order("scheduled_at", { ascending: true });
  }

  static async scheduleContent(id: string, scheduled_at: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    return await supabase
      .from("ai_generations")
      .update({
        scheduled_at,
        status: "scheduled",
      })
      .eq("id", id)
      .eq("user_id", user.id);
  }

  static async unscheduleContent(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    return await supabase
      .from("ai_generations")
      .update({
        scheduled_at: null,
        status: "draft",
      })
      .eq("id", id)
      .eq("user_id", user.id);
  }
}
