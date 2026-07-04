import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourtBySlug, getCourts } from "@/lib/courts";

type Params = { params: Promise<{ slug: string }> };

// ISR:建置時預先產生所有球場頁(靜態、秒開、SEO 最佳),每 5 分鐘更新
export const revalidate = 300;

export async function generateStaticParams() {
  const courts = await getCourts();
  return courts.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const court = await getCourtBySlug(slug);
  if (!court) return { title: "找不到球場" };

  const desc = `${court.city}${court.district ?? ""}的羽球場。${
    court.court_count ? `${court.court_count} 片場地、` : ""
  }${court.has_ac ? "有冷氣" : "無冷氣"}${
    court.opening_hours ? `,營業時間 ${court.opening_hours}` : ""
  }${court.booking_url ? ",可線上預約" : ""}。`;

  return {
    title: `${court.name} 羽球場資訊與預約`,
    description: desc,
    alternates: { canonical: `/courts/${court.slug}` },
    openGraph: { title: court.name, description: desc },
  };
}

export default async function CourtDetail({ params }: Params) {
  const { slug } = await params;
  const court = await getCourtBySlug(slug);
  if (!court) notFound();

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    court.address ?? court.name
  )}`;

  // SportsActivityLocation 結構化資料:讓 Google 以「場館」理解此頁,
  // 有機會在搜尋結果顯示地址、電話、營業時間等 rich results。
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: court.name,
    sport: "Badminton",
    ...(court.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: court.address,
        addressLocality: court.city,
        addressCountry: "TW",
      },
    }),
    geo: {
      "@type": "GeoCoordinates",
      latitude: court.lat,
      longitude: court.lng,
    },
    ...(court.phone && { telephone: court.phone }),
    ...(court.booking_url && { url: court.booking_url }),
    ...(court.opening_hours && { openingHours: court.opening_hours }),
  };

  return (
    <article className="detail">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/" className="back-link">
        ← 回地圖
      </Link>

      <div className="detail-hero">
        <h1>{court.name}</h1>
        <div className="loc">
          📍 {court.city}
          {court.district ?? ""}
          {court.address ? ` · ${court.address}` : ""}
        </div>
        <div className="tags">
          <span className={`tag ${court.has_ac ? "ac" : "warm"}`}>
            {court.has_ac ? "有冷氣" : "無冷氣"}
          </span>
          {court.court_count ? (
            <span className="tag">{court.court_count} 片場地</span>
          ) : null}
        </div>

        <div className="info-grid">
          <Cell k="營業時間" v={court.opening_hours} />
          <Cell k="收費" v={court.price_note} />
          <Cell
            k="電話"
            v={court.phone ? <a href={`tel:${court.phone}`}>{court.phone}</a> : null}
          />
          <Cell k="備註" v={court.notes} />
        </div>

        <div className="cta-row">
          {court.booking_url ? (
            <a
              className="btn primary"
              href={court.booking_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              前往預約 →
            </a>
          ) : (
            <span className="btn disabled">尚無線上預約(請電話洽詢)</span>
          )}
          <a
            className="btn ghost"
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google 地圖導航
          </a>
        </div>
      </div>

      <p style={{ marginTop: 20, color: "var(--muted)", fontSize: 13 }}>
        資訊有誤?{" "}
        <Link href="/submit" style={{ color: "var(--primary-ink)", fontWeight: 600 }}>
          回報給我們
        </Link>
        。
      </p>
    </article>
  );
}

function Cell({
  k,
  v,
}: {
  k: string;
  v: React.ReactNode | null | undefined;
}) {
  return (
    <div className="info-cell">
      <div className="k">{k}</div>
      <div className="v">{v || <span style={{ color: "var(--muted)" }}>—</span>}</div>
    </div>
  );
}
