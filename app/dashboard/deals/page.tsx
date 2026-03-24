"use client";

import { useState, useMemo } from "react";
import {
  Plane,
  Building2,
  Clock,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

// ─── Deal data ─────────────────────────────────────────────────────────────────

const ALL_DEALS = [
  {
    city: "Budapest",
    iata: "BUD",
    price: 39,
    region: "Central Europe",
    month: "March",
    dates: "Fri, 28 Mar → Sun, 30 Mar",
    hotel: "Est. €75/night",
    observed: "Thu 27 Mar 07:42 CET",
    image: "https://loremflickr.com/360/240/budapest,parliament,danube?lock=1",
  },
  {
    city: "Vienna",
    iata: "VIE",
    price: 45,
    region: "Central Europe",
    month: "March",
    dates: "Fri, 28 Mar → Sun, 30 Mar",
    hotel: "Est. €95/night",
    observed: "Thu 27 Mar 07:42 CET",
    image: "https://loremflickr.com/360/240/vienna,schonbrunn,palace?lock=1",
  },
  {
    city: "Dubrovnik",
    iata: "DBV",
    price: 49,
    region: "Southern Europe",
    month: "March",
    dates: "Fri, 28 Mar → Sun, 30 Mar",
    hotel: "Est. €110/night",
    observed: "Thu 27 Mar 07:42 CET",
    image: "https://loremflickr.com/360/240/dubrovnik,croatia,walls?lock=1",
  },
  {
    city: "Prague",
    iata: "PRG",
    price: 55,
    region: "Central Europe",
    month: "April",
    dates: "Fri, 4 Apr → Sun, 6 Apr",
    hotel: "Est. €85/night",
    observed: "Thu 27 Mar 07:42 CET",
    image: "https://loremflickr.com/360/240/prague,castle,charles?lock=1",
  },
  {
    city: "Venice",
    iata: "VCE",
    price: 59,
    region: "Southern Europe",
    month: "March",
    dates: "Fri, 28 Mar → Sun, 30 Mar",
    hotel: "Est. €130/night",
    observed: "Thu 27 Mar 07:42 CET",
    image: "https://loremflickr.com/360/240/venice,canal,gondola?lock=1",
  },
  {
    city: "Rome",
    iata: "FCO",
    price: 69,
    region: "Southern Europe",
    month: "April",
    dates: "Fri, 4 Apr → Sun, 6 Apr",
    hotel: "Est. €120/night",
    observed: "Thu 27 Mar 07:42 CET",
    image: "https://loremflickr.com/360/240/rome,colosseum,italy?lock=1",
  },
  {
    city: "Amsterdam",
    iata: "AMS",
    price: 79,
    region: "Western Europe",
    month: "April",
    dates: "Fri, 4 Apr → Sun, 6 Apr",
    hotel: "Est. €140/night",
    observed: "Thu 27 Mar 07:42 CET",
    image: "https://loremflickr.com/360/240/amsterdam,canal,houses?lock=1",
  },
  {
    city: "Athens",
    iata: "ATH",
    price: 79,
    region: "Southern Europe",
    month: "April",
    dates: "Fri, 11 Apr → Sun, 13 Apr",
    hotel: "Est. €90/night",
    observed: "Thu 27 Mar 07:42 CET",
    image: "https://loremflickr.com/360/240/athens,acropolis,parthenon?lock=1",
  },
  {
    city: "Barcelona",
    iata: "BCN",
    price: 89,
    region: "Western Europe",
    month: "April",
    dates: "Fri, 11 Apr → Sun, 13 Apr",
    hotel: "Est. €115/night",
    observed: "Thu 27 Mar 07:42 CET",
    image: "https://loremflickr.com/360/240/barcelona,sagrada,familia?lock=1",
  },
  {
    city: "Copenhagen",
    iata: "CPH",
    price: 89,
    region: "Northern Europe",
    month: "April",
    dates: "Fri, 18 Apr → Sun, 20 Apr",
    hotel: "Est. €160/night",
    observed: "Thu 27 Mar 07:42 CET",
    image: "https://loremflickr.com/360/240/copenhagen,nyhavn,denmark?lock=1",
  },
  {
    city: "Paris",
    iata: "CDG",
    price: 99,
    region: "Western Europe",
    month: "April",
    dates: "Fri, 11 Apr → Sun, 13 Apr",
    hotel: "Est. €150/night",
    observed: "Thu 27 Mar 07:42 CET",
    image: "https://loremflickr.com/360/240/paris,eiffel,tower?lock=1",
  },
  {
    city: "Lisbon",
    iata: "LIS",
    price: 109,
    region: "Western Europe",
    month: "May",
    dates: "Fri, 2 May → Sun, 4 May",
    hotel: "Est. €95/night",
    observed: "Thu 27 Mar 07:42 CET",
    image: "https://loremflickr.com/360/240/lisbon,tram,alfama?lock=1",
  },
];

// ─── Filter types ─────────────────────────────────────────────────────────────

type PriceFilter = "any" | "under50" | "50to80" | "80to120";
type MonthFilter = "any" | "March" | "April" | "May";
type SortFilter = "price-asc" | "price-desc" | "alpha";

// ─── Select component ─────────────────────────────────────────────────────────

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="appearance-none bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DealsPage() {
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("any");
  const [monthFilter, setMonthFilter] = useState<MonthFilter>("any");
  const [sortFilter, setSortFilter] = useState<SortFilter>("price-asc");

  const filtered = useMemo(() => {
    let list = ALL_DEALS.filter((d) => {
      if (priceFilter === "under50" && d.price >= 50) return false;
      if (priceFilter === "50to80" && (d.price < 50 || d.price > 80))
        return false;
      if (priceFilter === "80to120" && (d.price < 80 || d.price > 120))
        return false;
      if (monthFilter !== "any" && d.month !== monthFilter) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortFilter === "price-asc") return a.price - b.price;
      if (sortFilter === "price-desc") return b.price - a.price;
      return a.city.localeCompare(b.city);
    });

    return list;
  }, [priceFilter, monthFilter, sortFilter]);

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
      {/* ── Page header + filters (sticky) ── */}
      <div className="px-6 pt-6 pb-4 md:px-10 bg-gray-50 flex-shrink-0">
        {/* Page title */}
        <div className="flex flex-col gap-1 mb-4">
          <h1 className="text-2xl font-bold text-gray-800 leading-9">Deals</h1>
          <p className="text-sm text-gray-400 leading-5">
            Don&apos;t miss those great opportunities.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect<PriceFilter>
            label="Price"
            value={priceFilter}
            onChange={setPriceFilter}
            options={[
              { value: "any", label: "Any price" },
              { value: "under50", label: "Under €50" },
              { value: "50to80", label: "€50 – €80" },
              { value: "80to120", label: "€80 – €120" },
            ]}
          />

          <FilterSelect<MonthFilter>
            label="Month"
            value={monthFilter}
            onChange={setMonthFilter}
            options={[
              { value: "any", label: "Any month" },
              { value: "March", label: "March" },
              { value: "April", label: "April" },
              { value: "May", label: "May" },
            ]}
          />

          <div className="ml-auto">
            <FilterSelect<SortFilter>
              label="Sort"
              value={sortFilter}
              onChange={setSortFilter}
              options={[
                { value: "price-asc", label: "Price: low to high" },
                { value: "price-desc", label: "Price: high to low" },
                { value: "alpha", label: "A – Z" },
              ]}
            />
          </div>

          <p className="text-sm text-gray-400 font-medium">
            {filtered.length} deal{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Scrollable deals list ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 md:px-10 md:py-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <p className="text-base font-semibold text-gray-400">
              No deals match your filters.
            </p>
            <button
              onClick={() => {
                setPriceFilter("any");
                setMonthFilter("any");
              }}
              className="text-sm font-medium text-sky-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((deal) => (
              <div
                key={deal.iata}
                className="bg-white border border-gray-300 rounded-2xl p-[9px] flex flex-row gap-5 hover:shadow-sm transition-shadow"
              >
                {/* Image — fixed square, capped at 130px */}
                <div className="flex-shrink-0 self-stretch w-[130px] overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={deal.image}
                    alt={deal.city}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-3 py-2 pr-2 min-w-0">
                  {/* Top row: city + price (left) | View → (right) */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-base font-bold text-gray-800 leading-6">
                        {deal.city}
                      </p>
                      <p className="text-lg font-bold text-sky-600 leading-7">
                        from €{deal.price}
                      </p>
                    </div>
                    <button className="flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors flex-shrink-0">
                      View
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Detail rows */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Plane className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-500 leading-4">
                        {deal.dates}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-500 leading-4">
                        {deal.hotel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-500 leading-4">
                        Observed: {deal.observed}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
