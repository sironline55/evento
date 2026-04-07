'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import Link from 'next/link'


export default function EventDetailPage() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { id } = useParams()
  const [event, setEvent] = useState<any>(null)
  const [registrations, setRegistrations] = useState<any[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      sb.from('events').select('*').eq('id', id).single(),
      sb.from('registrations').select('id,guest_name,guest_email,guest_phone,status,created_at').eq('event_id', id).order('created_at', { ascending: false }).limit(10),
      sb.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', id)
    ]).then(([ev, regs, c]) => {
      setEvent(ev.data); setRegistrations(regs.data || []); setCount(c.count || 0); setLoading(false)
    })
  }, [id])

  async function copyRegLink() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await navigator.clipboard.writeText(window.location.origin + '/r/' + id)
    alert('تم نسخ رابط التسجيل!')
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>جاري التحميل...</div>
  if (!event) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>الفعالية غير موجودة</div>

  const statusColors: any = { draft: '#f3f4f6', published: '#dbeafe', active: '#dcfce7', completed: '#f3f4f6', cancelled: '#fef2f2' }
  const statusText: any = { draft: '#374151', published: '#1e40af', active: '#166534', completed: '#374151', cancelled: '#dc2626' }
  const statusLabels: any = { draft: 'مسودة', published: 'منشور', active: 'نشط', completed: 'مكتمل', cancelled: 'ملغي' }

  const attended = registrations.filter(r => r.status === 'attended').length

  return (
    <div style={{ padding: 24, direction: 'rtl' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href="/events" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>← الفعاليات</Link>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{event.title}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{event.title}</h1>
          {event.location && <p style={{ color: '#666', marginTop: 4, fontSize: 14 }}>📍 {event.location}</p>}
          {event.start_date && <p style={{ color: '#666', marginTop: 2, fontSize: 14 }}>📅 {new Date(event.start_date).toLocaleDateString('ar-SA')}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={copyRegLink} style={{ padding: '10px 18px', background: '#f3f4f6', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>📋 نسخ رابط التسجيل</button>
          <Link href={'/scanner'} style={{ padding: '10px 18px', background: '#F05537', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>📷 فتح الماسح</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'إجمالي المسجلين', value: count, color: '#F05537' },
          { label: 'حضروا', value: attended, color: '#0891b2' },
          { label: 'الحالة', value: statusLabels[event.status] || 'مسودة', color: statusText[event.status] }
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f0f0f0', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px' }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>آخر المسجلين ({count})</h2>
          <Link href={'/events/' + id + '/attendees'} style={{ fontSize: 13, color: '#F05537', textDecoration: 'none', fontWeight: 500 }}>عرض الكل ←</Link>
        </div>
        {registrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#999' }}>
            <p>لا يوجد مسجلون بعد</p>
            <button onClick={copyRegLink} style={{ background: '#F05537', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginTop: 8 }}>
              📋 مشاركة رابط التسجيل
            </button>
          </div>
        ) : (
          registrations.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < registrations.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div>
                <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{r.guest_name}</p>
                <p style={{ color: '#666', margin: 0, fontSize: 12 }}>{r.guest_phone || r.guest_email || ''}</p>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: r.status === 'attended' ? '#dcfce7' : '#f3f4f6', color: r.status === 'attended' ? '#166534' : '#374151' }}>
                {r.status === 'attended' ? 'حضر' : 'مسجل'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
