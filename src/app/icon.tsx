import { ImageResponse } from "next/og";

// 網站 favicon / Google 搜尋結果圖示(512x512,Google 建議 48 的倍數)
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 96,
        }}
      >
        <div style={{ display: "flex", transform: "rotate(38deg)" }}>
          <svg width="400" height="400" viewBox="0 0 100 100" fill="none">
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
