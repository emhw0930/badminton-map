import { ImageResponse } from "next/og";

export const alt = "台灣羽球地圖";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 全站 OG 分享圖(LINE / Facebook / Threads 貼連結時顯示)
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0ea766 0%, #0a8a53 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>
          台灣羽球地圖
        </div>
        <div style={{ fontSize: 40, marginTop: 24, opacity: 0.92 }}>
          查場地・看冷氣・直接預約
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 28,
            padding: "14px 36px",
            background: "rgba(255,255,255,0.16)",
            borderRadius: 999,
          }}
        >
          badminton-map.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
