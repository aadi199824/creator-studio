"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Send,
  Calendar,
  Building2,
  Image,
  BarChart3,
  Settings,
  Plus,
  Crown,
} from "lucide-react";

interface InstagramAccount {
  id: string;
  account_name?: string;
  username?: string;
  account_id: string;
  profile_picture?: string | null;
  platform?: string;
}

const menu = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "AI Generator",
    href: "/dashboard/generator",
    icon: Sparkles,
  },
  {
    name: "Content Library",
    href: "/dashboard/content",
    icon: FileText,
  },
  {
    name: "Publishing",
    href: "/dashboard/publishing",
    icon: Send,
  },
  {
    name: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    name: "Brands",
    href: "/dashboard/brands",
    icon: Building2,
  },
  {
    name: "Media Library",
    href: "/dashboard/media",
    icon: Image,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const response = await fetch(
          "/api/instagram/accounts",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load Instagram accounts"
          );
        }

        const data = await response.json();

        const instagramAccounts =
          (data.accounts ?? []).filter(
            (account: InstagramAccount) =>
              account.platform === "instagram" ||
              !account.platform
          );

        setAccounts(instagramAccounts);
      } catch (error) {
        console.error(
          "Sidebar Instagram accounts error:",
          error
        );

        setAccounts([]);
      } finally {
        setLoadingAccounts(false);
      }
    }

    loadAccounts();
  }, []);

  function getUsername(account: InstagramAccount) {
    return (
      account.account_name ||
      account.username ||
      "Instagram"
    );
  }

  function isAccountSelected(account: InstagramAccount) {
    if (!pathname.startsWith("/dashboard/publishing")) {
      return false;
    }

    const currentUrl =
      typeof window !== "undefined"
        ? new URL(window.location.href)
        : null;

    return (
      currentUrl?.searchParams.get("account") ===
      account.id
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-[#10001f] px-4 py-5 text-white">
      {/* =========================
          LOGO
      ========================== */}
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b00ff] via-[#c000ff] to-[#ff1493] shadow-lg shadow-purple-500/30">
          <Sparkles className="h-5 w-5 text-white" />
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-[17px] font-bold tracking-tight">
            Creator Studio AI
          </h1>

          <span className="rounded-md bg-gradient-to-r from-[#a000ff] to-[#ff1493] px-2 py-0.5 text-[9px] font-bold">
            PRO
          </span>
        </div>
      </div>

      {/* =========================
          MAIN NAV
      ========================== */}
      <nav className="space-y-1">
        {menu.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-gradient-to-r from-[#8b00ff] to-[#c000ff] text-white shadow-lg shadow-purple-700/30"
                  : "text-[#c5a9d7] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon
                className={`h-[19px] w-[19px] ${
                  active
                    ? "text-white"
                    : "text-[#c49bd9] group-hover:text-white"
                }`}
              />

              <span>{item.name}</span>

              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* =========================
          INSTAGRAM ACCOUNTS
      ========================== */}
      <div className="mt-7 flex min-h-0 flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between px-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9c79ae]">
            Your Instagram
          </span>

          <Link
            href="/dashboard/instagram"
            className="text-[#c000ff] transition hover:text-[#e000ff]"
            title="Manage Instagram accounts"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-1 overflow-y-auto pr-1">
          {loadingAccounts ? (
            <div className="space-y-2 px-2">
              <div className="h-12 animate-pulse rounded-xl bg-white/5" />
              <div className="h-12 animate-pulse rounded-xl bg-white/5" />
            </div>
          ) : accounts.length === 0 ? (
            <Link
              href="/dashboard/instagram"
              className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 px-3 py-3 text-xs text-[#a98bb7] hover:border-purple-500/50 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Connect Instagram
            </Link>
          ) : (
            accounts.map((account) => {
              const username = getUsername(account);
              const selected =
                isAccountSelected(account);

              return (
                <Link
                  key={account.id}
                  href={`/dashboard/publishing?account=${encodeURIComponent(
                    account.id
                  )}`}
                  className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-all ${
                    selected
                      ? "bg-[#8b00ff]/20 ring-1 ring-[#a000ff]/60"
                      : "hover:bg-white/5"
                  }`}
                >
                  {/* Profile picture */}
                  {account.profile_picture ? (
                    <img
                      src={account.profile_picture}
                      alt={`@${username}`}
                      className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-bold">
                      {username
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">
                      @{username}
                    </p>

                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-emerald-400">
                        Connected
                      </span>
                    </div>
                  </div>

                  <span className="text-[#73577f] transition group-hover:text-white">
                    ›
                  </span>
                </Link>
              );
            })
          )}
        </div>

        {/* Add account */}
        <Link
          href="/dashboard/instagram"
          className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-[#c9acd5] transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Add Instagram Account
        </Link>
      </div>

      {/* =========================
          PRO STORAGE / UPGRADE
      ========================== */}
      <div className="mt-4 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/40 to-pink-900/20 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-white">
            Storage Usage
          </span>

          <span className="flex items-center gap-1 text-[9px] font-bold text-purple-300">
            <Crown className="h-3 w-3" />
            PRO
          </span>
        </div>

        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[24%] rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
        </div>

        <div className="flex justify-between text-[9px] text-[#9c7eaa]">
          <span>2.4 GB used</span>
          <span>10 GB</span>
        </div>
      </div>
    </aside>
  );
}