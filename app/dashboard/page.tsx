"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  Building2,
  Heart,
  ArrowUpRight,
} from "lucide-react";

import StatsCard from "@/components/dashboard/stats-card";
import RecentPosts from "@/components/dashboard/recent-posts";
import QuickActions from "@/components/dashboard/quick-actions";
import { AnalyticsService } from "@/lib/services/analytics.service";

interface Overview {
  totalPosts: number;
  totalGenerations: number;
  activeBrands: number;
  scheduledPosts: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Overview>({
    totalPosts: 0,
    totalGenerations: 0,
    activeBrands: 0,
    scheduledPosts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsService.getOverviewStats().then(({ data }) => {
      if (data) setStats(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Everything happening across your brands, at a glance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Posts"
          value={loading ? "—" : stats.totalPosts}
          icon={FileText}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          trend={!loading ? "Generated + published" : undefined}
        />

        <StatsCard
          title="AI Generations"
          value={loading ? "—" : stats.totalGenerations}
          icon={Sparkles}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />

        <StatsCard
          title="Active Brands"
          value={loading ? "—" : stats.activeBrands}
          icon={Building2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        <StatsCard
          title="Engagement Rate"
          value="—"
          icon={Heart}
          iconBg="bg-pink-50"
          iconColor="text-pink-600"
          comingSoon
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <RecentPosts />

          <Link
            href="/dashboard/calendar"
            className="flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div>
              <h3 className="font-semibold">Content Calendar</h3>
              <p className="text-sm text-muted-foreground">
                {stats.scheduledPosts > 0
                  ? `${stats.scheduledPosts} post${
                      stats.scheduledPosts === 1 ? "" : "s"
                    } scheduled`
                  : "Nothing scheduled yet"}
              </p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-purple-600" />
          </Link>
        </div>

        <QuickActions />
      </div>
    </div>
  );
}
