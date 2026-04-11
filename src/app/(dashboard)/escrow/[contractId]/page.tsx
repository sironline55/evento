'use client'
async function triggerWhatsApp(type: string, userId: string, phone: string, data: any, refId?: string) {
  try { await fetch('/api/whatsapp/send', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({type,userId,phone,data,referenceId:refId}) }) } catch {}
}
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useParams } from 'next/navigation'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#F8F7FA', card:'#FFF', green:'#3A7D0A', red:'#DC2626' }
const inp: React.CSSProperties = { width:'100%', padding:'12px 14px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit', color:C.text, background:C.card, boxSizing:'border-box', transition:'border-color .15s' }

function fmt(n: number) {
  return n?.toLocaleString('ar-SA') || '0'
}

// ── Card Number formatter ────────────────────────────────
function formatCard(v: string) {
  return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g,'').slice(0,4)
  return d.length >= 3 ? d.slice(0,2)+'/'+d.slice(2) : d
}

// ── Flow Step ────────────────────────────────────────────
function FlowStep({ n, label, active, done }: { n:number; label:string; active:boolean; done:boolean }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flex:1 }}>
      <div style={{
        width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
        background: done ? C.green : active ? C.orange : C.border,
        color:'#fff', fontWeight:900, fontSize: done ? 16 : 14,
        transition:'all .3s'
      }}>
        {done ? '✓' : n}
      </div>
      <span style={{ fontSize:11, fontWeight: active ? 700 : 400, color: active ? C.navy : C.muted, textAlign:'center', lineHeight:1.3 }}>{label}</span>
    </div>
  )
}

