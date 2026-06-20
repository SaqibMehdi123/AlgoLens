import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@/components/analytics";
import { ProgressSync } from "@/components/progress-sync";
import { Providers } from "@/components/providers";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

// Production URL for absolute metadata/OG links: explicit env, else Vercel's, else local dev.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AlgoLens — See the algorithm. Prove the complexity.",
    template: "%s · AlgoLens",
  },
  description:
    "Learn data structures & algorithms by watching them run, measuring how they scale, and practicing until it sticks.",
  openGraph: {
    title: "AlgoLens",
    description: "See the algorithm. Prove the complexity. Then prove you can write it.",
    type: "website",
  },
};

// Avoid a flash of the wrong theme: apply the stored light theme before first paint.
const themeInit = `try{if(localStorage.getItem('algolens-theme')==='light')document.documentElement.classList.add('light')}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Progressive enhancement: real fonts if the CDN is reachable, system stack otherwise. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-dvh font-sans">
        <Providers>
          <SiteNav />
          <Analytics />
          <ProgressSync />
          <main className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
