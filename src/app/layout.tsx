export const dynamic = 'force-dynamic'
import type { Metadata } from "next"
import { ToastProvider } from '@/components/ui/Toast'
import { Tajawal } from "next/font/google"
import "./globals.css"

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
})

export const viewport = {
  themeColor: '#1E0A3C',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: "EventVMS — نظام إدارة الفعاليات",
  description: "منصة إدارة الفعاليات والكوادر البشرية",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EventVMS",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  }
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-tajawal), 'Tajawal', Arial, sans-serif" }}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
