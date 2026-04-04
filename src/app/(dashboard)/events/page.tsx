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

export default function EventsPage() {
  const [events, setEvents]         = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState('all')
  const [tab, setTab]               = useState('events')

  useEffect(() => {
    sb.from('events')
      .select('id,title,start_date,status,location,capacity')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setEvents(data || []); setLoading(false) })
  }, [])

  const filtered = events.filter(e => {
    const ms = !search || e.title?.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'all' || e.status === filter
    return ms && mf
  })

  return (
    <div style={{ minHeight: '100vh', background: C.bg, direction: 'rtl' }}>

      {/* ── Page header ── */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '24px 32px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: 0, color: C.navy, letterSpacing: '-1px' }}>
            الفعاليات
          </h1>
          <Link href="/events/new" style={{
            background: C.orange, color: '#fff', padding: '10px 22px',
            borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontSize: 14
          }}>
            + إنشاء فعالية
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex' }}>
          {[['events','الفعاليات'], ['collections','المجموعات']].map(([v,l]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 500,
              color: tab === v ? C.orange : C.muted,
              borderBottom: tab === v ? `2px solid ${C.orange}` : '2px solid transparent',
              transition: 'all 0.15s', marginBottom: -1
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── Filters row ── */}
      <div style={{ background: C.card, padding: '10px 32px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث في الفعاليات..."
            style={{ padding: '7px 12px 7px 32px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, outline: 'none', background: C.bg, fontFamily: 'inherit', color: C.text, width: 200 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all','الكل'],['draft','مسودة'],['published','نشط'],['completed','منتهي'],['cancelled','ملغي']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{
              padding: '6px 14px', borderRadius: 50,
              border: `1px solid ${filter === v ? C.orange : C.border}`,
              background: filter === v ? '#FEF0ED' : 'transparent',
              color: filter === v ? C.orange : C.text,
              fontSize: 12, fontWeight: 600, cursor: 'pointer'
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '0 32px 40px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: C.muted }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📅</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 8 }}>لا توجد فعاليات</h2>
            <p style={{ color: C.muted, marginBottom: 24 }}>ابدأ بإنشاء أول فعالية الآن</p>
            <Link href="/events/new" style={{ background: C.orange, color: '#fff', padding: '12px 24px', borderRadius: 6, textDecoration: 'none', fontWeight: 700 }}>
              إنشاء فعالية
            </Link>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 120px', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, marginTop: 8 }}>
              <span>الفعالية</span><span>مبيعات</span><span>تسجيلات</span><span>الحالة</span>
            </div>

            {filtered.map(ev => {
              const s   = STATUS[ev.status] || STATUS.draft
              const mo  = ev.start_date ? new Date(ev.start_date).toLocaleDateString('ar-SA', { month: 'short' }).toUpperCase() : ''
              const day = ev.start_date ? new Date(ev.start_date).getDate() : ''
              const dt  = ev.start_date ? new Date(ev.start_date).toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

              return (
                <div key={ev.id}
                  style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 120px', padding: '14px 16px', alignItems: 'center', borderBottom: `1px solid ${C.border}`, background: C.card, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8F7FA')}
                  onMouseLeave={e => (e.currentTarget.style.background = C.card)}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    {/* Date block */}
                    <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: C.orange, letterSpacing: '0.1em' }}>{mo}</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: C.navy, lineHeight: 1 }}>{day || '—'}</div>
                    </div>
                    <div>
                      <Link href={`/events/${ev.id}`} style={{ fontWeight: 700, fontSize: 15, color: C.navy, textDecoration: 'none', display: 'block' }}>
                        {ev.title}
                      </Link>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                        {ev.location ?? 'فعالية عبر الإنترنت'} · {dt}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, color: C.text }}>0 / {ev.capacity || '∞'}</span>
                  <span style={{ fontSize: 13, color: C.text }}>0</span>
                  <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                </div>
              )
            })}

            {/* CSV export */}
            <div style={{ padding: '14px 0' }}>
              <button style={{ background: 'none', border: 'none', color: C.orange, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                ↓ تصدير CSV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
