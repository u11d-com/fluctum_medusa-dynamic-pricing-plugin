import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        backgroundImage:
          "radial-gradient(circle at 50% 45%, rgba(124,58,237,0.35) 0%, rgba(124,58,237,0) 60%)",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 140,
          fontWeight: 800,
          color: "#ffffff",
          letterSpacing: -4,
        }}
      >
        Fluctum
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 40,
          fontWeight: 400,
          color: "#ffffff",
          marginTop: 16,
        }}
      >
        Real-Time Dynamic Pricing for Medusa
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 26,
          fontWeight: 600,
          color: "#ffffff",
          marginTop: 48,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        Open Source · MIT Licensed
      </div>
    </div>,
    { ...size },
  );
}
