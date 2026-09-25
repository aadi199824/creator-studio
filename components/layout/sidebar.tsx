"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Send,
  CalendarDays,
  Building2,
  Image as ImageIcon,
  BarChart3,
  Settings,
  Plus,
  ChevronRight,
  Menu,
  X,
  CheckCircle2,
  LayoutTemplate,
  Users,
} from "lucide-react";

import { BrandService } from "@/lib/services/brand.service";
import { Brand } from "@/lib/types/brand";
import { InstagramAvatar } from "@/components/instagram/instagram-avatar";

interface InstagramAccount {
  id: string;
  username: string;
  account_id?: string;
  profile_picture?: string | null;
  is_active?: boolean;
}

const menu = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI Generator", href: "/dashboard/generator", icon: Sparkles },
  { name: "Content Library", href: "/dashboard/content", icon: FileText },
  { name: "Publishing", href: "/dashboard/publishing", icon: Send },
  { name: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { name: "Brands", href: "/dashboard/brands", icon: Building2 },
  { name: "Media Library", href: "/dashboard/media", icon: ImageIcon },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Templates", href: "/dashboard/templates", icon: LayoutTemplate },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

/** Key used to remember which brand the user last had selected in this browser. */
const ACTIVE_BRAND_KEY = "creator-studio:active-brand";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrandId, setActiveBrandId] = useState<string>("");

  useEffect(() => {
    loadInstagramAccounts();
    loadBrands();
  }, []);

  async function loadInstagramAccounts() {
    try {
      setLoadingAccounts(true);

      const response = await fetch("/api/instagram/accounts", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load Instagram accounts.");
      }

      const data = await response.json();
      setAccounts(data.accounts ?? []);
    } catch (error) {
      console.error("Sidebar Instagram accounts error:", error);
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function loadBrands() {
    const { data } = await BrandService.getAll();
    const list = data ?? [];
    setBrands(list);

    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(ACTIVE_BRAND_KEY)
        : null;

    const validStored = list.find((b) => b.id === stored);
    setActiveBrandId(validStored?.id ?? list[0]?.id ?? "");
  }

  function selectBrand(id: string) {
    setActiveBrandId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_BRAND_KEY, id);
    }
  }

  function openInstagramProfile(event: React.MouseEvent, username: string) {
    event.stopPropagation();
    window.open(
      `https://www.instagram.com/${username}/`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function selectInstagramAccount(accountId: string) {
    setMobileOpen(false);
    router.push(
      `/dashboard/publishing?account=${encodeURIComponent(accountId)}`
    );
  }

  function connectInstagram() {
    setMobileOpen(false);
    router.push("/dashboard/instagram");
  }

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        className="fixed left-3 top-3 z-[60] flex h-11 w-11 items-center justify-center rounded-xl bg-[#19001f] text-white shadow-lg shadow-purple-900/30 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] shrink-0 flex-col overflow-hidden bg-[#17001f] text-white shadow-2xl transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 md:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* LOGO */}
          <div className="flex items-center justify-between px-5 pb-6 pt-5">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex min-w-0 items-center gap-3"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-600 to-pink-500 shadow-lg shadow-fuchsia-600/30">
                <Sparkles className="h-6 w-6 text-white" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[17px] font-bold leading-tight">
                    Creator Studio
                  </span>
                  <span className="rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white">
                    PRO
                  </span>
                </div>
                <span className="text-[17px] font-bold leading-tight">AI</span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="rounded-lg p-2 text-purple-200 transition hover:bg-white/10 md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* BRAND SWITCHER */}
          <div className="px-4 pb-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-purple-300">
                Your Brands
              </h2>
              <Link
                href="/dashboard/brands/new"
                aria-label="Add brand"
                className="flex h-6 w-6 items-center justify-center rounded-full text-fuchsia-400 transition hover:bg-fuchsia-500/10 hover:text-fuchsia-300"
              >
                <Plus className="h-4 w-4" />
              </Link>
            </div>

            {brands.length === 0 ? (
              <Link
                href="/dashboard/brands/new"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-purple-500/30 bg-white/[0.03] px-3 py-2.5 text-xs text-purple-200 transition hover:border-fuchsia-500/50 hover:bg-fuchsia-500/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Add your first brand
              </Link>
            ) : (
              <div className="space-y-1">
                {brands.slice(0, 5).map((brand) => (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => selectBrand(brand.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                      activeBrandId === brand.id
                        ? "bg-fuchsia-600/20 text-white"
                        : "text-purple-200 hover:bg-white/5"
                    }`}
                  >
                    <span className="text-base leading-none">
                      {brand.icon || "✨"}
                    </span>
                    <span className="truncate">{brand.name}</span>
                    {activeBrandId === brand.id && (
                      <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
                    )}
                  </button>
                ))}

                {brands.length > 5 && (
                  <Link
                    href="/dashboard/brands"
                    className="block px-2.5 py-1 text-xs text-purple-300 hover:text-white"
                  >
                    View all {brands.length} brands →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* MAIN NAVIGATION */}
          <nav className="space-y-1 px-3">
            {menu.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex min-h-[44px] items-center gap-4 rounded-xl px-4 transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-fuchsia-600 via-purple-600 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-900/30"
                      : "text-purple-200 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      isActive ? "text-white" : "text-fuchsia-300"
                    }`}
                  />
                  <span className="text-[15px] font-medium">{item.name}</span>
                  {isActive && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-white" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* INSTAGRAM ACCOUNTS */}
          <div className="mt-7 px-4 pb-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-purple-300">
                Your Instagram
              </h2>

              <button
                type="button"
                onClick={connectInstagram}
                aria-label="Add Instagram account"
                className="flex h-7 w-7 items-center justify-center rounded-full text-fuchsia-400 transition hover:bg-fuchsia-500/10 hover:text-fuchsia-300"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {loadingAccounts && (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl px-2 py-2">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
                      <div className="h-2 w-16 animate-pulse rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingAccounts && accounts.length === 0 && (
              <button
                type="button"
                onClick={connectInstagram}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-white/[0.03] px-3 py-3 text-sm text-purple-200 transition hover:border-fuchsia-500/50 hover:bg-fuchsia-500/10"
              >
                <span className="text-xs font-bold text-fuchsia-400">IG</span>
                Add Instagram Account
              </button>
            )}

            {!loadingAccounts && accounts.length > 0 && (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="group flex items-center gap-2 rounded-xl px-1 py-2 transition hover:bg-white/[0.05]"
                  >
                    <button
                      type="button"
                      onClick={(event) =>
                        openInstagramProfile(event, account.username)
                      }
                      aria-label={`Open @${account.username} Instagram profile`}
                      className="relative shrink-0 rounded-full ring-2 ring-transparent transition hover:ring-fuchsia-500"
                    >
                      <InstagramAvatar
                        src={account.profile_picture}
                        username={account.username}
                        className="h-11 w-11"
                      />

                      <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#17001f]">
                        <span className="text-[8px] font-bold text-fuchsia-400">
                          IG
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectInstagramAccount(account.id)}
                      className="min-w-0 flex-1 text-left outline-none"
                    >
                      <div className="flex items-center gap-1">
                        <span className="block truncate text-sm font-semibold text-purple-100">
                          @{account.username}
                        </span>
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      </div>

                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>
                          {account.is_active === false ? "Expired" : "Connected"}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectInstagramAccount(account.id)}
                      aria-label={`Select @${account.username} for publishing`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-purple-400 opacity-60 transition hover:bg-fuchsia-500/10 hover:text-fuchsia-300 hover:opacity-100"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!loadingAccounts && accounts.length > 0 && (
              <button
                type="button"
                onClick={connectInstagram}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500/20 bg-white/[0.03] px-3 py-2.5 text-sm font-medium text-purple-300 transition hover:border-fuchsia-500/40 hover:bg-fuchsia-500/10 hover:text-fuchsia-200"
              >
                <Plus className="h-4 w-4" />
                Add Instagram Account
              </button>
            )}
          </div>
        </div>

        {/* STORAGE CARD */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          <div className="rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-900/30 via-purple-900/20 to-purple-950/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-purple-100">
                Storage Usage
              </span>
              <span className="rounded-full bg-fuchsia-500/20 px-2 py-1 text-[10px] font-bold text-fuchsia-300">
                PRO
              </span>
            </div>
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-purple-950">
              <div className="h-full w-[24%] rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-purple-300">
              <span>2.4 GB used</span>
              <span>10 GB</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
