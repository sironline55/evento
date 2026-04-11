'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3' }

const PLATFORMS = [
  { id:'tiktok',    label:'TikTok',    icon:'🎵' },
  { id:'instagram', label:'Instagram', icon:'📸' },
  { id:'snapchat',  label:'Snapchat',  icon:'👻' },
  { id:'youtube',   label:'YouTube',   icon:'▶️' },
  { id:'twitter',   label:'X (Twitter)', icon:'🐦' },
  { id:'other',     label:'أخرى',      icon:'🌐' },
]

const POST_TYPES = ['reel','story','post','video','live','other']
const POST_LABELS: Record<string,string> = { reel:'ريل', story:'ستوري', post:'منشور', video:'فيديو', live:'بث مباشر', other:'أخرى' }

const STATUS_MAP: Record<string,{label:string;bg:string;color:string}> = {
  submitted:          { label:'قيد المراجعة',  bg:'#E6F1FB', color:'#185FA5' },
  approved:           { label:'موافق عليه',    bg:'#EAF7E0', color:'#166534' },
  rejected:           { label:'مرفوض',          bg:'#FEF2F2', color:'#DC2626' },
  revision_requested: { label:'يحتاج تعديل',  bg:'#FFF8E8', color:'#854F0B' },
}

export default function DeliverContentPage() {
  const { contractId } = useParams()
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const [contract,  setContract]  = useState<any>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [submitting,setSubmitting]= useState(false)
  const [toast,     setToast]     = useState('')
  const [form, setForm] = useState({
    platform:'tiktok', content_url:'', caption:'', post_type:'reel',
    views_count:'', likes_count:''
  })

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    if (!contractId) return
    Promise.all([
      sb.from('campaign_contracts')
        .select('*,campaign_briefs(title,event_type,event_date),influencer_profiles(display_name)')
        .eq('id', contractId).single(),
      sb.from('content_deliverables')
        .select('*').eq('contract_id', contractId)
        .order('submitted_at', { ascending:false })
    ]).then(([{data:c},{data:d}]) => {
      setContract(c)
      setDeliverables(d || [])
      setLoading(false)
    })
  }, [contractId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!contract || !form.content_url) return
    setSubmitting(true)

    const { data, error } = await sb.from('content_deliverables').insert({
      contract_id:   contractId,
      influencer_id: contract.influencer_id,
      org_id:        contract.org_id,
      platform:      form.platform,
      content_url:   form.content_url,
      caption:       form.caption || null,
      post_type:     form.post_type || null,
      views_count:   form.views_count ? Number(form.views_count) : null,
      likes_count:   form.likes_count ? Number(form.likes_count) : null,
      status:        'submitted'
    }).select().single()

    if (!error && data) {
      // Update contract status
      await sb.from('campaign_contracts')
        .update({ status:'content_submitted', content_submitted_at: new Date().toISOString() })
        .eq('id', contractId)
      setDeliverables(prev => [data, ...prev])
      setForm({ platform:'tiktok', content_url:'', caption:'', post_type:'reel', views_count:'', likes_count:'' })
      showToast('✅ تم تسليم المحتوى بنجاح!')
    } else {
      showToast('❌ خطأ: ' + error?.message)
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.navy, color:'#fff', fontFamily:'Tajawal,sans-serif' }}>
      جاري التحميل...
    </div>
  )

  if (!contract) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.navy, color:'#fff', fontFamily:'Tajawal,sans-serif' }}>
      العقد غير موجود
    </div>
  )

  const brief = contract.campaign_briefs as any
  const inp: React.CSSProperties = {
    width:'100%', padding:'11px 14px', border:`1px solid ${C.border}`,
    borderRadius:10, fontSize:14, boxSizing:'border-box', outline:'none',
    background:'#fafafa', fontFamily:'inherit'
  }

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg,${C.navy},#3D1A78)`, direction:'rtl', fontFamily:'Tajawal,sans-serif', padding:'24px 16px' }}>

      {toast && (
        <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', zIndex:9999,
          background: toast.startsWith('✅')?'#EAF7E0':'#FEF2F2',
          border:`1px solid ${toast.startsWith('✅')?'#9DE07B':'#FECACA'}`,
          color: toast.startsWith('✅')?'#166534':'#DC2626',
          borderRadius:12, padding:'12px 24px', fontWeight:700, fontSize:14,
          boxShadow:'0 8px 24px rgba(0,0,0,.15)' }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth:520, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <Link href="/influencer/portal" style={{ color:'rgba(255,255,255,.6)', textDecoration:'none', fontSize:13 }}>← البوابة</Link>
          <span style={{ color:'rgba(255,255,255,.8)', fontWeight:700, fontSize:14 }}>EventVMS</span>
        </div>

        {/* Contract card */}
        <div style={{ background:'rgba(255,255,255,.1)', borderRadius:16, padding:'18px 20px', marginBottom:16 }}>
          <h2 style={{ fontSize:17, fontWeight:800, color:'#fff', margin:'0 0 6px' }}>
            📄 {brief?.title || 'حملة تسويقية'}
          </h2>
          <div style={{ display:'flex', gap:16, fontSize:13, color:'rgba(255,255,255,.7)' }}>
            <span>💰 {Number(contract.influencer_payout||0).toLocaleString('ar-SA')} ريال</span>
            {contract.due_date && <span>⏰ التسليم: {new Date(contract.due_date).toLocaleDateString('ar-SA')}</span>}
            <span>📦 {deliverables.length} مسلّم</span>
          </div>
        </div>

        {/* Submission form */}
        {contract.status !== 'completed' && contract.status !== 'cancelled' && (
          <div style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 16px 48px rgba(0,0,0,.3)', marginBottom:16 }}>
            <div style={{ background:C.orange, padding:'16px 22px' }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:'#fff', margin:0 }}>📤 تسليم محتوى جديد</h3>
            </div>
            <form onSubmit={submit} style={{ padding:'22px' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

                {/* Platform selector */}
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:C.navy, display:'block', marginBottom:8 }}>المنصة *</label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    {PLATFORMS.map(p => (
                      <button key={p.id} type="button" onClick={() => setForm({...form, platform:p.id})}
                        style={{ padding:'8px', border:`2px solid ${form.platform===p.id?C.orange:C.border}`,
                          borderRadius:10, background: form.platform===p.id?'#FEF0ED':'#fff',
                          cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600,
                          color: form.platform===p.id?C.orange:C.muted, textAlign:'center' }}>
                        <div style={{ fontSize:18 }}>{p.icon}</div>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:C.navy, display:'block', marginBottom:6 }}>
                    رابط المنشور / المحتوى *
                  </label>
                  <input type="url" required placeholder="https://www.tiktok.com/@..." value={form.content_url}
                    onChange={e => setForm({...form, content_url:e.target.value})} style={inp} dir="ltr"/>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:C.navy, display:'block', marginBottom:6 }}>نوع المحتوى</label>
                    <select value={form.post_type} onChange={e => setForm({...form, post_type:e.target.value})}
                      style={{...inp, cursor:'pointer'}}>
                      {POST_TYPES.map(t => <option key={t} value={t}>{POST_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:C.navy, display:'block', marginBottom:6 }}>عدد المشاهدات</label>
                    <input type="number" placeholder="50000" value={form.views_count}
                      onChange={e => setForm({...form, views_count:e.target.value})} style={inp}/>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:C.navy, display:'block', marginBottom:6 }}>
                    الكابشن / الوصف <span style={{ color:C.muted, fontWeight:400 }}>(اختياري)</span>
                  </label>
                  <textarea placeholder="نص المنشور المستخدم..." value={form.caption}
                    onChange={e => setForm({...form, caption:e.target.value})}
                    rows={3} style={{...inp, resize:'vertical'}}/>
                </div>

                <button type="submit" disabled={submitting} style={{
                  padding:'13px', background:submitting?C.muted:C.navy,
                  color:'#fff', border:'none', borderRadius:12, fontSize:15,
                  fontWeight:700, cursor:submitting?'not-allowed':'pointer', fontFamily:'inherit'
                }}>
                  {submitting ? 'جاري التسليم...' : '📤 تسليم المحتوى'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Past deliverables */}
        {deliverables.length > 0 && (
          <div>
            <h3 style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.8)', margin:'0 0 10px' }}>
              المحتوى المسلّم ({deliverables.length})
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {deliverables.map(d => {
                const plat = PLATFORMS.find(p => p.id === d.platform)
                const st = STATUS_MAP[d.status] || STATUS_MAP.submitted
                return (
                  <div key={d.id} style={{ background:'#fff', borderRadius:14, padding:'14px 18px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:20 }}>{plat?.icon}</span>
                        <div>
                          <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>{plat?.label} — {POST_LABELS[d.post_type]||d.post_type}</p>
                          <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>
                            {new Date(d.submitted_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>
                      <span style={{ fontSize:11, padding:'3px 10px', background:st.bg, color:st.color, borderRadius:12, fontWeight:600 }}>
                        {st.label}
                      </span>
                    </div>
                    <a href={d.content_url} target="_blank" rel="noopener"
                      style={{ fontSize:12, color:C.orange, wordBreak:'break-all', direction:'ltr', display:'block' }}>
                      {d.content_url}
                    </a>
                    {d.views_count && <p style={{ fontSize:12, color:C.muted, margin:'4px 0 0' }}>👁 {Number(d.views_count).toLocaleString()} مشاهدة</p>}
                    {d.admin_note && (
                      <div style={{ marginTop:8, padding:'8px 12px', background:'#FFF8E8', borderRadius:8, fontSize:12, color:'#854F0B' }}>
                        💬 ملاحظة المنظم: {d.admin_note}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
