"use client";

import { useEffect, useState } from "react";

import ContentChart from "@/components/analytics/content-chart";
import PlatformChart from "@/components/analytics/platform-chart";
import StatsCard from "@/components/analytics/stats-card";

import { AnalyticsService } from "@/lib/services/analytics.service";

import {
  FileText,
  Clock3,
  CalendarDays,
  Rocket,
} from "lucide-react";

interface DashboardStats {
  total: number;
  drafts: number;
  scheduled: number;
  published: number;

  chartData: {
    date: string;
    total: number;
  }[];

  platformData: {
    name: string;
    value: number;
  }[];
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    drafts: 0,
    scheduled: 0,
    published: 0,
    chartData: [],
    platformData: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const { data, error } =
        await AnalyticsService.getDashboardStats();

      if (error) {
        console.error("Analytics Error:", error);
        return;
      }

      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Analytics
        </h1>

        <p className="text-muted-foreground">
          Track your AI content performance.
        </p>
      </div>

      {loading ? (
        <p>Loading analytics...</p>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              title="Total Content"
              value={stats.total}
              icon={FileText}
              color="bg-blue-500"
              subtitle="All generated content"
            />

            <StatsCard
              title="Drafts"
              value={stats.drafts}
              icon={Clock3}
              color="bg-yellow-500"
              subtitle="Waiting to publish"
            />

            <StatsCard
              title="Scheduled"
              value={stats.scheduled}
              icon={CalendarDays}
              color="bg-green-500"
              subtitle="Ready to publish"
            />

            <StatsCard
              title="Published"
              value={stats.published}
              icon={Rocket}
              color="bg-purple-500"
              subtitle="Already published"
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ContentChart
              data={stats.chartData}
            />

            <PlatformChart
              data={stats.platformData}
            />
          </div>
        </>
      )}
    </div>
  );
}