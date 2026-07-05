import { ImageResponse } from "next/og";

// iPhone 加入主畫面時的圖示(180x180,iOS 會自己切圓角,底不透明)
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0ea766 0%, #0a8a53 100%)",
        }}
      >
        <div style={{ display: "flex", transform: "rotate(38deg)" }}>
          <svg width="140" height="140" viewBox="0 0 100 100" fill="none">
            <polygon
              fill="#ffffff"
              points="50,61 27,20 35,14 44,19 50,13 56,19 65,14 73,20"
            />
            <line
              x1="44"
              y1="22"
              x2="48.5"
              y2="54"
              stroke="#0a8a53"
              strokeWidth="2.4"
            />
            <line
              x1="56"
              y1="22"
              x2="51.5"
              y2="54"
              stroke="#0a8a53"
              strokeWidth="2.4"
            />
            <circle cx="50" cy="71" r="11" fill="#ffffff" />
          </svg>
        </div>
      </div>
    ),
    { ...size }
  );
}
