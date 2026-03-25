"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  PlaneTakeoff,
  Plane,
  Bookmark,
  Clock,
  Bell,
  Building2,
  ArrowRight,
} from "lucide-react";

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

// ─── Deal data ─────────────────────────────────────────────────────────────────

const DEALS = [
  {
    city: "Paris",
    price: 89,
    image: "https://loremflickr.com/680/452/paris,eiffel,tower?lock=1",
    dates: "Fri, 21 Mar → Sun, 23 Mar",
    hotel: "Est. €110/night",
    observed: "Thu 19 Mar 07:42 CET",
  },
  {
    city: "Prague",
    price: 112,
    image: "https://loremflickr.com/680/452/prague,castle,charles?lock=1",
    dates: "Fri, 21 Mar → Sun, 23 Mar",
    hotel: "Est. €110/night",
    observed: "Thu 19 Mar 07:42 CET",
  },
  {
    city: "Milano",
    price: 118,
    image: "https://loremflickr.com/680/452/milan,duomo,cathedral?lock=1",
    dates: "Fri, 21 Mar → Sun, 23 Mar",
    hotel: "Est. €110/night",
    observed: "Thu 19 Mar 07:42 CET",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const countdown = useCountdown(NEXT_DROP_TS);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
      <main className="flex-1 px-6 py-6 md:px-10 flex flex-col gap-5">

        {/* ── Page header ── */}
        <div className="flex flex-col gap-1 pt-0">
          <h1 className="text-2xl font-bold text-gray-800 leading-9">
            Overview
          </h1>
          <p className="text-sm text-gray-400 leading-5">
            Your weekly flight deals at glance.
          </p>
        </div>

        {/* ── Next Deal Drop banner ── */}
        <div className="bg-white border border-sky-600 rounded-xl p-6 flex items-start gap-6">
          {/* Airplane illustration */}
          <div className="flex-shrink-0 h-[60px] w-[76px] relative mt-0.5">
            <Image src="/airplane.svg" alt="" fill className="object-contain" />
          </div>

          {/* Right: stacks vertically on mobile, side-by-side on md+ */}
          <div className="flex flex-1 flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-4 min-w-0">
            {/* Title + subtitle */}
            <div className="flex flex-col gap-1">
              <p className="text-lg font-bold text-gray-800 leading-7">
                Next Deal Drop
              </p>
              <p className="text-sm text-gray-400 leading-5">
                Don&apos;t miss this opportunity.
              </p>
            </div>

            {/* Countdown — right-aligned */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="flex items-baseline gap-1 tabular-nums">
                <span className="text-[30px] font-bold text-gray-800 leading-[40px]">{pad(countdown.d)}</span>
                <span className="text-sm font-bold text-gray-400 leading-5 mr-2">d</span>
                <span className="text-[30px] font-bold text-gray-800 leading-[40px]">{pad(countdown.h)}</span>
                <span className="text-sm font-bold text-gray-400 leading-5 mr-2">h</span>
                <span className="text-[30px] font-bold text-gray-800 leading-[40px]">{pad(countdown.m)}</span>
                <span className="text-sm font-bold text-gray-400 leading-5 mr-2">m</span>
                <span className="text-[30px] font-bold text-gray-800 leading-[40px]">{pad(countdown.s)}</span>
                <span className="text-sm font-bold text-gray-400 leading-5">s</span>
              </div>
              <p className="text-sm font-medium text-gray-400 leading-5">
                Thursday 07:42 CET
              </p>
            </div>
          </div>
        </div>

        {/* ── Stat cards — 1-col mobile, 3-col md+ ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* HOT THIS WEEK */}
          <div className="bg-white border border-gray-300 rounded-xl p-5 flex items-start justify-between">
            <div className="flex flex-col gap-6">
              <p className="text-base font-bold text-gray-400 leading-6 whitespace-nowrap">
                HOT THIS WEEK
              </p>
              <div>
                <p className="text-xl font-bold text-gray-800 leading-8">7 Deals</p>
                <p className="text-xs text-gray-400 leading-4">Available now</p>
              </div>
            </div>
            <div className="bg-orange-50 p-2 rounded-md flex-shrink-0">
              <PlaneTakeoff className="h-5 w-5 text-orange-400" />
            </div>
          </div>

          {/* SAVED */}
          <div className="bg-white border border-gray-300 rounded-xl p-5 flex items-start justify-between">
            <div className="flex flex-col gap-6">
              <p className="text-base font-bold text-gray-400 leading-6">SAVED</p>
              <div>
                <p className="text-xl font-bold text-gray-800 leading-8">0 Deals</p>
                <p className="text-xs text-gray-400 leading-4">Start saving deals</p>
              </div>
            </div>
            <div className="bg-green-50 p-2 rounded-md flex-shrink-0">
              <Bookmark className="h-5 w-5 text-green-500" />
            </div>
          </div>

          {/* BOOKED */}
          <div className="bg-white border border-gray-300 rounded-xl p-5 flex items-start justify-between">
            <div className="flex flex-col gap-6">
              <p className="text-base font-bold text-gray-400 leading-6">BOOKED</p>
              <div>
                <p className="text-xl font-bold text-gray-800 leading-8">0 Deals</p>
                <p className="text-xs text-gray-400 leading-4">Book your first deal</p>
              </div>
            </div>
            <div className="bg-red-50 p-2 rounded-md flex-shrink-0">
              <Clock className="h-5 w-5 text-red-400" />
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

          {/* Deal cards — 1-col mobile, 2-col md, 3-col lg */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DEALS.map((deal) => (
              <div
                key={deal.city}
                className="bg-white border border-gray-300 rounded-2xl p-px flex flex-col overflow-hidden"
              >
                {/* Hero image — 340:226 aspect ratio */}
                <div className="relative w-full overflow-hidden rounded-tl-lg rounded-tr-lg"
                  style={{ aspectRatio: "340/226" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={deal.image}
                    alt={deal.city}
                    className="absolute inset-0 w-full h-full object-cover"
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
        <div className="bg-white border border-gray-300 rounded-xl p-5 flex items-start gap-4">
          <div className="bg-sky-50 p-3 rounded-md flex-shrink-0">
            <Bell className="h-5 w-5 text-sky-500" />
          </div>
          <div className="flex flex-1 flex-col gap-6 min-w-0">
            <div className="flex flex-col gap-1">
              <p className="text-lg font-bold text-gray-800 leading-7">
                Add Cities to Your Bucket List
              </p>
              <p className="text-sm text-gray-400 leading-5">
                We will notify you when a deal lands for a destination you care about
              </p>
            </div>
            <button className="self-start bg-sky-600 text-white text-xs font-semibold px-5 py-2.5 rounded-md hover:bg-sky-700 transition-colors">
              Set Up Alert
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
