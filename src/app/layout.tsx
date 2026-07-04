import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "台灣羽球地圖 | 找羽球場地資訊",
    template: "%s | 台灣羽球地圖",
  },
  description:
    "在地圖上查詢台灣各地羽球場：幾片場地、營業時間、有無冷氣、收費與線上預約連結。",
  openGraph: {
    title: "台灣羽球地圖",
    description: "在地圖上查詢台灣各地羽球場資訊與預約連結。",
    type: "website",
  },
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
            <span className="logo">🏸</span>
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
