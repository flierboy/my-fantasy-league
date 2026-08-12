import type { Metadata } from "next";
import { Oswald, Source_Sans_3, Geist_Mono } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Upper Deckers",
    template: "%s · Upper Deckers",
  },
  description:
    "Private 10-team Yahoo fantasy football league Upper Deckers — owners, draft, standings, dues, polls, and trash talk.",
  applicationName: "Upper Deckers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className={`${oswald.variable} ${sourceSans.variable} ${geistMono.variable} flex min-h-full flex-col bg-background font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
