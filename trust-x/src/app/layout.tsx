import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { LayoutWrapper } from "@/components";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <UIProvider>
            <LayoutWrapper>
              {children}
              <footer className="border-t mt-8 py-6 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} TrustX
              </footer>
            </LayoutWrapper>
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

