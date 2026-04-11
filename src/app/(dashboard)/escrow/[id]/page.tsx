'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useParams } from 'next/navigation'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFF', green:'#3A7D0A', red:'#DC2626' }
const inp: React.CSSProperties = { width:'100%', padding:'12px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit', color:C.text, background:C.card, boxSizing:'border-box', letterSpacing:1 }

const METHODS = [
  { key:'card',     label:'بطاقة ائتمانية', icon:'💳', sub:'Visa / Mastercard / Mada',   color:'#1A56DB' },
  { key:'stc_pay',  label:'STC Pay',         icon:'📱', sub:'ادفع برقم جوالك',             color:'#6D28D9' },
  { key:'transfer', label:'تحويل بنكي',     icon:'🏦', sub:'IBAN مباشر',                  color:'#065F46' },
]

function fmt(n: number) {
  return n?.toLocaleString('ar-SA', { minimumFractionDigits:0, maximumFractionDigits:0 }) || '0'
}

// ── Step indicator ────────────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  const steps = ['اختر طريقة الدفع', 'أدخل بياناتك', 'التأكيد']
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:32 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', flex: i < steps.length-1 ? 1 : 'none' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{
              width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:800, fontSize:13,
              background: current > i ? C.green : current === i ? C.orange : '#E5E7EB',
              color: current >= i ? '#fff' : C.muted,
            }}>{current > i ? '✓' : i+1}</div>
            <span style={{ fontSize:11, color: current===i?C.navy:C.muted, fontWeight:current===i?700:400, whiteSpace:'nowrap' }}>{s}</span>
          </div>
          {i < steps.length-1 && <div style={{ flex:1, height:2, background: current > i ? C.green : '#E5E7EB', margin:'0 8px', marginBottom:16 }}/>}
        </div>
      ))}
    </div>
  )
}

// ── Card form ─────────────────────────────────────────────────────────────
function CardForm({ onPay, amount, loading }: { onPay:(ref:string)=>void; amount:number; loading:boolean }) {
  const [num, setNum] = useState('')
  const [exp, setExp] = useState('')
  const [cvv, setCvv] = useState('')
  const [name, setName] = useState('')

  function formatNum(v: string) {
    return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()
  }
  function formatExp(v: string) {
    return v.replace(/\D/g,'').slice(0,4).replace(/(\d{2})(\d)/,'$1/$2')
  }

  const isValid = num.replace(/\s/g,'').length===16 && exp.length===5 && cvv.length>=3 && name.length>2
  const cardBrand = num.startsWith('4') ? 'Visa' : num.startsWith('5') ? 'Mastercard' : num.startsWith('9') ? 'mada' : ''

  return (
    <div style={{ display:'grid', gap:14 }}>
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:6 }}>اسم حامل البطاقة</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="الاسم كما يظهر على البطاقة" style={inp}/>
      </div>
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:6 }}>رقم البطاقة</label>
        <div style={{ position:'relative' }}>
          <input value={num} onChange={e => setNum(formatNum(e.target.value))} placeholder="0000 0000 0000 0000" style={{...inp, paddingLeft:52}} maxLength={19}/>
          {cardBrand && <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:11, fontWeight:700, color:C.muted }}>{cardBrand}</span>}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:6 }}>تاريخ الانتهاء</label>
          <input value={exp} onChange={e => setExp(formatExp(e.target.value))} placeholder="MM/YY" style={inp} maxLength={5}/>
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:6 }}>CVV</label>
          <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="000" style={inp} type="password" maxLength={4}/>
        </div>
      </div>

      <div style={{ background:'#F0EDFF', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:14 }}>🔒</span>
        <span style={{ fontSize:12, color:'#5B3FA0' }}>بياناتك محمية بتشفير SSL 256-bit — هذه بيئة تجريبية آمنة</span>
      </div>

      <button onClick={() => { if(isValid) onPay('CARD-'+Math.random().toString(36).slice(2,10).toUpperCase()) }} disabled={!isValid || loading} style={{
        padding:'14px', background: isValid && !loading ? C.orange : '#DBDAE3',
        border:'none', borderRadius:10, color:'#fff', fontWeight:800, fontSize:15,
        cursor: isValid && !loading ? 'pointer' : 'not-allowed', fontFamily:'inherit',
        transition:'all .2s'
      }}>
        {loading ? '⏳ جاري المعالجة...' : `ادفع ${fmt(amount)} ريال →`}
      </button>
    </div>
  )
}

