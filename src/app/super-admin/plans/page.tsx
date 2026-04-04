'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy: '#1C1C3B', primary: '#F47D31',
  card: '#FFFFFF', border: '#F0EDE8', muted: '#8B8FA8',
}

const PLANS = [
  { key: 'free',       label: 'مجاني',      color: '#8B8FA8', bg: '#F3F4F6',
    price: '0',             maxEvents: 3,  maxMembers: 2,  maxAttendees: 100,
    features: ['qr_scan'], icon: '🆓' },
  { key: 'starter',    label: 'ستارتر',     color: '#0F6E56', bg: '#E8F8F8',
    price: '99 ريال/شهر',  maxEvents: 10, maxMembers: 5,  maxAttendees: 500,
    features: ['qr_scan','excel_export','analytics'], icon: '🚀' },
  { key: 'pro',        label: 'برو',         color: '#C45800', bg: '#FFF3EC',
    price: '299 ريال/شهر', maxEvents: 50, maxMembers: 20, maxAttendees: 5000,
    features: ['qr_scan','excel_export','analytics','staffing','custom_branding'], icon: '⭐' },
  { key: 'enterprise', label: 'إنتربرايز',  color: '#6B46C1', bg: '#F3F0F8',
    price: 'مخصص',         maxEvents: -1, maxMembers: -1, maxAttendees: -1,
    features: ['qr_scan','excel_export','analytics','staffing','custom_branding','api_access','white_label','custom_domain'],
    icon: '🏆' },
]

const FEATURE_LABELS: Record<string, string> = {
  qr_scan: 'مسح QR', excel_export: 'Excel', analytics: 'تقارير',
  staffing: 'كوادر', custom_branding: 'علامة تجارية',
  api_access: 'API', white_label: 'White Label', custom_domain: 'دومين'
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  trial:     { bg: '#FFF8E8', color: '#B07000' },
  active:    { bg: '#E8F8F0', color: '#1A7A4A' },
  suspended: { bg: '#FEF2F2', color: '#DC2626' },
  cancelled: { bg: '#F3F4F6', color: '#6B7280' },
}

const STATUS_LABELS: Record<string, string> = {
  trial: 'تجريبي', active: 'نشط', suspended: 'معلق', cancelled: 'ملغي'
}

export default function PlansPage() {
  const [orgs, setOrgs]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sb.from('organizations').select('id,name,plan,status').order('plan')
      .then(({ data }) => { setOrgs(data || []); setLoading(false) })
  }, [])

  const countByPlan  = (plan: string) => orgs.filter(o => o.plan === plan).length
  const activeByPlan = (plan: string) => orgs.filter(o => o.plan === plan && o.status === 'active').length

  return (
    <div style={{ padding: '28px 24px', direction: 'rtl', maxWidth: 960, margin: '0 auto' }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: C.navy }}>إدارة الباقات</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>نظرة عامة على توزيع الباقات</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 32 }}>
        {PLANS.map(plan => {
          const total  = countByPlan(plan.key)
          const active = activeByPlan(plan.key)
          return (
            <div key={plan.key} style={{ background: C.card, borderRadius: 20, padding: 20,
              border: `1px solid ${C.border}`, borderTop: `4px solid ${plan.color}`,
              boxShadow: '0 2px 12px rgba(28,28,59,0.04)' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{plan.icon}</div>
              <p style={{ fontSize: 18, fontWeight: 700, color: plan.color, margin: '0 0 4px' }}>{plan.label}</p>
              <p style={{ fontSize: 12, color: C.muted, margin: '0 0 16px' }}>{plan.price}</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{ flex: 1, background: plan.bg, borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: plan.color, margin: 0 }}>{loading ? '—' : total}</p>
                  <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>إجمالي</p>
                </div>
                <div style={{ flex: 1, background: '#E8F8F0', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#1A7A4A', margin: 0 }}>{loading ? '—' : active}</p>
                  <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>نشط</p>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, margin: '0 0 8px' }}>الميزات</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {plan.features.map(f => (
                    <span key={f} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20,
                      background: plan.bg, color: plan.color, fontWeight: 600 }}>
                      {FEATURE_LABELS[f] || f}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: C.muted }}>
                  <p style={{ margin: '2px 0' }}>📅 {plan.maxEvents === -1 ? 'غير محدود' : plan.maxEvents} فعالية</p>
                  <p style={{ margin: '2px 0' }}>👥 {plan.maxMembers === -1 ? 'غير محدود' : plan.maxMembers} أعضاء</p>
                  <p style={{ margin: '2px 0' }}>🎟 {plan.maxAttendees === -1 ? 'غير محدود' : plan.maxAttendees?.toLocaleString('ar')} زائر</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ background: C.card, borderRadius: 20, padding: '22px 24px', border: `1px solid ${C.border}` }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 18px', color: C.navy }}>الشركات حسب الباقة</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>جاري التحميل...</div>
        ) : orgs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>
            <p style={{ fontSize: 36, margin: '0 0 8px' }}>🏢</p><p>لا توجد شركات بعد</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
              padding: '8px 12px', background: '#F9F8F6', borderRadius: 10,
              marginBottom: 4, fontSize: 11, fontWeight: 600, color: C.muted }}>
              <span>الشركة</span><span>الباقة</span><span>الحالة</span>
            </div>
            {orgs.map((org, i) => {
              const plan   = PLANS.find(p => p.key === org.plan)
              const sc     = STATUS_COLORS[org.status as string] || STATUS_COLORS.trial
              const sLabel = STATUS_LABELS[org.status as string] || org.status
              return (
                <div key={org.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
                  padding: '11px 12px', alignItems: 'center',
                  borderBottom: i < orgs.length - 1 ? `1px solid ${C.border}` : 'none'
                }}>
                  <Link href={`/super-admin/organizations/${org.id}`}
                    style={{ fontWeight: 600, fontSize: 13, color: C.navy, textDecoration: 'none' }}>
                    {org.name}
                  </Link>
                  <span style={{ fontSize: 12, fontWeight: 600, color: plan?.color || C.muted }}>
                    {plan?.label || org.plan}
                  </span>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                    fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                    {sLabel}
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
