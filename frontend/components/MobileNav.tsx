"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { House, Home, Clock, TrendingUp, Bookmark, Search, LogIn, Menu, Settings, LogOut } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/", icon: House, label: "Home" },
  { href: "/for-you", icon: Home, label: "For You", authRequired: true },
  { href: "/latest", icon: Clock, label: "Latest" },
  { href: "/trending", icon: TrendingUp, label: "Trending" },
  { href: "/saved", icon: Bookmark, label: "Saved", authRequired: true },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/login", icon: LogIn, label: "Sign in", guestOnly: true },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthed, email, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push("/login");
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-[#F4F4F4]/95 backdrop-blur px-2 py-2 flex items-center justify-between">
      <div className="flex items-center gap-1 flex-1">
        {items.map(({ href, icon: Icon, label, authRequired, guestOnly }) => {
          if (authRequired && !isAuthed) return null;
          if (guestOnly && isAuthed) return null;
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex-1 min-h-[60px] flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg text-xs transition-colors",
                active ? "bg-black text-white" : "text-black/55 hover:text-black"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>

      {isAuthed && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={clsx(
              "flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors min-h-[60px]",
              menuOpen ? "bg-black text-white" : "text-black/55 hover:text-black"
            )}
          >
            <Menu className="w-5 h-5" />
            <span>More</span>
          </button>

          {menuOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-black/15 rounded-2xl shadow-lg z-50">
              <div className="p-3 space-y-2">
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-black/65 hover:text-black hover:bg-black/5 transition-all duration-150"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <div className="px-3 py-2 text-xs text-black/45 truncate border-t border-black/10 pt-2">{email}</div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-black/65 hover:text-red-600 hover:bg-red-500/10 transition-all duration-150"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
