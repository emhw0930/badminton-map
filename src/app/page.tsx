import MapExplorer from "@/components/MapExplorer";
import { getCourts } from "@/lib/courts";

// ISR:每 5 分鐘重新抓一次資料。頁面走靜態快取,TTFB 快、SEO 佳,
// 你在 Supabase 改資料最多 5 分鐘後生效。
export const revalidate = 300;

export default async function HomePage() {
  const courts = await getCourts();

  // WebSite 結構化資料,幫助 Google 理解站點
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "台灣羽球地圖",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://badminton-map.vercel.app",
    description: "在地圖上查詢台灣羽球場資訊與預約連結",
    inLanguage: "zh-Hant-TW",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MapExplorer courts={courts} />
    </>
  );
}
