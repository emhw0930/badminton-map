import MapExplorer from "@/components/MapExplorer";
import { getCourts } from "@/lib/courts";

// 每次請求都重新取資料;若想加快可改成 revalidate 快取。
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const courts = await getCourts();
  return <MapExplorer courts={courts} />;
}
