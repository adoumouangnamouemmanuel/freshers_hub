import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fresher Hub — Admin Dashboard",
  description: "Web admin dashboard for Fresher Hub — unit heads and platform administration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${outfit.variable} h-full antialiased`}
    >
      {/* Background layer for mesh/gradient aesthetic */}
      <body suppressHydrationWarning className="min-h-full flex flex-col relative bg-background text-foreground overflow-hidden">
        {/* Animated background mesh */}
        <div className="fixed inset-0 z-[-1] bg-mesh opacity-40 pointer-events-none" />
        
        {children}
      </body>
    </html>
  );
}