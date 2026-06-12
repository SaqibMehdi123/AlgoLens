import { getAlgo } from "@algolens/algo-core";
import { ImageResponse } from "next/og";
import { ascii, ogFont } from "@/lib/og-font";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AlgoLens visualization";

const BARS = [
  { h: 120, c: "#6C7BFF" },
  { h: 200, c: "#F5A524" },
  { h: 90, c: "#22D3EE" },
  { h: 260, c: "#FF6B6B" },
  { h: 160, c: "#2DD4A7" },
  { h: 300, c: "#A78BFA" },
  { h: 140, c: "#F472B6" },
  { h: 230, c: "#6C7BFF" },
];

/** Per-algorithm OpenGraph image (X5) — generated with satori via next/og. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getAlgo(slug);
  const title = ascii(entry?.title ?? "Visualize");
  const worst = ascii(entry?.complexity.worst ?? "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0B0E14",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", color: "#6C7BFF", fontSize: 30, fontWeight: 700 }}>
          AlgoLens
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 300 }}>
          {BARS.map((b, i) => (
            <div key={i} style={{ width: 80, height: b.h, background: b.c, borderRadius: 8 }} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, fontWeight: 700, color: "#E6EAF2" }}>{title}</div>
          <div style={{ fontSize: 30, color: "#9AA4B8", marginTop: 8 }}>
            {worst ? `Worst case ${worst} - ` : ""}See the algorithm. Prove the complexity.
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Noto Sans", data: ogFont(), weight: 400, style: "normal" }] },
  );
}
