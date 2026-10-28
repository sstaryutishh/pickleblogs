import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/instrument-serif/400.css";
import "./globals.css";
import { BlogHeader } from "@/components/BlogHeader";
import { BlogFooter } from "@/components/BlogFooter";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "The Pickle Blog", template: "%s | Pickle" },
  icons: { icon: "/blog/assets/pickle-icon.png", apple: "/blog/assets/pickle-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <BlogHeader />
        {children}
        <BlogFooter />
        <Analytics />
      </body>
    </html>
  );
}
