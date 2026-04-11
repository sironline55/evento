'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFF', green:'#3A7D0A', red:'#DC2626' }
const inp: React.CSSProperties = { width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit', color:C.text, background:C.card, boxSizing:'border-box' }
const lbl: React.CSSProperties = { fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:5 }

function fmt(n: number) {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n/1000).toFixed(0) + 'K'
  return n.toString()
}

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcGNqc2JjandxbHhmc3NtdGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTQ2MDQsImV4cCI6MjA5MDc3MDYwNH0.W2zchuG_HMpVIFhz9m5NbUSb2n59sUb2-xjtNclzcX8'
const SB_URL = 'https://xqpcjsbcjwqlxfssmtjb.supabase.co'

export default function InfluencerPortal() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const router = useRouter()
  const [tab, setTab] = useState('briefs')
  const [profile, setProfile] = useState<any>(null)
  const [briefs, setBriefs] = useState<any[]>([])
  const [myProposals, setMyProposals] = useState<any[]>([])
  const [myContracts, setMyContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [proposingId, setProposingId] = useState<string|null>(null)
  const [proposalForm, setProposalForm] = useState({ message:'', proposed_price:'', estimated_days:'3' })
  const [saving, setSaving] = useState(false)
  const [registerMode, setRegisterMode] = useState(false)
  const [regForm, setRegForm] = useState({ display_name:'', display_name_ar:'', bio_ar:'', tiktok_handle:'', tiktok_followers:'', instagram_handle:'', instagram_followers:'', snapchat_handle:'', snapchat_followers:'', price_basic:'', price_standard:'', price_premium:'', specializations:[] as string[] })

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      // Check if influencer profile exists
      const { data: prof } = await sb.from('influencer_profiles').select('*').eq('user_id', data.user.id).single()
      if (prof) {
        setProfile(prof)
        // Load open briefs
        const [briefsRes, propsRes, contractsRes] = await Promise.all([
          fetch(`${SB_URL}/rest/v1/campaign_briefs?status=eq.open&order=created_at.desc&limit=20`, {
            headers: { apikey: ANON_KEY, Authorization: `Bearer ${data.session?.access_token || ANON_KEY}` }
          }).then(r => r.json()),
          sb.from('campaign_proposals').select('*').eq('influencer_id', prof.id).order('created_at', { ascending:false }),
          sb.from('campaign_contracts').select('*').eq('influencer_id', prof.id).order('created_at', { ascending:false }),
        ])
        setBriefs(Array.isArray(briefsRes) ? briefsRes : [])
        setMyProposals(propsRes.data || [])
        setMyContracts(contractsRes.data || [])
      } else {
        setRegisterMode(true)
      }
      setLoading(false)
    })
  }, [])

  async function register() {
    const { data: { user } } = await sb.auth.getUser()
    setSaving(true)
    const { error } = await sb.from('influencer_profiles').insert({
      user_id: user!.id,
      display_name: regForm.display_name,
      display_name_ar: regForm.display_name_ar,
      bio_ar: regForm.bio_ar,
      tiktok_handle: regForm.tiktok_handle || null,
      tiktok_followers: parseInt(regForm.tiktok_followers) || 0,
      instagram_handle: regForm.instagram_handle || null,
      instagram_followers: parseInt(regForm.instagram_followers) || 0,
      snapchat_handle: regForm.snapchat_handle || null,
      snapchat_followers: parseInt(regForm.snapchat_followers) || 0,
      price_basic: parseFloat(regForm.price_basic) || null,
      price_standard: parseFloat(regForm.price_standard) || null,
      price_premium: parseFloat(regForm.price_premium) || null,
      specializations: regForm.specializations,
      status: 'pending',
    })
    setSaving(false)
    if (!error) window.location.reload()
    else alert('خطأ: ' + error.message)
  }

  async function submitProposal(briefId: string) {
    if (!profile || !proposalForm.message || !proposalForm.proposed_price) return
    setSaving(true)
    const { error } = await sb.from('campaign_proposals').insert({
      brief_id: briefId,
      influencer_id: profile.id,
      message: proposalForm.message,
      proposed_price: parseFloat(proposalForm.proposed_price),
      estimated_days: parseInt(proposalForm.estimated_days),
      status: 'pending',
    })
    setSaving(false)
    if (!error) {
      setProposingId(null)
      setProposalForm({ message:'', proposed_price:'', estimated_days:'3' })
      const { data: props } = await sb.from('campaign_proposals').select('*').eq('influencer_id', profile.id).order('created_at', { ascending:false })
      setMyProposals(props || [])
    } else alert('خطأ: ' + error.message)
  }

  if (loading) return <div style={{ padding:60, textAlign:'center', color:C.muted, direction:'rtl' }}>⏳</div>

  // Register form
  if (registerMode) return (
    <div style={{ padding:'32px 24px', direction:'rtl', maxWidth:600, margin:'0 auto' }}>
      <h1 style={{ fontSize:24, fontWeight:800, color:C.navy, marginBottom:6 }}>🌟 انضم كمؤثر في الفعاليات</h1>
      <p style={{ color:C.muted, fontSize:14, marginBottom:24 }}>سيراجع فريقنا ملفك وتبدأ في استقبال طلبات الحملات</p>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:24, display:'grid', gap:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div><label style={lbl}>الاسم بالإنجليزية *</label><input value={regForm.display_name} onChange={e => setRegForm(f=>({...f,display_name:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>الاسم بالعربية *</label><input value={regForm.display_name_ar} onChange={e => setRegForm(f=>({...f,display_name_ar:e.target.value}))} style={inp}/></div>
        </div>
        <div><label style={lbl}>نبذة عنك</label><textarea value={regForm.bio_ar} onChange={e => setRegForm(f=>({...f,bio_ar:e.target.value}))} rows={3} style={{...inp,resize:'vertical'}} placeholder="تخصصك وتجاربك في الفعاليات..."/></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div><label style={lbl}>🎵 تيك توك (username)</label><input value={regForm.tiktok_handle} onChange={e => setRegForm(f=>({...f,tiktok_handle:e.target.value}))} placeholder="@username" style={inp}/></div>
          <div><label style={lbl}>متابعو تيك توك</label><input type="number" value={regForm.tiktok_followers} onChange={e => setRegForm(f=>({...f,tiktok_followers:e.target.value}))} placeholder="450000" style={inp}/></div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div><label style={lbl}>📷 إنستغرام</label><input value={regForm.instagram_handle} onChange={e => setRegForm(f=>({...f,instagram_handle:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>المتابعون</label><input type="number" value={regForm.instagram_followers} onChange={e => setRegForm(f=>({...f,instagram_followers:e.target.value}))} style={inp}/></div>
        </div>
        <div>
          <label style={lbl}>التخصصات</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {['ترفيه','حفلات','رياضة','مؤتمرات','معارض','رحلات','أعمال'].map(s => (
              <button key={s} onClick={() => setRegForm(f => ({ ...f, specializations: f.specializations.includes(s) ? f.specializations.filter(x=>x!==s) : [...f.specializations, s] }))} style={{ padding:'6px 14px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600, border: regForm.specializations.includes(s)?`2px solid ${C.orange}`:`1px solid ${C.border}`, background: regForm.specializations.includes(s)?'#FEF0ED':C.card, color: regForm.specializations.includes(s)?C.orange:C.text }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          <div><label style={lbl}>باقة أساسية (ريال)</label><input type="number" value={regForm.price_basic} onChange={e => setRegForm(f=>({...f,price_basic:e.target.value}))} placeholder="1500" style={inp}/></div>
          <div><label style={lbl}>باقة معيارية</label><input type="number" value={regForm.price_standard} onChange={e => setRegForm(f=>({...f,price_standard:e.target.value}))} placeholder="3500" style={inp}/></div>
          <div><label style={lbl}>باقة بريميوم</label><input type="number" value={regForm.price_premium} onChange={e => setRegForm(f=>({...f,price_premium:e.target.value}))} placeholder="7000" style={inp}/></div>
        </div>
        <button onClick={register} disabled={saving || !regForm.display_name_ar} style={{ padding:'13px', background: regForm.display_name_ar ? C.orange : '#DBDAE3', border:'none', borderRadius:10, color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
          {saving ? '⏳ جاري التسجيل...' : '🌟 تقديم ملفي للمراجعة'}
        </button>
        <p style={{ textAlign:'center', color:C.muted, fontSize:12, margin:0 }}>سيراجع الفريق ملفك خلال 24 ساعة ويتم التفعيل</p>
      </div>
    </div>
  )

  const pendingStatus = profile?.status === 'pending'

  return (
    <div style={{ padding:'28px 24px', direction:'rtl', minHeight:'100vh', background:C.bg }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        {/* Profile header */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:20, display:'flex', gap:14, alignItems:'center' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:`linear-gradient(135deg, ${C.orange}, #FF8C42)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:22 }}>
            {(profile?.display_name_ar||profile?.display_name)?.[0]}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <h2 style={{ fontSize:18, fontWeight:800, color:C.navy, margin:0 }}>{profile?.display_name_ar}</h2>
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, fontWeight:700, background: pendingStatus ? '#FFF8E8' : '#EAF7E0', color: pendingStatus ? '#B07000' : C.green }}>
                {pendingStatus ? '⏳ قيد المراجعة' : '✓ نشط'}
              </span>
            </div>
            <div style={{ display:'flex', gap:16 }}>
              {profile?.tiktok_followers > 0 && <span style={{ fontSize:12, color:C.text }}>🎵 {fmt(profile.tiktok_followers)}</span>}
              {profile?.instagram_followers > 0 && <span style={{ fontSize:12, color:C.text }}>📷 {fmt(profile.instagram_followers)}</span>}
              <span style={{ fontSize:12, color:C.muted }}>{myContracts.filter((c:any)=>c.status==='completed').length} حملة منجزة</span>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, textAlign:'center' }}>
            <div style={{ background:'#F8F7FA', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:20, fontWeight:800, color:C.navy }}>{myProposals.length}</div>
              <div style={{ fontSize:10, color:C.muted }}>عرض أرسلته</div>
            </div>
            <div style={{ background:'#F8F7FA', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:20, fontWeight:800, color:C.orange }}>{myContracts.length}</div>
              <div style={{ fontSize:10, color:C.muted }}>عقد نشط</div>
            </div>
          </div>
        </div>

        {pendingStatus && (
          <div style={{ background:'#FFF8E8', border:'1px solid #F5C842', borderRadius:10, padding:'12px 16px', marginBottom:16 }}>
            <p style={{ color:'#7A5000', fontSize:13, margin:0, fontWeight:600 }}>⏳ ملفك قيد المراجعة — سيتم التفعيل خلال 24 ساعة ويمكنك بعدها التقدم للبريفات</p>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.border}`, marginBottom:16 }}>
          {[['briefs','البريفات المتاحة'],['proposals','عروضي'],['contracts','عقودي']].map(([v,l]) => (
            <button key={v} onClick={()=>setTab(v)} style={{ padding:'9px 18px', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:tab===v?700:400, color:tab===v?C.orange:C.muted, borderBottom:tab===v?`2px solid ${C.orange}`:'2px solid transparent', marginBottom:-1 }}>{l}</button>
          ))}
        </div>

        {/* Briefs tab */}
        {tab==='briefs' && (
          <div style={{ display:'grid', gap:14 }}>
            {briefs.length === 0 && <div style={{ textAlign:'center', padding:40, color:C.muted }}>لا توجد بريفات مفتوحة حالياً</div>}
            {briefs.map((brief:any) => {
              const alreadyApplied = myProposals.some((p:any) => p.brief_id === brief.id)
              return (
                <div key={brief.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                    <h3 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:0 }}>{brief.title}</h3>
                    <span style={{ fontSize:12, color:C.orange, fontWeight:700 }}>
                      {brief.budget_min ? `${parseInt(brief.budget_min).toLocaleString()} - ${parseInt(brief.budget_max||brief.budget_min).toLocaleString()} ريال` : 'مفتوح'}
                    </span>
                  </div>
                  <p style={{ color:C.muted, fontSize:13, margin:'0 0 12px', lineHeight:1.5 }}>{(brief.description||'').slice(0,120)}...</p>
                  <div style={{ display:'flex', gap:12, marginBottom:12, flexWrap:'wrap' }}>
                    {brief.event_type && <span style={{ fontSize:11, color:C.text }}>🎪 {brief.event_type}</span>}
                    {brief.influencers_needed && <span style={{ fontSize:11, color:C.text }}>👥 {brief.influencers_needed} مطلوب</span>}
                    {brief.event_date && <span style={{ fontSize:11, color:C.text }}>📅 {brief.event_date}</span>}
                  </div>

                  {alreadyApplied ? (
                    <span style={{ fontSize:13, color:C.green, fontWeight:700 }}>✅ قدّمت عرضاً على هذا البريف</span>
                  ) : proposingId === brief.id ? (
                    <div style={{ background:'#F8F7FA', borderRadius:10, padding:14, display:'grid', gap:10 }}>
                      <div><label style={lbl}>رسالتك للمنظم *</label><textarea value={proposalForm.message} onChange={e => setProposalForm(f=>({...f,message:e.target.value}))} rows={3} placeholder="اشرح كيف ستنفذ الحملة وما تميزك..." style={{...inp,resize:'vertical'}}/></div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        <div><label style={lbl}>سعرك (ريال) *</label><input type="number" value={proposalForm.proposed_price} onChange={e => setProposalForm(f=>({...f,proposed_price:e.target.value}))} style={inp}/></div>
                        <div><label style={lbl}>مدة التنفيذ (يوم)</label><input type="number" value={proposalForm.estimated_days} onChange={e => setProposalForm(f=>({...f,estimated_days:e.target.value}))} style={inp}/></div>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => submitProposal(brief.id)} disabled={saving} style={{ flex:2, padding:'10px', background:C.orange, border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                          {saving ? '⏳...' : '📤 إرسال العرض'}
                        </button>
                        <button onClick={() => setProposingId(null)} style={{ flex:1, padding:'10px', border:`1px solid ${C.border}`, borderRadius:8, background:'none', color:C.text, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>إلغاء</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setProposingId(brief.id) }} disabled={pendingStatus} style={{ padding:'9px 20px', background: pendingStatus ? '#DBDAE3' : C.navy, border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor: pendingStatus ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                      📤 تقديم عرض
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* My proposals tab */}
        {tab==='proposals' && (
          <div style={{ display:'grid', gap:12 }}>
            {myProposals.length === 0 && <div style={{ textAlign:'center', padding:40, color:C.muted }}>لم تقدم أي عروض بعد</div>}
            {myProposals.map((p:any) => (
              <div key={p.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>عرض #{p.id.slice(0,8)}</span>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background: p.status==='accepted'?'#EAF7E0':p.status==='rejected'?'#FEF2F2':'#FFF8E8', color: p.status==='accepted'?C.green:p.status==='rejected'?C.red:'#B07000' }}>
                    {p.status==='accepted'?'✅ مقبول':p.status==='rejected'?'✗ مرفوض':'⏳ انتظار'}
                  </span>
                </div>
                <p style={{ color:C.muted, fontSize:13, margin:'0 0 8px' }}>{p.message?.slice(0,100)}...</p>
                <div style={{ display:'flex', gap:16 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:C.orange }}>{p.proposed_price?.toLocaleString()} ريال</span>
                  <span style={{ fontSize:12, color:C.muted }}>{new Date(p.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contracts tab */}
        {tab==='contracts' && (
          <div style={{ display:'grid', gap:12 }}>
            {myContracts.length === 0 && <div style={{ textAlign:'center', padding:40, color:C.muted }}>لا توجد عقود نشطة</div>}
            {myContracts.map((c:any) => (
              <div key={c.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>عقد #{c.id.slice(0,8)}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:C.orange }}>{c.influencer_payout?.toLocaleString()} ريال</span>
                </div>
                <div style={{ display:'flex', gap:12 }}>
                  <span style={{ fontSize:11, background:'#F8F7FA', color:C.text, padding:'3px 10px', borderRadius:8 }}>{c.status}</span>
                  <span style={{ fontSize:11, color:C.muted }}>تسليم: {c.due_date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
