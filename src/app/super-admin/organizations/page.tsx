'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const C = {
  navy: '#1C1C3B', primary: '#F47D31',
  card: '#FFFFFF', border: '#F0EDE8', muted: '#8B8FA8',
}

const PLAN_COLORS: Record<string, string> = {
  free: '#8B8FA8', starter: '#7EC8C8', pro: '#F47D31', enterprise: '#9B8EC4'
}
const PLAN_BG: Record<string, string> = {
  free: '#F3F4F6', starter: '#E8F8F8', pro: '#FFF3EC', enterprise: '#F3F0F8'
}
const PLAN_LABELS: Record<string, string> = {
  free: 'مجاني', starter: 'ستارتر', pro: 'برو', enterprise: 'إنتربرايز'
}
const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  trial:     { label: 'تجريبي', bg: '#FFF8E8', color: '#B07000' },
  active:    { label: 'نشط',    bg: '#E8F8F0', color: '#1A7A4A' },
  suspended: { label: 'معلق',   bg: '#FEF2F2', color: '#DC2626' },
  cancelled: { label: 'ملغي',   bg: '#F3F4F6', color: '#6B7280' },
}

const ALL_STATUSES = ['all', 'trial', 'active', 'suspended', 'cancelled']
const STATUS_FILTER_LABELS: Record<string, string> = {
  all: 'الكل', trial: 'تجريبي', active: 'نشط', suspended: 'معلق', cancelled: 'ملغي'
}

export default function OrganizationsPage() {
  const [orgs, setOrgs]                   = useState<any[]>([])
  const [loading, setLoading]             = useState(true)
  const [filter, setFilter]               = useState('all')
  const [search, setSearch]               = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => { loadOrgs() }, [])

  async function loadOrgs() {
    setLoading(true)
    const { data } = await sb.from('organizations')
      .select('id,name,email,plan,status,max_events,max_members,created_at,trial_ends_at')
      .order('created_at', { ascending: false })
    setOrgs(data || [])
    setLoading(false)
  }

  async function toggleSuspend(org: any) {
    setActionLoading(org.id)
    const newStatus = org.status === 'suspended' ? 'active' : 'suspended'
    await sb.from('organizations').update({ status: newStatus }).eq('id', org.id)
    await loadOrgs()
    setActionLoading(null)
  }

  const filtered = orgs.filter(o => {
    const matchStatus = filter === 'all' || o.status === filter
    const matchSearch = !search
      || o.name?.toLowerCase().includes(search.toLowerCase())
      || o.email?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const inp: React.CSSProperties = {
    padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 50,
    fontSize: 13, outline: 'none', background: C.card, fontFamily: 'inherit', minWidth: 220
  }

  return (
    <div style={{ padding: '28px 24px', direction: 'rtl', maxWidth: 1000, margin: '0 auto' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: C.navy }}>الشركات</h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{orgs.length} شركة مسجلة</p>
        </div>
        <Link href="/super-admin/organizations/new" style={{
          background: C.primary, color: '#fff', padding: '11px 22px', borderRadius: 50,
          textDecoration: 'none', fontWeight: 700, fontSize: 14,
          boxShadow: '0 4px 12px rgba(244,125,49,0.35)'
        }}>＋ شركة جديدة</Link>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="بحث باسم الشركة أو الإيميل..." style={inp} />
        <div style={{ display: 'flex', gap: 6 }}>
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '8px 16px', borderRadius: 50, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              background: filter === s ? C.navy : C.card,
              color: filter === s ? '#fff' : C.muted,
              outline: `1px solid ${filter === s ? C.navy : C.border}`
            }}>{STATUS_FILTER_LABELS[s]}</button>
          ))}
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`,
        overflow: 'hidden', boxShadow: '0 2px 12px rgba(28,28,59,0.04)' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 120px',
          padding: '10px 18px', background: '#F9F8F6',
          fontSize: 11, fontWeight: 600, color: C.muted }}>
          <span>الشركة</span><span>الباقة</span><span>الحالة</span>
          <span>الفعاليات</span><span>الأعضاء</span><span>إجراءات</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>
            <p style={{ fontSize: 36, margin: '0 0 8px' }}>🏢</p><p>لا توجد نتائج</p>
          </div>
        ) : filtered.map((org, i) => {
          const s         = STATUS_CONFIG[org.status] || STATUS_CONFIG.trial
          const planColor = PLAN_COLORS[org.plan] || C.muted
          const planBg    = PLAN_BG[org.plan]    || '#F3F4F6'
          const isSuspended = org.status === 'suspended'
          return (
            <div key={org.id} style={{
              display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 120px',
              padding: '14px 18px', alignItems: 'center',
              borderTop: i > 0 ? `1px solid ${C.border}` : 'none'
            }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: C.navy }}>{org.name}</p>
                <p style={{ fontSize: 11, color: C.muted, margin: '2px 0 0' }}>{org.email || '—'}</p>
              </div>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 600, background: planBg, color: planColor }}>
                {PLAN_LABELS[org.plan] || org.plan}
              </span>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
                {s.label}
              </span>
              <span style={{ fontSize: 13, color: C.navy, fontWeight: 600 }}>{org.max_events ?? '—'}</span>
              <span style={{ fontSize: 13, color: C.navy, fontWeight: 600 }}>{org.max_members ?? '—'}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Link href={`/super-admin/organizations/${org.id}`} style={{
                  fontSize: 11, color: C.primary, textDecoration: 'none',
                  padding: '5px 10px', background: '#FFF3EC', borderRadius: 50, fontWeight: 600
                }}>إدارة</Link>
                <button onClick={() => toggleSuspend(org)}
                  disabled={actionLoading === org.id} style={{
                    fontSize: 11, color: isSuspended ? '#1A7A4A' : '#DC2626',
                    background: isSuspended ? '#E8F8F0' : '#FEF2F2',
                    border: 'none', padding: '5px 10px', borderRadius: 50,
                    cursor: 'pointer', fontWeight: 600,
                    opacity: actionLoading === org.id ? 0.6 : 1
                  }}>
                  {isSuspended ? 'تفعيل' : 'تعليق'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
