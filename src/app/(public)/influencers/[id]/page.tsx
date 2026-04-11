'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFF', green:'#3A7D0A' }
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcGNqc2JjandxbHhmc3NtdGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTQ2MDQsImV4cCI6MjA5MDc3MDYwNH0.W2zchuG_HMpVIFhz9m5NbUSb2n59sUb2-xjtNclzcX8'
const SB_URL = 'https://xqpcjsbcjwqlxfssmtjb.supabase.co'

const PACKAGES = [
  { key:'price_basic', label:'أساسي', desc:'محتوى واحد على منصة واحدة', color:'#6F7287', bg:'#F1F1F1' },
  { key:'price_standard', label:'معياري', desc:'حزمة محتوى متعددة المنصات', color:C.navy, bg:'#E8E4F0', popular:true },
  { key:'price_premium', label:'بريميوم', desc:'حملة شاملة مع تقارير كاملة', color:C.orange, bg:'#FEF0ED' },
]

const PLATFORMS_MAP: Record<string,{icon:string;label:string;base:string}> = {
  tiktok: { icon:'🎵', label:'تيك توك', base:'https://tiktok.com/@' },
  instagram: { icon:'📷', label:'إنستغرام', base:'https://instagram.com/' },
  snapchat: { icon:'👻', label:'سناب شات', base:'https://snapchat.com/add/' },
  youtube: { icon:'▶️', label:'يوتيوب', base:'https://youtube.com/@' },
  twitter: { icon:'𝕏', label:'تويتر', base:'https://x.com/' },
}

function fmt(n: number) {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n/1000).toFixed(0) + 'K'
  return n.toString()
}

