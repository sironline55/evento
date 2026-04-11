'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A', red:'#DC2626' }
const inp: React.CSSProperties = { width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit', color:C.text, background:C.card, boxSizing:'border-box' }
const lbl: React.CSSProperties = { fontSize:12, fontWeight:700, color:C.text, display:'block', marginBottom:6 }

export default function BriefDetailPage() {
  const params = useParams()
  const router = useRouter()
  const briefId = params.id as string

  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [user, setUser] = useState<any>(null)
  const [brief, setBrief] = useState<any>(null)
  const [proposals, setProposals] = useState<any[]>([])
  const [myProfile, setMyProfile] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [submittingProposal, setSubmittingProposal] = useState(false)
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null)
  const [proposal, setProposal] = useState({ cover_message:'', proposed_price:'', content_plan:'', portfolio_sample:'', delivery_days:'7' })
  const set = (k:string,v:string) => setProposal(p=>({...p,[k]:v}))
  const showToast = (msg:string, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000) }

  useEffect(()=>{
    sb.auth.getUser().then(async ({ data })=>{
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      const [{ data:briefData }, { data:propData }, { data:profileData }] = await Promise.all([
        sb.from('campaign_briefs').select('*').eq('id', briefId).single(),
        sb.from('campaign_proposals').select('*').eq('brief_id', briefId).order('created_at'),
        sb.from('worker_profiles').select('*').eq('user_id', data.user.id).eq('profile_type','influencer').maybeSingle()
      ])
      setBrief(briefData)
      setProposals(propData||[])
      setMyProfile(profileData)
      setIsOwner(briefData?.created_by === data.user.id)
      setLoading(false)
    })
  },[briefId])

  async function submitProposal() {
    if (!proposal.cover_message.trim()||!proposal.proposed_price) { alert('يرجى ملء الحقول المطلوبة'); return }
    setSubmittingProposal(true)
    const { error } = await sb.from('campaign_proposals').insert({
      brief_id: briefId,
      influencer_id: myProfile.id,
      user_id: user.id,
      cover_message: proposal.cover_message,
      proposed_price: parseInt(proposal.proposed_price),
      content_plan: proposal.content_plan||null,
      portfolio_sample: proposal.portfolio_sample||null,
      delivery_days: parseInt(proposal.delivery_days)||7,
      status: 'pending'
    })
    setSubmittingProposal(false)
    if (!error) {
      showToast('✅ تم إرسال عرضك بنجاح!')
      setShowProposalForm(false)
      const { data } = await sb.from('campaign_proposals').select('*').eq('brief_id', briefId)
      setProposals(data||[])
    } else showToast('❌ '+error.message, false)
  }

  async function acceptProposal(propId:string, influencerId:string, price:number) {
    if (!confirm('هل تريد قبول هذا العرض؟ سيتم إنشاء عقد وإغلاق باقي العروض.')) return
    const fee = Math.round(price * 0.15)
    const payout = price - fee
    const { data:contract } = await sb.from('campaign_contracts').insert({
      brief_id:briefId, proposal_id:propId, org_id:brief.org_id,
      influencer_id:influencerId, agreed_price:price,
      platform_fee:fee, influencer_payout:payout,
      status:'active', deadline:brief.event_date
    }).select().single()
    // تحديث حالة العروض
    await sb.from('campaign_proposals').update({status:'accepted'}).eq('id',propId)
    await sb.from('campaign_proposals').update({status:'rejected'}).eq('brief_id',briefId).neq('id',propId)
    await sb.from('campaign_briefs').update({status:'in_review'}).eq('id',briefId)
    // إنشاء escrow
    if (contract) {
      await sb.from('escrow_transactions').insert({
        contract_id:contract.id, org_id:brief.org_id, influencer_id:influencerId,
        amount:price, platform_fee:fee, influencer_payout:payout, status:'held'
      })
    }
    showToast('✅ تم قبول العرض وإنشاء العقد!')
    const { data:updatedBrief } = await sb.from('campaign_briefs').select('*').eq('id',briefId).single()
    const { data:updatedProps } = await sb.from('campaign_proposals').select('*').eq('brief_id',briefId)
    setBrief(updatedBrief); setProposals(updatedProps||[])
  }

  if (loading) return <div style={{padding:60,textAlign:'center',color:C.muted,direction:'rtl'}}>⏳ جاري التحميل...</div>
  if (!brief) return <div style={{padding:60,textAlign:'center',direction:'rtl'}}>الطلب غير موجود</div>

  const alreadyApplied = proposals.some(p=>p.user_id===user?.id)
  const statusColors: Record<string,string> = { open:C.green, in_review:'#B07000', closed:C.muted, cancelled:C.red }
  const statusLabels: Record<string,string> = { open:'مفتوح', in_review:'قيد المراجعة', closed:'مغلق', cancelled:'ملغي' }

  return (
    <div style={{minHeight:'100vh',background:C.bg,direction:'rtl'}}>
      {toast && <div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:toast.ok?C.navy:C.red,color:'#fff',padding:'10px 22px',borderRadius:8,fontWeight:700,zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,.2)'}}>{toast.msg}</div>}

      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:'14px 32px'}}>
        <Link href="/influencers" style={{color:C.orange,textDecoration:'none',fontSize:14,fontWeight:600}}>← العودة للمؤثرين</Link>
      </div>

      <div style={{maxWidth:920,margin:'24px auto',padding:'0 24px',display:'grid',gridTemplateColumns:'1fr 300px',gap:20}}>
        {/* Main */}
        <div>
          {/* Brief card */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24,marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
              <h1 style={{fontSize:22,fontWeight:900,color:C.navy,margin:0,flex:1}}>{brief.title}</h1>
              <span style={{fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:20,background:`${statusColors[brief.status]}20`,color:statusColors[brief.status],marginRight:12,flexShrink:0}}>
                {statusLabels[brief.status]}
              </span>
            </div>
            <p style={{fontSize:14,color:C.text,lineHeight:1.8,margin:'0 0 16px'}}>{brief.description}</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[
                ['🎪 الفعالية', brief.event_name||'—'],
                ['📅 التاريخ', brief.event_date||'—'],
                ['📍 المكان', brief.event_location||'—'],
                ['👥 المؤثرين', `${brief.influencer_count} مؤثر`],
                ['💰 الميزانية', brief.budget_min&&brief.budget_max ? `${brief.budget_min.toLocaleString()} - ${brief.budget_max.toLocaleString()} ريال` : '—'],
                ['⏰ آخر موعد', brief.deadline||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{background:'#F8F7FA',borderRadius:8,padding:'10px 14px'}}>
                  <p style={{fontSize:11,color:C.muted,margin:'0 0 2px'}}>{l}</p>
                  <p style={{fontSize:13,fontWeight:700,color:C.text,margin:0}}>{v}</p>
                </div>
              ))}
            </div>
            {(brief.content_types||[]).length>0&&(
              <div style={{marginTop:14}}>
                <p style={{fontSize:12,color:C.muted,marginBottom:8}}>📱 المحتوى المطلوب:</p>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {(brief.content_types||[]).map((ct:string)=>(
                    <span key={ct} style={{background:'#EDE9F7',color:'#5B3FA0',fontSize:12,fontWeight:600,padding:'4px 12px',borderRadius:20}}>{ct}</span>
                  ))}
                </div>
              </div>
            )}
            {brief.requirements&&<div style={{marginTop:14,background:'#FFF8E8',border:'1px solid #F5C842',borderRadius:8,padding:12}}><p style={{fontSize:11,fontWeight:700,color:'#7A5000',margin:'0 0 4px'}}>📋 متطلبات إضافية:</p><p style={{fontSize:13,color:'#7A5000',margin:0}}>{brief.requirements}</p></div>}
          </div>

          {/* Proposals */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{fontSize:15,fontWeight:700,color:C.navy,margin:0}}>العروض المقدمة ({proposals.length})</h3>
              {brief.status==='in_review'&&<span style={{fontSize:11,background:'#FFF8E8',color:'#B07000',padding:'4px 10px',borderRadius:20,fontWeight:700}}>تم اختيار مؤثر</span>}
            </div>
            {proposals.length===0?(
              <div style={{padding:40,textAlign:'center'}}><div style={{fontSize:40}}>🎭</div><p style={{color:C.muted,fontSize:13}}>لا يوجد عروض بعد — انتظر تقدم المؤثرين</p></div>
            ):proposals.map((p,i)=>(
              <div key={p.id} style={{padding:'16px 20px',borderBottom:i<proposals.length-1?`1px solid ${C.border}`:'none',background:p.status==='accepted'?'#EAF7E0':p.status==='rejected'?'#FEF2F2':C.card}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <div>
                    <span style={{fontSize:14,fontWeight:700,color:C.navy}}>مؤثر #{p.influencer_id?.slice(-8)}</span>
                    <span style={{fontSize:11,marginRight:8,padding:'2px 8px',borderRadius:20,fontWeight:600,
                      background:p.status==='accepted'?'#EAF7E0':p.status==='rejected'?'#FEF2F2':'#F8F7FA',
                      color:p.status==='accepted'?C.green:p.status==='rejected'?C.red:C.muted}}>
                      {p.status==='accepted'?'✅ مقبول':p.status==='rejected'?'❌ مرفوض':'⏳ قيد المراجعة'}
                    </span>
                  </div>
                  <span style={{fontSize:16,fontWeight:900,color:C.orange}}>{p.proposed_price?.toLocaleString()} ريال</span>
                </div>
                <p style={{fontSize:13,color:C.text,margin:'0 0 8px',lineHeight:1.7}}>{p.cover_message}</p>
                {p.content_plan&&<p style={{fontSize:12,color:C.muted,margin:'0 0 8px'}}>📋 خطة المحتوى: {p.content_plan}</p>}
                {p.portfolio_sample&&<a href={p.portfolio_sample} target="_blank" style={{fontSize:12,color:C.orange}}>🔗 مثال أعمال سابقة</a>}
                {isOwner&&p.status==='pending'&&brief.status==='open'&&(
                  <div style={{marginTop:12,display:'flex',gap:8}}>
                    <button onClick={()=>acceptProposal(p.id,p.influencer_id,p.proposed_price)} style={{padding:'8px 18px',background:C.green,border:'none',borderRadius:6,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>✅ قبول العرض</button>
                    <button onClick={async()=>{await sb.from('campaign_proposals').update({status:'rejected'}).eq('id',p.id);const {data}=await sb.from('campaign_proposals').select('*').eq('brief_id',briefId);setProposals(data||[])}} style={{padding:'8px 14px',background:'#FEF2F2',border:'none',borderRadius:6,color:C.red,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>رفض</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* للمؤثر — نموذج التقديم */}
          {!isOwner && brief.status==='open' && myProfile && !alreadyApplied && (
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden',marginBottom:16}}>
              <div style={{background:C.navy,padding:'14px 18px',color:'#fff'}}>
                <p style={{fontWeight:800,fontSize:15,margin:0}}>🎭 تقدم لهذه الحملة</p>
                <p style={{opacity:.7,fontSize:12,margin:'4px 0 0'}}>أرسل عرضك الآن</p>
              </div>
              {!showProposalForm?(
                <div style={{padding:16}}>
                  <button onClick={()=>setShowProposalForm(true)} style={{width:'100%',padding:'12px',background:C.orange,border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>إرسال عرض</button>
                </div>
              ):(
                <div style={{padding:16,display:'grid',gap:12}}>
                  <div><label style={lbl}>سعرك المقترح (ريال) *</label><input type="number" value={proposal.proposed_price} onChange={e=>set('proposed_price',e.target.value)} placeholder="0" style={inp}/></div>
                  <div><label style={lbl}>رسالة التقديم *</label><textarea value={proposal.cover_message} onChange={e=>set('cover_message',e.target.value)} rows={4} placeholder="لماذا أنت الخيار المثالي لهذه الحملة؟" style={{...inp,resize:'vertical'}}/></div>
                  <div><label style={lbl}>خطة المحتوى</label><textarea value={proposal.content_plan} onChange={e=>set('content_plan',e.target.value)} rows={2} placeholder="كيف ستنفذ المحتوى؟" style={{...inp,resize:'vertical'}}/></div>
                  <div><label style={lbl}>رابط مثال من أعمالك</label><input value={proposal.portfolio_sample} onChange={e=>set('portfolio_sample',e.target.value)} placeholder="https://..." style={inp}/></div>
                  <div><label style={lbl}>مدة التسليم (أيام)</label><input type="number" value={proposal.delivery_days} onChange={e=>set('delivery_days',e.target.value)} style={inp}/></div>
                  <button onClick={submitProposal} disabled={submittingProposal} style={{padding:'12px',background:submittingProposal?C.muted:C.orange,border:'none',borderRadius:8,color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                    {submittingProposal?'⏳ جاري الإرسال...':'🚀 إرسال العرض'}
                  </button>
                </div>
              )}
            </div>
          )}
          {alreadyApplied&&<div style={{background:'#EAF7E0',border:'1px solid #C3E6C3',borderRadius:12,padding:14,marginBottom:16,textAlign:'center'}}><p style={{color:C.green,fontWeight:700,margin:0}}>✅ لقد تقدمت لهذه الحملة</p></div>}
          {!myProfile&&!isOwner&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,marginBottom:16,textAlign:'center'}}><p style={{color:C.muted,fontSize:14,marginBottom:12}}>سجّل كمؤثر للتقدم</p><Link href="/influencers/register" style={{display:'block',padding:'10px',background:C.orange,color:'#fff',borderRadius:8,textDecoration:'none',fontWeight:700,fontSize:13}}>سجّل كمؤثر</Link></div>}

          {/* Brief stats */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
            <p style={{fontWeight:700,color:C.navy,fontSize:14,margin:'0 0 14px'}}>📊 إحصائيات الطلب</p>
            {[['👁️ المشاهدات', brief.views_count||0], ['📬 العروض', proposals.length], ['✅ المطلوب', `${brief.influencer_count} مؤثر`]].map(([l,v])=>(
              <div key={l as string} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,color:C.muted}}>{l}</span>
                <span style={{fontWeight:700,color:C.navy,fontSize:13}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
