export type Court = {
  id: string;
  slug: string;
  name: string;
  city: string;
  district: string | null;
  address: string | null;
  lat: number;
  lng: number;
  court_count: number | null;
  has_ac: boolean | null; // null = 冷氣資訊未確認(政府資料集無此欄位)
  phone: string | null;
  booking_url: string | null;
  opening_hours: string | null;
  price_note: string | null;
  notes: string | null;
  raw?: Record<string, string> | null; // 體育署普查完整原始欄位
  status: string;
  created_at: string;
  updated_at: string;
};

export type SubmissionKind = "new" | "edit" | "report";
