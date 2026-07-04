-- ============================================================
--  台灣羽球地圖 — 資料庫 schema
--  在 Supabase Dashboard → SQL Editor 貼上整份執行即可。
-- ============================================================

-- 清乾淨(重建時方便;正式資料上線後請勿隨意執行 drop)
drop table if exists public.court_submissions cascade;
drop table if exists public.courts cascade;

-- ------------------------------------------------------------
-- 球場主表
-- ------------------------------------------------------------
create table public.courts (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,          -- 網址用,例如 "taipei-nangang-sports-center"
  name         text not null,                 -- 球場名稱
  city         text not null,                 -- 縣市,例如 "臺北市"
  district     text,                          -- 行政區,例如 "南港區"
  address      text,                          -- 完整地址
  lat          double precision not null,     -- 緯度
  lng          double precision not null,     -- 經度
  court_count  integer,                       -- 場地(片)數
  has_ac       boolean default false,         -- 有無冷氣
  phone        text,                          -- 聯絡電話
  booking_url  text,                          -- 線上預約連結(沒有可留空)
  opening_hours text,                         -- 營業時間(自由文字)
  price_note   text,                          -- 收費說明
  notes        text,                          -- 其他備註
  status       text not null default 'published', -- published / hidden
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index courts_city_idx on public.courts (city);
create index courts_status_idx on public.courts (status);

-- ------------------------------------------------------------
-- 使用者回報 / 新增球場(進審核佇列,不直接進主表)
-- ------------------------------------------------------------
create table public.court_submissions (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'new',   -- new(新增) / edit(修正) / report(回報錯誤)
  court_id    uuid references public.courts(id) on delete set null, -- edit/report 時指向哪家
  payload     jsonb not null,                -- 使用者填的內容
  contact     text,                          -- 回報者聯絡方式(選填)
  status      text not null default 'pending', -- pending / approved / rejected
  created_at  timestamptz not null default now()
);

create index submissions_status_idx on public.court_submissions (status);

-- ============================================================
--  Row Level Security(這是 Production 的關鍵:用 anon key 也安全)
-- ============================================================
alter table public.courts enable row level security;
alter table public.court_submissions enable row level security;

-- 任何人都能「讀取」已發佈的球場
create policy "public can read published courts"
  on public.courts for select
  using (status = 'published');

-- 任何人都能「新增」一筆回報(但不能讀別人的回報、不能改主表)
create policy "public can insert submissions"
  on public.court_submissions for insert
  with check (true);

-- 注意:沒有給 anon 任何 update/delete/select submissions 的權限,
-- 你要審核時,請用 Supabase Studio(以 service role 身分)操作。

-- ============================================================
--  雙北範例資料(座標為概略值,上線前請自行校正)
-- ============================================================
insert into public.courts
  (slug, name, city, district, address, lat, lng, court_count, has_ac, phone, booking_url, opening_hours, price_note)
values
  ('taipei-nangang-sports-center', '臺北市南港運動中心', '臺北市', '南港區',
   '臺北市南港區玉成街69號', 25.0552, 121.5850, 8, true,
   '02-2653-9108', 'https://www.nksports.com.tw/', '06:00-22:00', '依時段計費,約 NT$200-400/小時'),

  ('taipei-zhongshan-sports-center', '臺北市中山運動中心', '臺北市', '中山區',
   '臺北市中山區中山北路二段44巷2號', 25.0575, 121.5230, 6, true,
   '02-2521-6828', 'https://www.zsstadium.com.tw/', '06:00-22:00', '需線上或電話預約'),

  ('newtaipei-banqiao-gym', '新北市板橋體育館', '新北市', '板橋區',
   '新北市板橋區僑中一街1號', 25.0113, 121.4530, 10, false,
   '02-2963-4569', null, '09:00-21:00', '場地租借,無冷氣'),

  ('newtaipei-xinzhuang-sports-center', '新北市新莊國民運動中心', '新北市', '新莊區',
   '新北市新莊區公園路100號', 25.0360, 121.4510, 6, true,
   '02-2277-2222', 'https://www.xinzhuang-sport.com.tw/', '06:00-22:00', '會員/散客不同價');
