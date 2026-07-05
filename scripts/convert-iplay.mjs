#!/usr/bin/env node
/**
 * 把體育署「全國運動場館」開放資料 CSV 轉成 Supabase 匯入 SQL。
 *
 * 用法: node scripts/convert-iplay.mjs <csv路徑> [--fresh]
 * 輸出: supabase/import-iplay.sql(--fresh 時為 supabase/reimport-fresh.sql)
 *
 * 一般模式:
 * - 只取 設施項目 = 羽球場(館) 且「對外開放或可租借」的場館
 * - 跳過與手動精選資料重複者;附加匯入(on conflict do nothing)
 *
 * --fresh 全新重建模式:
 * - 先 delete 全表,再匯入「全部」羽球場館(1,259 筆等級)
 * - 不對外開放且不可租借者一樣入庫,但 status = 'hidden'(網站不顯示)
 * - 每筆的 CSV 完整原始欄位存進 raw jsonb
 */
import { readFileSync, writeFileSync } from "fs";
import { createHash } from "crypto";

const csvPath = process.argv[2];
const FRESH = process.argv.includes("--fresh");
if (!csvPath) {
  console.error("用法: node scripts/convert-iplay.mjs <csv路徑> [--fresh]");
  process.exit(1);
}

// ---------- CSV 解析(RFC4180) ----------
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const CITY = {
  "63000": "臺北市", "65000": "新北市", "68000": "桃園市", "66000": "臺中市",
  "67000": "臺南市", "64000": "高雄市", "10002": "宜蘭縣", "10004": "新竹縣",
  "10005": "苗栗縣", "10007": "彰化縣", "10008": "南投縣", "10009": "雲林縣",
  "10010": "嘉義縣", "10013": "屏東縣", "10014": "臺東縣", "10015": "花蓮縣",
  "10016": "澎湖縣", "10017": "基隆市", "10018": "新竹市", "10020": "嘉義市",
  "09007": "連江縣", "9007": "連江縣", "09020": "金門縣", "9020": "金門縣",
};

// 一般(附加)模式下,與手動精選資料重複者跳過
const CURATED_CORES = [
  "中山運動中心", "中正運動中心", "大同運動中心", "松山運動中心",
  "萬華運動中心", "信義運動中心", "士林運動中心", "北投運動中心",
  "內湖運動中心", "南港運動中心", "文山運動中心", "大安運動中心",
  "臺北體育館", "華江羽球館", "新莊國民運動中心", "板橋國民運動中心",
  "板橋體育館", "三重國民運動中心", "中和國民運動中心", "永和國民運動中心",
  "土城國民運動中心", "新店國民運動中心", "蘆洲國民運動中心",
  "淡水國民運動中心", "汐止國民運動中心",
];

