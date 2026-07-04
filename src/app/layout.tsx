import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://badminton-map.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "台灣羽球地圖|查羽球場地、預約連結、冷氣資訊",
    template: "%s|台灣羽球地圖",
  },
  description:
    "在地圖上查詢台北、新北羽球場：幾片場地、營業時間、有無冷氣、收費與線上預約連結。涵蓋運動中心與民營羽球館,資料由社群共同維護。",
  keywords: [
    "羽球場",
    "羽球館",
    "羽球場地預約",
    "台北羽球場",
    "新北羽球場",
    "運動中心羽球",
    "羽球場冷氣",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "台灣羽球地圖",
    description:
      "在地圖上查台北、新北羽球場:場地數、營業時間、冷氣、預約連結。",
    type: "website",
    url: SITE_URL,
    siteName: "台灣羽球地圖",
    locale: "zh_TW",
  },
  twitter: {
    card: "summary_large_image",
    title: "台灣羽球地圖",
    description: "在地圖上查雙北羽球場資訊與預約連結。",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant-TW">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            <span className="logo">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="7" cy="17" r="3.2" />
                <path d="M9.5 14.5 19 5" />
                <path d="m13 8 4-3.5" />
                <path d="m16 11 3.5-4" />
              </svg>
            </span>
            台灣羽球地圖
          </Link>
          <nav>
            <Link href="/" className="nav-link">
              地圖
            </Link>
            <Link href="/submit" className="nav-cta">
              + 回報球場
            </Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>
            資料由社群共同維護,若有錯誤或缺漏歡迎{" "}
            <Link href="/submit">回報</Link>。
          </p>
        </footer>
      </body>
    </html>
  );
}
