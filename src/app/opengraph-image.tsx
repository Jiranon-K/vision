import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#191A23",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "52px",
            fontWeight: 700,
            color: "#B9FF66",
            marginBottom: "40px",
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            fontSize: "84px",
            fontWeight: 700,
            lineHeight: 1.05,
            maxWidth: "1000px",
          }}
        >
          <span style={{ marginRight: "20px" }}>Write once,</span>
          <span
            style={{
              backgroundColor: "#B9FF66",
              color: "#191A23",
              padding: "0 16px",
              borderRadius: "16px",
            }}
          >
            share everywhere
          </span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "32px",
            color: "rgba(255,255,255,0.6)",
            marginTop: "32px",
            maxWidth: "800px",
          }}
        >
          The infrastructure for modern creators.
        </div>
      </div>
    ),
    { ...size },
  );
}
