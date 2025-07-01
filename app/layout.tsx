import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}
        <a href="http://www.freevisitorcounters.com">more information</a>
        <Script
          strategy="afterInteractive"
          src="https://www.freevisitorcounters.com/auth.php?id=40d2bbfacb14a0e25c25d1f0263a1bffa8bef199"
        />
        <Script
          strategy="afterInteractive"
          src="https://www.freevisitorcounters.com/en/home/counter/1358444/t/2"
        />
      </body>
    </html>
  )
}