export default function InfluencerProfile() {
  const params = useParams()
  const id = params?.id as string
  const [inf, setInf] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPkg, setSelectedPkg] = useState('price_standard')
  const [showBriefModal, setShowBriefModal] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`${SB_URL}/rest/v1/influencer_profiles?id=eq.${id}&status=eq.active&limit=1`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
    })
    .then(r => r.json())
    .then(d => { setInf(d?.[0] || null); setLoading(false) })
    .catch(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding:80, textAlign:'center', color:C.muted, direction:'rtl' }}>⏳ جاري التحميل...</div>
  if (!inf) return <div style={{ padding:80, textAlign:'center', direction:'rtl' }}><h2>المؤثر غير موجود</h2><a href="/influencers">← العودة</a></div>

  const platforms = ['tiktok','instagram','snapchat','youtube','twitter'].filter(p => inf[`${p}_handle`])

  return (
    <div style={{ minHeight:'100vh', background:'#F8F7FA', direction:'rtl', fontFamily:"'Tajawal', sans-serif" }}>
      {/* Header cover */}
      <div style={{ height:200, background:`linear-gradient(135deg, ${C.navy} 0%, #6B3FA0 100%)`, position:'relative' }}>
        <a href="/influencers" style={{ position:'absolute', top:20, right:24, color:'rgba(255,255,255,.8)', textDecoration:'none', fontSize:14, fontWeight:600 }}>
          ← العودة للكتالوج
        </a>
        {inf.is_featured && (
          <span style={{ position:'absolute', top:20, left:24, background:'rgba(240,85,55,.9)', color:'#fff', fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>⭐ مؤثر مميز</span>
        )}
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'0 16px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, alignItems:'start' }}>

          {/* Left column */}
          <div>
            {/* Profile card */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24, marginTop:-60, marginBottom:16 }}>
              <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                <div style={{ width:80, height:80, borderRadius:'50%', background:`linear-gradient(135deg, ${C.orange}, #FF8C42)`, border:'4px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:32, flexShrink:0 }}>
                  {(inf.display_name_ar || inf.display_name)?.[0]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                    <h1 style={{ fontSize:22, fontWeight:900, color:C.navy, margin:0 }}>{inf.display_name_ar || inf.display_name}</h1>
                    {inf.is_verified && <span style={{ fontSize:12, background:'#EAF7E0', color:C.green, padding:'2px 10px', borderRadius:10, fontWeight:700 }}>✓ موثق</span>}
                  </div>
                  <p style={{ color:C.muted, fontSize:14, margin:'0 0 10px', lineHeight:1.6 }}>{inf.bio_ar || inf.bio}</p>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {(inf.specializations || []).map((s:string) => (
                      <span key={s} style={{ fontSize:11, background:'#F0EDFF', color:'#5B3FA0', padding:'3px 10px', borderRadius:20, fontWeight:600 }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign:'center', flexShrink:0 }}>
                  {inf.avg_rating > 0 && <>
                    <div style={{ fontSize:24, fontWeight:900, color:'#F5A623' }}>{inf.avg_rating?.toFixed(1)}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{inf.total_reviews} تقييم</div>
                  </>}
                  <div style={{ fontSize:18, fontWeight:800, color:C.navy, marginTop:4 }}>{inf.total_campaigns}</div>
                  <div style={{ fontSize:11, color:C.muted }}>حملة منجزة</div>
                </div>
              </div>
            </div>

            {/* Platforms */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:16 }}>
              <h3 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:'0 0 16px' }}>📊 المتابعون على المنصات</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:10 }}>
                {platforms.map(p => {
                  const pm = PLATFORMS_MAP[p]
                  const followers = inf[`${p}_followers`] || 0
                  const handle = inf[`${p}_handle`]
                  return (
                    <a key={p} href={`${pm.base}${handle}`} target="_blank" rel="noopener"
                      style={{ display:'block', padding:'12px 14px', background:'#F8F7FA', border:`1px solid ${C.border}`, borderRadius:10, textDecoration:'none', transition:'all .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = C.orange)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
                    >
                      <div style={{ fontSize:20, marginBottom:4 }}>{pm.icon}</div>
                      <div style={{ fontSize:18, fontWeight:800, color:C.navy }}>{fmt(followers)}</div>
                      <div style={{ fontSize:11, color:C.muted }}>{pm.label}</div>
                      <div style={{ fontSize:10, color:C.orange, marginTop:2 }}>@{handle}</div>
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Content types */}
            {(inf.content_types || []).length > 0 && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:16 }}>
                <h3 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:'0 0 12px' }}>🎬 أنواع المحتوى</h3>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {(inf.content_types || []).map((t:string) => (
                    <span key={t} style={{ padding:'6px 14px', background:'#FEF0ED', color:C.orange, borderRadius:20, fontSize:13, fontWeight:700 }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {(inf.portfolio_links || []).length > 0 && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:16 }}>
                <h3 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:'0 0 12px' }}>🎯 أعمال سابقة</h3>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {(inf.portfolio_links || []).map((url:string, i:number) => (
                    <a key={i} href={url} target="_blank" rel="noopener" style={{
                      padding:'7px 14px', background:'#F8F7FA', border:`1px solid ${C.border}`, borderRadius:8,
                      fontSize:13, color:C.navy, textDecoration:'none', fontWeight:600
                    }}>🔗 عمل {i+1}</a>
                  ))}
                </div>
              </div>
            )}

            {/* Terms */}
            <div style={{ background:'#FFF8E8', border:'1px solid #F5C842', borderRadius:14, padding:20 }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:'#7A5000', margin:'0 0 10px' }}>📋 الشروط العامة للتعاون</h3>
              <ul style={{ margin:0, paddingRight:16, color:'#7A5000', fontSize:13, lineHeight:2 }}>
                <li>يجب توفير بريف واضح يتضمن أهداف الحملة</li>
                <li>الحرية الإبداعية للمؤثر مع الحفاظ على رسالة العلامة</li>
                <li>الاتفاق المسبق على جدول النشر قبل بدء الحملة</li>
                <li>المبالغ محفوظة بضمان المنصة حتى التسليم</li>
              </ul>
            </div>
          </div>

          {/* Right: Pricing sidebar (sticky) */}
          <div style={{ position:'sticky', top:20 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20, marginTop:-20 }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:C.navy, margin:'0 0 16px' }}>💰 اختر الباقة</h3>
              <div style={{ display:'grid', gap:10, marginBottom:20 }}>
                {PACKAGES.filter(pkg => inf[pkg.key]).map(pkg => (
                  <button key={pkg.key} onClick={() => setSelectedPkg(pkg.key)} style={{
                    padding:'12px 14px', borderRadius:10, cursor:'pointer', fontFamily:'inherit', textAlign:'right',
                    border: selectedPkg===pkg.key ? `2px solid ${pkg.color}` : `1px solid ${C.border}`,
                    background: selectedPkg===pkg.key ? pkg.bg : C.card,
                    transition:'all .2s', position:'relative'
                  }}>
                    {pkg.popular && selectedPkg===pkg.key && (
                      <span style={{ position:'absolute', top:-8, left:10, background:C.orange, color:'#fff', fontSize:9, fontWeight:700, padding:'1px 7px', borderRadius:10 }}>الأكثر طلباً</span>
                    )}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:pkg.color }}>{pkg.label}</span>
                      <span style={{ fontSize:17, fontWeight:900, color:pkg.color }}>{inf[pkg.key]?.toLocaleString()} ريال</span>
                    </div>
                    <p style={{ fontSize:11, color:C.muted, margin:'3px 0 0' }}>{pkg.desc}</p>
                  </button>
                ))}
              </div>

              <div style={{ background:'#F8F7FA', borderRadius:10, padding:12, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                  <span style={{ color:C.muted }}>السعر الأساسي</span>
                  <span style={{ fontWeight:700 }}>{inf[selectedPkg]?.toLocaleString()} ريال</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                  <span style={{ color:C.muted }}>عمولة المنصة (15%)</span>
                  <span style={{ color:C.muted }}>{Math.round((inf[selectedPkg]||0)*0.15).toLocaleString()} ريال</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, borderTop:`1px solid ${C.border}`, paddingTop:8, marginTop:4 }}>
                  <span style={{ fontWeight:800, color:C.navy }}>الإجمالي</span>
                  <span style={{ fontWeight:900, color:C.orange }}>{Math.round((inf[selectedPkg]||0)*1.15).toLocaleString()} ريال</span>
                </div>
                <p style={{ fontSize:10, color:C.muted, margin:'8px 0 0', textAlign:'center' }}>شامل ضريبة القيمة المضافة 15%</p>
              </div>

              <button onClick={() => setShowBriefModal(true)} style={{
                width:'100%', padding:'13px', background:C.orange, border:'none', borderRadius:10,
                color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit', marginBottom:10
              }}>📤 إرسال بريف الحملة</button>

              <a href={`/dashboard/briefs/new?influencer=${inf.id}`} style={{
                display:'block', width:'100%', padding:'10px', border:`1px solid ${C.border}`, borderRadius:10,
                color:C.text, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                textAlign:'center', textDecoration:'none', boxSizing:'border-box'
              }}>💬 تواصل مع المؤثر</a>
            </div>

            {/* Quick stats */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, marginTop:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { label:'متوسط التفاعل', value:'4.2%', icon:'📈' },
                  { label:'وقت الاستجابة', value:'< 2 ساعة', icon:'⚡' },
                  { label:'نسبة الإنجاز', value:'98%', icon:'✅' },
                  { label:'إجمالي المتابعين', value: fmt((inf.tiktok_followers||0)+(inf.instagram_followers||0)+(inf.snapchat_followers||0)), icon:'👥' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center', padding:'10px 8px', background:'#F8F7FA', borderRadius:8 }}>
                    <div style={{ fontSize:18, marginBottom:3 }}>{s.icon}</div>
                    <div style={{ fontSize:14, fontWeight:800, color:C.navy }}>{s.value}</div>
                    <div style={{ fontSize:10, color:C.muted }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brief Modal */}
      {showBriefModal && (
        <div onClick={e => { if(e.target===e.currentTarget) setShowBriefModal(false) }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:C.card, borderRadius:16, padding:28, maxWidth:500, width:'100%', direction:'rtl' }}>
            <h3 style={{ fontSize:18, fontWeight:800, color:C.navy, margin:'0 0 6px' }}>📤 إرسال بريف لـ {inf.display_name_ar}</h3>
            <p style={{ color:C.muted, fontSize:13, margin:'0 0 20px' }}>سيتلقى المؤثر طلبك ويرد بعرضه خلال 24 ساعة</p>
            <a href={`/dashboard/briefs/new?influencer=${inf.id}`} style={{
              display:'block', padding:'13px', background:C.orange, borderRadius:10, color:'#fff',
              fontWeight:800, fontSize:15, textAlign:'center', textDecoration:'none', marginBottom:10
            }}>إنشاء بريف جديد ←</a>
            <button onClick={() => setShowBriefModal(false)} style={{ width:'100%', padding:'11px', border:`1px solid ${C.border}`, borderRadius:10, background:'none', color:C.text, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  )
}
