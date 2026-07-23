import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";

import StatsCard from "@/components/dashboard/stats-card";
import RecentPosts from "@/components/dashboard/recent-posts";
import QuickActions from "@/components/dashboard/quick-actions";

import {
  FileText,
  Sparkles,
  Building2,
  Calendar,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-8 space-y-8">
          <h1 className="text-3xl font-bold">
            Dashboard
          </h1>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Posts"
              value="245"
              icon={FileText}
            />

            <StatsCard
              title="AI Credits"
              value="8,240"
              icon={Sparkles}
            />

            <StatsCard
              title="Brands"
              value="6"
              icon={Building2}
            />

            <StatsCard
              title="Scheduled"
              value="32"
              icon={Calendar}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <RecentPosts />
            </div>

            <QuickActions />
          </div>
        </main>
      </div>
    </div>
  );
}