#!/usr/bin/env node
/**
 * 把體育署「全國運動場館」開放資料 CSV 轉成 Supabase 匯入 SQL。
 *
 * 用法: node scripts/convert-iplay.mjs <csv路徑>
 * 輸出: supabase/import-iplay.sql
 *
 * 規則:
 * - 只取 設施項目 = 羽球場(館)
 * - 只留「對外開放(免費/付費)」或「可租借(免費/付費)」的場館
 * - 同名同址去重;與現有精選資料(運動中心等)重複者跳過
 * - has_ac 一律 null(資料集無冷氣欄位,UI 顯示為未知)
 */
import { readFileSync, writeFileSync } from "fs";
import { createHash } from "crypto";

const csvPath = process.argv[2];
// --fresh:產出「清空重建」SQL(先 delete 全表,且不跳過精選場館,全部改用政府資料)
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

// 現有精選資料的核心名稱(匯入時跳過,保留手動整理的優質版本)
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

const usable = badminton.filter((r) => {
  const open = col(r, "開放情形");
  const rent = col(r, "租借資訊");
  return (
    open.startsWith("免費") || open.startsWith("付費") ||
    rent.startsWith("免費") || rent.startsWith("付費")
  );
});

const seen = new Set();
const out = [];
let skippedCurated = 0;

for (const r of usable) {
  const rawName = col(r, "場館名稱");
  const org = col(r, "場館隸屬機關");
  const city = CITY[col(r, "縣市")] ?? col(r, "縣市");
  const district = col(r, "行政區");
  const address = col(r, "地址").replace(/^\[\d+\]/, ""); // 去掉 [郵遞區號]
  const lat = parseFloat(col(r, "緯度"));
  const lng = parseFloat(col(r, "經度"));
  if (!(lat > 20 && lat < 27 && lng > 117 && lng < 123)) continue; // 座標檢查

  // 名稱太籠統時(如「羽球場館」),加上隸屬機關辨識
  const name =
    rawName.length <= 5 || rawName.startsWith("羽球")
      ? `${org} ${rawName}`.trim()
      : rawName;

  // 與精選資料重複者跳過(--fresh 模式不跳過,全部用政府資料)
  if (!FRESH && CURATED_CORES.some((core) => name.includes(core))) { skippedCurated++; continue; }

  // 同名同址去重
  const key = `${name}|${address}`;
  if (seen.has(key)) continue;
  seen.add(key);

  const slug = "iplay-" + createHash("sha1").update(key).digest("hex").slice(0, 10);

  const open = col(r, "開放情形");
  const rent = col(r, "租借資訊");
  const days = col(r, "開放時間");
  const supplement = col(r, "開放及休館時間補充說明");
  const phone = col(r, "場館實際管理人電話");
  const site = col(r, "場館官方網站");

  const hours = days && days !== "NULL" ? `週${days}` : null;
  const priceNote = [open, rent].filter((s) => s && s !== "NULL").join(";");
  let notes = `${open}。資料來源:教育部體育署全國運動場館資料。`;
  if (supplement && supplement !== "NULL") {
    notes += ` ${supplement.slice(0, 120)}`;
  }

  out.push(
    `(${sqlStr(slug)}, ${sqlStr(name)}, ${sqlStr(city)}, ${sqlStr(district)}, ${sqlStr(address)}, ` +
    `${lat}, ${lng}, null, null, ${sqlStr(phone)}, ` +
    `${sqlStr(/^https?:\/\//.test(site) ? site : null)}, ${sqlStr(hours)}, ${sqlStr(priceNote)}, ${sqlStr(notes)})`
  );
}

// 分批 INSERT(每批 200 筆),重跑安全(slug 衝突自動跳過)
const BATCH = 200;
let sql = `-- 體育署全國運動場館資料匯入(羽球場館,${out.length} 筆)
-- 由 scripts/convert-iplay.mjs 產生,可整份貼進 Supabase SQL Editor 執行。
-- 重複執行安全:slug 已存在的列會自動跳過。\n\n`;
if (FRESH) {
  sql = `-- 全新重建:先清空 courts 再匯入政府資料 ${out.length} 筆
-- (delete 而非 truncate:保留 court_submissions 回報資料,FK 會自動設為 null)
delete from public.courts;\n\n` + sql;
}
for (let i = 0; i < out.length; i += BATCH) {
  sql += `insert into public.courts (slug, name, city, district, address, lat, lng, court_count, has_ac, phone, booking_url, opening_hours, price_note, notes)\nvalues\n`;
  sql += out.slice(i, i + BATCH).join(",\n");
  sql += `\non conflict (slug) do nothing;\n\n`;
}

writeFileSync("supabase/import-iplay.sql", sql);
console.log(`✓ 產出 supabase/import-iplay.sql`);
console.log(`  匯入筆數: ${out.length}`);
console.log(`  跳過(與精選重複): ${skippedCurated}`);
