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
    default: "Yahoo Keepers League",
    template: "%s · Yahoo Keepers League",
  },
  description:
    "Private 10-team Yahoo fantasy football league — owners, draft, standings, dues, polls, and trash talk.",
  applicationName: "Yahoo Keepers League",
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
