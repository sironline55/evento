'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar, Users, BarChart2, Briefcase,
  ScanLine, Settings, CreditCard, Building2, Tag
} from 'lucide-react'

const NAV = [
  { href: '/events',    label: 'الفعاليات',  icon: Calendar   },
  { href: '/attendees', label: 'الحضور',      icon: Users      },
  { href: '/analytics', label: 'التقارير',    icon: BarChart2  },
  { href: '/staffing',  label: 'الكوادر',     icon: Briefcase  },
  { href: '/influencers', label: 'المؤثرون',   icon: Users      },
  { href: '/briefs', label: 'الحملات',      icon: Tag     },
  { href: '/scanner',   label: 'الماسح',      icon: ScanLine   },
  { href: '/coupons',   label: 'الكوبونات',   icon: Tag        },
]

const BOTTOM_NAV = [
  { href: '/settings', label: 'الإعدادات',   icon: Settings   },
  { href: '/billing',  label: 'المالية',      icon: CreditCard },
  { href: '/accounts', label: 'الحسابات',     icon: Building2  },
  { href: '/influencers-admin', label: 'مراجعة المؤثرين', icon: Users      },
]

const NAVY   = '#1E0A3C'
const ORANGE = '#F05537'

export default function Sidebar() {
  const pathname = usePathname()

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link href={href} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 14px', borderRadius: 8, marginBottom: 2,
        background: active ? 'rgba(240,85,55,0.15)' : 'transparent',
        color: active ? ORANGE : 'rgba(255,255,255,0.75)',
        textDecoration: 'none', fontSize: 13, fontWeight: active ? 700 : 500,
        transition: 'all 0.15s',
      }}>
        <Icon size={16} strokeWidth={active ? 2.5 : 2} />
        <span style={{ fontFamily: "'Tajawal', sans-serif" }}>{label}</span>
      </Link>
    )
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: 200, background: NAVY, zIndex: 50,
      display: 'flex', flexDirection: 'column',
      direction: 'rtl', fontFamily: "'Tajawal', sans-serif",
    }}>
      {/* Logo */}
      <Link href="/events" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '16px 14px 12px', textDecoration: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>🎪</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>EventVMS</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>نظام الفعاليات</div>
        </div>
      </Link>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {NAV.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* Bottom nav */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {BOTTOM_NAV.map(item => <NavItem key={item.href} {...item} />)}
      </div>

      {/* Version */}
      <div style={{
        padding: '8px 14px', fontSize: 10,
        color: 'rgba(255,255,255,0.3)', textAlign: 'center',
      }}>
        v1.1.97 BETA
      </div>
    </div>
  )
}
