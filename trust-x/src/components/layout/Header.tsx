"use client";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Header() {
  return (
    <header className="w-full bg-gradient-brand dark:bg-gradient-to-r dark:from-gray-800 dark:via-purple-900 dark:to-gray-800 text-white px-4 md:px-6 py-3 flex justify-between items-center shadow-lg animate-gradient relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 animate-shimmer pointer-events-none" />
      <h1 className="font-bold text-base md:text-lg lg:text-xl animate-slide-in relative z-10 hover:scale-105 transition-transform duration-300 cursor-pointer">
        ✨ TrustX
      </h1>
      <nav className="flex gap-2 md:gap-4 items-center relative z-10">
        <Link href="/" className="text-sm md:text-base hover:underline hover:text-accent-cyan transition-all duration-300 hover:scale-110">
          Home
        </Link>
        <Link href="/dashboard" className="text-sm md:text-base hover:underline hover:text-accent-pink transition-all duration-300 hover:scale-110">
          Dashboard
        </Link>
        <Link href="/users" className="hidden sm:block text-sm md:text-base hover:underline hover:text-accent-purple transition-all duration-300 hover:scale-110">
          Users
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
