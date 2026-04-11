'use client'
import RatingForm from '@/components/influencer/RatingForm'
async function triggerWhatsApp(type: string, userId: string, phone: string, data: any, refId?: string) {
  try { await fetch('/api/whatsapp/send', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({type,userId,phone,data,referenceId:refId}) }) } catch {}
}
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import MobilePageHeader from '@/components/layout/MobilePageHeader'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFF', green:'#3A7D0A', red:'#DC2626' }

const STATUS_LABELS: Record<string,{label:string;color:string;bg:string;icon:string}> = {
  pending_payment: { label:'انتظار الدفع', color:'#B07000', bg:'#FFF8E8', icon:'💳' },
  active:          { label:'نشط', color:C.green, bg:'#EAF7E0', icon:'🟢' },
  content_submitted: { label:'محتوى بالمراجعة', color:C.navy, bg:'#E8E4F0', icon:'📤' },
  approved:        { label:'تمت الموافقة', color:C.green, bg:'#EAF7E0', icon:'✅' },
  disputed:        { label:'نزاع', color:C.red, bg:'#FEF2F2', icon:'⚠️' },
  completed:       { label:'مكتمل', color:C.muted, bg:'#F1F1F1', icon:'🏁' },
  cancelled:       { label:'ملغي', color:C.red, bg:'#FEF2F2', icon:'✗' },
}

