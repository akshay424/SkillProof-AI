import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { Providers } from "./providers";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SkillProof AI — Transform Learning into Project Readiness",
  description:
    "AI-powered fresher learning and project readiness platform: roadmaps, code review, and real-time AI viva interviews.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      <body className="app-gradient-backdrop min-h-screen font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
