'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar, Users, BarChart2, Briefcase,
  Settings, ScanLine, CreditCard, Building2
} from 'lucide-react'

const NAV = [
  { href: '/events',    label: 'الفعاليات',  icon: Calendar   },
  { href: '/attendees', label: 'الحضور',      icon: Users      },
  { href: '/analytics', label: 'التقارير',    icon: BarChart2  },
  { href: '/staffing',  label: 'الكوادر',     icon: Briefcase  },
  { href: '/scanner',   label: 'الماسح',      icon: ScanLine   },
  { href: '/settings',  label: 'الإعدادات',   icon: Settings   },
]

const BOTTOM_NAV = [
  { href: '/billing',  label: 'المالية',      icon: CreditCard },
  { href: '/accounts', label: 'الحسابات',     icon: Building2  },
]

/* Qoyod sidebar palette — using EventVMS navy */
const S = {
  bg:         '#1E0A3C',   /* navy brand color */
  bgHover:    '#2D1550',   /* lighter navy */
  bgActive:   '#F05537',   /* orange brand = active */
  text:       '#C4BAD8',   /* soft lavender-white */
  textActive: '#FFFFFF',
  divider:    'rgba(255,255,255,0.08)',
  logo:       '#FFFFFF',
}

export default function Sidebar() {
  const pathname = usePathname()

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link href={href} style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 14px',
        borderRadius: 7,
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: active ? 700 : 400,
        color: active ? S.textActive : S.text,
        background: active ? S.bgActive : 'transparent',
        transition: 'background 0.15s, color 0.15s',
        direction: 'rtl',
        letterSpacing: '0.01em',
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = S.bgHover
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
      }}>
        <Icon
          size={17}
          strokeWidth={active ? 2.2 : 1.6}
          color={active ? '#fff' : S.text}
        />
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <aside style={{
      position: 'fixed',
      top: 0, right: 0, bottom: 0,
      width: 200,
      background: S.bg,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
      direction: 'rtl',
    }}>

      {/* Logo */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: `1px solid ${S.divider}`,
      }}>
        <Link href="/events" style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 32, height: 32,
            background: '#F05537',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Calendar size={17} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: S.logo, letterSpacing: '0.02em' }}>
              EventVMS
            </div>
            <div style={{ fontSize: 10, color: S.text, marginTop: 1 }}>
              إدارة الفعاليات
            </div>
          </div>
        </Link>
      </div>

      {/* Main Nav */}
      <nav style={{
        flex: 1,
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflowY: 'auto',
      }}>
        {NAV.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* Bottom Nav */}
      <div style={{
        padding: '8px 8px 14px',
        borderTop: `1px solid ${S.divider}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {BOTTOM_NAV.map(item => <NavItem key={item.href} {...item} />)}
      </div>
    </aside>
  )
}
