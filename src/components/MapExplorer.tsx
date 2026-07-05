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

// 兩點間距離(公里,Haversine)
function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export default function MapExplorer({ courts }: { courts: Court[] }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [acOnly, setAcOnly] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  function toggleNearMe() {
    if (userLoc) {
      setUserLoc(null); // 再按一次取消
      return;
    }
    setLocError("");
    if (!navigator.geolocation) {
      setLocError("此瀏覽器不支援定位");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError("無法取得位置,請確認已允許定位權限");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

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

  // 有定位時依距離排序
  const sorted = useMemo(() => {
    if (!userLoc) return filtered;
    return [...filtered].sort(
      (a, b) =>
        distanceKm(userLoc.lat, userLoc.lng, a.lat, a.lng) -
        distanceKm(userLoc.lat, userLoc.lng, b.lat, b.lng)
    );
  }, [filtered, userLoc]);

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
            <button
              className={`chip ${userLoc ? "active" : ""}`}
              onClick={toggleNearMe}
              disabled={locating}
              aria-pressed={!!userLoc}
            >
              {locating ? "定位中…" : "📍 離我最近"}
            </button>
          </div>
          {locError && (
            <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--danger)" }}>
              {locError}
            </div>
          )}
        </div>

        <div className="result-count">
          {filtered.length} 個羽球場
          {filtered.length > LIST_CAP && `(清單顯示前 ${LIST_CAP} 筆)`}
        </div>

        <div className="court-list">
          {sorted.slice(0, LIST_CAP).map((c) => (
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
                {userLoc &&
                  ` · ${distanceKm(userLoc.lat, userLoc.lng, c.lat, c.lng).toFixed(1)} km`}
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
