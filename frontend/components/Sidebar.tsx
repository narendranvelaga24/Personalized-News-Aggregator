"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  House,
  Home,
  Clock,
  TrendingUp,
  Bookmark,
  Search,
  Settings,
  Zap,
  LogOut,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/", icon: House, label: "Home" },
  { href: "/for-you", icon: Home, label: "For You", authRequired: true },
  { href: "/latest", icon: Clock, label: "Latest" },
  { href: "/trending", icon: TrendingUp, label: "Trending" },
  { href: "/saved", icon: Bookmark, label: "Saved", authRequired: true },
  { href: "/search", icon: Search, label: "Search" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthed, email, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 border-r border-black/10 bg-[#F4F4F4]/95 backdrop-blur z-40 px-3 py-6">
      {/* Brand */}
      <div className="flex items-center gap-2 px-3 mb-8">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="font-display text-lg text-black">NewsFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, icon: Icon, label, authRequired }) => {
          if (authRequired && !isAuthed) return null;
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-black text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
                  : "text-black/65 hover:text-black hover:bg-black/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-black/10 pt-4 mt-4 space-y-1">
        {isAuthed ? (
          <>
            <Link
              href="/settings"
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                pathname === "/settings"
                  ? "bg-black text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
                  : "text-black/65 hover:text-black hover:bg-black/5"
              )}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <div className="px-3 py-2 text-xs text-black/45 truncate">{email}</div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-black/65 hover:text-red-600 hover:bg-red-500/10 transition-all duration-150"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="btn-primary block text-center text-sm"
          >
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}
