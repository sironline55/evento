'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AttendeesClient() {
  const { id } = useParams()
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!id) return
    sb.from('registrations').select('*').eq('event_id', id).order('created_at', { ascending: false })
      .then(({ data }) => { setRegistrations(data || []); setLoading(false) })
  }, [id])

  const filtered = registrations.filter(r =>
    !search || r.guest_name?.toLowerCase().includes(search.toLowerCase()) || r.guest_phone?.includes(search)
  )
  const stats = {
    total: registrations.length,
    attended: registrations.filter(r => r.status === 'attended').length,
    registered: registrations.filter(r => r.status === 'registered').length,
  }

  return (
    <div style={{ padding: 24, direction: 'rtl' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href={`/events/${id}`} style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>← الفعالية</Link>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>المسجلون</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[{ label: 'إجمالي', value: stats.total, color: '#2B6E64' }, { label: 'حضروا', value: stats.attended, color: '#0891b2' }, { label: 'مسجلون', value: stats.registered, color: '#7c3aed' }].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #f0f0f0', textAlign: 'center' }}>
            <p style={{ fontSize: 26, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: '#666', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
        style={{ width: '100%', maxWidth: 360, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, marginBottom: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>جاري التحميل...</div>
      : filtered.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#999', background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0' }}>لا توجد تسجيلات</div>
      : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: '#f9fafb', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', gap: 12, fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
            <span>الاسم</span><span>الجوال</span><span>التاريخ</span><span>الحالة</span>
          </div>
          {filtered.map((r, i) => (
            <div key={r.id} style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', gap: 12, alignItems: 'center', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}>
              <div>
                <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{r.guest_name}</p>
                {r.guest_email && <p style={{ color: '#666', margin: 0, fontSize: 12 }}>{r.guest_email}</p>}
              </div>
              <span style={{ color: '#666', fontSize: 13 }}>{r.guest_phone || '—'}</span>
              <span style={{ color: '#666', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</span>
              <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: r.status === 'attended' ? '#dcfce7' : '#f3f4f6', color: r.status === 'attended' ? '#166534' : '#374151' }}>
                {r.status === 'attended' ? 'حضر' : 'مسجل'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
