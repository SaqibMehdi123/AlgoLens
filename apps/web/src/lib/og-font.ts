import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Load the Noto Sans font next/og bundles, via a correctly-constructed absolute path, and pass
 * it to ImageResponse explicitly (keeping OG text ASCII via {@link ascii} so no glyph fallback
 * is triggered).
 *
 * KNOWN LOCAL LIMITATION: @vercel/og additionally loads its WASM/default assets via a `file:`
 * URL derived from the install path. On Windows when that absolute path contains spaces (e.g.
 * "Projects for portfolio"), the URL is malformed and the OG route 500s *during response
 * streaming* — uncatchable from here. It renders correctly on Linux/CI/Vercel. Normal pages are
 * unaffected (the OG URL is only fetched by crawlers, not during page render).
 */
const REL = "next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf";

let cached: ArrayBuffer | null = null;

export function ogFont(): ArrayBuffer {
  if (cached) return cached;
  const candidates = [
    path.join(process.cwd(), "node_modules", REL),
    path.join(process.cwd(), "..", "..", "node_modules", REL),
  ];
  const fontPath = candidates.find((c) => existsSync(c));
  if (!fontPath) throw new Error(`OG font not found; looked in: ${candidates.join(", ")}`);
  const buf = readFileSync(fontPath);
  cached = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return cached;
}

/**
 * Keep OG text within the provided font's (basic-latin) glyph coverage. Any uncovered glyph
 * makes @vercel/og fall back to its default-font loader — the very thing that breaks here.
 */
export function ascii(s: string): string {
  return s
    .replace(/[²₂]/g, "2")
    .replace(/[³₃]/g, "3")
    .replace(/⁴/g, "4")
    .replace(/ⁿ/g, "n")
    .replace(/[·•]/g, "-")
    .replace(/[—–]/g, "-")
    .replace(/[^\x20-\x7E]/g, "");
}