// ── STC Pay form ──────────────────────────────────────────────────────────
function STCForm({ onPay, amount, loading }: { onPay:(ref:string)=>void; amount:number; loading:boolean }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sending, setSending] = useState(false)

  function sendOtp() {
    if (phone.length < 10) return
    setSending(true)
    setTimeout(() => { setOtpSent(true); setSending(false) }, 1500)
  }

  return (
    <div style={{ display:'grid', gap:14 }}>
      <div style={{ textAlign:'center', padding:'20px 0' }}>
        <div style={{ fontSize:48, marginBottom:8 }}>📱</div>
        <h3 style={{ fontSize:16, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>الدفع عبر STC Pay</h3>
        <p style={{ color:C.muted, fontSize:13, margin:0 }}>أدخل رقم جوالك المرتبط بحساب STC Pay</p>
      </div>
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:6 }}>رقم الجوال</label>
        <div style={{ display:'flex', gap:8 }}>
          <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
            placeholder="05xxxxxxxx" style={{...inp, flex:1}}/>
          {!otpSent && (
            <button onClick={sendOtp} disabled={phone.length<10 || sending} style={{ padding:'12px 16px', background: phone.length>=10 ? '#6D28D9' : '#DBDAE3', border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              {sending ? '⏳...' : 'إرسال OTP'}
            </button>
          )}
        </div>
      </div>
      {otpSent && (
        <>
          <div style={{ background:'#EAF7E0', border:'1px solid #C3E6C3', borderRadius:8, padding:'10px 14px' }}>
            <p style={{ color:C.green, fontSize:13, fontWeight:600, margin:0 }}>✅ تم إرسال رمز التحقق — (للتجربة: استخدم 1234)</p>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:6 }}>رمز التحقق OTP</label>
            <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
              placeholder="● ● ● ●" style={{...inp, textAlign:'center', fontSize:22, letterSpacing:8}} maxLength={6}/>
          </div>
          <button onClick={() => { if(otp==='1234'||otp.length===4) onPay('STC-'+Math.random().toString(36).slice(2,8).toUpperCase()) }} disabled={otp.length<4||loading} style={{
            padding:'14px', background: otp.length>=4 && !loading ? '#6D28D9' : '#DBDAE3',
            border:'none', borderRadius:10, color:'#fff', fontWeight:800, fontSize:15,
            cursor: otp.length>=4 && !loading ? 'pointer' : 'not-allowed', fontFamily:'inherit'
          }}>
            {loading ? '⏳ جاري التحقق...' : `تأكيد دفع ${fmt(amount)} ريال`}
          </button>
        </>
      )}
    </div>
  )
}

