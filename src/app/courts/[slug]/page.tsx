import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourtBySlug } from "@/lib/courts";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const court = await getCourtBySlug(slug);
  if (!court) return { title: "找不到球場" };

  const desc = `${court.city}${court.district ?? ""}的羽球場。${
    court.court_count ? `${court.court_count} 片場地、` : ""
  }${court.has_ac ? "有冷氣" : "無冷氣"}${
    court.opening_hours ? `,營業時間 ${court.opening_hours}` : ""
  }。`;

  return {
    title: court.name,
    description: desc,
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

  return (
    <article className="detail">
      <p>
        <Link href="/">← 回地圖</Link>
      </p>
      <h1>{court.name}</h1>
      <p className="court-meta">
        <span className={`badge ${court.has_ac ? "ac" : "no-ac"}`}>
          {court.has_ac ? "❄️ 有冷氣" : "無冷氣"}
        </span>
        {court.court_count ? (
          <span className="badge">{court.court_count} 片場地</span>
        ) : null}
      </p>

      <div style={{ marginTop: 18 }}>
        <Row label="縣市地區" value={`${court.city}${court.district ?? ""}`} />
        <Row label="地址" value={court.address} />
        <Row label="營業時間" value={court.opening_hours} />
        <Row label="收費" value={court.price_note} />
        <Row
          label="電話"
          value={
            court.phone ? <a href={`tel:${court.phone}`}>{court.phone}</a> : null
          }
        />
        <Row label="備註" value={court.notes} />
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {court.booking_url ? (
          <a
            className="btn"
            href={court.booking_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            前往預約 →
          </a>
        ) : (
          <span className="btn secondary" style={{ cursor: "default" }}>
            此球場尚無線上預約(請電話洽詢)
          </span>
        )}
        <a
          className="btn secondary"
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          在 Google 地圖開啟
        </a>
      </div>

      <p style={{ marginTop: 24, color: "var(--muted)", fontSize: 13 }}>
        資訊有誤?<Link href="/submit">回報給我們</Link>。
      </p>
    </article>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="row">
      <span className="label">{label}</span>
      <span>{value}</span>
    </div>
  );
}
