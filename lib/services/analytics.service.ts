import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

const supabase = createClient();

export class AnalyticsService {
  static async getDashboardStats() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    const { data, error } = await supabase
      .from("ai_generations")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      return { data: null, error };
    }

    const total = data.length;

    const drafts = data.filter((item) => item.status === "draft").length;

    const scheduled = data.filter(
      (item) => item.status === "scheduled"
    ).length;

    const published = data.filter(
      (item) => item.status === "published"
    ).length;

    // Group by day
    const grouped = data.reduce((acc: Record<string, number>, item) => {
      const day = format(new Date(item.created_at), "MMM dd");
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(grouped).map(([date, total]) => ({
      date,
      total,
    }));

    // Group by platform
    const platformMap = data.reduce((acc: Record<string, number>, item) => {
      const platform = item.platform || "Unknown";
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {});

    const platformData = Object.entries(platformMap).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      data: {
        total,
        drafts,
        scheduled,
        published,
        chartData,
        platformData,
      },
      error: null,
    };
  }

  /**
   * Lightweight counts used by the dashboard's top stat row. Everything
   * here is a real count from Supabase — there is no analytics ingestion
   * pipeline from the social platforms yet, so we never fabricate
   * engagement/reach numbers (see Dashboard for how that's surfaced).
   */
  static async getOverviewStats() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        data: {
          totalPosts: 0,
          totalGenerations: 0,
          activeBrands: 0,
          scheduledPosts: 0,
        },
        error: new Error("Not authenticated"),
      };
    }

    const [generations, published, brands, scheduled] = await Promise.all([
      supabase
        .from("ai_generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("published_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("brands")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("ai_generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "scheduled"),
    ]);

    return {
      data: {
        totalGenerations: generations.count ?? 0,
        totalPosts: (published.count ?? 0) + (generations.count ?? 0),
        activeBrands: brands.count ?? 0,
        scheduledPosts: scheduled.count ?? 0,
      },
      error:
        generations.error ||
        published.error ||
        brands.error ||
        scheduled.error ||
        null,
    };
  }
}