// ── Bank Transfer form ────────────────────────────────────────────────────
function BankForm({ onPay, amount, contractId, loading }: { onPay:(ref:string)=>void; amount:number; contractId:string; loading:boolean }) {
  const ref = 'EVTVMS-' + contractId.slice(0,8).toUpperCase()
  const [confirmed, setConfirmed] = useState(false)

  return (
    <div style={{ display:'grid', gap:14 }}>
      <div style={{ background:'#F8F7FA', borderRadius:12, padding:20 }}>
        <h4 style={{ fontSize:14, fontWeight:800, color:C.navy, margin:'0 0 14px' }}>بيانات التحويل البنكي</h4>
        {[
          { label:'اسم المستفيد', value:'شركة EventVMS للخدمات الرقمية' },
          { label:'IBAN', value:'SA03 8000 0000 6080 1016 7519' },
          { label:'اسم البنك', value:'البنك الأهلي السعودي (SNB)' },
          { label:'المبلغ', value:`${fmt(amount)} ريال سعودي` },
          { label:'رقم المرجع (مهم)', value:ref },
        ].map(row => (
          <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
            <span style={{ color:C.muted }}>{row.label}</span>
            <span style={{ fontWeight:700, color: row.label.includes('رجع')||row.label.includes('بلغ') ? C.orange : C.navy, direction:'ltr' }}>{row.value}</span>
          </div>
        ))}
      </div>
      <div style={{ background:'#FFF8E8', border:'1px solid #F5C842', borderRadius:10, padding:'12px 16px' }}>
        <p style={{ color:'#7A5000', fontSize:12, fontWeight:600, margin:0, lineHeight:1.6 }}>
          ⚠️ يجب ذكر رقم المرجع في خانة الملاحظات أثناء التحويل حتى يُفعَّل العقد تلقائياً
        </p>
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ width:16, height:16, accentColor:C.orange }}/>
        <span style={{ fontSize:13, color:C.text }}>أؤكد أنني قمت بإتمام التحويل البنكي بالمبلغ والمرجع الصحيح</span>
      </label>
      <button onClick={() => { if(confirmed) onPay(ref) }} disabled={!confirmed||loading} style={{
        padding:'14px', background: confirmed && !loading ? '#065F46' : '#DBDAE3',
        border:'none', borderRadius:10, color:'#fff', fontWeight:800, fontSize:15,
        cursor: confirmed && !loading ? 'pointer' : 'not-allowed', fontFamily:'inherit'
      }}>
        {loading ? '⏳ جاري التسجيل...' : '✓ تأكيد التحويل البنكي'}
      </button>
    </div>
  )
}

