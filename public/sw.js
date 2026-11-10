// CGU Faculty Search — offline support.
// The whole directory (data included) is one static page, so keeping a copy of it plus its
// build files lets students search and call even on weak campus Wi-Fi or with no signal.
//
//  • Pages ("/", "/?q=…"):        network first (always fresh), cached copy when offline
//  • /_next/static/*, icons:      cache first (file names change with every build)
//  • Other sites (visitor counter, Google Form, WhatsApp, Gmail): never touched
//
// On install (and after every fresh page load) the page's HTML is read and every build file it
// refers to is cached too — otherwise the first visit, which the worker doesn't control yet,
// would leave the CSS/JS uncached and the offline page unstyled.
const CACHE = "cgu-v2-2" // bump to drop old caches
const EXTRA = ["/manifest.webmanifest", "/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"]

function assetsIn(html) {
  const found = html.match(/(?:\/_next\/)?static\/(?:chunks|css|media)\/[^"'\s\\)]+/g) || []
  return [...new Set(found.map((u) => (u.startsWith("/_next/") ? u : `/_next/${u}`)))]
}

async function cachePage(res) {
  const c = await caches.open(CACHE)
  const html = await res.clone().text()
  await c.put("/", res)
  await Promise.all([...assetsIn(html), ...EXTRA].map((u) => c.match(u).then((hit) => hit || c.add(u)).catch(() => undefined)))
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch("/", { cache: "no-cache" })
      .then((res) => (res.ok ? cachePage(res) : undefined))
      .catch(() => undefined),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k.startsWith("cgu-") && k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req)
          if (res.ok && url.pathname === "/") event.waitUntil(cachePage(res.clone()))
          return res
        } catch {
          return (await caches.match("/")) || Response.error()
        }
      })(),
    )
    return
  }

  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:svg|png|ico|webmanifest|woff2?)$/.test(url.pathname)
  if (isStatic) {
    event.respondWith(
      (async () => {
        const hit = await caches.match(req, { ignoreSearch: true })
        if (hit) return hit
        const res = await fetch(req)
        if (res.ok) {
          const c = await caches.open(CACHE)
          await c.put(req, res.clone())
        }
        return res
      })(),
    )
  }
})
