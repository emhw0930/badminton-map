import type { MetadataRoute } from "next";
import { getCourts } from "@/lib/courts";

// 部署後把這個環境變數設成你的網域,sitemap 才會用正確網址
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courts = await getCourts();
  const courtUrls = courts.map((c) => ({
    url: `${BASE}/courts/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
  }));

  return [
    { url: BASE, lastModified: new Date() },
    { url: `${BASE}/submit`, lastModified: new Date() },
    ...courtUrls,
  ];
}
