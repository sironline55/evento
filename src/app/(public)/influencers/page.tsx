'use client'
import { useEffect, useState, useRef } from 'react'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFF', green:'#3A7D0A' }

const PLATFORMS = [
  { key:'tiktok_followers', icon:'🎵', label:'تيك توك', color:'#010101' },
  { key:'instagram_followers', icon:'📷', label:'إنستغرام', color:'#E1306C' },
  { key:'snapchat_followers', icon:'👻', label:'سناب', color:'#FFFC00' },
  { key:'youtube_followers', icon:'▶️', label:'يوتيوب', color:'#FF0000' },
]

const SPECS = ['الكل','ترفيه','حفلات','رياضة','مؤتمرات','معارض','رحلات','أعمال']
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcGNqc2JjandxbHhmc3NtdGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTQ2MDQsImV4cCI6MjA5MDc3MDYwNH0.W2zchuG_HMpVIFhz9m5NbUSb2n59sUb2-xjtNclzcX8'
const SB_URL = 'https://xqpcjsbcjwqlxfssmtjb.supabase.co'

function fmt(n: number) {
  if (!n || n === 0) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n/1000).toFixed(0) + 'K'
  return n.toString()
}

function totalFollowers(inf: any) {
  return (inf.tiktok_followers||0)+(inf.instagram_followers||0)+(inf.snapchat_followers||0)+(inf.youtube_followers||0)
}

