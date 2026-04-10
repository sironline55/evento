'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A'
}
const inp: React.CSSProperties = {
  width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`,
  borderRadius:6, fontSize:13, outline:'none', fontFamily:'inherit',
  color:C.text, background:C.bg, boxSizing:'border-box'
}

// ── Nafath verification states ────────────────────────────────────────
type NafathState =
  | { stage:'idle' }
  | { stage:'entering_id' }
  | { stage:'waiting'; random:string; sessionId:string; countdown:number }
  | { stage:'polling'; random:string; sessionId:string }
  | { stage:'success'; verifiedName:string }
  | { stage:'rejected' }
  | { stage:'expired' }
  | { stage:'error'; message:string }

// ── Nafath Section Component ──────────────────────────────────────────
function NafathSection({ worker, onVerified }: {
  worker: any
  onVerified: (name: string, maskedId: string) => void
}) {
  const [state, setState] = useState<NafathState>({ stage:'idle' })
  const [nationalId, setNationalId] = useState('')
  const [idError, setIdError]       = useState('')
  const pollRef = useRef<NodeJS.Timeout|null>(null)

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  // Countdown timer while waiting
  useEffect(() => {
    if (state.stage !== 'waiting') return
    const t = setInterval(() => {
      setState(s => s.stage === 'waiting'
        ? s.countdown <= 1 ? { stage:'expired' } : { ...s, countdown: s.countdown-1 }
        : s)
    }, 1000)
    return () => clearInterval(t)
  }, [state.stage])

  function validateId(v: string) {
    if (!/^[12]\d{9}$/.test(v)) {
      setIdError('يجب أن يبدأ بـ 1 أو 2 ويتكون من 10 أرقام'); return false
    }
    setIdError(''); return true
  }

  async function startVerification() {
    if (!validateId(nationalId)) return
    setState({ stage:'waiting', random:'--', sessionId:'', countdown:300 })
    try {
      const res = await fetch('/api/nafath/initiate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ nationalId, purpose:'profile_verify' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الاتصال')
      setState({ stage:'waiting', random: data.random, sessionId: data.sessionId, countdown:300 })
      startPolling(data.sessionId, data.random)
    } catch(e:any) {
      setState({ stage:'error', message: e.message })
    }
  }

  function startPolling(sessionId: string, random: string) {
    // Poll every 2 seconds
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/nafath/status', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ sessionId }),
        })
        const { status } = await res.json()
        if (status === 'COMPLETED') {
          clearInterval(pollRef.current!)
          // Call complete endpoint
          const r2 = await fetch('/api/nafath/complete', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ sessionId }),
          })
          const d2 = await r2.json()
          if (r2.ok) {
            setState({ stage:'success', verifiedName: d2.verifiedName })
            onVerified(d2.verifiedName, d2.maskedId)
          } else {
            setState({ stage:'error', message: d2.error })
          }
        } else if (status === 'REJECTED') {
          clearInterval(pollRef.current!); setState({ stage:'rejected' })
        } else if (status === 'EXPIRED' || status === 'ERROR') {
          clearInterval(pollRef.current!); setState({ stage:'expired' })
        }
        // WAITING → keep polling
      } catch { /* network error — keep trying */ }
    }, 2000)
  }

  function reset() {
    if (pollRef.current) clearInterval(pollRef.current)
    setNationalId(''); setIdError('')
    setState({ stage:'idle' })
  }

  // ── Already verified ──────────────────────────────────────────────
  if (worker.nafath_verified) {
    return (
      <div style={{ background:C.card, border:`2px solid ${C.green}`, borderRadius:12, padding:20, marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <div style={{ width:44, height:44, background:'#EAF7E0', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🛡️</div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:C.navy }}>موثّق عبر نفاذ</h3>
              <span style={{ background:C.green, color:'#fff', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>✓ موثّق</span>
            </div>
            <p style={{ margin:'3px 0 0', fontSize:12, color:C.muted }}>
              هويتك موثّقة بالهوية الوطنية السعودية
            </p>
          </div>
        </div>
        <div style={{ background:'#F0FAF0', borderRadius:8, padding:'12px 14px', border:`1px solid #C3E6C3` }}>
          {[
            ['👤 الاسم الموثّق',  worker.nafath_verified_name || '—'],
            ['🪪 رقم الهوية',     worker.nafath_id_masked     || '—'],
            ['📅 تاريخ التوثيق', worker.nafath_verified_at
              ? new Date(worker.nafath_verified_at).toLocaleDateString('ar-SA', {year:'numeric',month:'long',day:'numeric'})
              : '—'],
          ].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid #DFF0DF` }}>
              <span style={{ fontSize:12, color:C.muted }}>{l}</span>
              <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{v}</span>
            </div>
          ))}
        </div>
        <p style={{ margin:'10px 0 0', fontSize:11, color:C.muted, textAlign:'center' }}>
          يظهر بادج "موثّق بنفاذ" لأصحاب العمل على ملفك الشخصي
        </p>
      </div>
    )
  }

  // ── Idle: CTA ─────────────────────────────────────────────────────
  if (state.stage === 'idle') {
    return (
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <div style={{ width:44, height:44, background:'#EDE9F7', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🛡️</div>
          <div>
            <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:C.navy }}>توثيق الهوية عبر نفاذ</h3>
            <p style={{ margin:'3px 0 0', fontSize:12, color:C.muted }}>يزيد من فرص قبولك في الفعاليات</p>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
          {[
            ['🏅', 'بادج موثّق يظهر لأصحاب العمل'],
            ['🔒', 'يؤكد أن هويتك حقيقية'],
            ['⚡', 'يُسرّع قبولك في الفعاليات'],
            ['🛡️', 'يحمي الفعاليات ذات الأمان العالي'],
          ].map(([icon, text]) => (
            <div key={text} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'8px 10px', background:'#F8F7FA', borderRadius:8 }}>
              <span style={{ fontSize:15 }}>{icon}</span>
              <span style={{ fontSize:11, color:C.text, lineHeight:1.4 }}>{text}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setState({ stage:'entering_id' })}
          style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,#1E0A3C,#3D1A78)', border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
        >
          🛡️ ابدأ التوثيق عبر نفاذ
        </button>
        <p style={{ margin:'8px 0 0', fontSize:11, color:C.muted, textAlign:'center' }}>يتطلب تطبيق نفاذ على جوالك</p>
      </div>
    )
  }

  // ── Entering ID ───────────────────────────────────────────────────
  if (state.stage === 'entering_id') {
    return (
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:C.navy }}>أدخل رقم هويتك</h3>
          <button onClick={reset} style={{ background:'none', border:'none', color:C.muted, fontSize:18, cursor:'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize:13, color:C.muted, margin:'0 0 14px', lineHeight:1.6 }}>
          سيُرسَل طلب تحقق لتطبيق نفاذ على جوالك — لا يتم مشاركة رقم هويتك مع أي طرف ثالث
        </p>
        <div style={{ marginBottom:10 }}>
          <label style={{ fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:5 }}>رقم الهوية الوطنية / الإقامة</label>
          <input
            value={nationalId}
            onChange={e => { setNationalId(e.target.value.replace(/\D/g,'')); setIdError('') }}
            onKeyDown={e => e.key==='Enter' && startVerification()}
            placeholder="1xxxxxxxxx"
            maxLength={10}
            inputMode="numeric"
            style={{ ...inp, fontSize:18, letterSpacing:4, textAlign:'center', fontFamily:'monospace' }}
          />
          {idError && <p style={{ fontSize:11, color:'#DC2626', margin:'4px 0 0' }}>⚠️ {idError}</p>}
          <p style={{ fontSize:11, color:C.muted, margin:'4px 0 0' }}>
            {nationalId.length}/10 رقم — يبدأ بـ 1 (مواطن) أو 2 (مقيم)
          </p>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          <button onClick={reset} style={{ flex:1, padding:'10px', border:`1px solid ${C.border}`, borderRadius:8, background:C.bg, cursor:'pointer', fontWeight:600, fontSize:13, fontFamily:'inherit', color:C.text }}>إلغاء</button>
          <button
            onClick={startVerification}
            disabled={nationalId.length !== 10}
            style={{ flex:2, padding:'10px', border:'none', borderRadius:8, background: nationalId.length===10 ? C.navy : '#DBDAE3', color:'#fff', fontWeight:700, fontSize:13, cursor: nationalId.length===10 ? 'pointer' : 'not-allowed', fontFamily:'inherit', transition:'background 0.2s' }}
          >
            إرسال طلب التحقق ←
          </button>
        </div>
      </div>
    )
  }

  // ── Waiting for user to approve in Nafath app ─────────────────────
  if (state.stage === 'waiting' || state.stage === 'polling') {
    const mins = Math.floor(state.countdown / 60)
    const secs = state.countdown % 60
    const pct  = Math.round((1 - state.countdown / 300) * 100)

    return (
      <div style={{ background:C.card, border:`2px solid #7B4FBF`, borderRadius:12, padding:20, marginBottom:14 }}>
        {/* Mock mode banner — remove after getting real API key */}
        <div style={{ background:'#FFF8E8', border:'1px solid #F5C842', borderRadius:8, padding:'8px 12px', marginBottom:14, display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:13 }}>🔧</span>
          <p style={{ margin:0, fontSize:11, color:'#7A5000' }}>
            <strong>وضع التطوير:</strong> بعد ربط Rabet API سيصل الطلب الحقيقي لتطبيق نفاذ. الآن الـ API يعيد WAITING دائماً.
          </p>
        </div>

        <div style={{ textAlign:'center', marginBottom:20 }}>
          <p style={{ fontSize:13, color:C.muted, margin:'0 0 12px' }}>افتح تطبيق نفاذ على جوالك واختر هذا الرقم:</p>
          <div style={{
            background:'linear-gradient(135deg,#1E0A3C,#3D1A78)',
            borderRadius:16, padding:'20px',
            display:'inline-flex', flexDirection:'column', alignItems:'center', gap:6,
            minWidth:140, boxShadow:'0 8px 24px rgba(30,10,60,0.3)'
          }}>
            <span style={{ color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:600, letterSpacing:2 }}>الرمز</span>
            <span style={{ color:'#fff', fontSize:52, fontWeight:900, lineHeight:1, fontFamily:'monospace', letterSpacing:8 }}>
              {state.random === '--' ? '…' : state.random}
            </span>
            <span style={{ color:'rgba(255,255,255,0.5)', fontSize:10 }}>أدخل هذا الرقم في نفاذ</span>
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:12, color:C.muted }}>
              <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:'#7B4FBF', marginLeft:6, animation:'pulse 1.5s ease-in-out infinite' }}/>
              في انتظار موافقتك...
            </span>
            <span style={{ fontSize:12, fontWeight:700, color: state.countdown < 60 ? '#DC2626' : C.muted }}>
              {mins}:{secs.toString().padStart(2,'0')}
            </span>
          </div>
          <div style={{ background:'#EDE9F7', borderRadius:50, height:5, overflow:'hidden' }}>
            <div style={{ width:`${pct}%`, height:'100%', background:'#7B4FBF', transition:'width 1s linear', borderRadius:50 }}/>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14, textAlign:'center' }}>
          {[['1','افتح نفاذ'],['2','اختر الرقم'],['3','وافق ببصمتك']].map(([n,l]) => (
            <div key={n} style={{ background:'#F8F7FA', borderRadius:8, padding:'8px 4px' }}>
              <div style={{ width:22, height:22, background:'#7B4FBF', borderRadius:'50%', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 4px' }}>{n}</div>
              <p style={{ fontSize:10, color:C.muted, margin:0 }}>{l}</p>
            </div>
          ))}
        </div>

        <button onClick={reset} style={{ width:'100%', padding:'9px', border:`1px solid ${C.border}`, borderRadius:8, background:C.bg, cursor:'pointer', fontSize:12, color:C.muted, fontFamily:'inherit' }}>
          إلغاء التحقق
        </button>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────────────
  if (state.stage === 'success') {
    return (
      <div style={{ background:'#EAF7E0', border:`2px solid ${C.green}`, borderRadius:12, padding:24, marginBottom:14, textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:8 }}>✅</div>
        <h3 style={{ color:C.green, fontSize:18, fontWeight:800, margin:'0 0 6px' }}>تم التوثيق بنجاح!</h3>
        <p style={{ color:'#2A6A20', fontSize:13, margin:'0 0 12px' }}>مرحباً {state.verifiedName}</p>
        <p style={{ color:C.muted, fontSize:12, margin:0 }}>يظهر بادج "موثّق بنفاذ" الآن على ملفك الشخصي</p>
      </div>
    )
  }

  // ── Rejected ──────────────────────────────────────────────────────
  if (state.stage === 'rejected') {
    return (
      <div style={{ background:'#FEF2F2', border:`2px solid #DC2626`, borderRadius:12, padding:20, marginBottom:14, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:8 }}>❌</div>
        <h3 style={{ color:'#B91C1C', fontSize:16, fontWeight:800, margin:'0 0 6px' }}>تم رفض الطلب</h3>
        <p style={{ color:'#B91C1C', fontSize:13, margin:'0 0 14px' }}>رفضت طلب التحقق في تطبيق نفاذ</p>
        <button onClick={reset} style={{ padding:'9px 24px', background:'#DC2626', border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>حاول مجدداً</button>
      </div>
    )
  }

  // ── Expired / Error ───────────────────────────────────────────────
  return (
    <div style={{ background:'#FFF8E8', border:`2px solid #B07000`, borderRadius:12, padding:20, marginBottom:14, textAlign:'center' }}>
      <div style={{ fontSize:40, marginBottom:8 }}>{state.stage === 'expired' ? '⏰' : '⚠️'}</div>
      <h3 style={{ color:'#7A5000', fontSize:16, fontWeight:800, margin:'0 0 6px' }}>
        {state.stage === 'expired' ? 'انتهت صلاحية الرمز' : 'حدث خطأ'}
      </h3>
      <p style={{ color:'#7A5000', fontSize:13, margin:'0 0 14px' }}>
        {state.stage === 'expired' ? 'لم يتم التحقق خلال 5 دقائق' : (state as any).message || 'خطأ غير معروف'}
      </p>
      <button onClick={reset} style={{ padding:'9px 24px', background:C.navy, border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>إعادة المحاولة</button>
    </div>
  )
}

// ── Main Profile Page ─────────────────────────────────────────────────
export default function StaffProfile() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const router = useRouter()

  const [worker, setWorker]           = useState<any>(null)
  const [ratings, setRatings]         = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [editing, setEditing]         = useState(false)
  const [form, setForm]               = useState<any>({})
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: w } = await sb.from('worker_profiles').select('*').eq('user_id', data.user.id).single()
      if (!w) return
      setWorker(w)
      setForm({
        full_name: w.full_name||'', phone: w.phone||'', city: w.city||'',
        bio: w.bio||'', experience_years: w.experience_years||0,
        daily_rate: w.daily_rate||0, is_available: w.is_available!==false
      })
      const [{ data: rat }, { data: asgn }] = await Promise.all([
        sb.from('staff_ratings').select('*,events(title)').eq('worker_id',w.id).order('created_at',{ascending:false}),
        sb.from('event_staff_assignments').select('*,events(title,start_date)').eq('worker_profile_id',w.id).order('work_date',{ascending:false}).limit(20),
      ])
      setRatings(rat||[]); setAssignments(asgn||[])
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true)
    await sb.from('worker_profiles').update({...form, updated_at: new Date().toISOString()}).eq('id', worker.id)
    setWorker((w:any) => ({...w,...form}))
    setEditing(false); setSaving(false)
  }

  function handleVerified(name: string, maskedId: string) {
    setWorker((w:any) => ({
      ...w,
      nafath_verified:      true,
      nafath_verified_name: name,
      nafath_id_masked:     maskedId,
      nafath_verified_at:   new Date().toISOString(),
      is_verified:          true,
    }))
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>جاري التحميل...</div>
  if (!worker) return null

  const avgRating    = ratings.length > 0 ? (ratings.reduce((s,r) => s+(r.rating||0),0)/ratings.length).toFixed(1) : '—'
  const completedJobs = assignments.filter(a => a.status==='completed').length

  return (
    <div style={{direction:'rtl', paddingBottom:80}}>
      {/* Hero */}
      <div style={{background:`linear-gradient(135deg,${C.navy},#3D1A78)`,padding:'24px 20px 60px',position:'relative'}}>
        <h2 style={{color:'rgba(255,255,255,0.7)',fontSize:13,margin:'0 0 16px',fontWeight:400}}>ملف الموظف</h2>
        <div style={{display:'flex',gap:16,alignItems:'center'}}>
          <div style={{position:'relative'}}>
            {worker.profile_photo||worker.photo_url ? (
              <img src={worker.profile_photo||worker.photo_url} alt="" style={{width:72,height:72,borderRadius:'50%',objectFit:'cover',border:'3px solid rgba(255,255,255,0.3)'}}/>
            ) : (
              <div style={{width:72,height:72,background:C.orange,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,color:'#fff',fontWeight:800,border:'3px solid rgba(255,255,255,0.3)'}}>
                {worker.full_name?.[0]||'?'}
              </div>
            )}
            {/* Verified badge overlay */}
            {worker.nafath_verified && (
              <div style={{position:'absolute',bottom:-2,right:-2,background:C.green,borderRadius:'50%',width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',border:'2px solid #fff',fontWeight:700}}>✓</div>
            )}
          </div>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              <h1 style={{color:'#fff',fontSize:20,fontWeight:800,margin:0}}>{worker.full_name}</h1>
              {worker.nafath_verified && (
                <span style={{background:'rgba(58,125,10,0.9)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:10,border:'1px solid rgba(255,255,255,0.3)'}}>
                  🛡️ موثّق نفاذ
                </span>
              )}
            </div>
            <p style={{color:'rgba(255,255,255,0.6)',fontSize:12,margin:'4px 0 0'}}>
              {worker.city||'—'} · {worker.experience_years||0} سنوات خبرة
            </p>
            <div style={{display:'flex',gap:1,marginTop:6}}>
              {[1,2,3,4,5].map(n => (
                <span key={n} style={{color: n<=Math.round(worker.rating_avg||worker.rating||0)?'#FFD700':'rgba(255,255,255,0.2)',fontSize:16}}>★</span>
              ))}
              <span style={{color:'rgba(255,255,255,0.6)',fontSize:12,marginRight:6}}>({ratings.length} تقييم)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{padding:'0 16px',marginTop:-28,marginBottom:16}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {[
            {l:'أعمال',    v:completedJobs,           c:C.navy,    b:'#F0EDF7'},
            {l:'التزام',   v:`${worker.commitment_pct||100}%`, c:C.green,   b:'#EAF7E0'},
            {l:'التقييم',  v:avgRating+'★',            c:'#B07000', b:'#FFFBEB'},
            {l:'الأجر',    v:`${worker.daily_rate||0}`,c:C.orange,  b:'#FEF0ED'},
          ].map(s => (
            <div key={s.l} style={{background:s.b,borderRadius:10,padding:'12px 10px',textAlign:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
              <p style={{fontSize:17,fontWeight:800,color:s.c,margin:0}}>{s.v}</p>
              <p style={{fontSize:10,color:C.muted,margin:0}}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:'0 16px'}}>

        {/* ── NAFATH SECTION ───────────────────────────────── */}
        <NafathSection worker={worker} onVerified={handleVerified}/>

        {/* ── Personal Info ─────────────────────────────────── */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:18,marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:0}}>المعلومات الشخصية</h3>
            <button onClick={()=>setEditing(!editing)} style={{padding:'6px 14px',border:`1px solid ${C.border}`,borderRadius:6,background:C.bg,color:C.text,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>
              {editing ? 'إلغاء' : '✏️ تعديل'}
            </button>
          </div>
          {editing ? (
            <div>
              {[
                ['الاسم الكامل','full_name','text'],
                ['رقم الجوال','phone','tel'],
                ['المدينة','city','text'],
                ['الخبرة (سنوات)','experience_years','number'],
                ['الأجر اليومي (SAR)','daily_rate','number'],
              ].map(([l,k,t]) => (
                <div key={k} style={{marginBottom:10}}>
                  <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>{l}</label>
                  <input type={t} value={form[k]||''} onChange={e=>setForm((f:any)=>({...f,[k]:e.target.value}))} style={inp}/>
                </div>
              ))}
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>نبذة تعريفية</label>
                <textarea value={form.bio||''} onChange={e=>setForm((f:any)=>({...f,bio:e.target.value}))} rows={3} style={{...inp,resize:'vertical'}} placeholder="اكتب نبذة عن نفسك..."/>
              </div>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginBottom:14}}>
                <input type="checkbox" checked={form.is_available} onChange={e=>setForm((f:any)=>({...f,is_available:e.target.checked}))} style={{width:15,height:15,accentColor:C.orange}}/>
                <span style={{fontSize:13,fontWeight:600,color:C.text}}>متاح للعمل حالياً</span>
              </label>
              <button onClick={save} disabled={saving} style={{width:'100%',padding:'10px',background:C.orange,border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                {saving ? '...' : '💾 حفظ التغييرات'}
              </button>
            </div>
          ) : (
            <div>
              {[
                ['📞 الجوال',   worker.phone||'—'],
                ['📍 المدينة',  worker.city||'—'],
                ['💼 الخبرة',   `${worker.experience_years||0} سنوات`],
                ['💰 الأجر',    `${worker.daily_rate||0} SAR / يوم`],
                ['🟢 الحالة',   worker.is_available!==false?'متاح للعمل':'غير متاح'],
              ].map(([l,v]) => (
                <div key={l} style={{display:'grid',gridTemplateColumns:'110px 1fr',gap:8,marginBottom:10,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
                  <span style={{fontSize:12,color:C.muted,fontWeight:600}}>{l}</span>
                  <span style={{fontSize:13,color:C.text,fontWeight:600}}>{v}</span>
                </div>
              ))}
              {worker.bio && (
                <p style={{fontSize:13,color:C.text,lineHeight:1.6,margin:'10px 0 0',background:'#F8F7FA',padding:'12px',borderRadius:8}}>{worker.bio}</p>
              )}
            </div>
          )}
        </div>

        {/* Skills */}
        {(worker.skills||[]).length > 0 && (
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginBottom:14}}>
            <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 12px'}}>المهارات</h3>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {(worker.skills||[]).map((s:string) => (
                <span key={s} style={{background:'#EDE9F7',color:'#7B4FBF',padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:700}}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Work history */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden',marginBottom:14}}>
          <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontWeight:700,color:C.navy,fontSize:14}}>📋 سجل الأعمال ({assignments.length})</span>
          </div>
          {assignments.length===0 ? (
            <p style={{padding:20,color:C.muted,fontSize:13,margin:0}}>لا توجد أعمال سابقة</p>
          ) : assignments.map((a,i) => {
            const stMap: any = {
              pending:{l:'انتظار',c:'#B07000'}, confirmed:{l:'مؤكد',c:C.green},
              completed:{l:'مكتمل',c:'#7B4FBF'}, no_show:{l:'غياب',c:'#DC2626'}, assigned:{l:'مسند',c:'#0070B8'}
            }
            const st = stMap[a.status]||stMap.pending
            return (
              <div key={a.id} style={{padding:'12px 16px',borderBottom:i<assignments.length-1?`1px solid ${C.border}`:'none',display:'flex',alignItems:'center',gap:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.events?.title||'—'}</p>
                  <div style={{display:'flex',gap:8,marginTop:2}}>
                    <span style={{fontSize:11,color:C.muted}}>🎭 {a.role}</span>
                    {a.zone&&<span style={{fontSize:11,color:C.muted}}>📍 {a.zone}</span>}
                    {a.work_date&&<span style={{fontSize:11,color:C.muted}}>📅 {new Date(a.work_date).toLocaleDateString('ar-SA')}</span>}
                  </div>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:st.c,whiteSpace:'nowrap'}}>{st.l}</span>
              </div>
            )
          })}
        </div>

        {/* Ratings */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontWeight:700,color:C.navy,fontSize:14}}>⭐ تقييمات المنظمين ({ratings.length})</span>
          </div>
          {ratings.length===0 ? (
            <p style={{padding:20,color:C.muted,fontSize:13,margin:0}}>لا توجد تقييمات بعد</p>
          ) : ratings.map((r,i) => (
            <div key={r.id} style={{padding:'14px 16px',borderBottom:i<ratings.length-1?`1px solid ${C.border}`:'none'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontSize:13,fontWeight:700,color:C.navy}}>{r.events?.title||'فعالية'}</span>
                <div style={{display:'flex',gap:1}}>
                  {[1,2,3,4,5].map(n=><span key={n} style={{color:n<=r.rating?'#FFD700':'#DBDAE3',fontSize:16}}>★</span>)}
                </div>
              </div>
              {r.comment&&<p style={{fontSize:12,color:C.muted,margin:'0 0 6px'}}>"{r.comment}"</p>}
              <div style={{display:'flex',gap:12}}>
                {r.punctuality&&<span style={{fontSize:11,color:C.muted}}>⏰ {r.punctuality}/5</span>}
                {r.professionalism&&<span style={{fontSize:11,color:C.muted}}>💼 {r.professionalism}/5</span>}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
