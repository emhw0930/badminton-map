"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "ok" | "err";

export default function SubmitPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errMsg, setErrMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrMsg("");

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: fd.get("name"),
      city: fd.get("city"),
      district: fd.get("district"),
      address: fd.get("address"),
      court_count: fd.get("court_count"),
      has_ac: fd.get("has_ac") === "on",
      phone: fd.get("phone"),
      booking_url: fd.get("booking_url"),
      opening_hours: fd.get("opening_hours"),
      notes: fd.get("notes"),
    };

    // 未設定 Supabase 時,直接視為成功(方便本機試玩)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setStatus("ok");
      form.reset();
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("court_submissions").insert({
      kind: fd.get("kind") || "new",
      payload,
      contact: fd.get("contact"),
    });

    if (error) {
      setStatus("err");
      setErrMsg(error.message);
    } else {
      setStatus("ok");
      form.reset();
    }
  }

  if (status === "ok") {
    return (
      <div className="form">
        <div className="notice ok">
          ✅ 感謝回報!我們會盡快審核並更新地圖。
        </div>
        <Link href="/">← 回地圖</Link>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h1>回報 / 新增球場</h1>
      <p className="hint">
        找不到某個球場,或發現資訊有誤?填一下,我們審核後就會更新。
      </p>

      <label>
        回報類型
        <select name="kind" defaultValue="new">
          <option value="new">新增球場</option>
          <option value="edit">修正現有資訊</option>
          <option value="report">回報錯誤</option>
        </select>
      </label>

      <label>
        球場名稱 *
        <input name="name" required placeholder="例:○○羽球館" />
      </label>

      <div style={{ display: "flex", gap: 12 }}>
        <label style={{ flex: 1 }}>
          縣市
          <input name="city" placeholder="臺北市" />
        </label>
        <label style={{ flex: 1 }}>
          行政區
          <input name="district" placeholder="信義區" />
        </label>
      </div>

      <label>
        地址
        <input name="address" placeholder="完整地址,方便我們定位" />
      </label>

      <div style={{ display: "flex", gap: 12, alignItems: "end" }}>
        <label style={{ flex: 1 }}>
          場地數
          <input name="court_count" type="number" min="1" placeholder="6" />
        </label>
        <label
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <input name="has_ac" type="checkbox" />
          有冷氣
        </label>
      </div>

      <label>
        營業時間
        <input name="opening_hours" placeholder="06:00-22:00" />
      </label>

      <label>
        電話
        <input name="phone" placeholder="02-xxxx-xxxx" />
      </label>

      <label>
        線上預約連結
        <input name="booking_url" placeholder="https://…(沒有可留空)" />
      </label>

      <label>
        其他備註
        <textarea name="notes" rows={3} placeholder="收費、注意事項…" />
      </label>

      <label>
        你的聯絡方式(選填)
        <input name="contact" placeholder="Email 或 LINE,方便有問題時聯繫" />
        <span className="hint">不會公開顯示。</span>
      </label>

      {status === "err" && (
        <div className="notice err">送出失敗:{errMsg}</div>
      )}

      <button
        className="btn"
        type="submit"
        disabled={status === "sending"}
        style={{ border: "none", cursor: "pointer" }}
      >
        {status === "sending" ? "送出中…" : "送出回報"}
      </button>
    </form>
  );
}
