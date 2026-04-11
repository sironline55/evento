'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useParams } from 'next/navigation'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFF', green:'#3A7D0A', red:'#DC2626' }

function fmt(n: number) {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n/1000).toFixed(0) + 'K'
  return n.toString()
}

export default function BriefDetailPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [brief, setBrief] = useState<any>(null)
  const [proposals, setProposals] = useState<any[]>([])
  const [influencers, setInfluencers] = useState<Record<string,any>>({})
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string|null>(null)

  useEffect(() => {
    if (!id) return
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const [briefRes, propsRes] = await Promise.all([
        sb.from('campaign_briefs').select('*').eq('id', id).single(),
        sb.from('campaign_proposals').select('*').eq('brief_id', id).order('created_at')
      ])
      setBrief(briefRes.data)
      const props = propsRes.data || []
      setProposals(props)
      // Load influencer profiles
      if (props.length > 0) {
        const infIds = props.map((p:any) => p.influencer_id)
        const { data: infs } = await sb.from('influencer_profiles').select('*').in('id', infIds)
        const map: Record<string,any> = {}
        infs?.forEach((inf:any) => { map[inf.id] = inf })
        setInfluencers(map)
      }
      setLoading(false)
    })
  }, [id])

  async function acceptProposal(proposal: any) {
    if (!confirm(`قبول عرض ${influencers[proposal.influencer_id]?.display_name_ar}؟`)) return
    setAccepting(proposal.id)
    const inf = influencers[proposal.influencer_id]
    const price = proposal.proposed_price
    const fee = Math.round(price * 0.15 * 100) / 100
    const payout = price - fee

    const { error: contractErr } = await sb.from('campaign_contracts').insert({
      brief_id: brief.id,
      proposal_id: proposal.id,
      influencer_id: proposal.influencer_id,
      org_id: brief.org_id,
      agreed_price: price,
      platform_fee: fee,
      influencer_payout: payout,
      status: 'pending_payment',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })

    if (!contractErr) {
      await sb.from('campaign_proposals').update({ status:'accepted' }).eq('id', proposal.id)
      // Reject others if max reached
      const selectedCount = proposals.filter(p => p.status === 'accepted').length + 1
      if (selectedCount >= brief.influencers_needed) {
        const otherIds = proposals.filter(p => p.id !== proposal.id && p.status === 'pending').map(p => p.id)
        if (otherIds.length > 0) {
          await sb.from('campaign_proposals').update({ status:'rejected', rejection_reason:'تم اختيار عدد كافٍ من المؤثرين' }).in('id', otherIds)
        }
        await sb.from('campaign_briefs').update({ status:'in_review' }).eq('id', brief.id)
      }
      await sb.from('campaign_briefs').update({ selected_count: selectedCount }).eq('id', brief.id)
      setProposals(prev => prev.map(p => p.id===proposal.id ? {...p, status:'accepted'} : p))
    }
    setAccepting(null)
  }

  async function rejectProposal(proposalId: string) {
    await sb.from('campaign_proposals').update({ status:'rejected', rejection_reason:'لا يناسب متطلبات الحملة' }).eq('id', proposalId)
    setProposals(prev => prev.map(p => p.id===proposalId ? {...p, status:'rejected'} : p))
  }

  if (loading) return <div style={{ padding:60, textAlign:'center', color:C.muted, direction:'rtl' }}>⏳</div>
  if (!brief) return <div style={{ padding:60, textAlign:'center', direction:'rtl' }}><h2>البريف غير موجود</h2><a href="/briefs">← العودة</a></div>

  const pending = proposals.filter(p => p.status === 'pending')
  const accepted = proposals.filter(p => p.status === 'accepted')
  const rejected = proposals.filter(p => p.status === 'rejected')

  return (
    <div style={{ padding:'28px 24px', direction:'rtl', maxWidth:900, margin:'0 auto' }}>
      <a href="/briefs" style={{ color:C.muted, fontSize:13, textDecoration:'none', display:'block', marginBottom:16 }}>← الرجوع للبريفات</a>

      {/* Brief summary */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:24, marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <h1 style={{ fontSize:20, fontWeight:800, color:C.navy, margin:0 }}>{brief.title}</h1>
          <span style={{ fontSize:11, background:'#EAF7E0', color:C.green, padding:'3px 10px', borderRadius:20, fontWeight:700 }}>
            {brief.influencers_needed} مؤثر مطلوب · {accepted.length} مقبول
          </span>
        </div>
        <p style={{ color:C.muted, fontSize:14, margin:'0 0 14px', lineHeight:1.6 }}>{brief.description}</p>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          {brief.event_type && <span style={{ fontSize:12, color:C.text }}>🎪 {brief.event_type}</span>}
          {brief.event_date && <span style={{ fontSize:12, color:C.text }}>📅 {brief.event_date}</span>}
          {brief.budget_min && <span style={{ fontSize:12, color:C.text }}>💰 {parseInt(brief.budget_min).toLocaleString()} - {parseInt(brief.budget_max||brief.budget_min).toLocaleString()} ريال</span>}
          <span style={{ fontSize:12, color:C.text }}>📬 {proposals.length} عرض وصل</span>
        </div>
      </div>

      {/* Proposals tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.border}`, marginBottom:16 }}>
        {[
          { label:`انتظار الرد (${pending.length})`, data:pending },
          { label:`مقبول (${accepted.length})`, data:accepted },
          { label:`مرفوض (${rejected.length})`, data:rejected },
        ].map((t, i) => (
          <span key={i} style={{ padding:'8px 16px', fontSize:13, fontWeight:600, color:i===0?C.orange:C.muted, borderBottom: i===0?`2px solid ${C.orange}`:'2px solid transparent', cursor:'pointer' }}>{t.label}</span>
        ))}
      </div>

      {proposals.length === 0 && (
        <div style={{ textAlign:'center', padding:60, background:C.card, borderRadius:14, border:`2px dashed ${C.border}` }}>
          <div style={{ fontSize:40, marginBottom:8 }}>📭</div>
          <p style={{ color:C.muted, fontSize:14 }}>لم يتقدم أي مؤثر بعد — البريف مفتوح للمؤثرين المسجلين</p>
        </div>
      )}

      {/* Proposal cards */}
      <div style={{ display:'grid', gap:14 }}>
        {[...pending, ...accepted, ...rejected].map(proposal => {
          const inf = influencers[proposal.influencer_id]
          if (!inf) return null
          const totalFollowers = (inf.tiktok_followers||0) + (inf.instagram_followers||0) + (inf.snapchat_followers||0)
          const isAccepted = proposal.status === 'accepted'
          const isRejected = proposal.status === 'rejected'

          return (
            <div key={proposal.id} style={{
              background:C.card, border:`1px solid ${isAccepted ? C.green : isRejected ? '#F5C0B0' : C.border}`,
              borderRadius:12, padding:20, opacity: isRejected ? 0.6 : 1
            }}>
              <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                {/* Avatar */}
                <div style={{ width:52, height:52, borderRadius:'50%', background:`linear-gradient(135deg, ${C.orange}, #FF8C42)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:20, flexShrink:0 }}>
                  {(inf.display_name_ar||inf.display_name)?.[0]}
                </div>

                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <a href={`/influencers/${inf.id}`} target="_blank" style={{ fontSize:15, fontWeight:800, color:C.navy, textDecoration:'none' }}>{inf.display_name_ar||inf.display_name}</a>
                        {inf.is_verified && <span style={{ fontSize:10, background:'#EAF7E0', color:C.green, padding:'1px 6px', borderRadius:8, fontWeight:700 }}>✓ موثق</span>}
                        {isAccepted && <span style={{ fontSize:10, background:'#EAF7E0', color:C.green, padding:'1px 8px', borderRadius:8, fontWeight:700 }}>✅ مقبول</span>}
                        {isRejected && <span style={{ fontSize:10, background:'#FEF2F2', color:C.red, padding:'1px 8px', borderRadius:8, fontWeight:700 }}>✗ مرفوض</span>}
                      </div>
                      <div style={{ display:'flex', gap:10, marginTop:4 }}>
                        {(inf.specializations || []).slice(0,2).map((s:string) => (
                          <span key={s} style={{ fontSize:10, background:'#F0EDFF', color:'#5B3FA0', padding:'1px 8px', borderRadius:10 }}>{s}</span>
                        ))}
                        <span style={{ fontSize:11, color:C.muted }}>👥 {fmt(totalFollowers)} إجمالي</span>
                      </div>
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:20, fontWeight:900, color:C.orange }}>{proposal.proposed_price?.toLocaleString()} ريال</div>
                      <div style={{ fontSize:11, color:C.muted, textAlign:'center' }}>{proposal.estimated_days} يوم</div>
                    </div>
                  </div>

                  <p style={{ color:C.text, fontSize:13, margin:'10px 0', lineHeight:1.6, background:'#F8F7FA', padding:10, borderRadius:8 }}>
                    {proposal.message}
                  </p>

                  {!isAccepted && !isRejected && (
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => acceptProposal(proposal)} disabled={accepting===proposal.id || accepted.length >= brief.influencers_needed} style={{
                        padding:'9px 20px', background: accepted.length >= brief.influencers_needed ? '#DBDAE3' : C.green,
                        border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor: accepted.length >= brief.influencers_needed ? 'not-allowed' : 'pointer', fontFamily:'inherit'
                      }}>
                        {accepting===proposal.id ? '⏳...' : '✓ قبول العرض'}
                      </button>
                      <button onClick={() => rejectProposal(proposal.id)} style={{ padding:'9px 16px', background:'#FEF2F2', border:'none', borderRadius:8, color:C.red, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                        ✗ رفض
                      </button>
                      <a href={`/influencers/${inf.id}`} target="_blank" style={{ padding:'9px 14px', border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:13, fontWeight:600, textDecoration:'none' }}>
                        عرض الملف
                      </a>
                    </div>
                  )}

                  {isAccepted && (
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:13, color:C.green, fontWeight:700 }}>✅ تم القبول — في انتظار الدفع لتفعيل العقد</span>
                      <a href="/contracts" style={{ fontSize:12, color:C.orange, fontWeight:600, textDecoration:'none' }}>عرض العقد ←</a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
