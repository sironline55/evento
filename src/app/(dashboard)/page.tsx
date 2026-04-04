'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy: '#1E0A3C', orange: '#F05537', text: '#39364F',
  muted: '#6F7287', border: '#DBDAE3', bg: '#FAFAFA', card: '#FFFFFF'
}

const STATUS: Record<string,{label:string;color:string;bg:string}> = {
  draft:     { label:'مسودة',  color:'#6F7287', bg:'#F8F7FA' },
  published: { label:'نشط',   color:'#3A7D0A', bg:'#EAF7E0' },
  active:    { label:'نشط',   color:'#3A7D0A', bg:'#EAF7E0' },
  completed: { label:'منتهي', color:'#6F7287', bg:'#F8F7FA' },
  cancelled: { label:'ملغي',  color:'#C6341A', bg:'#FDEDEA' },
}

export default function DashboardPage() {
  const [user, setUser]     = useState<any>(null)
  const [stats, setStats]   = useState({ events: 0, registrations: 0 })
  const [recent, setRecent] = useState<any[]>([])

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => setUser(data.user))
    Promise.all([
      sb.from('events').select('*', { count: 'exact', head: true }),
      sb.from('registrations').select('*', { count: 'exact', head: true }),
      sb.from('events').select('id,title,start_date,status').order('created_at', { ascending: false }).limit(5)
    ]).then(([ev, reg, rec]) => {
      setStats({ events: ev.count || 0, registrations: reg.count || 0 })
      setRecent(rec.data || [])
    })
  }, [])

  const name = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'مرحباً'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, direction: 'rtl' }}>

      {/* Header */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '32px 32px 28px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, margin: 0, color: C.navy, letterSpacing: '-1px' }}>
          أهلاً، {name}
        </h1>
      </div>

      {/* Body */}
      <div style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* ── Left: Create cards + recent ── */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            {[
              { title: 'إنشاء من الصفر', desc: 'أضف تفاصيل فعالتك وأنشئ التذاكر يدوياً', icon: '✏️', btn: 'إنشاء فعالية' },
              { title: 'إنشاء بشكل أسرع', desc: 'أجب على بعض الأسئلة وابدأ فوراً', icon: '✨', btn: 'إنشاء سريع' },
            ].map(card => (
              <Link key={card.title} href="/events/new" style={{ textDecoration: 'none' }}>
                <div
                  style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '32px 24px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#B4A7D6'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ fontSize: 36, marginBottom: 18 }}>{card.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 10px' }}>{card.title}</h3>
                  <p style={{ fontSize: 13, color: C.muted, margin: '0 0 22px', lineHeight: 1.6 }}>{card.desc}</p>
                  <button style={{ padding: '9px 20px', border: `1px solid ${C.border}`, borderRadius: 6, background: C.card, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: C.text }}>
                    {card.btn}
                  </button>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent events */}
          {recent.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.navy }}>آخر الفعاليات</h2>
                <Link href="/events" style={{ fontSize: 13, color: C.orange, textDecoration: 'none', fontWeight: 600 }}>عرض الكل</Link>
              </div>
              {recent.map((ev, i) => {
                const s   = STATUS[ev.status] || STATUS.draft
                const mo  = ev.start_date ? new Date(ev.start_date).toLocaleDateString('ar-SA', { month: 'short' }).toUpperCase() : ''
                const day = ev.start_date ? new Date(ev.start_date).getDate() : ''
                return (
                  <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration: 'none' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < recent.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8F7FA')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: C.orange, letterSpacing: '0.1em' }}>{mo}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: C.navy, lineHeight: 1 }}>{day || '—'}</div>
                      </div>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: C.navy, flex: 1 }}>{ev.title}</p>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Right: Organizer panel ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ width: 60, height: 60, background: '#E8E8ED', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 28 }}>🎪</div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: C.navy, margin: '0 0 6px' }}>{name}</h3>
          <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
            <button style={{ background: 'none', border: 'none', color: C.orange, cursor: 'pointer', fontWeight: 600, fontSize: 13, padding: 0 }}>عرض</button>
            <button style={{ background: 'none', border: 'none', color: C.orange, cursor: 'pointer', fontWeight: 600, fontSize: 13, padding: 0 }}>تعديل</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>{stats.events}</div>
              <div style={{ fontSize: 12, color: C.muted }}>الفعاليات</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>{stats.registrations}</div>
              <div style={{ fontSize: 12, color: C.muted }}>التسجيلات</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
