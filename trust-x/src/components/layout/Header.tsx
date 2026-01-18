"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data?.data?.user) {
          setUser(data.data.user);
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="w-full bg-gradient-brand dark:bg-gradient-to-r dark:from-gray-800 dark:via-purple-900 dark:to-gray-800 text-white px-4 md:px-6 py-3 flex justify-between items-center shadow-lg animate-gradient relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 animate-shimmer pointer-events-none" />
      <Link href="/" className="font-bold text-base md:text-lg lg:text-xl animate-slide-in relative z-10 hover:scale-105 transition-transform duration-300 cursor-pointer">
        ✨ TrustX
      </Link>
      <nav className="flex gap-2 md:gap-4 items-center relative z-10">
        <Link href="/" className="text-sm md:text-base hover:underline hover:text-accent-cyan transition-all duration-300 hover:scale-110">
          Home
        </Link>
        
        {isLoading ? (
          <div className="text-sm text-white/70 animate-pulse">Loading...</div>
        ) : isAuthenticated && user ? (
          <>
            {user.role === 'ADMIN' ? (
              <>
                <Link href="/dashboard/admin" className="text-sm md:text-base hover:underline hover:text-accent-pink transition-all duration-300 hover:scale-110">
                  Admin Dashboard
                </Link>
                <Link href="/businesses" className="hidden sm:block text-sm md:text-base hover:underline hover:text-accent-purple transition-all duration-300 hover:scale-110">
                  Businesses
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="text-sm md:text-base hover:underline hover:text-accent-pink transition-all duration-300 hover:scale-110">
                  Dashboard
                </Link>
                <Link href="/businesses" className="hidden sm:block text-sm md:text-base hover:underline hover:text-accent-purple transition-all duration-300 hover:scale-110">
                  Businesses
                </Link>
              </>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-accent-cyan hidden md:inline">
                {user.name || 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs md:text-sm px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all duration-300 hover:scale-105 border border-red-400/30"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm md:text-base hover:underline hover:text-accent-pink transition-all duration-300 hover:scale-110">
              Login
            </Link>
            <Link href="/signup" className="text-sm md:text-base px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-300 hover:scale-105">
              Sign Up
            </Link>
          </>
        )}
        
        <ThemeToggle />
      </nav>
    </header>
  );
}
