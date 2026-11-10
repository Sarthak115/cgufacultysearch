import type { Metadata, Viewport } from 'next'
import { ServiceWorkerRegister } from '@/components/sw-register'
import { ThemeProvider } from '@/components/theme-provider'
import { SITE_URL } from '@/lib/config'
import './globals.css'

const TITLE = 'CGU Faculty Search — faculty & office contacts'
const DESCRIPTION =
  'Find phone numbers, emails and departments of faculty, Deans, HODs and offices at C. V. Raman Global University (CGU), Bhubaneswar. Spelling-tolerant search; call, WhatsApp or email in one tap.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s · CGU Faculty Search' },
  description: DESCRIPTION,
  applicationName: 'CGU Faculty Search',
  keywords: [
    'CGU', 'C V Raman Global University', 'CGU faculty', 'CGU faculty contact', 'CGU HOD', 'CGU Dean',
    'CGU phone number', 'CV Raman Global University Bhubaneswar', 'faculty directory',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'CGU Faculty Search',
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
  // Icons live in public/ (not app/): Next 15.2's app/ icon loader crashed cached rebuilds.
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-icon.png', sizes: '180x180' }],
  },
  appleWebApp: { capable: true, title: 'CGU Faculty', statusBarStyle: 'default' },
  formatDetection: { telephone: false }, // we render our own call buttons
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7c3aed' },
    { media: '(prefers-color-scheme: dark)', color: '#110e1a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>

      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <ServiceWorkerRegister />
         {/* ✅ Visitor Counter Code */}
        {/* suppressHydrationWarning: the counter script rewrites this link's text before React loads.
            It's a React-only flag — the counter's HTML, id and scripts are unchanged. */}
        <a href="http://www.freevisitorcounters.com" suppressHydrationWarning>more information</a>
        {/* The counter must load synchronously (it writes itself into the page) — keep exactly as is. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          type="text/javascript"
          src="https://www.freevisitorcounters.com/auth.php?id=40d2bbfacb14a0e25c25d1f0263a1bffa8bef199"
        ></script>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          type="text/javascript"
          src="https://www.freevisitorcounters.com/en/home/counter/1358444/t/2"
        ></script>
      </body>
    </html>
  )
}
