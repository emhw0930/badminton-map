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
      <div className="form-page">
        <div className="form-card" style={{ alignItems: "center", textAlign: "center", gap: 12 }}>
          <div style={{ fontSize: 44 }}>🎉</div>
          <h1 style={{ margin: 0 }}>感謝你的回報!</h1>
          <p className="sub" style={{ margin: 0 }}>
            我們會盡快審核並更新地圖。
          </p>
          <Link className="btn primary" href="/">
            回地圖
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <Link href="/" className="back-link">
        ← 回地圖
      </Link>
      <h1>回報 / 新增球場</h1>
      <p className="sub">
        找不到某個球場,或發現資訊有誤?填一下,我們審核後就會更新到地圖。
      </p>

      <form className="form-card" onSubmit={handleSubmit}>
        <label className="field">
          <span>回報類型</span>
          <select name="kind" defaultValue="new">
            <option value="new">新增球場</option>
            <option value="edit">修正現有資訊</option>
            <option value="report">回報錯誤</option>
          </select>
        </label>

        <label className="field">
          <span>球場名稱 *</span>
          <input name="name" required placeholder="例:○○羽球館" />
        </label>

        <div className="field-row">
          <label className="field">
            <span>縣市</span>
            <input name="city" placeholder="臺北市" />
          </label>
          <label className="field">
            <span>行政區</span>
            <input name="district" placeholder="信義區" />
          </label>
        </div>

        <label className="field">
          <span>地址</span>
          <input name="address" placeholder="完整地址,方便我們定位" />
        </label>

        <div className="field-row">
          <label className="field">
            <span>場地數</span>
            <input name="court_count" type="number" min="1" placeholder="6" />
          </label>
          <label className="field checkbox">
            <input name="has_ac" type="checkbox" />
            <span>有冷氣</span>
          </label>
        </div>

        <label className="field">
          <span>營業時間</span>
          <input name="opening_hours" placeholder="06:00-22:00" />
        </label>

        <label className="field">
          <span>電話</span>
          <input name="phone" placeholder="02-xxxx-xxxx" />
        </label>

        <label className="field">
          <span>線上預約連結</span>
          <input name="booking_url" placeholder="https://…(沒有可留空)" />
        </label>

        <label className="field">
          <span>其他備註</span>
          <textarea name="notes" rows={3} placeholder="收費、注意事項…" />
        </label>

        <label className="field">
          <span>
            你的聯絡方式 <span className="hint">(選填,不會公開)</span>
          </span>
          <input name="contact" placeholder="Email 或 LINE,方便有問題時聯繫" />
        </label>

        {status === "err" && (
          <div className="notice err">送出失敗:{errMsg}</div>
        )}

        <button className="btn primary block" type="submit" disabled={status === "sending"}>
          {status === "sending" ? "送出中…" : "送出回報"}
        </button>
      </form>
    </div>
  );
}
