import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body className="min-h-dvh font-sans">
        <Providers>
          <SiteNav />
        </Providers>
        <main className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
