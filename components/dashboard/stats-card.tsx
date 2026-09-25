import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  iconBg?: string;
  iconColor?: string;
  comingSoon?: boolean;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
  comingSoon,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{title}</p>
          <h2 className="mt-2 text-3xl font-bold">{value}</h2>

          {comingSoon ? (
            <p className="mt-1 text-xs font-medium text-amber-600">
              Coming soon
            </p>
          ) : trend ? (
            <p className="mt-1 text-xs font-medium text-emerald-600">
              {trend}
            </p>
          ) : null}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}
