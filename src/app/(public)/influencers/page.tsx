'use client'
import { useEffect, useState, useRef } from 'react'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFF', green:'#3A7D0A' }

const PLATFORMS = [
  { key:'tiktok_followers',    icon:'🎵', label:'تيك توك'   },
  { key:'instagram_followers', icon:'📷', label:'إنستغرام'  },
  { key:'snapchat_followers',  icon:'👻', label:'سناب'      },
  { key:'youtube_followers',   icon:'▶️', label:'يوتيوب'   },
]
const SPECS = ['الكل','ترفيه','حفلات','رياضة','مؤتمرات','معارض','رحلات','أعمال']
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcGNqc2JjandxbHhmc3NtdGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTQ2MDQsImV4cCI6MjA5MDc3MDYwNH0.W2zchuG_HMpVIFhz9m5NbUSb2n59sUb2-xjtNclzcX8'
const SB_URL = 'https://xqpcjsbcjwqlxfssmtjb.supabase.co'

function fmt(n: number) {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M'
  if (n >= 1000) return (n/1000).toFixed(0)+'K'
  return n.toString()
}
function totalFollowers(inf: any) {
  return (inf.tiktok_followers||0)+(inf.instagram_followers||0)+(inf.snapchat_followers||0)+(inf.youtube_followers||0)
}

// ── Avatar component ────────────────────────────────────────────────────────
function Avatar({ inf, size=52, border=2 }: { inf: any; size?: number; border?: number }) {
  const name = inf.display_name_ar || inf.display_name || '?'
  const initials = name[0]
  const [imgError, setImgError] = useState(false)
  const avatarUrl = inf.avatar_url

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        onError={() => setImgError(true)}
        alt={name}
        style={{
          width:size, height:size, borderRadius:'50%',
          objectFit:'cover', border:`${border}px solid ${C.border}`,
          flexShrink:0
        }}
      />
    )
  }
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:`linear-gradient(135deg, ${C.orange} 0%, #FF8C42 100%)`,
      border:`${border}px solid ${C.border}`,
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontWeight:900, fontSize:Math.round(size*0.38),
      flexShrink:0
    }}>
      {initials}
    </div>
  )
}

