"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Court } from "@/lib/types";

// 地圖只在瀏覽器渲染(maplibre-gl 依賴 window)
const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapExplorer({ courts }: { courts: Court[] }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<string>("all");
  const [acOnly, setAcOnly] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  const cities = useMemo(
    () => Array.from(new Set(courts.map((c) => c.city))).sort(),
    [courts]
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    return courts.filter((c) => {
      if (city !== "all" && c.city !== city) return false;
      if (acOnly && !c.has_ac) return false;
      if (q) {
        const hay = `${c.name}${c.district ?? ""}${c.address ?? ""}`;
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [courts, query, city, acOnly]);

  return (
    <div className="map-layout">
      <aside className="sidebar">
        <div className="filters">
          <input
            placeholder="搜尋球場名稱 / 地區…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="all">全部縣市</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            className={`chip ${acOnly ? "active" : ""}`}
            onClick={() => setAcOnly((v) => !v)}
          >
            ❄️ 有冷氣
          </button>
        </div>

        <div>
          <p style={{ padding: "10px 16px", color: "var(--muted)", margin: 0 }}>
            共 {filtered.length} 個球場
          </p>
          {filtered.map((c) => (
            <div
              key={c.slug}
              className="court-card"
              onClick={() => setActive(c.slug)}
            >
              <h3>{c.name}</h3>
              <div className="court-meta">
                <span>
                  {c.city}
                  {c.district ?? ""}
                </span>
                {c.court_count ? <span>{c.court_count} 片場地</span> : null}
                <span className={`badge ${c.has_ac ? "ac" : "no-ac"}`}>
                  {c.has_ac ? "❄️ 有冷氣" : "無冷氣"}
                </span>
              </div>
              <div style={{ marginTop: 8 }}>
                <Link href={`/courts/${c.slug}`} onClick={(e) => e.stopPropagation()}>
                  查看詳情 →
                </Link>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ padding: 16, color: "var(--muted)" }}>
              找不到符合條件的球場。
            </p>
          )}
        </div>
      </aside>

      <div className="map-wrap">
        <MapView courts={filtered} activeSlug={active} onSelect={setActive} />
      </div>
    </div>
  );
}
