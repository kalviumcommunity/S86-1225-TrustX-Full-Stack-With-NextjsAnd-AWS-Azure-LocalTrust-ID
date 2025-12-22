import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrustX",
  description: "TrustX application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="bg-gray-50 border-b">
          <nav className="container mx-auto flex items-center justify-between py-3 px-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="font-bold text-lg">
                TrustX
              </Link>
              <Link href="/login" className="text-sm text-gray-700">
                Login
              </Link>
              <Link href="/dashboard" className="text-sm text-gray-700">
                Dashboard
              </Link>
              <Link href="/users" className="text-sm text-gray-700">
                Users
              </Link>
            </div>
            <div className="text-sm text-gray-500">v0.1</div>
          </nav>
        </header>
        <main className="container mx-auto px-4 py-6">{children}</main>
        <footer className="border-t mt-8 py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} TrustX
        </footer>
      </body>
    </html>
  );
}

