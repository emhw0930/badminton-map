import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourts } from "@/lib/courts";

type Params = { params: Promise<{ city: string }> };

// ISR:各縣市頁預先靜態化,每 5 分鐘更新
export const revalidate = 300;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://badminton-map.vercel.app";

export async function generateStaticParams() {
  const courts = await getCourts();
  const cities = Array.from(new Set(courts.map((c) => c.city)));
  return cities.map((city) => ({ city }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city: rawCity } = await params;
  const city = decodeURIComponent(rawCity);
  const courts = (await getCourts()).filter((c) => c.city === city);
  if (courts.length === 0) return { title: "找不到縣市" };

  return {
    title: `${city}羽球場一覽(${courts.length} 個場地)`,
    description: `${city}共 ${courts.length} 個羽球場地:運動中心、學校體育館與羽球館。查地址、營業時間、收費與預約方式,附地圖定位。`,
    alternates: { canonical: `/city/${city}` },
    openGraph: {
      title: `${city}羽球場一覽`,
      description: `${city} ${courts.length} 個羽球場地資訊與預約連結。`,
    },
  };
}

export default async function CityPage({ params }: Params) {
  const { city: rawCity } = await params;
  const city = decodeURIComponent(rawCity);
  const courts = (await getCourts()).filter((c) => c.city === city);
  if (courts.length === 0) notFound();

  // 依行政區分組
  const byDistrict = new Map<string, typeof courts>();
  for (const c of courts) {
    const d = c.district ?? "其他";
    if (!byDistrict.has(d)) byDistrict.set(d, []);
    byDistrict.get(d)!.push(c);
  }
  const districts = Array.from(byDistrict.keys()).sort();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${city}羽球場一覽`,
    numberOfItems: courts.length,
    itemListElement: courts.slice(0, 100).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      url: `${SITE_URL}/courts/${c.slug}`,
    })),
  };

  return (
    <div className="detail city-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/" className="back-link">
        ← 回地圖
      </Link>
      <h1 className="city-title">{city}羽球場一覽</h1>
      <p className="city-sub">
        共 {courts.length} 個場地,涵蓋運動中心、學校體育館與羽球館。點進各場地查看
        營業時間、收費、停車與預約方式。
      </p>

      {districts.map((d) => (
        <section key={d}>
          <h2 className="city-district">
            {d}({byDistrict.get(d)!.length})
          </h2>
          <div className="city-grid">
            {byDistrict.get(d)!.map((c) => (
              <Link key={c.slug} href={`/courts/${c.slug}`} className="court-card">
                <h3>{c.name}</h3>
                <div className="loc">
                  📍 {c.address ?? `${c.city}${c.district ?? ""}`}
                </div>
                <div className="tags">
                  {c.price_note?.includes("免費對外") && (
                    <span className="tag ac">免費</span>
                  )}
                  {c.booking_url && <span className="tag">可線上預約</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
