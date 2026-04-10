export const dynamic = 'force-dynamic'
import type { Metadata } from "next"
import { Tajawal } from "next/font/google"
import "./globals.css"

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
})

export const metadata: Metadata = {
  title: "EventVMS — نظام إدارة الفعاليات",
  description: "منصة إدارة الفعاليات والكوادر البشرية",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-tajawal), 'Tajawal', Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
