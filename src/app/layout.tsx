import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Manrope, Unbounded } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "КЛИН — барбершоп в Екатеринбурге",
    template: "%s · КЛИН",
  },
  description:
    "Барбершоп КЛИН на Малышева, 44. Мужские стрижки, борода, королевское бритьё. Онлайн-запись к барберу за 30 секунд.",
  keywords: [
    "барбершоп",
    "Екатеринбург",
    "стрижка",
    "барбер",
    "борода",
    "КЛИН",
  ],
  openGraph: {
    title: "КЛИН — барбершоп в Екатеринбурге",
    description:
      "Точная форма. Твой характер. Онлайн-запись к барберу на Малышева, 44.",
    type: "website",
    locale: "ru_RU",
    images: [{ url: "/images/hero.jpg", width: 1600, height: 1063 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f2ebd9",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${unbounded.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full bg-paper text-ink">{children}</body>
    </html>
  );
}
