import type { Metadata } from "next";
import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/source-serif-4";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";
import { BrandProvider } from "@/components/brand/BrandProvider";
import { BRAND_BOOT } from "@/lib/brand";

export const metadata: Metadata = {
  title: {
    default: "Aurum Asset Management",
    template: "%s · Aurum",
  },
  description: "Aurum client platform — fund administration, onboarding and reporting.",
  icons: { icon: "/brand/aurum-mark.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BRAND_BOOT }} />
      </head>
      <body className="min-h-screen antialiased">
        <BrandProvider>{children}</BrandProvider>
      </body>
    </html>
  );
}
