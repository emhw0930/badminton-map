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
--  雙北真實球場初版資料(2026-07 整理)
--  來源:台北市運動中心預約系統、新北市體育局、各中心官網。
--  座標為概略值;標註「請以官網公告為準」者,場數/地址待校正。
-- ============================================================
insert into public.courts
  (slug, name, city, district, address, lat, lng, court_count, has_ac, phone, booking_url, opening_hours, price_note, notes)
values
  -- 臺北市 12 間運動中心(統一預約:booking-tpsc.sporetrofit.com)
  ('taipei-zhongshan-sports-center', '臺北市中山運動中心', '臺北市', '中山區',
   '臺北市中山區中山北路二段44巷2號', 25.0578, 121.5223, 6, true,
   '02-2521-6828', 'https://booking-tpsc.sporetrofit.com/', '06:00-22:00', '依時段計費,請以預約系統為準', null),
  ('taipei-zhongzheng-sports-center', '臺北市中正運動中心', '臺北市', '中正區',
   '臺北市中正區信義路一段1號', 25.0339, 121.5187, 5, true,
   null, 'https://booking-tpsc.sporetrofit.com/', '06:00-22:00', '依時段計費,請以預約系統為準', null),
  ('taipei-datong-sports-center', '臺北市大同運動中心', '臺北市', '大同區',
   '臺北市大同區大龍街51號', 25.0669, 121.5153, null, true,
   '02-2592-0055', 'https://booking-tpsc.sporetrofit.com/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('taipei-songshan-sports-center', '臺北市松山運動中心', '臺北市', '松山區',
   '臺北市松山區敦化北路1號', 25.0480, 121.5488, null, true,
   null, 'https://booking-tpsc.sporetrofit.com/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('taipei-wanhua-sports-center', '臺北市萬華運動中心', '臺北市', '萬華區',
   '臺北市萬華區西寧南路6-1號', 25.0448, 121.5062, null, true,
   '02-2375-9900', 'https://booking-tpsc.sporetrofit.com/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('taipei-xinyi-sports-center', '臺北市信義運動中心', '臺北市', '信義區',
   '臺北市信義區松勤街100號', 25.0312, 121.5657, null, true,
   null, 'https://booking-tpsc.sporetrofit.com/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('taipei-shilin-sports-center', '臺北市士林運動中心', '臺北市', '士林區',
   '臺北市士林區士商路1號', 25.0898, 121.5233, null, true,
   '02-2880-6066', 'https://booking-tpsc.sporetrofit.com/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('taipei-beitou-sports-center', '臺北市北投運動中心', '臺北市', '北投區',
   '臺北市北投區石牌路一段39巷100號', 25.1148, 121.5157, null, true,
   null, 'https://booking-tpsc.sporetrofit.com/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('taipei-neihu-sports-center', '臺北市內湖運動中心', '臺北市', '內湖區',
   '臺北市內湖區洲子街12號', 25.0796, 121.5748, null, true,
   null, 'https://booking-tpsc.sporetrofit.com/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('taipei-nangang-sports-center', '臺北市南港運動中心', '臺北市', '南港區',
   '臺北市南港區玉成街69號', 25.0552, 121.5850, 8, true,
   '02-2653-9108', 'https://booking-tpsc.sporetrofit.com/', '06:00-22:00', '依時段計費,請以預約系統為準', null),
  ('taipei-wenshan-sports-center', '臺北市文山運動中心', '臺北市', '文山區',
   '臺北市文山區興隆路三段222號', 24.9987, 121.5580, null, true,
   null, 'https://booking-tpsc.sporetrofit.com/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('taipei-daan-sports-center', '臺北市大安運動中心', '臺北市', '大安區',
   '臺北市大安區辛亥路三段55號', 25.0180, 121.5450, 12, true,
   '02-2377-0300', 'https://booking-tpsc.sporetrofit.com/', '06:00-22:00', '網路可預約 14 日內場地;依時段計費', null),

  -- 臺北市 其他
  ('taipei-gymnasium', '臺北體育館', '臺北市', '松山區',
   '臺北市松山區南京東路四段10號', 25.0516, 121.5498, null, true,
   null, 'https://vbs.sports.taipei/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('taipei-huajiang-badminton', '華江羽球館', '臺北市', '萬華區',
   null, 25.0330, 121.4930, null, false,
   '02-2339-0100', null, '平日 05:30-23:00 / 假日 06:00-22:00', '電話預約', '橋下場館;初版整理資料,場數與細節請以官網公告為準'),

  -- 新北市
  ('newtaipei-xinzhuang-sports-center', '新北市新莊國民運動中心', '新北市', '新莊區',
   '新北市新莊區公園路11號', 25.0402, 121.4327, null, true,
   null, 'https://www.xzsports.com.tw/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('newtaipei-banqiao-sports-center', '新北市板橋國民運動中心', '新北市', '板橋區',
   null, 25.0060, 121.4430, null, true,
   '02-2258-8886', 'https://www.bqsports.com.tw/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('newtaipei-banqiao-gym', '新北市板橋體育館', '新北市', '板橋區',
   '新北市板橋區僑中一街1號', 25.0113, 121.4530, 10, false,
   '02-2963-4569', null, '09:00-21:00', '場地租借,無冷氣', null),
  ('newtaipei-sanchong-sports-center', '新北市三重國民運動中心', '新北市', '三重區',
   null, 25.0720, 121.4840, null, true,
   null, 'http://www.scsports.com.tw/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('newtaipei-zhonghe-sports-center', '新北市中和國民運動中心', '新北市', '中和區',
   '新北市中和區錦和路350-2號', 24.9968, 121.4855, null, true,
   '02-2242-9222', 'https://www.zhsc.com.tw/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('newtaipei-yonghe-sports-center', '新北市永和國民運動中心', '新北市', '永和區',
   null, 25.0100, 121.5160, null, true,
   '02-2231-8989', 'https://yhcsc.cyc.org.tw/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('newtaipei-tucheng-sports-center', '新北市土城國民運動中心', '新北市', '土城區',
   '新北市土城區金城路二段247-1號', 24.9880, 121.4520, null, true,
   '02-2261-5999', 'https://www.tcsports.com.tw/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('newtaipei-xindian-sports-center', '新北市新店國民運動中心', '新北市', '新店區',
   null, 24.9720, 121.5390, null, true,
   null, 'https://www.xdsports.com.tw/', '06:00-22:00', '尖峰 490/hr、離峰 290/hr(每面)', '初版整理資料,場數與細節請以官網公告為準'),
  ('newtaipei-luzhou-sports-center', '新北市蘆洲國民運動中心', '新北市', '蘆洲區',
   null, 25.0870, 121.4640, null, true,
   null, 'https://lzcsc.cyc.org.tw/', '06:00-22:00', '離峰 300/hr、尖峰 500/hr(每面)', '初版整理資料,場數與細節請以官網公告為準'),
  ('newtaipei-tamsui-sports-center', '新北市淡水國民運動中心', '新北市', '淡水區',
   null, 25.1800, 121.4500, null, true,
   null, 'https://wstssc.com.tw/', '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準'),
  ('newtaipei-xizhi-sports-center', '新北市汐止國民運動中心', '新北市', '汐止區',
   null, 25.0650, 121.6550, null, true,
   null, null, '06:00-22:00', '依時段計費,請以預約系統為準', '初版整理資料,場數與細節請以官網公告為準');
