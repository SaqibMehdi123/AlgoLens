import { locateLesson } from "@algolens/content";
import { ImageResponse } from "next/og";
import { ascii, ogFont } from "@/lib/og-font";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AlgoLens lesson";

/** Per-lesson OpenGraph image (X5). */
export default async function Image({ params }: { params: Promise<{ track: string; lesson: string }> }) {
  const { track, lesson } = await params;
  const loc = locateLesson(track, lesson);

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
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", color: "#6C7BFF", fontSize: 30, fontWeight: 700 }}>
          AlgoLens - Learn
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 36, color: "#22D3EE", marginBottom: 16 }}>
            {ascii(loc?.track.title ?? "DSA Foundations")}
          </div>
          <div style={{ fontSize: 68, fontWeight: 700, color: "#E6EAF2", lineHeight: 1.1 }}>
            {ascii(loc?.lesson.title ?? "Lesson")}
          </div>
          <div style={{ fontSize: 28, color: "#9AA4B8", marginTop: 20, maxWidth: 1000 }}>
            {ascii(loc?.lesson.summary ?? "")}
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#6B7385" }}>
          {loc ? `${loc.lesson.estMinutes} min - interactive` : ""}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Noto Sans", data: ogFont(), weight: 400, style: "normal" }] },
  );
}
