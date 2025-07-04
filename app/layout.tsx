import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CGU Faculty Search',
  description: 'Explore a comprehensive directory of faculty members at C.V. Raman Global University. Easily find department-wise contact details, email addresses, and designations to connect with professors and teaching staff—built to make academic communication faster and smoother for students.',
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
         {/* ✅ Visitor Counter Code */}
        <a href="http://www.freevisitorcounters.com">more information</a>
        <script
          type="text/javascript"
          src="https://www.freevisitorcounters.com/auth.php?id=40d2bbfacb14a0e25c25d1f0263a1bffa8bef199"
        ></script>
        <script
          type="text/javascript"
          src="https://www.freevisitorcounters.com/en/home/counter/1358444/t/2"
        ></script>
      </body>
    </html>
  )
}