// ── Success screen ────────────────────────────────────────────────────────
function SuccessScreen({ contract, payRef, method }: { contract:any; payRef:string; method:string }) {
  const autoRelease = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return (
    <div style={{ textAlign:'center', padding:'40px 24px' }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:'#EAF7E0', border:`3px solid ${C.green}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, margin:'0 auto 20px' }}>✅</div>
      <h2 style={{ fontSize:22, fontWeight:900, color:C.navy, margin:'0 0 8px' }}>تم الدفع بنجاح!</h2>
      <p style={{ color:C.muted, fontSize:14, margin:'0 0 28px' }}>المبلغ محفوظ في Escrow وسيُحوَّل للمؤثر عند موافقتك على المحتوى</p>

      <div style={{ background:'#F8F7FA', borderRadius:14, padding:20, marginBottom:24, textAlign:'right' }}>
        {[
          { label:'رقم المرجع', value:payRef },
          { label:'طريقة الدفع', value: method==='card'?'بطاقة ائتمانية':method==='stc_pay'?'STC Pay':'تحويل بنكي' },
          { label:'المبلغ المحفوظ', value:`${fmt(contract.agreed_price)} ريال` },
          { label:'عمولة المنصة', value:`${fmt(contract.platform_fee)} ريال` },
          { label:'صافي المؤثر', value:`${fmt(contract.influencer_payout)} ريال` },
          { label:'الإفراج التلقائي', value:autoRelease.toLocaleDateString('ar-SA', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) },
        ].map(r => (
          <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
            <span style={{ color:C.muted }}>{r.label}</span>
            <span style={{ fontWeight:700, color: r.label.includes('صافي')||r.label.includes('محفوظ') ? C.orange : C.navy }}>{r.value}</span>
          </div>
        ))}
      </div>

      <div style={{ background:'#E8E4F0', borderRadius:12, padding:'14px 18px', marginBottom:24 }}>
        <h4 style={{ fontSize:13, fontWeight:800, color:C.navy, margin:'0 0 10px' }}>📋 مراحل الحملة</h4>
        {[
          { icon:'✅', label:'دفع Escrow', done:true },
          { icon:'🟡', label:'المؤثر يبدأ إنتاج المحتوى', done:false },
          { icon:'⏳', label:'رفع المحتوى للمراجعة', done:false },
          { icon:'⏳', label:'موافقتك وإفراج المبلغ', done:false },
        ].map((s,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'5px 0' }}>
            <span style={{ fontSize:14 }}>{s.icon}</span>
            <span style={{ fontSize:13, color: s.done ? C.green : C.muted, fontWeight: s.done ? 700 : 400 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <a href="/contracts" style={{ padding:'12px', background:C.navy, borderRadius:10, color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none', display:'block' }}>
          عرض العقود ←
        </a>
        <a href="/briefs" style={{ padding:'12px', border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontWeight:600, fontSize:14, textDecoration:'none', display:'block' }}>
          البريفات
        </a>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function EscrowPayPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const router = useRouter()
  const params = useParams()
  const contractId = params?.id as string

  const [contract, setContract] = useState<any>(null)
  const [brief, setBrief] = useState<any>(null)
  const [influencer, setInfluencer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [method, setMethod] = useState('card')
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [payRef, setPayRef] = useState('')

  useEffect(() => {
    if (!contractId) return
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: c } = await sb.from('campaign_contracts').select('*').eq('id', contractId).single()
      if (!c) { router.push('/contracts'); return }
      if (c.status !== 'pending_payment') { setPaid(true) }
      setContract(c)
      const [briefRes, infRes] = await Promise.all([
        sb.from('campaign_briefs').select('title, event_type, event_date').eq('id', c.brief_id).single(),
        sb.from('influencer_profiles').select('display_name, display_name_ar, avatar_url').eq('id', c.influencer_id).single()
      ])
      setBrief(briefRes.data)
      setInfluencer(infRes.data)
      setLoading(false)
    })
  }, [contractId])

  async function handlePayment(ref: string) {
    setPaying(true)
    await new Promise(r => setTimeout(r, 2000)) // simulate payment processing
    const autoRelease = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await Promise.all([
      sb.from('campaign_contracts').update({ status:'active' }).eq('id', contractId),
      sb.from('escrow_transactions').upsert({
        contract_id: contractId,
        org_id: contract.org_id,
        influencer_id: contract.influencer_id,
        amount: contract.agreed_price,
        platform_fee: contract.platform_fee,
        influencer_payout: contract.influencer_payout,
        payment_method: method,
        payment_ref: ref,
        payment_status: 'paid',
        auto_release_at: autoRelease,
      })
    ])
    setPayRef(ref)
    setPaying(false)
    setPaid(true)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', direction:'rtl' }}>
      <div style={{ textAlign:'center', color:C.muted }}>
        <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
        <p style={{ fontSize:15 }}>جاري تحميل بيانات العقد...</p>
      </div>
    </div>
  )

  if (!contract) return null

  const total = contract.agreed_price

  return (
    <div style={{ minHeight:'100vh', background:'#F0EFF5', direction:'rtl', fontFamily:"'Tajawal', sans-serif", padding:'32px 16px' }}>
      <div style={{ maxWidth:620, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <a href="/contracts" style={{ color:C.muted, fontSize:13, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4, marginBottom:16 }}>
            ← الرجوع للعقود
          </a>
          <h1 style={{ fontSize:24, fontWeight:900, color:C.navy, margin:'0 0 4px' }}>💳 دفع Escrow</h1>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>ادفع بأمان — مبلغك محفوظ حتى تعتمد المحتوى</p>
        </div>

        {paid ? (
          <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:0, overflow:'hidden' }}>
            <SuccessScreen contract={contract} payRef={payRef} method={method}/>
          </div>
        ) : (
          <div style={{ display:'grid', gap:14 }}>

            {/* Contract summary card */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:C.navy, margin:'0 0 14px' }}>📄 ملخص العقد</h3>
              <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:14 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:`linear-gradient(135deg, ${C.orange}, #FF8C42)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:18, flexShrink:0 }}>
                  {(influencer?.display_name_ar||influencer?.display_name||'?')[0]}
                </div>
                <div>
                  <div style={{ fontWeight:800, color:C.navy, fontSize:15 }}>{influencer?.display_name_ar || influencer?.display_name}</div>
                  <div style={{ fontSize:12, color:C.muted }}>{brief?.title}</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {[
                  { label:'المبلغ المتفق', value:`${fmt(contract.agreed_price)} ر`, color:C.navy },
                  { label:'عمولة 15%', value:`${fmt(contract.platform_fee)} ر`, color:C.muted },
                  { label:'للمؤثر', value:`${fmt(contract.influencer_payout)} ر`, color:C.green },
                ].map(f => (
                  <div key={f.label} style={{ textAlign:'center', background:'#F8F7FA', borderRadius:8, padding:'10px 6px' }}>
                    <div style={{ fontSize:15, fontWeight:800, color:f.color }}>{f.value}</div>
                    <div style={{ fontSize:10, color:C.muted }}>{f.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment card */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:24 }}>
              <Steps current={step}/>

              {step === 0 && (
                <div style={{ display:'grid', gap:10 }}>
                  <h3 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>اختر طريقة الدفع</h3>
                  {METHODS.map(m => (
                    <button key={m.key} onClick={() => setMethod(m.key)} style={{
                      padding:'14px 16px', borderRadius:10, cursor:'pointer', fontFamily:'inherit', textAlign:'right',
                      border: method===m.key ? `2px solid ${m.color}` : `1px solid ${C.border}`,
                      background: method===m.key ? `${m.color}10` : C.card,
                      display:'flex', alignItems:'center', gap:14, transition:'all .15s'
                    }}>
                      <span style={{ fontSize:26, flexShrink:0 }}>{m.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color: method===m.key ? m.color : C.navy }}>{m.label}</div>
                        <div style={{ fontSize:11, color:C.muted }}>{m.sub}</div>
                      </div>
                      <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${method===m.key ? m.color : C.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {method===m.key && <div style={{ width:10, height:10, borderRadius:'50%', background:m.color }}/>}
                      </div>
                    </button>
                  ))}

                  {/* Escrow guarantee info */}
                  <div style={{ background:'#EAF7E0', border:'1px solid #C3E6C3', borderRadius:10, padding:'12px 16px', display:'flex', gap:10, marginTop:4 }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>🔒</span>
                    <div>
                      <p style={{ fontSize:12, color:'#1A5A00', fontWeight:700, margin:'0 0 2px' }}>مدفوعاتك محمية بضمان Escrow</p>
                      <p style={{ fontSize:11, color:'#2D7A00', margin:0, lineHeight:1.6 }}>
                        مبلغك لن يصل للمؤثر إلا بعد موافقتك على المحتوى — أو يُردّ لك في حالة النزاع.
                        إفراج تلقائي بعد 7 أيام من تسليم المحتوى إذا لم تتخذ إجراء.
                      </p>
                    </div>
                  </div>

                  <button onClick={() => setStep(1)} style={{ padding:'13px', background:C.orange, border:'none', borderRadius:10, color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
                    التالي: إدخال البيانات ←
                  </button>
                </div>
              )}

              {step === 1 && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                    <button onClick={() => setStep(0)} style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, fontSize:18, padding:0 }}>›</button>
                    <h3 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:0 }}>
                      {METHODS.find(m=>m.key===method)?.icon} {METHODS.find(m=>m.key===method)?.label}
                    </h3>
                  </div>

                  {method==='card' && <CardForm onPay={ref => { setPayRef(ref); setStep(2); handlePayment(ref) }} amount={total} loading={paying}/>}
                  {method==='stc_pay' && <STCForm onPay={ref => { setPayRef(ref); setStep(2); handlePayment(ref) }} amount={total} loading={paying}/>}
                  {method==='transfer' && <BankForm onPay={ref => { setPayRef(ref); setStep(2); handlePayment(ref) }} amount={total} contractId={contractId} loading={paying}/>}
                </div>
              )}

              {step === 2 && (
                <div style={{ textAlign:'center', padding:'40px 0' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>⏳</div>
                  <h3 style={{ fontSize:18, fontWeight:800, color:C.navy, margin:'0 0 6px' }}>جاري معالجة الدفع...</h3>
                  <p style={{ color:C.muted, fontSize:13 }}>يرجى الانتظار، لا تغلق هذه الصفحة</p>
                  <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:20 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:C.orange, animation:`pulse ${1 + i*0.2}s infinite` }}/>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
