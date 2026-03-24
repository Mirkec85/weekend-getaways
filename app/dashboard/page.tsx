"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gauge,
  PlaneTakeoff,
  Settings,
  User,
  Plane,
  Bookmark,
  Clock,
  Bell,
  Menu,
  X,
  LogOut,
  Building2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// ─── Countdown to next Thursday 07:42 CET ────────────────────────────────────

function getNextThursdayDrop(): number {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysUntilThursday = ((4 - dayOfWeek + 7) % 7) || 7;

  const target = new Date(now);
  target.setUTCDate(now.getUTCDate() + daysUntilThursday);
  target.setUTCHours(6, 42, 0, 0); // 07:42 CET = 06:42 UTC

  if (target.getTime() <= now.getTime()) {
    target.setUTCDate(target.getUTCDate() + 7);
  }

  return target.getTime();
}

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
  { label: "Overview", href: "/dashboard", icon: Gauge, active: true },
  { label: "Deals", href: "#", icon: PlaneTakeoff, active: false },
  { label: "Alerts", href: "#", icon: Bell, active: false },
  { label: "Settings", href: "#", icon: Settings, active: false },
  { label: "Account", href: "#", icon: User, active: false },
];

// ─── Deal data ─────────────────────────────────────────────────────────────────

const DEALS = [
  {
    city: "Paris",
    price: 89,
    image: "https://loremflickr.com/360/240/paris,eiffel,tower?lock=1",
    dates: "Fri, 21 Mar → Sun, 23 Mar",
    hotel: "Est. €110/night",
    observed: "Thu 19 Mar 07:42 CET",
  },
  {
    city: "Prague",
    price: 112,
    image: "https://loremflickr.com/360/240/prague,castle,charles?lock=1",
    dates: "Fri, 21 Mar → Sun, 23 Mar",
    hotel: "Est. €110/night",
    observed: "Thu 19 Mar 07:42 CET",
  },
  {
    city: "Milano",
    price: 118,
    image: "https://loremflickr.com/360/240/milan,duomo,cathedral?lock=1",
    dates: "Fri, 21 Mar → Sun, 23 Mar",
    hotel: "Est. €110/night",
    observed: "Thu 19 Mar 07:42 CET",
  },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

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
    <aside className="flex h-full w-[272px] flex-col bg-white p-4 gap-6">
      {/* Logo */}
      <div className="w-full pb-6 border-b border-gray-200 flex items-center justify-between">
        <Image src="/logo.svg" alt="Flajko" width={100} height={30} priority />
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav + Log Out */}
      <div className="flex flex-1 flex-col justify-between min-h-0">
        {/* Nav */}
        <nav className="flex flex-col gap-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 rounded-md px-4 py-3 text-base font-medium transition-colors ${
                item.active
                  ? "bg-sky-100 text-sky-600"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Log Out */}
        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="flex items-center gap-4 rounded-md px-4 py-3 text-base font-medium text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed w-full"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {signingOut ? "Signing out…" : "Log Out"}
        </button>
      </div>
    </aside>
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
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex h-full flex-col shadow-xl">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
        {/* Mobile top bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <Image src="/logo.svg" alt="Flajko" width={88} height={26} />
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 px-6 py-6 md:px-10 flex flex-col gap-6">
          {/* Page header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-gray-800 leading-9">
              Overview
            </h1>
            <p className="text-sm text-gray-400 leading-5">
              Your weekly flight deals at glance.
            </p>
          </div>

          {/* ── Next Deal Drop banner ── */}
          <div className="bg-white border border-sky-600 rounded-xl p-6 flex items-center gap-6">
            {/* Airplane illustration */}
            <div className="flex-shrink-0 h-[60px] w-[76px] relative">
              <Image src="/airplane.svg" alt="" fill className="object-contain" />
            </div>

            <div className="flex flex-1 items-center justify-between min-w-0 gap-4">
              {/* Left: title + subtitle */}
              <div className="flex flex-col gap-1">
                <p className="text-lg font-bold text-gray-800 leading-7">
                  Next Deal Drop
                </p>
                <p className="text-sm text-gray-400 leading-5">
                  Don&apos;t miss this opportunity.
                </p>
              </div>

              {/* Right: countdown */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="flex items-baseline gap-1 tabular-nums">
                  <span className="text-[30px] font-bold text-gray-800 leading-[40px]">{pad(countdown.d)}</span>
                  <span className="text-[14px] font-bold text-gray-400 leading-5 mr-2">d</span>
                  <span className="text-[30px] font-bold text-gray-800 leading-[40px]">{pad(countdown.h)}</span>
                  <span className="text-[14px] font-bold text-gray-400 leading-5 mr-2">h</span>
                  <span className="text-[30px] font-bold text-gray-800 leading-[40px]">{pad(countdown.m)}</span>
                  <span className="text-[14px] font-bold text-gray-400 leading-5 mr-2">m</span>
                  <span className="text-[30px] font-bold text-gray-800 leading-[40px]">{pad(countdown.s)}</span>
                  <span className="text-[14px] font-bold text-gray-400 leading-5">s</span>
                </div>
                <p className="text-sm font-medium text-gray-400 leading-5">
                  Thursday 07:42 CET
                </p>
              </div>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="flex gap-5 flex-col sm:flex-row">
            {/* HOT THIS WEEK */}
            <div className="bg-white border border-gray-300 rounded-xl p-5 flex items-start justify-between flex-1">
              <div className="flex flex-col gap-6">
                <p className="text-base font-bold text-gray-400 leading-6 whitespace-nowrap">HOT THIS WEEK</p>
                <div>
                  <p className="text-xl font-bold text-gray-800 leading-8">7 Deals</p>
                  <p className="text-xs text-gray-400 leading-4">Available now</p>
                </div>
              </div>
              <div className="bg-orange-50 p-2 rounded-md flex-shrink-0">
                <PlaneTakeoff className="h-4 w-4 text-orange-400" />
              </div>
            </div>

            {/* SAVED */}
            <div className="bg-white border border-gray-300 rounded-xl p-5 flex items-start justify-between flex-1">
              <div className="flex flex-col gap-6">
                <p className="text-base font-bold text-gray-400 leading-6">SAVED</p>
                <div>
                  <p className="text-xl font-bold text-gray-800 leading-8">0 Deals</p>
                  <p className="text-xs text-gray-400 leading-4">Start saving deals</p>
                </div>
              </div>
              <div className="bg-green-50 p-2 rounded-md flex-shrink-0">
                <Bookmark className="h-4 w-4 text-green-500" />
              </div>
            </div>

            {/* BOOKED */}
            <div className="bg-white border border-gray-300 rounded-xl p-5 flex items-start justify-between flex-1">
              <div className="flex flex-col gap-6">
                <p className="text-base font-bold text-gray-400 leading-6">BOOKED</p>
                <div>
                  <p className="text-xl font-bold text-gray-800 leading-8">0 Deals</p>
                  <p className="text-xs text-gray-400 leading-4">Book your first deal</p>
                </div>
              </div>
              <div className="bg-red-50 p-2 rounded-md flex-shrink-0">
                <Clock className="h-4 w-4 text-red-400" />
              </div>
            </div>
          </div>

          {/* ── This week's deals ── */}
          <div className="flex flex-col gap-2">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 leading-7">
                This Week&apos;s Deals
              </h2>
              <button className="px-3 py-2 rounded-md text-sm font-semibold text-sky-600 hover:bg-sky-50 transition-colors">
                View All
              </button>
            </div>

            {/* Deal cards grid */}
            <div className="flex gap-5 flex-col md:flex-row">
              {DEALS.map((deal) => (
                <div
                  key={deal.city}
                  className="bg-white border border-gray-300 rounded-2xl p-px flex-1 flex flex-col overflow-hidden"
                >
                  {/* Image */}
                  <div className="w-full overflow-hidden rounded-t-lg" style={{ maxHeight: "230px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={deal.image}
                      alt={deal.city}
                      className="w-full object-cover"
                      style={{ maxHeight: "230px" }}
                    />
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col gap-2">
                    <div className="flex flex-col gap-3">
                      {/* City + Price */}
                      <div className="flex items-start justify-between">
                        <p className="text-base font-bold text-gray-800 leading-6">
                          {deal.city}
                        </p>
                        <p className="text-lg font-bold text-sky-600 leading-7">
                          from €{deal.price}
                        </p>
                      </div>

                      {/* Detail rows */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Plane className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          <span className="text-xs font-semibold text-gray-500 leading-4">
                            {deal.dates}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          <span className="text-xs font-semibold text-gray-500 leading-4">
                            {deal.hotel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          <span className="text-xs font-semibold text-gray-500 leading-4">
                            Observed: {deal.observed}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* View button */}
                    <div className="flex justify-end">
                      <button className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-sky-600 hover:bg-sky-50 transition-colors">
                        View
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bucket List CTA ── */}
          <div className="bg-white border border-gray-300 rounded-xl p-5 flex items-center gap-4">
            <div className="bg-sky-50 p-3 rounded-md flex-shrink-0">
              <Bell className="h-5 w-5 text-sky-500" />
            </div>
            <div className="flex flex-1 items-center justify-between min-w-0 gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-lg font-bold text-gray-800 leading-7">
                  Add Cities to Your Bucket List
                </p>
                <p className="text-sm text-gray-400 leading-5">
                  We will notify you when a deal lands for a destination you care about
                </p>
              </div>
              <button className="bg-sky-600 text-white text-xs font-semibold px-5 py-2.5 rounded-md hover:bg-sky-700 transition-colors flex-shrink-0">
                Set Up Alert
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
