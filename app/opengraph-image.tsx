// Preview image shown when the site link is shared on WhatsApp / Telegram / X. Built once at build time.
import { ImageResponse } from "next/og"

export const alt = "CGU Faculty Search — faculty & office contacts at C. V. Raman Global University"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 55%, #9333ea 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              background: "rgba(255,255,255,0.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
              <path d="M22 10v6" />
              <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
            </svg>
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2 }}>CGU Faculty Search</div>
        </div>
        <div style={{ marginTop: 36, fontSize: 38, opacity: 0.92 }}>
          Faculty &amp; office contacts · C. V. Raman Global University
        </div>
        <div style={{ marginTop: 48, display: "flex", gap: 18 }}>
          {["Search any spelling", "Call", "WhatsApp", "Email"].map((t) => (
            <div
              key={t}
              style={{ fontSize: 30, padding: "12px 26px", borderRadius: 999, background: "rgba(255,255,255,0.18)" }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  )
}
