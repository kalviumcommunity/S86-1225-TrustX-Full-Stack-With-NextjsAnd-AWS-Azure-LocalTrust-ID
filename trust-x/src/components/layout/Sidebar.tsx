"use client";
import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Overview", emoji: "📊" },
  { href: "/users", label: "Users", emoji: "👥" },
  { href: "/settings", label: "Settings", emoji: "⚙️" },
];

export default function Sidebar() {
  return (
    <aside className="w-48 lg:w-64 h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-r-2 border-accent-purple/30 dark:border-accent-cyan/30 p-4 hidden md:block animate-slide-in shadow-xl">
      <h2 className="text-base lg:text-lg font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-pink dark:from-accent-cyan dark:to-accent-purple animate-gradient">
        Navigation
      </h2>
      <ul className="space-y-2">
        {links.map((link, index) => (
          <li key={link.href} className="animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <Link
              href={link.href}
              className="flex items-center gap-2 text-sm lg:text-base text-gray-700 dark:text-gray-300 hover:text-accent-purple dark:hover:text-accent-cyan transition-all duration-300 hover:translate-x-2 hover:scale-105 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 group"
            >
              <span className="group-hover:animate-float">{link.emoji}</span>
              <span className="relative">
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent-purple to-accent-pink dark:from-accent-cyan dark:to-accent-purple group-hover:w-full transition-all duration-300" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