const sqlEsc = (s) => s.replace(/'/g, "''");
const sqlStr = (s) => (s == null || s === "" || s === "NULL" ? "null" : `'${sqlEsc(s)}'`);

const text = readFileSync(csvPath, "utf8").replace(/^﻿/, "");
const rows = parseCSV(text);
const header = rows[0];
const idx = Object.fromEntries(header.map((h, i) => [h, i]));
const col = (r, name) => (r[idx[name]] ?? "").trim();
const data = rows.slice(1).filter((r) => r.length === header.length);

const badminton = data.filter((r) => col(r, "設施項目") === "羽球場(館)");

const seen = new Set();
const out = [];
let skippedCurated = 0;
let hiddenCount = 0;

for (const r of badminton) {
  const open = col(r, "開放情形");
  const rent = col(r, "租借資訊");
  const isUsable =
    open.startsWith("免費") || open.startsWith("付費") ||
    rent.startsWith("免費") || rent.startsWith("付費");

  // 一般模式只收可用場館;--fresh 全收,不可用者標 hidden
  if (!FRESH && !isUsable) continue;

  const rawName = col(r, "場館名稱");
  const org = col(r, "場館隸屬機關");
  const city = CITY[col(r, "縣市")] ?? col(r, "縣市");
  const district = col(r, "行政區");
  const address = col(r, "地址").replace(/^\[\d+\]/, "");
  const lat = parseFloat(col(r, "緯度"));
  const lng = parseFloat(col(r, "經度"));
  if (!(lat > 20 && lat < 27 && lng > 117 && lng < 123)) continue;

  const name =
    rawName.length <= 5 || rawName.startsWith("羽球")
      ? `${org} ${rawName}`.trim()
      : rawName;

  if (!FRESH && CURATED_CORES.some((core) => name.includes(core))) { skippedCurated++; continue; }

  const key = `${name}|${address}`;
  if (seen.has(key)) continue;
  seen.add(key);

  const slug = "iplay-" + createHash("sha1").update(key).digest("hex").slice(0, 10);
  const days = col(r, "開放時間");
  const supplement = col(r, "開放及休館時間補充說明");
  const phone = col(r, "場館實際管理人電話");
  const site = col(r, "場館官方網站");

  const hours = days && days !== "NULL" ? `週${days}` : null;
  const priceNote = [open, rent].filter((s) => s && s !== "NULL").join(";");
  let notes = `${open}。資料來源:教育部體育署全國運動場館資料。`;
  if (supplement && supplement !== "NULL") notes += ` ${supplement.slice(0, 120)}`;

  const status = isUsable ? "published" : "hidden";
  if (!isUsable) hiddenCount++;

  // 完整原始欄位 → raw jsonb(略過空值與 NULL,控制檔案大小)
  const raw = {};
  header.forEach((h, i) => {
    const v = (r[i] ?? "").trim();
    if (v && v !== "NULL") raw[h] = v;
  });

  out.push(
    `(${sqlStr(slug)}, ${sqlStr(name)}, ${sqlStr(city)}, ${sqlStr(district)}, ${sqlStr(address)}, ` +
    `${lat}, ${lng}, null, null, ${sqlStr(phone)}, ` +
    `${sqlStr(/^https?:\/\//.test(site) ? site : null)}, ${sqlStr(hours)}, ${sqlStr(priceNote)}, ${sqlStr(notes)}, ` +
    `'${sqlEsc(JSON.stringify(raw))}'::jsonb, ${sqlStr(status)})`
  );
}

const BATCH = 200;
const COLS =
  "slug, name, city, district, address, lat, lng, court_count, has_ac, phone, booking_url, opening_hours, price_note, notes, raw, status";

let sql = `-- 體育署全國運動場館資料匯入(羽球場館 ${out.length} 筆,其中 hidden ${hiddenCount} 筆)
-- 由 scripts/convert-iplay.mjs 產生,可整份貼進 Supabase SQL Editor 執行。
-- 重複執行安全:slug 已存在的列會自動跳過。

-- 確保 raw 欄位存在(舊資料庫升級用)
alter table public.courts add column if not exists raw jsonb;

`;
if (FRESH) {
  sql += `-- 全新重建:先清空 courts
-- (delete 而非 truncate:保留 court_submissions 回報資料,FK 會自動設為 null)
delete from public.courts;

`;
}
for (let i = 0; i < out.length; i += BATCH) {
  sql += `insert into public.courts (${COLS})\nvalues\n`;
  sql += out.slice(i, i + BATCH).join(",\n");
  sql += `\non conflict (slug) do nothing;\n\n`;
}

const outFile = FRESH ? "supabase/reimport-fresh.sql" : "supabase/import-iplay.sql";
writeFileSync(outFile, sql);
console.log(`✓ 產出 ${outFile}`);
console.log(`  匯入筆數: ${out.length}(published ${out.length - hiddenCount} / hidden ${hiddenCount})`);
if (!FRESH) console.log(`  跳過(與精選重複): ${skippedCurated}`);
