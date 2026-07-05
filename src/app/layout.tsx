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
                width="22"
                height="22"
                viewBox="0 0 100 100"
                fill="none"
                aria-hidden="true"
              >
                <g transform="rotate(38 50 50)">
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
                    strokeWidth="4"
                  />
                  <line
                    x1="56"
                    y1="22"
                    x2="51.5"
                    y2="54"
                    stroke="#0a8a53"
                    strokeWidth="4"
                  />
                  <circle cx="50" cy="71" r="11" fill="#ffffff" />
                </g>
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
          <nav className="footer-cities" aria-label="各縣市羽球場">
            {[
              "臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市",
              "基隆市", "新竹市", "新竹縣", "苗栗縣", "彰化縣", "南投縣",
              "雲林縣", "嘉義市", "嘉義縣", "屏東縣", "宜蘭縣", "花蓮縣",
              "臺東縣", "澎湖縣", "金門縣", "連江縣",
            ].map((c) => (
              <Link key={c} href={`/city/${c}`}>
                {c}羽球場
              </Link>
            ))}
          </nav>
          <p>
            資料來源:教育部體育署與社群共同維護,若有錯誤或缺漏歡迎{" "}
            <Link href="/submit">回報</Link>。
          </p>
        </footer>
      </body>
    </html>
  );
}
