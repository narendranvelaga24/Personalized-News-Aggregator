"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Home, Clock, TrendingUp, Bookmark, Search } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/for-you", icon: Home, label: "For You", authRequired: true },
  { href: "/latest", icon: Clock, label: "Latest" },
  { href: "/trending", icon: TrendingUp, label: "Trending" },
  { href: "/saved", icon: Bookmark, label: "Saved", authRequired: true },
  { href: "/search", icon: Search, label: "Search" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { isAuthed } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-[#F4F4F4]/95 backdrop-blur px-2 py-2 flex items-center justify-around">
      {items.map(({ href, icon: Icon, label, authRequired }) => {
        if (authRequired && !isAuthed) return null;
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors",
              active ? "bg-black text-white" : "text-black/55 hover:text-black"
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
