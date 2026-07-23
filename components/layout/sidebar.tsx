import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Sparkles,
  Image,
  Calendar,
  BarChart3,
  Settings,
} from "lucide-react";

const menu = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Brands", href: "/dashboard/brands", icon: Building2 },
  { name: "Content", href: "/dashboard/content", icon: FileText },
  { name: "AI Generator", href: "/dashboard/generator", icon: Sparkles },
  { name: "Media", href: "/dashboard/media", icon: Image },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-white min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-8">Creator Studio AI</h1>

      <nav className="space-y-2">
        {menu.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100 transition"
          >
            <item.icon size={20} />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}