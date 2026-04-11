'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFF', green:'#3A7D0A', red:'#DC2626' }

const STATUS_MAP: Record<string,{label:string;color:string;bg:string}> = {
  open:       { label:'مفتوح', color:C.green, bg:'#EAF7E0' },
  in_review:  { label:'قيد المراجعة', color:'#B07000', bg:'#FFF8E8' },
  closed:     { label:'مغلق', color:C.muted, bg:'#F1F1F1' },
  cancelled:  { label:'ملغي', color:C.red, bg:'#FEF2F2' },
}

export default function BriefsPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const router = useRouter()
  const [briefs, setBriefs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<any>(null)
  const [tab, setTab] = useState('open')

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: ownedOrgs } = await sb.from('organizations').select('*').eq('owner_id', data.user.id).limit(1)
      const o = ownedOrgs?.[0]
      if (o) {
        setOrg(o)
        const { data: b } = await sb.from('campaign_briefs').select('*').eq('org_id', o.id).order('created_at', { ascending:false })
        setBriefs(b || [])
      }
      setLoading(false)
    })
  }, [])

  const filtered = briefs.filter(b => tab === 'all' || b.status === tab)
  const counts = { open: briefs.filter(b=>b.status==='open').length, in_review: briefs.filter(b=>b.status==='in_review').length, closed: briefs.filter(b=>b.status==='closed').length }

  async function closeBrief(id: string) {
    if (!confirm('هل تريد إغلاق هذا البريف؟')) return
    await sb.from('campaign_briefs').update({ status:'closed' }).eq('id', id)
    setBriefs(prev => prev.map(b => b.id===id ? {...b, status:'closed'} : b))
  }

  if (loading) return <div style={{ padding:60, textAlign:'center', color:C.muted, direction:'rtl' }}>⏳ جاري التحميل...</div>

  return (
    <div style={{ padding:'28px 24px', direction:'rtl', maxWidth:900, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>📋 حملات المؤثرين</h1>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>اعرض البريفات واستقبل العروض من المؤثرين</p>
        </div>
        <a href="/briefs/new" style={{ padding:'11px 20px', background:C.orange, borderRadius:10, color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
          + نشر بريف جديد
        </a>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'إجمالي البريفات', value:briefs.length, icon:'📋', color:C.navy },
          { label:'مفتوح', value:counts.open, icon:'🟢', color:C.green },
          { label:'قيد المراجعة', value:counts.in_review, icon:'🟡', color:'#B07000' },
          { label:'منجز', value:counts.closed, icon:'✅', color:C.muted },
        ].map(s => (
          <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 16px' }}>
            <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:3 }}>
              <span>{s.icon}</span>
              <span style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</span>
            </div>
            <p style={{ fontSize:11, color:C.muted, margin:0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.border}`, marginBottom:16 }}>
        {[['all','الكل'],['open','مفتوح'],['in_review','قيد المراجعة'],['closed','مغلق']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} style={{
            padding:'9px 18px', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit',
            fontSize:13, fontWeight: tab===v ? 700 : 400,
            color: tab===v ? C.orange : C.muted,
            borderBottom: tab===v ? `2px solid ${C.orange}` : '2px solid transparent',
            marginBottom:-1
          }}>{l}</button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, background:C.card, borderRadius:14, border:`2px dashed ${C.border}` }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
          <h3 style={{ fontSize:18, color:C.navy, margin:'0 0 8px' }}>لا يوجد بريفات بعد</h3>
          <p style={{ color:C.muted, fontSize:14, margin:'0 0 20px' }}>انشر أول بريف لك واستقبل العروض من المؤثرين</p>
          <a href="/briefs/new" style={{ display:'inline-block', padding:'11px 24px', background:C.orange, borderRadius:10, color:'#fff', fontWeight:700, textDecoration:'none' }}>
            + نشر بريف جديد
          </a>
        </div>
      ) : (
        <div style={{ display:'grid', gap:12 }}>
          {filtered.map(brief => {
            const st = STATUS_MAP[brief.status] || STATUS_MAP.open
            return (
              <div key={brief.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                      <h3 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:0 }}>{brief.title}</h3>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20, background:st.bg, color:st.color }}>{st.label}</span>
                    </div>
                    <p style={{ color:C.muted, fontSize:13, margin:0, lineHeight:1.5 }}>
                      {(brief.description || '').slice(0, 120)}{(brief.description||'').length > 120 ? '...' : ''}
                    </p>
                  </div>
                </div>

                <div style={{ display:'flex', gap:16, marginBottom:14, flexWrap:'wrap' }}>
                  {brief.event_type && <span style={{ fontSize:12, color:C.text }}>🎪 {brief.event_type}</span>}
                  {brief.event_date && <span style={{ fontSize:12, color:C.text }}>📅 {brief.event_date}</span>}
                  {brief.influencers_needed && <span style={{ fontSize:12, color:C.text }}>👥 {brief.influencers_needed} مؤثر</span>}
                  {brief.budget_min && brief.budget_max && <span style={{ fontSize:12, color:C.text }}>💰 {parseInt(brief.budget_min).toLocaleString()} - {parseInt(brief.budget_max).toLocaleString()} ريال</span>}
                </div>

                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <a href={`/briefs/${brief.id}`} style={{ padding:'8px 16px', background:C.navy, borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>
                    عرض التقدمات ({brief.proposals_count || 0})
                  </a>
                  <a href={`/influencers`} style={{ padding:'8px 14px', border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:13, fontWeight:600, textDecoration:'none' }}>
                    عرض المؤثرين
                  </a>
                  {brief.status === 'open' && (
                    <button onClick={() => closeBrief(brief.id)} style={{ padding:'8px 14px', border:'none', borderRadius:8, background:'#FEF2F2', color:C.red, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      إغلاق البريف
                    </button>
                  )}
                  <span style={{ marginRight:'auto', fontSize:11, color:C.muted }}>
                    {new Date(brief.created_at).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
