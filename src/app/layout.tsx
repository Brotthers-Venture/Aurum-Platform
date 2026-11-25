import type { Metadata } from "next";
import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/source-serif-4";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./globals.css";
import { BrandProvider } from "@/components/brand/BrandProvider";
import { ThemeProvider } from "@/components/shell/ThemeProvider";
import { PreviewRoleProvider } from "@/components/admin/PreviewRole";
import { BRAND_BOOT } from "@/lib/brand";
import { ECO_BOOT, THEME_BOOT } from "@/lib/theme";

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
        <script dangerouslySetInnerHTML={{ __html: BRAND_BOOT + THEME_BOOT + ECO_BOOT }} />
      </head>
      <body className="min-h-screen antialiased">
        <BrandProvider>
          <ThemeProvider>
            <PreviewRoleProvider>{children}</PreviewRoleProvider>
          </ThemeProvider>
        </BrandProvider>
      </body>
    </html>
  );
}
