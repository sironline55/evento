'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Props {
  title: string
  subtitle?: string
  back?: string
  action?: { label: string; href?: string; onClick?: () => void; icon?: string }
  color?: string
}

const C = { navy:'#1E0A3C', orange:'#F05537', muted:'rgba(255,255,255,.6)' }

export default function MobilePageHeader({ title, subtitle, back, action, color = C.navy }: Props) {
  const router = useRouter()

  return (
    <div
      className="md:hidden"
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: color,
        padding: '12px 16px 14px',
        paddingTop: `max(12px, env(safe-area-inset-top))`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {/* Back button */}
        {back ? (
          <Link href={back} style={{
            width: 36, height: 36, background: 'rgba(255,255,255,.12)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', fontSize: 16, flexShrink: 0
          }}>←</Link>
        ) : (
          <div style={{ width: 36, height: 36, flexShrink: 0 }}/>
        )}

        {/* Title */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2 }}>{title}</p>
          {subtitle && <p style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', margin: '2px 0 0' }}>{subtitle}</p>}
        </div>

        {/* Action button */}
        {action ? (
          action.href ? (
            <Link href={action.href} style={{
              padding: '7px 12px', background: C.orange, color: '#fff',
              borderRadius: 10, textDecoration: 'none', fontSize: 12, fontWeight: 700,
              flexShrink: 0, whiteSpace: 'nowrap'
            }}>{action.icon && <span style={{ marginLeft: 4 }}>{action.icon}</span>}{action.label}</Link>
          ) : (
            <button onClick={action.onClick} style={{
              padding: '7px 12px', background: C.orange, color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0
            }}>{action.icon && <span style={{ marginLeft: 4 }}>{action.icon}</span>}{action.label}</button>
          )
        ) : (
          <div style={{ width: 36, height: 36, flexShrink: 0 }}/>
        )}
      </div>
    </div>
  )
}