// ── Featured Influencer Slider Card ─────────────────────────────
function FeaturedCard({ inf, index }: { inf: any; index: number }) {
  const gradients = [
    'linear-gradient(135deg, #1E0A3C 0%, #6B3FA0 100%)',
    'linear-gradient(135deg, #0A1628 0%, #1A4FA0 100%)',
    'linear-gradient(135deg, #1A0A0A 0%, #A03020 100%)',
    'linear-gradient(135deg, #0A1A0A 0%, #1A8040 100%)',
    'linear-gradient(135deg, #1A1A0A 0%, #907020 100%)',
  ]
  const bg = gradients[index % gradients.length]
  const mainPlatform = PLATFORMS.find(p => inf[p.key] > 0)
  const topFollowers = mainPlatform ? inf[mainPlatform.key] : 0

  return (
    <a href={`/influencers/${inf.id}`} style={{ textDecoration:'none', display:'block', flexShrink:0, width:260 }}>
      <div style={{
        background: bg, borderRadius:16, overflow:'hidden', height:320, position:'relative',
        cursor:'pointer', transition:'transform .2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-6px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
      >
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.05)' }}/>
        <div style={{ position:'absolute', bottom:-20, left:-20, width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,.04)' }}/>

        {/* Badges */}
        <div style={{ position:'absolute', top:14, right:14, display:'flex', flexDirection:'column', gap:5 }}>
          {inf.is_featured && (
            <span style={{ background:'rgba(240,85,55,.9)', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>⭐ مميز</span>
          )}
          {inf.is_verified && (
            <span style={{ background:'rgba(58,125,10,.9)', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>✓ موثق</span>
          )}
        </div>

        {/* Main followers badge */}
        {mainPlatform && (
          <div style={{ position:'absolute', top:14, left:14, background:'rgba(0,0,0,.6)', backdropFilter:'blur(8px)', color:'#fff', fontSize:13, fontWeight:800, padding:'5px 12px', borderRadius:20, display:'flex', alignItems:'center', gap:5 }}>
            <span>{mainPlatform.icon}</span>
            <span>{fmt(topFollowers)}</span>
          </div>
        )}

        {/* Avatar */}
        <div style={{ display:'flex', justifyContent:'center', marginTop:50 }}>
          <div style={{
            width:80, height:80, borderRadius:'50%',
            background:`linear-gradient(135deg, ${C.orange} 0%, #FF8C42 100%)`,
            border:'3px solid rgba(255,255,255,.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontWeight:900, fontSize:32,
            boxShadow:'0 8px 25px rgba(0,0,0,.3)'
          }}>
            {(inf.display_name_ar||inf.display_name||'?')[0]}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding:'12px 16px', textAlign:'center' }}>
          <h3 style={{ color:'#fff', fontWeight:800, fontSize:17, margin:'0 0 4px', textShadow:'0 1px 3px rgba(0,0,0,.3)' }}>
            {inf.display_name_ar || inf.display_name}
          </h3>
          <p style={{ color:'rgba(255,255,255,.7)', fontSize:12, margin:'0 0 10px', lineHeight:1.5 }}>
            {(inf.bio_ar || inf.bio || '').slice(0,55)}{(inf.bio_ar||'').length>55?'...':''}
          </p>

          {/* Tags */}
          <div style={{ display:'flex', gap:5, justifyContent:'center', flexWrap:'wrap', marginBottom:12 }}>
            {(inf.specializations||[]).slice(0,2).map((s:string) => (
              <span key={s} style={{ fontSize:10, background:'rgba(255,255,255,.15)', color:'#fff', padding:'2px 8px', borderRadius:10, fontWeight:600 }}>{s}</span>
            ))}
          </div>

          {/* Platform stats row */}
          <div style={{ display:'flex', justifyContent:'center', gap:10, flexWrap:'wrap', marginBottom:10 }}>
            {PLATFORMS.filter(p => inf[p.key] > 0).slice(0,3).map(p => (
              <span key={p.key} style={{ fontSize:11, color:'rgba(255,255,255,.85)', display:'flex', alignItems:'center', gap:3 }}>
                <span style={{ fontSize:13 }}>{p.icon}</span>
                <span style={{ fontWeight:700 }}>{fmt(inf[p.key])}</span>
              </span>
            ))}
          </div>

          {/* Price */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,.15)', paddingTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'rgba(255,255,255,.6)', fontSize:11 }}>يبدأ من</span>
            <span style={{ color:'#FFB347', fontWeight:900, fontSize:15 }}>{inf.price_basic?.toLocaleString() || '—'} ريال</span>
          </div>
        </div>
      </div>
    </a>
  )
}

// ── Stats bubble ──────────────────────────────────────────────────
function StatBubble({ icon, value, label, color }: { icon:string; value:string; label:string; color:string }) {
  return (
    <div style={{ textAlign:'center', padding:'16px 20px', background:C.card, borderRadius:14, border:`1px solid ${C.border}`, minWidth:100 }}>
      <div style={{ fontSize:24, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:22, fontWeight:900, color }}>{value}</div>
      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{label}</div>
    </div>
  )
}

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('الكل')
  const [sort, setSort] = useState('featured')
  const sliderRef = useRef<HTMLDivElement>(null)
  const [sliderPos, setSliderPos] = useState(0)

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/influencer_profiles?select=*&status=eq.active&order=is_featured.desc,tiktok_followers.desc`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
    })
    .then(r => r.json())
    .then(d => { setInfluencers(Array.isArray(d) ? d : []); setLoading(false) })
    .catch(() => setLoading(false))
  }, [])

  const filtered = influencers.filter(inf => {
    const matchSearch = !search || (inf.display_name_ar+inf.display_name+(inf.bio_ar||'')).toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter==='الكل' || (inf.specializations||[]).includes(filter)
    return matchSearch && matchFilter
  }).sort((a, b) => {
    if (sort==='featured') return (b.is_featured?1:0)-(a.is_featured?1:0)
    if (sort==='rating') return (b.avg_rating||0)-(a.avg_rating||0)
    if (sort==='campaigns') return (b.total_campaigns||0)-(a.total_campaigns||0)
    if (sort==='price_asc') return (a.price_basic||0)-(b.price_basic||0)
    return 0
  })

  const featured = influencers.filter(inf => inf.is_featured || inf.tiktok_followers > 100000)
  const totalReach = influencers.reduce((s,inf) => s + totalFollowers(inf), 0)

  function slideLeft() {
    const el = sliderRef.current
    if (!el) return
    const newPos = Math.max(0, sliderPos - 280)
    setSliderPos(newPos)
    el.scrollTo({ left: newPos, behavior: 'smooth' })
  }
  function slideRight() {
    const el = sliderRef.current
    if (!el) return
    const newPos = Math.min(el.scrollWidth - el.clientWidth, sliderPos + 280)
    setSliderPos(newPos)
    el.scrollTo({ left: newPos, behavior: 'smooth' })
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F8F7FA', direction:'rtl', fontFamily:"'Tajawal', sans-serif" }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{ background:`linear-gradient(135deg, ${C.navy} 0%, #3D1A78 100%)`, padding:'48px 24px 60px', textAlign:'center' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(240,85,55,.2)', border:'1px solid rgba(240,85,55,.4)', borderRadius:20, padding:'4px 14px', marginBottom:16 }}>
          <span style={{ fontSize:12, color:'#F05537', fontWeight:700 }}>✨ ماركت المؤثرين</span>
        </div>
        <h1 style={{ fontSize:36, fontWeight:900, color:'#fff', margin:'0 0 12px' }}>تواصل مع مؤثري الفعاليات</h1>
        <p style={{ fontSize:16, color:'rgba(255,255,255,.75)', margin:'0 0 32px', maxWidth:520, marginInline:'auto' }}>
          مئات المؤثرين المتخصصين في الفعاليات — ابعث بريفك وانتظر العروض
        </p>
        <div style={{ maxWidth:480, margin:'0 auto' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث باسم المؤثر أو التخصص..."
            style={{ width:'100%', padding:'13px 18px', borderRadius:10, border:'none', fontSize:15, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
          />
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 16px' }}>

        {/* ── Filter tabs ─────────────────────────────────────── */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'20px 0 12px', scrollbarWidth:'none', alignItems:'center' }}>
          {SPECS.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding:'7px 16px', borderRadius:20, border:`1px solid ${filter===s?C.orange:C.border}`,
              background:filter===s?C.orange:C.card, color:filter===s?'#fff':C.text,
              fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', flexShrink:0
            }}>{s}</button>
          ))}
          <div style={{ marginRight:'auto', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              padding:'7px 12px', borderRadius:8, border:`1px solid ${C.border}`,
              fontSize:12, fontFamily:'inherit', color:C.text, background:C.card, cursor:'pointer', outline:'none'
            }}>
              <option value="featured">مقترح</option>
              <option value="rating">الأعلى تقييماً</option>
              <option value="campaigns">الأكثر حملات</option>
              <option value="price_asc">الأقل سعراً</option>
            </select>
            <span style={{ fontSize:12, color:C.muted }}>{filtered.length} مؤثر</span>
          </div>
        </div>

        {loading && <div style={{ textAlign:'center', padding:60, color:C.muted }}>⏳ جاري التحميل...</div>}

        {/* ── Grid ────────────────────────────────────────────── */}
        {!loading && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16, paddingBottom:20 }}>
            {filtered.map(inf => (
              <a key={inf.id} href={`/influencers/${inf.id}`} style={{ textDecoration:'none' }}>
                <div style={{
                  background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
                  overflow:'hidden', transition:'all .2s', cursor:'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform='translateY(-3px)', e.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,.1)')}
                onMouseLeave={e => (e.currentTarget.style.transform='none', e.currentTarget.style.boxShadow='none')}
                >
                  <div style={{ height:72, background:`linear-gradient(135deg, ${C.navy}, #6B3FA0)`, position:'relative' }}>
                    {inf.is_featured && <span style={{ position:'absolute', top:10, right:10, background:'rgba(240,85,55,.9)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>⭐ مميز</span>}
                    {inf.is_verified && <span style={{ position:'absolute', top:10, left:10, background:'rgba(58,125,10,.9)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>✓ موثق</span>}
                  </div>
                  <div style={{ padding:'0 16px 16px', marginTop:-20 }}>
                    <div style={{ width:52, height:52, borderRadius:'50%', background:`linear-gradient(135deg, ${C.orange}, #FF8C42)`, border:'3px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:20, marginBottom:8 }}>
                      {(inf.display_name_ar||inf.display_name||'?')[0]}
                    </div>
                    <h3 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:'0 0 3px' }}>{inf.display_name_ar||inf.display_name}</h3>
                    <p style={{ fontSize:12, color:C.muted, margin:'0 0 10px', lineHeight:1.5 }}>{(inf.bio_ar||inf.bio||'').slice(0,60)}{(inf.bio_ar||'').length>60?'...':''}</p>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
                      {(inf.specializations||[]).slice(0,3).map((s:string) => (
                        <span key={s} style={{ fontSize:10, background:'#F0EDFF', color:'#5B3FA0', padding:'2px 8px', borderRadius:10, fontWeight:600 }}>{s}</span>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
                      {PLATFORMS.filter(p => inf[p.key]>0).slice(0,3).map(p => (
                        <span key={p.key} style={{ fontSize:11, color:C.text, display:'flex', alignItems:'center', gap:3 }}>
                          <span>{p.icon}</span><span style={{ fontWeight:700 }}>{fmt(inf[p.key])}</span>
                        </span>
                      ))}
                      {totalFollowers(inf)>0 && (
                        <span style={{ fontSize:11, color:C.muted, marginRight:'auto' }}>{fmt(totalFollowers(inf))} إجمالي</span>
                      )}
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
                      <div>
                        <span style={{ fontSize:10, color:C.muted, display:'block' }}>يبدأ من</span>
                        <span style={{ fontSize:16, fontWeight:800, color:C.orange }}>{inf.price_basic?.toLocaleString()||'—'} ريال</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {inf.avg_rating>0 && <span style={{ fontSize:12, color:'#F5A623', fontWeight:700 }}>{'★'.repeat(Math.round(inf.avg_rating))}</span>}
                        <span style={{ fontSize:11, background:'#EAF7E0', color:C.green, padding:'4px 10px', borderRadius:20, fontWeight:600 }}>{inf.total_campaigns||0} حملة</span>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* ── FEATURED SLIDER WIDGET ──────────────────────────── */}
        {!loading && influencers.length > 0 && (
          <div style={{ marginBottom:48 }}>
            {/* Section header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingTop:16, borderTop:`2px solid ${C.border}` }}>
              <div>
                <h2 style={{ fontSize:22, fontWeight:900, color:C.navy, margin:'0 0 4px' }}>🌟 المؤثرون المميزون</h2>
                <p style={{ color:C.muted, fontSize:13, margin:0 }}>نخبة من المؤثرين الأكثر تأثيراً في مجال الفعاليات</p>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={slideLeft} style={{ width:36, height:36, borderRadius:'50%', border:`1px solid ${C.border}`, background:C.card, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
                <button onClick={slideRight} style={{ width:36, height:36, borderRadius:'50%', border:`1px solid ${C.border}`, background:C.card, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
              </div>
            </div>

            {/* Slider */}
            <div ref={sliderRef} style={{ display:'flex', gap:16, overflowX:'auto', scrollbarWidth:'none', paddingBottom:8, scrollBehavior:'smooth' }}>
              {(featured.length > 0 ? featured : influencers).map((inf, i) => (
                <FeaturedCard key={inf.id} inf={inf} index={i} />
              ))}
            </div>

            {/* ── Stats section ─────────────────────────────────── */}
            <div style={{ marginTop:32, background:`linear-gradient(135deg, ${C.navy} 0%, #3D1A78 100%)`, borderRadius:18, padding:'28px 32px' }}>
              <div style={{ textAlign:'center', marginBottom:24 }}>
                <h3 style={{ color:'#fff', fontSize:20, fontWeight:800, margin:'0 0 6px' }}>📊 أرقام تتحدث عن نفسها</h3>
                <p style={{ color:'rgba(255,255,255,.65)', fontSize:13, margin:0 }}>المؤثرون المسجلون في منصتنا</p>
              </div>
              <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
                {[
                  { icon:'👥', value:influencers.length+'+', label:'مؤثر مسجل', color:'#FFB347' },
                  { icon:'📡', value:fmt(totalReach), label:'إجمالي المتابعين', color:'#7CB9FF' },
                  { icon:'✅', value:influencers.filter(i=>i.is_verified).length+'', label:'مؤثر موثق', color:'#7FD97F' },
                  { icon:'🎪', value:'8', label:'تخصص في الفعاليات', color:'#FF9EAD' },
                  { icon:'⭐', value:influencers.filter(i=>i.is_featured).length+'', label:'مؤثر مميز', color:'#FFE066' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center', padding:'16px 20px', background:'rgba(255,255,255,.08)', borderRadius:12, border:'1px solid rgba(255,255,255,.12)', minWidth:110, backdropFilter:'blur(8px)' }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
                    <div style={{ fontSize:24, fontWeight:900, color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.65)', marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── CTA for influencers to join ────────────────────── */}
            <div style={{ marginTop:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ fontSize:36, flexShrink:0 }}>🎤</div>
                <div>
                  <h4 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>هل أنت مؤثر في الفعاليات؟</h4>
                  <p style={{ fontSize:12, color:C.muted, margin:'0 0 12px', lineHeight:1.5 }}>انضم إلى منصتنا واستقبل حملات مدفوعة من أكبر المنظمين</p>
                  <a href="/influencer/portal" style={{ display:'inline-block', padding:'8px 18px', background:C.orange, borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, textDecoration:'none' }}>
                    انضم الآن ←
                  </a>
                </div>
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ fontSize:36, flexShrink:0 }}>🎪</div>
                <div>
                  <h4 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>منظم فعاليات؟</h4>
                  <p style={{ fontSize:12, color:C.muted, margin:'0 0 12px', lineHeight:1.5 }}>سجّل دخولك وانشر بريفك لتستقبل عروض المؤثرين المناسبين</p>
                  <a href="/login" style={{ display:'inline-block', padding:'8px 18px', background:C.navy, borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, textDecoration:'none' }}>
                    لوحة التحكم ←
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
