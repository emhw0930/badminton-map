"use client";

import { useDeferredValue, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Court } from "@/lib/types";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="map-loading">地圖載入中…</div>,
});

// 側欄清單一次最多渲染的筆數(全台資料近千筆,地圖仍顯示全部)
const LIST_CAP = 80;

export default function MapExplorer({ courts }: { courts: Court[] }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [acOnly, setAcOnly] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  // 延遲搜尋值,避免每個按鍵都重算/重繪地圖
  const deferredQuery = useDeferredValue(query);

  const cities = useMemo(
    () => Array.from(new Set(courts.map((c) => c.city))).sort(),
    [courts]
  );

  const filtered = useMemo(() => {
    // 台/臺 互通 + 不分大小寫
    const norm = (s: string) => s.replace(/臺/g, "台").toLowerCase();
    // 空格分隔 = 多關鍵字 AND 搜尋(如「台北 國小」)
    const tokens = norm(deferredQuery.trim()).split(/\s+/).filter(Boolean);
    return courts.filter((c) => {
      if (city !== "all" && c.city !== city) return false;
      if (acOnly && !c.has_ac) return false;
      if (tokens.length > 0) {
        const hay = norm(
          `${c.name}${c.city}${c.district ?? ""}${c.address ?? ""}`
        );
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
  }, [courts, deferredQuery, city, acOnly]);

  return (
    <div className="map-layout">
      <aside className="sidebar">
        <div className="toolbar">
          <div className="search">
            <SearchIcon />
            <input
              placeholder="搜尋球場名稱、地區…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="搜尋球場"
            />
          </div>
          <div className="chips">
            <span className="chip select">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="選擇縣市"
              >
                <option value="all">全部縣市</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </span>
            <button
              className={`chip ${acOnly ? "active" : ""}`}
              onClick={() => setAcOnly((v) => !v)}
              aria-pressed={acOnly}
            >
              有冷氣
            </button>
          </div>
        </div>

        <div className="result-count">
          {filtered.length} 個羽球場
          {filtered.length > LIST_CAP && `(清單顯示前 ${LIST_CAP} 筆)`}
        </div>

        <div className="court-list">
          {filtered.slice(0, LIST_CAP).map((c) => (
            <div
              key={c.slug}
              className={`court-card ${active === c.slug ? "active" : ""}`}
              onClick={() => setActive(c.slug)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setActive(c.slug);
              }}
            >
              <h3>{c.name}</h3>
              <div className="loc">
                📍 {c.city}
                {c.district ?? ""}
              </div>
              <div className="tags">
                {c.court_count ? (
                  <span className="tag">{c.court_count} 片場地</span>
                ) : null}
                {c.has_ac != null && (
                  <span className={`tag ${c.has_ac ? "ac" : "warm"}`}>
                    {c.has_ac ? "有冷氣" : "無冷氣"}
                  </span>
                )}
                {c.booking_url ? (
                  <span className="tag">可線上預約</span>
                ) : null}
              </div>
              <div style={{ marginTop: 10 }}>
                <Link
                  href={`/courts/${c.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    color: "var(--primary-ink)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  查看詳情 →
                </Link>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty">
              找不到符合條件的球場。
              <br />
              試試調整篩選,或{" "}
              <Link href="/submit" style={{ color: "var(--primary-ink)", fontWeight: 600 }}>
                回報新球場
              </Link>
              。
            </div>
          )}
        </div>
      </aside>

      <div className="map-wrap">
        <MapView courts={filtered} activeSlug={active} onSelect={setActive} />
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
