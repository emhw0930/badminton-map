"use client";

import { useEffect, useRef } from "react";
import type { Court } from "@/lib/types";
import "maplibre-gl/dist/maplibre-gl.css";

// 免費、免 API key 的向量地圖底圖(OpenFreeMap)
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

type Props = {
  courts: Court[];
  activeSlug?: string | null;
  onSelect?: (slug: string) => void;
};

export default function MapView({ courts, activeSlug, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // 用 ref 存放 maplibre 的 map 實例與 marker,避免重複建立
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markersRef = useRef<Record<string, import("maplibre-gl").Marker>>({});

  // 建立地圖(只跑一次)。maplibre-gl 只能在瀏覽器執行,故動態 import。
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [121.53, 25.03], // 台北盆地
        zoom: 10,
      });
      map.addControl(new maplibregl.NavigationControl(), "top-right");
      mapRef.current = map;

      map.on("load", () => {
        courts.forEach((court) => {
          const el = document.createElement("div");
          el.style.cssText =
            "width:16px;height:16px;border-radius:50%;background:#38bdf8;border:2px solid #04121b;cursor:pointer;box-shadow:0 0 0 2px rgba(56,189,248,.35)";

          const popup = new maplibregl.Popup({ offset: 18 }).setHTML(
            `<strong>${escapeHtml(court.name)}</strong><br/>` +
              `<a href="/courts/${court.slug}">查看詳情 →</a>`
          );

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([court.lng, court.lat])
            .setPopup(popup)
            .addTo(map);

          el.addEventListener("click", () => onSelect?.(court.slug));
          markersRef.current[court.slug] = marker;
        });
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
    // 只建立一次;courts 變動時不重建地圖(篩選在側欄處理)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 點選側欄時,飛到對應球場並打開 popup
  useEffect(() => {
    if (!activeSlug) return;
    const court = courts.find((c) => c.slug === activeSlug);
    const marker = markersRef.current[activeSlug];
    if (!court || !mapRef.current || !marker) return;
    mapRef.current.flyTo({ center: [court.lng, court.lat], zoom: 14 });
    marker.togglePopup();
  }, [activeSlug, courts]);

  return <div id="map" ref={containerRef} />;
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] as string
  );
}
