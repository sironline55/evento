'use client'
import Link from 'next/link'

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF'
}

const PLANS = [
  { name:'مجاني',     price:'0',             color:'#8B8FA8', bg:'#F3F4F6', features:['3 فعاليات','500 زائر','ماسح QR'], current:true },
  { name:'ستارتر',    price:'99 ريال/شهر',   color:'#0F6E56', bg:'#E8F8F8', features:['10 فعاليات','5 أعضاء','تصدير Excel','تقارير'], current:false },
  { name:'برو',       price:'299 ريال/شهر',  color:C.orange,  bg:'#FFF3EC', features:['50 فعالية','20 عضو','كوادر','علامة تجارية','API'], current:false },
]

export default function BillingPage() {
  return (
    <div style={{minHeight:'100vh', background:C.bg, direction:'rtl'}}>
      <div style={{background:C.card, borderBottom:`1px solid ${C.border}`, padding:'24px 32px 0'}}>
        <h1 style={{fontSize:40, fontWeight:800, margin:'0 0 20px', color:C.navy, letterSpacing:'-1px'}}>المالية</h1>
        <div style={{display:'flex'}}>
          {['الباقة','الفواتير','الإعدادات'].map((t,i) => (
            <button key={t} style={{padding:'10px 20px', background:'none', border:'none', cursor:'pointer', fontSize:14,
              fontWeight:i===0?700:400, color:i===0?C.orange:C.muted,
              borderBottom:i===0?`2px solid ${C.orange}`:'2px solid transparent', marginBottom:-1}}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:760, margin:'0 auto', padding:'28px 24px'}}>
        <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:22, marginBottom:20}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <p style={{fontSize:13, color:C.muted, margin:'0 0 4px'}}>باقتك الحالية</p>
              <p style={{fontSize:22, fontWeight:800, color:C.navy, margin:'0 0 4px'}}>🆓 مجاني</p>
              <p style={{fontSize:13, color:C.muted, margin:0}}>3 فعاليات · 500 زائر · ماسح QR</p>
            </div>
            <span style={{padding:'6px 14px', borderRadius:6, background:'#F3F4F6', fontSize:12, fontWeight:600, color:C.muted}}>الباقة الحالية</span>
          </div>
        </div>

        <h2 style={{fontSize:18, fontWeight:700, color:C.navy, margin:'0 0 14px'}}>الباقات المتاحة</h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14}}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{background:C.card, border:`2px solid ${plan.current?plan.color:C.border}`,
              borderRadius:10, padding:20, position:'relative'}}>
              {plan.current && <span style={{position:'absolute', top:-10, right:16, background:plan.color, color:'#fff', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20}}>باقتك</span>}
              <p style={{fontSize:18, fontWeight:700, color:plan.color, margin:'0 0 4px'}}>{plan.name}</p>
              <p style={{fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 14px'}}>{plan.price}</p>
              <ul style={{listStyle:'none', padding:0, margin:'0 0 16px'}}>
                {plan.features.map(f => (
                  <li key={f} style={{fontSize:13, color:C.text, padding:'4px 0', display:'flex', gap:8, alignItems:'center'}}>
                    <span style={{color:plan.color, fontWeight:700}}>✓</span> {f}
                  </li>
                ))}
              </ul>
              {!plan.current && (
                <button style={{width:'100%', padding:'10px', border:'none', borderRadius:6, background:plan.color, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer'}}>
                  ترقية الآن
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
