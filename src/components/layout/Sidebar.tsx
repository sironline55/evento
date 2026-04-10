'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Users, BarChart2, Briefcase, Settings, ScanLine } from 'lucide-react'

const NAV = [
  { href: '/events',    label: 'الفعاليات',  icon: Calendar },
  { href: '/attendees', label: 'الحضور',      icon: Users },
  { href: '/analytics', label: 'التقارير',    icon: BarChart2 },
  { href: '/staffing',  label: 'الكوادر',     icon: Briefcase },
  { href: '/scanner',   label: 'الماسح',      icon: ScanLine },
  { href: '/settings',  label: 'الاعدادات',   icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: 200, background: '#fff',
      borderLeft: '1px solid #e5e7eb',
      display: 'flex', flexDirection: 'column',
      zIndex: 50, boxShadow: '-2px 0 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #f3f4f6' }}>
        <Link href="/events" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: '#e53e3e', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎪</div>
          <span style={{ fontWeight: 700, color: '#111', fontSize: 15 }}>EventVMS</span>
        </Link>
      </div>
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              textDecoration: 'none', fontSize: 14,
              fontWeight: active ? 600 : 400,
              color: active ? '#e53e3e' : '#374151',
              background: active ? '#fef2f2' : 'transparent',
              direction: 'rtl',
            }}>
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
