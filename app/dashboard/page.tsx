"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  Settings,
  User,
  Plane,
  Bookmark,
  CheckCircle2,
  Clock,
  Heart,
  Bell,
  Menu,
  X,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// ─── Countdown to next Thursday 07:42 CET ────────────────────────────────────

function getNextThursdayDrop(): number {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun … 4=Thu … 6=Sat
  const daysUntilThursday = ((4 - dayOfWeek + 7) % 7) || 7;

  const target = new Date(now);
  target.setUTCDate(now.getUTCDate() + daysUntilThursday);
  target.setUTCHours(6, 42, 0, 0); // 07:42 CET = 06:42 UTC

  if (target.getTime() <= now.getTime()) {
    target.setUTCDate(target.getUTCDate() + 7);
  }

  return target.getTime();
}

// Computed once at module level — stable across renders
const NEXT_DROP_TS = getNextThursdayDrop();

function useCountdown(targetTs: number) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    function tick() {
      const diff = targetTs - Date.now();
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTs]);

  return timeLeft;
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, active: true },
  { label: "Deals", href: "/dashboard/deals", icon: Ticket, active: false },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, active: false },
  { label: "Account", href: "/dashboard/account", icon: User, active: false },
];

// ─── Deal data ─────────────────────────────────────────────────────────────────

const DEALS = [
  {
    city: "Rome",
    country: "Italy",
    price: 89,
    gradient: "from-[#F97316] via-[#EA580C] to-[#B91C1C]",
    accent: "#F97316",
    emoji: "🏛️",
  },
  {
    city: "Vienna",
    country: "Austria",
    price: 112,
    gradient: "from-[#6366F1] via-[#4F46E5] to-[#1E40AF]",
    accent: "#6366F1",
    emoji: "🎻",
  },
  {
    city: "Amsterdam",
    country: "Netherlands",
    price: 118,
    gradient: "from-[#0891B2] via-[#0E7490] to-[#065F46]",
    accent: "#0891B2",
    emoji: "🚲",
  },
];

const DATES = "Fri 28 Mar → Sun 30 Mar";

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ onClose }: { onClose?: () => void }) {
  const countdown = useCountdown(NEXT_DROP_TS);
  const { signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const pad = (n: number) => String(n).padStart(2, "0");

  async function handleLogout() {
    setSigningOut(true);
    try {
      await signOut();
      router.push("/");
    } catch (err) {
      console.error("Sign out failed:", err);
      setSigningOut(false);
    }
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-gray-100">
        <Image
          src="/logo.svg"
          alt="Flajko"
          width={88}
          height={26}
          priority
        />
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              item.active
                ? "bg-[#EEF4FF] text-[#3174E0]"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            }`}
          >
            <item.icon
              className={`h-4 w-4 flex-shrink-0 ${
                item.active ? "text-[#3174E0]" : "text-gray-400"
              }`}
            />
            {item.label}
            {item.active && (
              <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#3174E0] opacity-60" />
            )}
          </Link>
        ))}
      </nav>

      {/* Next drop */}
      <div className="mx-3 mb-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Next deal drop
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[22px] font-bold tabular-nums text-gray-900 leading-none">
            {pad(countdown.d)}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">d</span>
          <span className="text-[22px] font-bold tabular-nums text-gray-900 leading-none">
            {pad(countdown.h)}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">h</span>
          <span className="text-[22px] font-bold tabular-nums text-gray-900 leading-none">
            {pad(countdown.m)}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">m</span>
        </div>
        <p className="mt-1.5 text-[11px] text-gray-400">Thu 07:42 CET</p>
      </div>

      {/* Log out */}
      <div className="border-t border-gray-100 px-3 py-3">
        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {signingOut ? "Signing out…" : "Log out"}
        </button>
      </div>
    </aside>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent ?? "#3174E0"}18` }}
        >
          <Icon
            className="h-3.5 w-3.5"
            style={{ color: accent ?? "#3174E0" }}
          />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900 leading-none">
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 text-xs text-gray-400">{sub}</p>
      )}
    </div>
  );
}

// ─── Deal card ────────────────────────────────────────────────────────────────

function DealCard({
  city,
  country,
  price,
  gradient,
  emoji,
}: {
  city: string;
  country: string;
  price: number;
  gradient: string;
  emoji: string;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="group rounded-xl border border-gray-100 bg-white overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_16px_0_rgba(0,0,0,0.07)]">
      {/* Banner */}
      <div className={`relative h-36 bg-gradient-to-br ${gradient}`}>
        {/* Noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Emoji */}
        <span className="absolute bottom-3 left-4 text-2xl select-none">
          {emoji}
        </span>
        {/* Heart */}
        <button
          onClick={() => setSaved((s) => !s)}
          aria-label={saved ? "Unsave deal" : "Save deal"}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-transform hover:scale-110 active:scale-95"
        >
          <Heart
            className={`h-4 w-4 transition-all ${
              saved ? "fill-rose-400 stroke-rose-400" : "stroke-white"
            }`}
          />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-gray-900 leading-tight">{city}</p>
            <p className="text-xs text-gray-400 mt-0.5">{country}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-gray-400 leading-none">from</p>
            <p className="text-xl font-bold text-gray-900 leading-tight">
              €{price}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
          <Plane className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <span>{DATES}</span>
        </div>

        <div className="mt-3.5">
          <a
            href="#"
            className="flex h-8 w-full items-center justify-center rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3174E0] focus-visible:ring-offset-1"
          >
            View deal
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const countdown = useCountdown(NEXT_DROP_TS);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Desktop sidebar ── */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative flex h-full w-64 flex-col shadow-xl">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
        {/* Mobile top bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 lg:hidden">
          <Image src="/logo.svg" alt="Flajko" width={72} height={22} />
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 px-6 py-8 md:px-8 max-w-[1100px] w-full mx-auto">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
              Overview
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Your weekly flight deals at a glance.
            </p>
          </div>

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-8">
            <StatCard
              icon={Ticket}
              label="This week"
              value="3 deals"
              sub="Available now"
              accent="#3174E0"
            />
            <StatCard
              icon={Bookmark}
              label="Saved"
              value="0 deals"
              sub="Start saving"
              accent="#8B5CF6"
            />
            <StatCard
              icon={CheckCircle2}
              label="Booked"
              value="0 trips"
              sub="Book your first"
              accent="#10B981"
            />
            <StatCard
              icon={Clock}
              label="Next drop"
              value={`${pad(countdown.d)}d ${pad(countdown.h)}h`}
              sub="Thu 07:42 CET"
              accent="#F59E0B"
            />
          </div>

          {/* ── This week's deals ── */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                This week&apos;s deals
              </h2>
              <a
                href="#"
                className="text-xs font-semibold text-[#3174E0] hover:text-[#2563C4] transition-colors"
              >
                View all
              </a>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DEALS.map((deal) => (
                <DealCard key={deal.city} {...deal} />
              ))}
            </div>
          </div>

          {/* ── CTA banner ── */}
          <div className="rounded-xl border border-gray-100 bg-white px-6 py-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EEF4FF]">
                  <Bell className="h-4 w-4 text-[#3174E0]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Add cities to your bucket list
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">
                    We&apos;ll alert you when a deal lands for a destination
                    you care about.
                  </p>
                </div>
              </div>
              <a
                href="#"
                className="inline-flex h-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3174E0] focus-visible:ring-offset-1 sm:w-auto w-full"
              >
                Set up alerts
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
