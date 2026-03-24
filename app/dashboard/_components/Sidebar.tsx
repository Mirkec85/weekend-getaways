"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Gauge,
  PlaneTakeoff,
  Bell,
  Settings,
  User,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: Gauge },
  { label: "Deals", href: "/dashboard/deals", icon: PlaneTakeoff },
  { label: "Alerts", href: "#", icon: Bell },
  { label: "Settings", href: "#", icon: Settings },
  { label: "Account", href: "#", icon: User },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
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
        <nav className="flex flex-col gap-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href !== "#" && pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-4 rounded-md px-4 py-3 text-base font-medium transition-colors ${
                  isActive
                    ? "bg-sky-100 text-sky-600"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

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