// ── Minimal Influencer Card ─────────────────────────────────────────────────
function InfluencerCard({ inf }: { inf: any }) {
  const [hov, setHov] = useState(false)

  return (
    <a href={`/influencers/${inf.id}`} style={{ textDecoration:'none' }}>
      <div style={{
        background:C.card,
        border:`1px solid ${hov ? C.navy : C.border}`,
        borderRadius:14,
        padding:'18px 16px',
        transition:'all .18s',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? '0 8px 28px rgba(30,10,60,.1)' : 'none',
        cursor:'pointer',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      >
        {/* Top row: avatar + badges */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
          <Avatar inf={inf} size={56} />

          <div style={{ flex:1, minWidth:0 }}>
            {/* Badges inline top-right */}
            <div style={{ display:'flex', gap:5, marginBottom:5, flexWrap:'wrap' }}>
              {inf.is_verified && (
                <span style={{ fontSize:10, background:'#EAF7E0', color:C.green, padding:'2px 8px', borderRadius:20, fontWeight:700, display:'flex', alignItems:'center', gap:3 }}>
                  ✓ موثق
                </span>
              )}
              {inf.is_featured && (
                <span style={{ fontSize:10, background:'#FEF0ED', color:C.orange, padding:'2px 8px', borderRadius:20, fontWeight:700 }}>
                  ⭐ مميز
                </span>
              )}
            </div>
            <h3 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:'0 0 2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {inf.display_name_ar || inf.display_name}
            </h3>
            <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
              {inf.bio_ar || inf.bio || ''}
            </p>
          </div>
        </div>

        {/* Specialization tags */}
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
          {(inf.specializations||[]).slice(0,3).map((s:string) => (
            <span key={s} style={{ fontSize:10, background:'#F0EDFF', color:'#5B3FA0', padding:'2px 8px', borderRadius:10, fontWeight:600 }}>{s}</span>
          ))}
        </div>

        {/* Platform stats */}
        <div style={{ display:'flex', gap:12, marginBottom:14, flexWrap:'wrap' }}>
          {PLATFORMS.filter(p => inf[p.key] > 0).slice(0,3).map(p => (
            <span key={p.key} style={{ fontSize:11, color:C.text, display:'flex', alignItems:'center', gap:3 }}>
              <span style={{ fontSize:13 }}>{p.icon}</span>
              <span style={{ fontWeight:700 }}>{fmt(inf[p.key])}</span>
            </span>
          ))}
          {totalFollowers(inf) > 0 && (
            <span style={{ fontSize:11, color:C.muted, marginRight:'auto' }}>{fmt(totalFollowers(inf))} إجمالي</span>
          )}
        </div>

        {/* Footer: price + campaigns */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
          <div>
            <span style={{ fontSize:10, color:C.muted, display:'block', marginBottom:1 }}>يبدأ من</span>
            <span style={{ fontSize:16, fontWeight:800, color:C.orange }}>{inf.price_basic?.toLocaleString()||'—'} ريال</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {(inf.avg_rating||0) > 0 && (
              <span style={{ fontSize:11, color:'#F5A623', fontWeight:700 }}>{'★'.repeat(Math.round(inf.avg_rating))}</span>
            )}
            <span style={{ fontSize:11, background:'#EAF7E0', color:C.green, padding:'4px 10px', borderRadius:20, fontWeight:600 }}>
              {inf.total_campaigns||0} حملة
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}

// ── Featured Slider Card (minimal dark version) ─────────────────────────────
function FeaturedCard({ inf, index }: { inf: any; index: number }) {
  const [hov, setHov] = useState(false)
  const bgs = ['#12082A','#0A1628','#140A08','#0A140A','#14140A']
  const accents = [C.orange, '#4A90D9', '#E05530', '#3A9D30', '#B07A10']
  const bg = bgs[index % bgs.length]
  const accent = accents[index % accents.length]

  return (
    <a href={`/influencers/${inf.id}`} style={{ textDecoration:'none', display:'block', flexShrink:0, width:240 }}>
      <div style={{
        background: bg,
        borderRadius:14,
        border:`1px solid rgba(255,255,255,.1)`,
        padding:'20px 16px',
        height:280,
        display:'flex',
        flexDirection:'column',
        transition:'all .18s',
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? '0 12px 36px rgba(0,0,0,.3)' : 'none',
        cursor:'pointer',
        position:'relative',
        overflow:'hidden',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      >
        {/* Subtle accent line at top */}
        <div style={{ position:'absolute', top:0, right:0, left:0, height:2, background:accent, borderRadius:'14px 14px 0 0' }}/>

        {/* Top: avatar + badges */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{ position:'relative' }}>
            <Avatar inf={inf} size={52} border={2} />
            {inf.is_verified && (
              <div style={{ position:'absolute', bottom:-2, right:-2, width:16, height:16, borderRadius:'50%', background:C.green, border:'2px solid '+bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'#fff', fontWeight:900 }}>✓</div>
            )}
          </div>
          <div>
            <div style={{ display:'flex', gap:4, marginBottom:4 }}>
              {inf.is_featured && <span style={{ fontSize:9, background:'rgba(240,85,55,.25)', color:'#FF8C6A', padding:'1px 7px', borderRadius:10, fontWeight:700 }}>⭐ مميز</span>}
            </div>
            <h3 style={{ color:'#fff', fontWeight:800, fontSize:15, margin:0, lineHeight:1.3 }}>
              {inf.display_name_ar || inf.display_name}
            </h3>
            <p style={{ color:'rgba(255,255,255,.5)', fontSize:11, margin:'2px 0 0' }}>
              {(inf.specializations||[])[0] || ''}
            </p>
          </div>
        </div>

        {/* Bio */}
        <p style={{ color:'rgba(255,255,255,.6)', fontSize:12, margin:'0 0 auto', lineHeight:1.6, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
          {inf.bio_ar || inf.bio || ''}
        </p>

        {/* Platforms */}
        <div style={{ display:'flex', gap:10, marginTop:12, marginBottom:12, flexWrap:'wrap' }}>
          {PLATFORMS.filter(p => inf[p.key] > 0).slice(0,3).map(p => (
            <span key={p.key} style={{ fontSize:11, color:'rgba(255,255,255,.75)', display:'flex', alignItems:'center', gap:3 }}>
              <span style={{ fontSize:13 }}>{p.icon}</span>
              <span style={{ fontWeight:700 }}>{fmt(inf[p.key])}</span>
            </span>
          ))}
        </div>

        {/* Price */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,.1)', paddingTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:'rgba(255,255,255,.45)', fontSize:10 }}>يبدأ من</span>
          <span style={{ color:accent, fontWeight:900, fontSize:14 }}>{inf.price_basic?.toLocaleString()||'—'} ريال</span>
        </div>
      </div>
    </a>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('الكل')
  const [sort, setSort] = useState('featured')
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/influencer_profiles?select=*&status=eq.active&order=is_featured.desc,tiktok_followers.desc`, {
      headers: { apikey:ANON_KEY, Authorization:`Bearer ${ANON_KEY}` }
    })
    .then(r => r.json())
    .then(d => { setInfluencers(Array.isArray(d) ? d : []); setLoading(false) })
    .catch(() => setLoading(false))
  }, [])

  const filtered = influencers.filter(inf => {
    const matchSearch = !search || (inf.display_name_ar+inf.display_name+(inf.bio_ar||'')).toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter==='الكل' || (inf.specializations||[]).includes(filter)
    return matchSearch && matchFilter
  }).sort((a,b) => {
    if (sort==='featured') return (b.is_featured?1:0)-(a.is_featured?1:0)
    if (sort==='rating') return (b.avg_rating||0)-(a.avg_rating||0)
    if (sort==='campaigns') return (b.total_campaigns||0)-(a.total_campaigns||0)
    if (sort==='price_asc') return (a.price_basic||0)-(b.price_basic||0)
    return 0
  })

  const featured = influencers.filter(inf => inf.is_featured || inf.tiktok_followers > 100000)
  const totalReach = influencers.reduce((s,inf) => s+totalFollowers(inf), 0)

  function slide(dir: 'left'|'right') {
    const el = sliderRef.current
    if (!el) return
    el.scrollBy({ left: dir==='right' ? -260 : 260, behavior:'smooth' })
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F8F7FA', direction:'rtl', fontFamily:"'Tajawal', sans-serif" }}>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div style={{ background:`linear-gradient(135deg, ${C.navy} 0%, #3D1A78 100%)`, padding:'48px 24px 60px', textAlign:'center' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(240,85,55,.2)', border:'1px solid rgba(240,85,55,.4)', borderRadius:20, padding:'4px 14px', marginBottom:16 }}>
          <span style={{ fontSize:12, color:'#F05537', fontWeight:700 }}>✨ ماركت المؤثرين</span>
        </div>
        <h1 style={{ fontSize:36, fontWeight:900, color:'#fff', margin:'0 0 12px' }}>تواصل مع مؤثري الفعاليات</h1>
        <p style={{ fontSize:16, color:'rgba(255,255,255,.75)', margin:'0 0 32px', maxWidth:520, marginInline:'auto' }}>
          مئات المؤثرين المتخصصين في الفعاليات — ابعث بريفك وانتظر العروض
        </p>
        <div style={{ maxWidth:480, margin:'0 auto' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث باسم المؤثر أو التخصص..."
            style={{ width:'100%', padding:'13px 18px', borderRadius:10, border:'none', fontSize:15, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
          />
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 16px' }}>

        {/* ── Filter tabs ───────────────────────────────────────────── */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'20px 0 12px', scrollbarWidth:'none', alignItems:'center' }}>
          {SPECS.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding:'7px 16px', borderRadius:20,
              border:`1px solid ${filter===s?C.orange:C.border}`,
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

        {/* ── Cards Grid (Minimal) ──────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:14, paddingBottom:32 }}>
            {filtered.map(inf => <InfluencerCard key={inf.id} inf={inf} />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:80 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
            <p style={{ color:C.muted, fontSize:16 }}>لا يوجد مؤثرون بهذه المعايير</p>
          </div>
        )}

        {/* ── FEATURED SLIDER ──────────────────────────────────────── */}
        {!loading && influencers.length > 0 && (
          <div style={{ marginBottom:48 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
              <div>
                <h2 style={{ fontSize:20, fontWeight:900, color:C.navy, margin:'0 0 3px' }}>🌟 المؤثرون المميزون</h2>
                <p style={{ color:C.muted, fontSize:13, margin:0 }}>نخبة المؤثرين الأكثر تأثيراً في الفعاليات</p>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => slide('left')} style={{ width:34, height:34, borderRadius:'50%', border:`1px solid ${C.border}`, background:C.card, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:C.navy }}>›</button>
                <button onClick={() => slide('right')} style={{ width:34, height:34, borderRadius:'50%', border:`1px solid ${C.border}`, background:C.card, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:C.navy }}>‹</button>
              </div>
            </div>

            <div ref={sliderRef} style={{ display:'flex', gap:14, overflowX:'auto', scrollbarWidth:'none', paddingBottom:6 }}>
              {(featured.length > 0 ? featured : influencers).map((inf,i) => <FeaturedCard key={inf.id} inf={inf} index={i} />)}
            </div>

            {/* Stats bar */}
            <div style={{ marginTop:20, display:'flex', gap:10, overflowX:'auto', scrollbarWidth:'none', paddingBottom:4 }}>
              {[
                { icon:'👥', value:influencers.length+'+', label:'مؤثر مسجل' },
                { icon:'📡', value:fmt(totalReach), label:'إجمالي المتابعين' },
                { icon:'✅', value:influencers.filter(i=>i.is_verified).length+'', label:'موثق' },
                { icon:'⭐', value:influencers.filter(i=>i.is_featured).length+'', label:'مميز' },
                { icon:'🎪', value:'8', label:'تخصص' },
              ].map(s => (
                <div key={s.label} style={{ flex:'0 0 auto', padding:'12px 20px', background:C.card, border:`1px solid ${C.border}`, borderRadius:12, textAlign:'center', minWidth:100 }}>
                  <div style={{ fontSize:18, marginBottom:3 }}>{s.icon}</div>
                  <div style={{ fontSize:20, fontWeight:900, color:C.navy }}>{s.value}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* CTA pair */}
            <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 20px', display:'flex', alignItems:'center', gap:14 }}>
                <span style={{ fontSize:32, flexShrink:0 }}>🎤</span>
                <div>
                  <h4 style={{ fontSize:14, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>هل أنت مؤثر؟</h4>
                  <p style={{ fontSize:12, color:C.muted, margin:'0 0 10px', lineHeight:1.5 }}>انضم واستقبل حملات من كبار المنظمين</p>
                  <a href="/influencer/portal" style={{ display:'inline-block', padding:'7px 16px', background:C.orange, borderRadius:8, color:'#fff', fontWeight:700, fontSize:12, textDecoration:'none' }}>انضم الآن ←</a>
                </div>
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 20px', display:'flex', alignItems:'center', gap:14 }}>
                <span style={{ fontSize:32, flexShrink:0 }}>🎪</span>
                <div>
                  <h4 style={{ fontSize:14, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>منظم فعاليات؟</h4>
                  <p style={{ fontSize:12, color:C.muted, margin:'0 0 10px', lineHeight:1.5 }}>سجّل دخولك وابدأ باستقبال عروض المؤثرين</p>
                  <a href="/login" style={{ display:'inline-block', padding:'7px 16px', background:C.navy, borderRadius:8, color:'#fff', fontWeight:700, fontSize:12, textDecoration:'none' }}>لوحة التحكم ←</a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
