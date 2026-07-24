import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

const supabase = createClient();

export class AnalyticsService {
  static async getDashboardStats() {
    const { data, error } = await supabase
      .from("ai_generations")
      .select("*");

    if (error) {
      return { data: null, error };
    }

    const total = data.length;

    const drafts = data.filter(
      (item) => item.status === "draft"
    ).length;

    const scheduled = data.filter(
      (item) => item.status === "scheduled"
    ).length;

    const published = data.filter(
      (item) => item.status === "published"
    ).length;

    // Group by day
    const grouped = data.reduce((acc: Record<string, number>, item) => {
      const day = format(
        new Date(item.created_at),
        "MMM dd"
      );

      acc[day] = (acc[day] || 0) + 1;

      return acc;
    }, {});

    const chartData = Object.entries(grouped).map(
      ([date, total]) => ({
        date,
        total,
      })
    );
    // Group by platform
const platformMap = data.reduce(
  (acc: Record<string, number>, item) => {
    const platform = item.platform || "Unknown";
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  },
  {}
);

const platformData = Object.entries(platformMap).map(
  ([name, value]) => ({
    name,
    value,
  })
);

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
}