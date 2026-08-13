import type { Metadata, Viewport } from "next";
import { Oswald, Source_Sans_3, Geist_Mono } from "next/font/google";
import { SiteBackground } from "@/components/layout/site-background";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
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
    default: "Upper Deckcers",
    template: "%s · Upper Deckcers",
  },
  description:
    "Private 10-team Yahoo fantasy football league Upper Deckcers — owners, draft, standings, dues, polls, and trash talk.",
  applicationName: "Upper Deckcers",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Upper Deckcers",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className={`${oswald.variable} ${sourceSans.variable} ${geistMono.variable} font-sans`}
      >
        <SiteBackground />
        <div className="ff-app-shell">{children}</div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
