import Link from "next/link";

export default function NotFound() {
  return (
    <div className="detail">
      <h1>找不到頁面</h1>
      <p style={{ color: "var(--muted)" }}>這個球場或頁面不存在。</p>
      <Link className="btn" href="/">
        回地圖
      </Link>
    </div>
  );
}