export default function ContractsPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const router = useRouter()
  const [contracts, setContracts] = useState<any[]>([])
  const [briefs, setBriefs] = useState<Record<string,any>>({})
  const [influencers, setInfluencers] = useState<Record<string,any>>({})
  const [ratingOpen, setRatingOpen] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [approving, setApproving] = useState<string|null>(null)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: ownedOrgs } = await sb.from('organizations').select('id').eq('owner_id', data.user.id).limit(1)
      const orgId = ownedOrgs?.[0]?.id
      if (!orgId) { setLoading(false); return }

      const { data: c } = await sb.from('campaign_contracts').select('*').eq('org_id', orgId).order('created_at', { ascending:false })
      const contractsList = c || []
      setContracts(contractsList)

      if (contractsList.length > 0) {
        const briefIds = [...new Set(contractsList.map((x:any) => x.brief_id).filter(Boolean))]
        const infIds   = [...new Set(contractsList.map((x:any) => x.influencer_id).filter(Boolean))]
        const [briefsRes, infsRes] = await Promise.all([
          sb.from('campaign_briefs').select('id,title').in('id', briefIds),
          sb.from('influencer_profiles').select('id,display_name,display_name_ar,avatar_url,tiktok_followers,instagram_followers').in('id', infIds),
        ])
        const bMap: Record<string,any> = {}; briefsRes.data?.forEach((b:any) => { bMap[b.id] = b })
        const iMap: Record<string,any> = {}; infsRes.data?.forEach((i:any) => { iMap[i.id] = i })
        setBriefs(bMap); setInfluencers(iMap)
      }
      setLoading(false)
    })
  }, [])

  async function approveContract(contract: any) {
    setApproving(contract.id)
    await sb.from('campaign_contracts').update({ status:'completed', completed_at: new Date().toISOString() }).eq('id', contract.id)
    // 🔔 WhatsApp: notify influencer payment released
    triggerWhatsApp('inf_payment_released', contract.influencer_id, '+966500000000', {
      name: influencers[contract.influencer_id]?.display_name_ar || 'مؤثر',
      amount: contract.influencer_payout?.toLocaleString('ar-SA'),
    }, contract.id)
    // Release escrow
    await sb.from('escrow_transactions').update({ payment_status:'released', released_at: new Date().toISOString() }).eq('contract_id', contract.id)
    setContracts(prev => prev.map(c => c.id===contract.id ? {...c, status:'completed'} : c))
    setApproving(null)
  }

  async function disputeContract(contractId: string) {
    await sb.from('campaign_contracts').update({ status:'disputed' }).eq('id', contractId)
    setContracts(prev => prev.map(c => c.id===contractId ? {...c, status:'disputed'} : c))
  }

  const TABS: [string,string][] = [
    ['active', 'نشطة'],
    ['pending_payment', 'انتظار دفع'],
    ['content_submitted', 'بالمراجعة'],
    ['completed', 'مكتملة'],
    ['all', 'الكل'],
  ]

  const filtered = tab === 'all' ? contracts : contracts.filter(c => c.status === tab)
  const stats = {
    active: contracts.filter(c=>c.status==='active').length,
    pending: contracts.filter(c=>c.status==='pending_payment').length,
    reviewing: contracts.filter(c=>c.status==='content_submitted').length,
    completed: contracts.filter(c=>c.status==='completed').length,
    totalValue: contracts.filter(c=>c.status!=='cancelled').reduce((s,c) => s + (c.agreed_price||0), 0),
  }

  if (loading) return <div style={{ padding:60, textAlign:'center', color:C.muted, direction:'rtl' }}>⏳ جاري التحميل...</div>

  return (
    <div style={{ padding:'28px 24px', direction:'rtl', maxWidth:960, margin:'0 auto' }}>
      <MobilePageHeader title="العقود" />
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>📄 عقود المؤثرين</h1>
        <p style={{ color:C.muted, fontSize:13, margin:0 }}>تابع الحملات النشطة وراجع المحتوى وأفرج عن المدفوعات</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'نشط', value:stats.active, color:C.green, icon:'🟢' },
          { label:'انتظار دفع', value:stats.pending, color:'#B07000', icon:'💳' },
          { label:'بالمراجعة', value:stats.reviewing, color:C.navy, icon:'📤' },
          { label:'مكتمل', value:stats.completed, color:C.muted, icon:'🏁' },
          { label:'إجمالي القيمة', value:`${stats.totalValue.toLocaleString()} ر`, color:C.orange, icon:'💰' },
        ].map(s => (
          <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:20, marginBottom:3 }}>{s.icon}</div>
            <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.border}`, marginBottom:16, overflowX:'auto' }}>
        {TABS.map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding:'9px 16px', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:tab===v?700:400, color:tab===v?C.orange:C.muted, borderBottom:tab===v?`2px solid ${C.orange}`:'2px solid transparent', marginBottom:-1, whiteSpace:'nowrap' }}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, background:C.card, borderRadius:14, border:`2px dashed ${C.border}` }}>
          <div style={{ fontSize:40, marginBottom:8 }}>📭</div>
          <p style={{ color:C.muted }}>لا توجد عقود في هذه الفئة</p>
          <a href="/briefs/new" style={{ display:'inline-block', marginTop:12, padding:'10px 24px', background:C.orange, borderRadius:10, color:'#fff', fontWeight:700, textDecoration:'none' }}>+ نشر بريف جديد</a>
        </div>
      ) : (
        <div style={{ display:'grid', gap:14 }}>
          {filtered.map(contract => {
            const st = STATUS_LABELS[contract.status] || STATUS_LABELS.active
            const inf = influencers[contract.influencer_id]
            const brief = briefs[contract.brief_id]
            const fee = contract.platform_fee || 0
            const payout = contract.influencer_payout || 0

            return (
              <div key={contract.id} style={{ background:C.card, border:`1px solid ${contract.status==='disputed'?C.red:C.border}`, borderRadius:14, padding:20 }}>
                {/* Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <div style={{ width:44, height:44, borderRadius:'50%', background:`linear-gradient(135deg, ${C.orange}, #FF8C42)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:18, flexShrink:0 }}>
                      {(inf?.display_name_ar||inf?.display_name||'?')?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight:800, color:C.navy, fontSize:15 }}>{inf?.display_name_ar || inf?.display_name || 'مؤثر'}</div>
                      <div style={{ fontSize:12, color:C.muted }}>{brief?.title || 'حملة'}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'left' }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:st.bg, color:st.color, display:'block', marginBottom:4 }}>
                      {st.icon} {st.label}
                    </span>
                    <span style={{ fontSize:11, color:C.muted }}>#{contract.id.slice(0,8)}</span>
                  </div>
                </div>

                {/* Financial breakdown */}
                <div style={{ background:'#F8F7FA', borderRadius:10, padding:14, marginBottom:14 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                    {[
                      { label:'المبلغ المتفق', value:`${contract.agreed_price?.toLocaleString()} ريال`, color:C.navy },
                      { label:'عمولة المنصة (15%)', value:`${fee.toLocaleString()} ريال`, color:C.muted },
                      { label:'يستلم المؤثر', value:`${payout.toLocaleString()} ريال`, color:C.green },
                    ].map(f => (
                      <div key={f.label} style={{ textAlign:'center' }}>
                        <div style={{ fontSize:16, fontWeight:800, color:f.color }}>{f.value}</div>
                        <div style={{ fontSize:11, color:C.muted }}>{f.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div style={{ display:'flex', gap:16, marginBottom:14, fontSize:12, color:C.muted }}>
                  {contract.start_date && <span>🗓 بداية: {contract.start_date}</span>}
                  {contract.due_date && <span>⏰ تسليم: {contract.due_date}</span>}
                  {contract.completed_at && <span>✅ أُكمل: {new Date(contract.completed_at).toLocaleDateString('ar-SA')}</span>}
                </div>

                {/* Escrow badge */}
                {contract.status === 'pending_payment' && (
                  <div style={{ background:'#FFF8E8', border:'1px solid #F5C842', borderRadius:8, padding:'12px 16px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                    <div>
                      <p style={{ color:'#7A5000', fontSize:13, fontWeight:700, margin:'0 0 2px' }}>💳 في انتظار الدفع لتفعيل العقد</p>
                      <p style={{ color:'#B07000', fontSize:12, margin:0 }}>ادفع المبلغ في Escrow حتى يبدأ المؤثر بالعمل</p>
                    </div>
                    <a href={`/escrow/${contract.id}`} style={{ padding:'10px 18px', background:'#F05537', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>
                      ادفع الآن ←
                    </a>
                  </div>
                )}

                {/* Actions */}
                {contract.status === 'pending_payment' && (
                    <a href={`/escrow/${contract.id}`} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 20px', background:'#F05537', border:'none', borderRadius:10, color:'#fff', fontWeight:800, fontSize:14, textDecoration:'none', marginBottom:12 }}>
                      🔒 ادفع {contract.agreed_price?.toLocaleString()} ريال في Escrow
                    </a>
                )}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {contract.status === 'active' && (
                    <a href={`/influencer/deliver/${contract.id}`}
                      style={{ padding:'6px 14px', background:'#E6F1FB', color:'#185FA5', border:'1px solid #93C5FD', borderRadius:8, fontSize:12, fontWeight:700, textDecoration:'none', cursor:'pointer' }}>
                      📤 تسليم المحتوى
                    </a>
                  )}
                  {contract.status === 'completed' && (
                    <button onClick={() => setRatingOpen(ratingOpen===contract.id?null:contract.id)}
                      style={{ padding:'6px 14px', background:'#FFF8E8', color:'#854F0B', border:'1px solid #F5D56B', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      ⭐ قيّم المؤثر
                    </button>
                  )}
                  {ratingOpen === contract.id && (
                    <div style={{ marginTop:8 }}>
                      <RatingForm
                        contractId={contract.id}
                        influencerId={contract.influencer_id}
                        orgId={contract.org_id}
                        influencerName={(contract.influencer_profiles as any)?.display_name || 'المؤثر'}
                        onDone={() => setRatingOpen(null)}
                      />
                    </div>
                  )}
                  {contract.status === 'content_submitted' && (
                    <>
                      <button onClick={() => approveContract(contract)} disabled={approving===contract.id} style={{ padding:'9px 18px', background:C.green, border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                        {approving===contract.id ? '⏳...' : '✅ موافقة وإفراج عن المبلغ'}
                      </button>
                      <button onClick={() => disputeContract(contract.id)} style={{ padding:'9px 14px', background:'#FEF2F2', border:'none', borderRadius:8, color:C.red, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                        ⚠️ فتح نزاع
                      </button>
                    </>
                  )}
                  {contract.status === 'completed' && (
                    <span style={{ fontSize:13, color:C.green, fontWeight:700 }}>✅ مكتمل — تم إفراج المبلغ للمؤثر</span>
                  )}
                  {contract.status === 'disputed' && (
                    <span style={{ fontSize:13, color:C.red, fontWeight:700 }}>⚠️ قيد حل النزاع — سيتواصل معك الفريق</span>
                  )}
                  <a href={`/briefs/${contract.brief_id}`} style={{ padding:'9px 14px', border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:13, fontWeight:600, textDecoration:'none' }}>
                    عرض البريف
                  </a>
                  <a href={`/influencers/${contract.influencer_id}`} target="_blank" style={{ padding:'9px 14px', border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:13, fontWeight:600, textDecoration:'none' }}>
                    ملف المؤثر ↗
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}