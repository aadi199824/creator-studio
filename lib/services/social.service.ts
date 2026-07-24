import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export class SocialService {
  static async getAccounts() {
    return await supabase
      .from("social_accounts")
      .select("*")
      .order("created_at", {
        ascending: false,
      });
  }

  static async disconnect(id: string) {
    return await supabase
      .from("social_accounts")
      .delete()
      .eq("id", id);
  }
}