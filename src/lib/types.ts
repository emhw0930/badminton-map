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
  has_ac: boolean;
  phone: string | null;
  booking_url: string | null;
  opening_hours: string | null;
  price_note: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type SubmissionKind = "new" | "edit" | "report";
