import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfigProvider } from "@/components/ConfigProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CF Next — Cloudflare Management",
    template: "%s · CF Next",
  },
  description:
    "A modern web interface for managing your Cloudflare infrastructure — zones, DNS records, firewall rules, SSL/TLS and cache settings.",
  keywords: ["Cloudflare", "DNS", "zones", "firewall", "SSL", "management", "dashboard"],
  authors: [{ name: "CF Next" }],
  creator: "CF Next",
  applicationName: "CF Next",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    title: "CF Next — Cloudflare Management",
    description:
      "Manage your Cloudflare infrastructure with a modern, fast web interface.",
    siteName: "CF Next",
  },
  twitter: {
    card: "summary",
    title: "CF Next — Cloudflare Management",
    description: "Manage your Cloudflare infrastructure with a modern, fast web interface.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#F48120",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
        <ThemeProvider>
          <ConfigProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
