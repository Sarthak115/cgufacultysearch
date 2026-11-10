// Makes the site installable ("Add to Home screen") — it then opens like an app.
import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CGU Faculty Search",
    short_name: "CGU Faculty",
    description: "Faculty & office contacts at C. V. Raman Global University — search, call, WhatsApp.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf7fd",
    theme_color: "#7c3aed",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
