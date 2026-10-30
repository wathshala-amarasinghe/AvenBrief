import { ImageResponse } from "next/og";
import { siteUrl } from "@/lib/site-metadata";

export const alt = "AvenBrief — The world, made clear";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 84px",
          color: "#111827",
          background: "linear-gradient(135deg, #ffffff 0%, #eef4ff 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 18, height: 18, borderRadius: 999, background: "#2563eb" }} />
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "0.04em" }}>AVENBRIEF</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ maxWidth: 900, fontSize: 78, fontWeight: 700, lineHeight: 1.05 }}>The world, made clear.</div>
          <div style={{ fontSize: 30, color: "#526078" }}>Clear reporting, useful context, and links to original sources.</div>
        </div>
        <div style={{ fontSize: 24, color: "#2563eb" }}>{siteUrl.host}</div>
      </div>
    ),
    size,
  );
}