export default function EscrowPaymentPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const router = useRouter()
  const params = useParams()
  const contractId = params?.contractId as string

  const [contract, setContract] = useState<any>(null)
  const [brief, setBrief] = useState<any>(null)
  const [influencer, setInfluencer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [step, setStep] = useState(1) // 1=payment form, 2=processing, 3=success

  // Card form state
  const [card, setCard] = useState({ number:'', name:'', expiry:'', cvv:'' })
  const [method, setMethod] = useState<'card'|'stc'|'apple'>('card')
  const [stcPhone, setStcPhone] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!contractId) return
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }

      const { data: c } = await sb.from('campaign_contracts').select('*').eq('id', contractId).single()
      if (!c) { router.push('/contracts'); return }
      if (c.status !== 'pending_payment') {
        // Already paid — redirect
        router.push('/contracts')
        return
      }
      setContract(c)

      const [briefRes, infRes] = await Promise.all([
        sb.from('campaign_briefs').select('title,description,event_date,event_type').eq('id', c.brief_id).single(),
        sb.from('influencer_profiles').select('display_name,display_name_ar,avatar_url,tiktok_followers,instagram_followers').eq('id', c.influencer_id).single(),
      ])
      setBrief(briefRes.data)
      setInfluencer(infRes.data)
      setLoading(false)
    })
  }, [contractId])

  async function handlePay() {
    if (method === 'card') {
      if (!card.number || !card.name || !card.expiry || !card.cvv) {
        setError('يرجى تعبئة جميع حقول البطاقة')
        return
      }
      if (card.number.replace(/\s/g,'').length < 16) {
        setError('رقم البطاقة غير صحيح')
        return
      }
    }
    if (method === 'stc' && !stcPhone) {
      setError('يرجى إدخال رقم الجوال')
      return
    }
    setError('')
    setPaying(true)
    setStep(2) // Processing

    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2500))

    // Create escrow transaction
    const autoRelease = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { error: escrowErr } = await sb.from('escrow_transactions').insert({
      contract_id: contractId,
      org_id: contract.org_id,
      influencer_id: contract.influencer_id,
      amount: contract.agreed_price,
      platform_fee: contract.platform_fee,
      influencer_payout: contract.influencer_payout,
      payment_method: method,
      payment_ref: `TXN-${Date.now()}`,
      payment_status: 'paid',
      auto_release_at: autoRelease,
    })

    if (!escrowErr) {
      // 🔔 WhatsApp: notify influencer payment is held
      triggerWhatsApp('inf_payment_held', contract.influencer_id, '+966500000000', {
        name: influencer?.display_name_ar || 'مؤثر',
        amount: contract.influencer_payout?.toLocaleString('ar-SA'),
      }, contractId)
      await sb.from('campaign_contracts').update({
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
      }).eq('id', contractId)
      setStep(3)
      setPaid(true)
    } else {
      setError('حدث خطأ، حاول مرة أخرى')
      setStep(1)
    }
    setPaying(false)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', direction:'rtl' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
        <p style={{ color:C.muted }}>جاري التحميل...</p>
      </div>
    </div>
  )

  if (!contract) return null

  const totalWithVat = Math.round(contract.agreed_price * 1.15)

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl', fontFamily:"'Tajawal',sans-serif", padding:'28px 16px' }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>

        {/* Back */}
        <a href="/contracts" style={{ color:C.muted, fontSize:13, textDecoration:'none', display:'block', marginBottom:20 }}>← العودة للعقود</a>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:24, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>🔒 دفع مبلغ Escrow</h1>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>المبلغ محفوظ بأمان — لن يُحوَّل للمؤثر إلا بعد موافقتك على المحتوى</p>
        </div>

        {/* Progress Flow */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'20px 24px', marginBottom:20 }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.muted, margin:'0 0 16px', textTransform:'uppercase', letterSpacing:1 }}>مراحل العملية</p>
          <div style={{ display:'flex', alignItems:'flex-start', gap:0 }}>
            <FlowStep n={1} label="دفع Escrow" active={step===1} done={step>1} />
            <div style={{ flex:1, height:2, background: step>1?C.green:C.border, marginTop:18, transition:'background .3s' }}/>
            <FlowStep n={2} label="المؤثر ينفذ" active={false} done={false} />
            <div style={{ flex:1, height:2, background:C.border, marginTop:18 }}/>
            <FlowStep n={3} label="ترفع المحتوى" active={false} done={false} />
            <div style={{ flex:1, height:2, background:C.border, marginTop:18 }}/>
            <FlowStep n={4} label="تراجع وتوافق" active={false} done={false} />
            <div style={{ flex:1, height:2, background:C.border, marginTop:18 }}/>
            <FlowStep n={5} label="يستلم المبلغ" active={false} done={false} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:16, alignItems:'start' }}>

          {/* Left: Payment form */}
          <div>
            {step === 3 ? (
              /* SUCCESS */
              <div style={{ background:C.card, border:`2px solid ${C.green}`, borderRadius:16, padding:40, textAlign:'center' }}>
                <div style={{ width:64, height:64, borderRadius:'50%', background:'#EAF7E0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:28 }}>✅</div>
                <h2 style={{ fontSize:22, fontWeight:900, color:C.green, margin:'0 0 8px' }}>تم الدفع بنجاح!</h2>
                <p style={{ color:C.muted, fontSize:14, margin:'0 0 6px' }}>المبلغ محفوظ في Escrow — العقد أصبح نشطاً</p>
                <p style={{ color:C.muted, fontSize:12, margin:'0 0 28px' }}>سيُفرج عنه تلقائياً بعد 7 أيام من تسليم المحتوى إذا لم تُدخل نزاعاً</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <a href="/contracts" style={{ padding:'12px', background:C.navy, borderRadius:10, color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none', display:'block', textAlign:'center' }}>
                    عرض العقود
                  </a>
                  <a href="/briefs" style={{ padding:'12px', border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontWeight:600, fontSize:14, textDecoration:'none', display:'block', textAlign:'center' }}>
                    البريفات
                  </a>
                </div>
              </div>
            ) : step === 2 ? (
              /* PROCESSING */
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:60, textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>⚙️</div>
                <h3 style={{ fontSize:18, fontWeight:800, color:C.navy, margin:'0 0 8px' }}>جاري معالجة الدفع...</h3>
                <p style={{ color:C.muted, fontSize:13, margin:'0 0 24px' }}>يرجى الانتظار، لا تغلق الصفحة</p>
                <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:C.orange, animation:'pulse 1.2s ease-in-out infinite', animationDelay:`${i*0.2}s` }}/>
                  ))}
                </div>
              </div>
            ) : (
              /* PAYMENT FORM */
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24 }}>
                <h3 style={{ fontSize:16, fontWeight:800, color:C.navy, margin:'0 0 18px' }}>طريقة الدفع</h3>

                {/* Method tabs */}
                <div style={{ display:'flex', gap:8, marginBottom:24 }}>
                  {[
                    { v:'card', label:'💳 بطاقة', desc:'Visa / Mastercard / Mada' },
                    { v:'stc', label:'📱 STC Pay', desc:'الدفع بـ STC' },
                    { v:'apple', label:' Apple Pay', desc:'ادفع ببصمتك' },
                  ].map(m => (
                    <button key={m.v} onClick={() => setMethod(m.v as any)} style={{
                      flex:1, padding:'10px 8px', borderRadius:10, cursor:'pointer', fontFamily:'inherit', textAlign:'center',
                      border: method===m.v ? `2px solid ${C.orange}` : `1px solid ${C.border}`,
                      background: method===m.v ? '#FEF0ED' : C.card,
                    }}>
                      <div style={{ fontSize:14, fontWeight:700, color: method===m.v ? C.orange : C.text, marginBottom:2 }}>{m.label}</div>
                      <div style={{ fontSize:10, color:C.muted }}>{m.desc}</div>
                    </button>
                  ))}
                </div>

                {method === 'card' && (
                  <div style={{ display:'grid', gap:14 }}>
                    <div>
                      <label style={{ fontSize:12, fontWeight:700, color:C.text, display:'block', marginBottom:6 }}>رقم البطاقة</label>
                      <div style={{ position:'relative' }}>
                        <input
                          value={card.number}
                          onChange={e => setCard(c=>({...c, number: formatCard(e.target.value)}))}
                          placeholder="0000 0000 0000 0000"
                          style={{...inp, paddingLeft:48, direction:'ltr', textAlign:'left'}}
                          maxLength={19}
                        />
                        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:18 }}>💳</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize:12, fontWeight:700, color:C.text, display:'block', marginBottom:6 }}>اسم حامل البطاقة</label>
                      <input
                        value={card.name}
                        onChange={e => setCard(c=>({...c, name: e.target.value}))}
                        placeholder="AHMED MOHAMMED"
                        style={{...inp, direction:'ltr', textAlign:'left', textTransform:'uppercase'}}
                      />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div>
                        <label style={{ fontSize:12, fontWeight:700, color:C.text, display:'block', marginBottom:6 }}>تاريخ الانتهاء</label>
                        <input
                          value={card.expiry}
                          onChange={e => setCard(c=>({...c, expiry: formatExpiry(e.target.value)}))}
                          placeholder="MM/YY"
                          style={{...inp, direction:'ltr', textAlign:'left'}}
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize:12, fontWeight:700, color:C.text, display:'block', marginBottom:6 }}>CVV</label>
                        <input
                          value={card.cvv}
                          onChange={e => setCard(c=>({...c, cvv: e.target.value.replace(/\D/g,'').slice(0,4)}))}
                          placeholder="•••"
                          type="password"
                          style={{...inp, direction:'ltr', textAlign:'left'}}
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {method === 'stc' && (
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:C.text, display:'block', marginBottom:6 }}>رقم الجوال المسجل في STC Pay</label>
                    <input
                      value={stcPhone}
                      onChange={e => setStcPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                      placeholder="05XXXXXXXX"
                      style={{...inp, direction:'ltr', textAlign:'left'}}
                      maxLength={10}
                    />
                    <p style={{ fontSize:11, color:C.muted, margin:'8px 0 0' }}>ستصلك رسالة تأكيد على جوالك</p>
                  </div>
                )}

                {method === 'apple' && (
                  <div style={{ textAlign:'center', padding:'24px 0' }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>📱</div>
                    <p style={{ color:C.muted, fontSize:14, margin:'0 0 6px' }}>سيُفتح Apple Pay عند الضغط على زر الدفع</p>
                    <p style={{ color:C.muted, fontSize:12 }}>استخدم Touch ID أو Face ID للتأكيد</p>
                  </div>
                )}

                {error && (
                  <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', marginTop:16 }}>
                    <p style={{ color:C.red, fontSize:13, margin:0, fontWeight:600 }}>⚠️ {error}</p>
                  </div>
                )}

                <div style={{ marginTop:24, padding:'14px 16px', background:'#F8F7FA', borderRadius:10, marginBottom:20 }}>
                  <p style={{ fontSize:12, color:C.muted, margin:'0 0 6px', fontWeight:700 }}>ملاحظة مهمة</p>
                  <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.7 }}>
                    المبلغ سيُخصم من حسابك ويُحفظ في Escrow آمن. لن يصل للمؤثر إلا بعد موافقتك على المحتوى المُسلَّم، أو تلقائياً بعد 7 أيام.
                  </p>
                </div>

                <button onClick={handlePay} disabled={paying} style={{
                  width:'100%', padding:'14px', background:C.orange, border:'none',
                  borderRadius:12, color:'#fff', fontWeight:900, fontSize:16,
                  cursor: paying ? 'wait' : 'pointer', fontFamily:'inherit',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8
                }}>
                  <span>🔒</span>
                  <span>ادفع {totalWithVat.toLocaleString()} ريال بأمان</span>
                </button>

                <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:14 }}>
                  {['🔒 SSL آمن', '🏦 SAMA معتمد', '🛡️ حماية كاملة'].map(t => (
                    <span key={t} style={{ fontSize:11, color:C.muted }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Order summary (sticky) */}
          <div style={{ position:'sticky', top:20 }}>

            {/* Contract info */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:12 }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:C.navy, margin:'0 0 14px' }}>📄 تفاصيل العقد</h3>

              {/* Influencer */}
              {influencer && (
                <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14, padding:'10px 12px', background:'#F8F7FA', borderRadius:10 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:`linear-gradient(135deg, ${C.orange}, #FF8C42)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16, flexShrink:0 }}>
                    {influencer.avatar_url ? (
                      <img src={influencer.avatar_url} style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover' }} alt="" onError={e=>(e.currentTarget.style.display='none')}/>
                    ) : (influencer.display_name_ar||influencer.display_name||'?')[0]}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{influencer.display_name_ar || influencer.display_name}</div>
                    <div style={{ fontSize:11, color:C.muted }}>مؤثر معتمد</div>
                  </div>
                </div>
              )}

              {brief && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:12, color:C.muted, marginBottom:3 }}>الحملة</div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{brief.title}</div>
                  {brief.event_date && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>📅 {brief.event_date}</div>}
                </div>
              )}

              {/* Financial breakdown */}
              <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14, display:'grid', gap:8 }}>
                {[
                  { label:'سعر الحملة', value: contract.agreed_price, color:C.text },
                  { label:'عمولة المنصة (15%)', value: contract.platform_fee, color:C.muted },
                  { label:'ضريبة القيمة المضافة (15%)', value: Math.round(contract.agreed_price*0.15), color:C.muted },
                ].map(r => (
                  <div key={r.label} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                    <span style={{ color:C.muted }}>{r.label}</span>
                    <span style={{ fontWeight:600, color:r.color }}>{r.value?.toLocaleString()} ريال</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', borderTop:`1px solid ${C.border}`, paddingTop:8, marginTop:2 }}>
                  <span style={{ fontSize:15, fontWeight:800, color:C.navy }}>الإجمالي</span>
                  <span style={{ fontSize:18, fontWeight:900, color:C.orange }}>{totalWithVat.toLocaleString()} ريال</span>
                </div>
              </div>
            </div>

            {/* Escrow guarantee */}
            <div style={{ background:'#EAF7E0', border:'1px solid #C3E6C3', borderRadius:12, padding:16 }}>
              <h4 style={{ fontSize:13, fontWeight:800, color:'#1A5A00', margin:'0 0 10px', display:'flex', alignItems:'center', gap:6 }}>
                🛡️ ضمان Escrow
              </h4>
              <div style={{ display:'grid', gap:7 }}>
                {[
                  'المبلغ محفوظ بأمان لدينا',
                  'لا يُحوَّل للمؤثر إلا بموافقتك',
                  'استرداد كامل في حال النزاع',
                  'إفراج تلقائي بعد 7 أيام',
                ].map(g => (
                  <div key={g} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'#2A7A00' }}>
                    <span style={{ fontSize:10, background:'#C3E6C3', borderRadius:'50%', width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✓</span>
                    {g}
                  </div>
                ))}
              </div>
            </div>

            {/* Payout info */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginTop:10 }}>
              <p style={{ fontSize:11, color:C.muted, margin:'0 0 8px', fontWeight:700 }}>💰 سيستلم المؤثر</p>
              <div style={{ fontSize:20, fontWeight:900, color:C.navy }}>{contract.influencer_payout?.toLocaleString()} ريال</div>
              <p style={{ fontSize:10, color:C.muted, margin:'4px 0 0' }}>بعد خصم عمولة المنصة 15%</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  )
}
