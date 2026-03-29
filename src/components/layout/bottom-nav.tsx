"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "공고", icon: "📋" },
  { href: "/map", label: "지도", icon: "🗺️" },
  { href: "/favorites", label: "관심", icon: "⭐" },
  { href: "/login", label: "내정보", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();

  // 지도 페이지에서는 바텀 네비 숨김
  if (pathname === "/map") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-1.5 text-xs",
              pathname === item.href
                ? "text-blue-600 font-medium"
                : "text-gray-500"
            )}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
