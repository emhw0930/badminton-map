# 🏸 台灣羽球地圖

在地圖上查詢台灣羽球場資訊:幾片場地、營業時間、有無冷氣、收費與線上預約連結。
Production 等級、零成本可上線的 side project。

## 技術棧(全部免費、免綁信用卡)

| 層 | 技術 |
|---|---|
| 前端 | Next.js 15 (App Router) + React 19 + TypeScript |
| 地圖 | MapLibre GL + OpenFreeMap 向量圖磚(免 API key) |
| 資料庫 / 後端 | Supabase(Postgres + Auth + 內建後台) |
| 後台管理 | Supabase Studio(不用另寫 admin) |
| 部署 | Cloudflare Pages 或 Vercel |

## 特色

- 🗺️ 互動地圖 + 側欄清單,支援縣市 / 關鍵字 / 有無冷氣篩選
- 📄 每個球場一個獨立網址(`/courts/[slug]`),SSR 產生、可被 Google 收錄
- 📝 使用者「回報 / 新增球場」表單,進審核佇列(RLS 保護)
- 🔍 內建 sitemap.xml、robots.txt、OpenGraph metadata
- 🧪 **未設定 Supabase 也能跑**:自動 fallback 到示範資料

---

## 本機開發

```bash
npm install
npm run dev      # 開 http://localhost:3000,即使沒設定 Supabase 也能看到示範資料
```

其他指令:

```bash
npm run build      # 產生 production build
npm run typecheck  # 型別檢查
```

---

## 連接 Supabase(正式資料)

1. 到 [supabase.com](https://supabase.com) 免費開一個專案(不需信用卡)。
2. 打開 **SQL Editor**,把 [`supabase/schema.sql`](supabase/schema.sql) 整份貼上執行。
   這會建立 `courts`、`court_submissions` 兩張表、設定 RLS 權限,並塞入雙北範例資料。
3. 到 **Project Settings → API**,複製 `Project URL` 與 `anon public` key。
4. 複製環境變數範本並填入:

   ```bash
   cp .env.local.example .env.local
   # 編輯 .env.local,填入 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

5. 重啟 `npm run dev`,現在資料就來自 Supabase 了。

### 管理資料 / 審核回報

- 直接在 **Supabase Studio → Table Editor** 編輯 `courts`(這就是你的後台)。
- 使用者的回報會進 `court_submissions`(`status = pending`)。審核後手動把內容
  搬進 `courts`、並把該筆 `status` 改成 `approved`。

> 安全性:前端只用 `anon` key,資料權限由資料庫 RLS 決定 —— 一般人只能讀已發佈的
> 球場、只能新增回報,不能改你的主資料。

---

## 部署(免費)

### Vercel(最快)

1. 把專案推上 GitHub。
2. 到 [vercel.com](https://vercel.com) 匯入這個 repo。
3. 在 Vercel 專案的 **Environment Variables** 填入:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`(你的正式網域,sitemap 會用到)
4. Deploy,拿到免費的 `*.vercel.app` 網址。

### Cloudflare Pages

同樣連 GitHub,framework 選 Next.js,填入相同環境變數即可。

---

## 資料維護建議

- **先做深、再做廣**:第一版把雙北做到最完整,再擴張其他縣市。
- **經緯度**:在 Google Maps 對球場點右鍵,第一行就是 `lat, lng`,複製即可。
- **靠社群補資料**:上線後把 `/submit` 表單連結丟到羽球社團,讓使用者幫你補。

## 專案結構

```
supabase/schema.sql          資料庫 schema + RLS + 範例資料
src/
  app/
    layout.tsx               全站外框 / 導覽 / metadata
    page.tsx                 地圖首頁(Server Component)
    courts/[slug]/page.tsx   球場詳情頁(SSR + SEO)
    submit/page.tsx          回報 / 新增球場表單
    sitemap.ts, robots.ts    SEO
  components/
    MapExplorer.tsx          篩選 + 側欄 + 地圖(Client)
    MapView.tsx              MapLibre 地圖本體
  lib/
    courts.ts                取球場資料(Supabase,含 fallback)
    supabase/                Supabase client(server / browser)
    types.ts
  data/sample.ts             未接 Supabase 時的示範資料
```
