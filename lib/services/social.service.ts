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

  static async saveAccount(data: {
    user_id: string;
    platform: string;
    account_name: string;
    account_id: string;
    access_token: string;
  }) {
    return await supabase
      .from("social_accounts")
      .upsert(data, {
        onConflict: "account_id",
      });
  }

  static async disconnect(id: string) {
    return await supabase
      .from("social_accounts")
      .delete()
      .eq("id", id);
  }
}