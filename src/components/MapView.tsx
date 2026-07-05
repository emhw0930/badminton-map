"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  type MapRef,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import type { LayerProps } from "react-map-gl/maplibre";
import type { GeoJSONSource } from "maplibre-gl";
import type { Court } from "@/lib/types";
import "maplibre-gl/dist/maplibre-gl.css";

// 免費、免 API key 的向量底圖(Positron:極簡淺灰風格,突顯球場標記)
const MAP_STYLE = "https://tiles.openfreemap.org/styles/bright";
const SOURCE_ID = "courts";

type Props = {
  courts: Court[];
  activeSlug?: string | null;
  onSelect?: (slug: string) => void;
};

// 群集圓圈:依數量放大、變深
const clusterLayer: LayerProps = {
  id: "clusters",
  type: "circle",
  source: SOURCE_ID,
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#34d399",
      10,
      "#0ea766",
      30,
      "#0a8a53",
    ],
    "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 30, 30],
    "circle-stroke-width": 3,
    "circle-stroke-color": "rgba(255,255,255,0.85)",
  },
};

const clusterCountLayer: LayerProps = {
  id: "cluster-count",
  type: "symbol",
  source: SOURCE_ID,
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-size": 13,
    "text-font": ["Noto Sans Regular"],
  },
  paint: { "text-color": "#ffffff" },
};

// 單一球場圓點
const unclusteredLayer: LayerProps = {
  id: "unclustered-point",
  type: "circle",
  source: SOURCE_ID,
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": "#0ea766",
    "circle-radius": 8,
    "circle-stroke-width": 3,
    "circle-stroke-color": "#ffffff",
  },
};

export default function MapView({ courts, activeSlug, onSelect }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [popup, setPopup] = useState<Court | null>(null);

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: courts.map((c) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [c.lng, c.lat] },
        properties: { slug: c.slug, name: c.name },
      })),
    }),
    [courts]
  );

  // 點選:群集就放大展開,單點就選取 + 開 popup
  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const map = mapRef.current;
      if (!map) return;

      if (feature.properties?.point_count) {
        const clusterId = feature.properties.cluster_id;
        const src = map.getSource(SOURCE_ID) as GeoJSONSource;
        src.getClusterExpansionZoom(clusterId).then((zoom) => {
          const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
          map.flyTo({ center: [lng, lat], zoom, duration: 600 });
        });
      } else {
        const slug = feature.properties?.slug as string;
        const court = courts.find((c) => c.slug === slug);
        if (court) {
          setPopup(court);
          onSelect?.(slug);
        }
      }
    },
    [courts, onSelect]
  );

  // 側欄點選 → 飛過去
  const active = courts.find((c) => c.slug === activeSlug);
  if (active && mapRef.current) {
    mapRef.current.flyTo({
      center: [active.lng, active.lat],
      zoom: Math.max(mapRef.current.getZoom(), 13),
      duration: 700,
    });
  }

  return (
    <Map
      ref={mapRef}
      mapStyle={MAP_STYLE}
      initialViewState={{ longitude: 121.53, latitude: 25.03, zoom: 10 }}
      minZoom={6}
      maxZoom={18}
      interactiveLayerIds={["clusters", "unclustered-point"]}
      onClick={handleClick}
      onLoad={() => {
        // 容器尺寸在初始化當下可能還沒定案(canvas 會卡在 400x300 預設值),
        // load 後主動校正一次,再保險補一次
        mapRef.current?.resize();
        setTimeout(() => mapRef.current?.resize(), 300);
      }}
      cursor="auto"
      onMouseEnter={() => {
        if (mapRef.current) mapRef.current.getCanvas().style.cursor = "pointer";
      }}
      onMouseLeave={() => {
        if (mapRef.current) mapRef.current.getCanvas().style.cursor = "";
      }}
    >
      <NavigationControl position="top-right" showCompass={false} />

      <Source
        id={SOURCE_ID}
        type="geojson"
        data={geojson}
        cluster
        clusterRadius={50}
        clusterMaxZoom={14}
      >
        <Layer {...clusterLayer} />
        <Layer {...clusterCountLayer} />
        <Layer {...unclusteredLayer} />
      </Source>

      {popup && (
        <Popup
          longitude={popup.lng}
          latitude={popup.lat}
          anchor="bottom"
          offset={16}
          closeButton
          onClose={() => setPopup(null)}
        >
          <div className="popup-title">{popup.name}</div>
          <a className="popup-link" href={`/courts/${popup.slug}`}>
            查看詳情 →
          </a>
        </Popup>
      )}
    </Map>
  );
}
