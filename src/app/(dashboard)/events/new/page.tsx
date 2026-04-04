'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function NewEventPage() {
  const [form, setForm] = useState({
    title: '', description: '', location: '',
    start_date: '', end_date: '', capacity: '',
    status: 'draft' as 'draft' | 'published'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1px solid #e5e7eb',
    borderRadius: 10, fontSize: 14, boxSizing: 'border-box',
    outline: 'none', background: '#fafafa', fontFamily: 'inherit'
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setError('يجب تسجيل الدخول أولاً'); setLoading(false); return }

    const { data, error: err } = await sb.from('events').insert({
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      capacity: form.capacity ? parseInt(form.capacity) : null,
      status: form.status,
      created_by: user.id,
      is_public: true,
    }).select('id').single()

    if (err) { setError(err.message); setLoading(false) }
    else router.push('/events/' + data!.id)
  }

  return (
    <div style={{ padding: 24, direction: 'rtl', maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/events" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>← الفعاليات</Link>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>فعالية جديدة</span>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>إنشاء فعالية جديدة</h1>
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}
      <form onSubmit={create}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>اسم الفعالية *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="معرض الفعاليات السعودية 2025" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>الوصف</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="وصف الفعالية..." rows={3} style={{ ...inp, resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>الموقع</label>
            <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="الرياض، فندق..." style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>تاريخ البداية *</label>
              <input type="datetime-local" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>تاريخ النهاية</label>
              <input type="datetime-local" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={inp} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>الطاقة الاستيعابية</label>
              <input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="500" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>الحالة</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} style={inp}>
                <option value="draft">مسودة</option>
                <option value="published">منشور</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ background: loading ? '#e5e7eb' : '#2B6E64', color: loading ? '#9ca3af' : '#fff', padding: '14px', borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'جاري الإنشاء...' : '✓ إنشاء الفعالية'}
          </button>
        </div>
      </form>
    </div>
  )
}
