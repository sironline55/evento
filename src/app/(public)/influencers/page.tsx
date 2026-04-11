'use client'
import { useEffect, useState } from 'react'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFF', green:'#3A7D0A' }

const PLATFORMS = [
  { key:'tiktok_followers', icon:'🎵', label:'تيك توك' },
  { key:'instagram_followers', icon:'📷', label:'إنستغرام' },
  { key:'snapchat_followers', icon:'👻', label:'سناب' },
  { key:'youtube_followers', icon:'▶️', label:'يوتيوب' },
]

const SPECS = ['الكل','ترفيه','حفلات','رياضة','مؤتمرات','معارض','رحلات','أعمال']
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcGNqc2JjandxbHhmc3NtdGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTQ2MDQsImV4cCI6MjA5MDc3MDYwNH0.W2zchuG_HMpVIFhz9m5NbUSb2n59sUb2-xjtNclzcX8'
const SB_URL = 'https://xqpcjsbcjwqlxfssmtjb.supabase.co'

function fmt(n: number) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n/1000).toFixed(0) + 'K'
  return n.toString()
}

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('الكل')
  const [sort, setSort] = useState('featured')

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/influencer_profiles?select=*&status=eq.active&order=is_featured.desc,total_campaigns.desc`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
    })
    .then(r => r.json())
    .then(d => { setInfluencers(Array.isArray(d) ? d : []); setLoading(false) })
    .catch(() => setLoading(false))
  }, [])

  const filtered = influencers.filter(inf => {
    const matchSearch = !search || (inf.display_name_ar + inf.display_name + inf.bio_ar).toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'الكل' || (inf.specializations || []).includes(filter)
    return matchSearch && matchFilter
  }).sort((a, b) => {
    if (sort === 'featured') return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
    if (sort === 'rating') return (b.avg_rating || 0) - (a.avg_rating || 0)
    if (sort === 'campaigns') return (b.total_campaigns || 0) - (a.total_campaigns || 0)
    if (sort === 'price_asc') return (a.price_basic || 0) - (b.price_basic || 0)
    return 0
  })

  const totalFollowers = (inf: any) =>
    (inf.tiktok_followers||0) + (inf.instagram_followers||0) + (inf.snapchat_followers||0) + (inf.youtube_followers||0)

  return (
    <div style={{ minHeight:'100vh', background:'#F8F7FA', direction:'rtl', fontFamily:"'Tajawal', sans-serif" }}>
      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg, ${C.navy} 0%, #3D1A78 100%)`, padding:'48px 24px 60px', textAlign:'center' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(240,85,55,.2)', border:'1px solid rgba(240,85,55,.4)', borderRadius:20, padding:'4px 14px', marginBottom:16 }}>
          <span style={{ fontSize:12, color:'#F05537', fontWeight:700 }}>✨ ماركت المؤثرين</span>
        </div>
        <h1 style={{ fontSize:36, fontWeight:900, color:'#fff', margin:'0 0 12px' }}>تواصل مع مؤثري الفعاليات</h1>
        <p style={{ fontSize:16, color:'rgba(255,255,255,.75)', margin:'0 0 32px', maxWidth:520, marginInline:'auto' }}>
          مئات المؤثرين المتخصصين في الفعاليات — ابعث بريفك وانتظر العروض
        </p>
        {/* Search */}
        <div style={{ maxWidth:500, margin:'0 auto', display:'flex', gap:10 }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث باسم المؤثر أو التخصص..."
            style={{ flex:1, padding:'13px 18px', borderRadius:10, border:'none', fontSize:15, fontFamily:'inherit', outline:'none' }}
          />
          <a href="/dashboard/briefs/new" style={{
            padding:'13px 20px', background:C.orange, borderRadius:10, color:'#fff',
            fontWeight:800, fontSize:14, textDecoration:'none', whiteSpace:'nowrap', display:'flex', alignItems:'center'
          }}>+ نشر بريف</a>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 16px' }}>
        {/* Filter tabs */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'20px 0 12px', scrollbarWidth:'none' }}>
          {SPECS.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding:'7px 16px', borderRadius:20, border:`1px solid ${filter===s ? C.orange : C.border}`,
              background: filter===s ? C.orange : C.card, color: filter===s ? '#fff' : C.text,
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

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:80 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
            <p style={{ color:C.muted, fontSize:16 }}>لا يوجد مؤثرون بهذه المعايير</p>
          </div>
        )}

        {/* Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16, paddingBottom:40 }}>
          {filtered.map(inf => (
            <a key={inf.id} href={`/influencers/${inf.id}`} style={{ textDecoration:'none' }}>
              <div style={{
                background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
                overflow:'hidden', transition:'all .2s', cursor:'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)', e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none', e.currentTarget.style.boxShadow = 'none')}
              >
                {/* Cover */}
                <div style={{ height:72, background:`linear-gradient(135deg, ${C.navy}, #6B3FA0)`, position:'relative' }}>
                  {inf.is_featured && (
                    <span style={{ position:'absolute', top:10, right:10, background:'rgba(240,85,55,.9)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>
                      ⭐ مميز
                    </span>
                  )}
                  {inf.is_verified && (
                    <span style={{ position:'absolute', top:10, left:10, background:'rgba(58,125,10,.9)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>
                      ✓ موثق
                    </span>
                  )}
                </div>

                <div style={{ padding:'0 16px 16px', marginTop:-20 }}>
                  {/* Avatar */}
                  <div style={{ width:52, height:52, borderRadius:'50%', background:`linear-gradient(135deg, ${C.orange}, #FF8C42)`, border:'3px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:20, marginBottom:8 }}>
                    {(inf.display_name_ar || inf.display_name)?.[0]}
                  </div>

                  <h3 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:'0 0 3px' }}>{inf.display_name_ar || inf.display_name}</h3>
                  <p style={{ fontSize:12, color:C.muted, margin:'0 0 10px', lineHeight:1.5 }}>{(inf.bio_ar || inf.bio || '').slice(0, 60)}{(inf.bio_ar||'').length > 60 ? '...' : ''}</p>

                  {/* Tags */}
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
                    {(inf.specializations || []).slice(0,3).map((s:string) => (
                      <span key={s} style={{ fontSize:10, background:'#F0EDFF', color:'#5B3FA0', padding:'2px 8px', borderRadius:10, fontWeight:600 }}>{s}</span>
                    ))}
                  </div>

                  {/* Followers */}
                  <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
                    {PLATFORMS.filter(p => inf[p.key] > 0).slice(0,3).map(p => (
                      <span key={p.key} style={{ fontSize:11, color:C.text, display:'flex', alignItems:'center', gap:3 }}>
                        <span>{p.icon}</span><span style={{ fontWeight:700 }}>{fmt(inf[p.key])}</span>
                      </span>
                    ))}
                    {totalFollowers(inf) > 0 && (
                      <span style={{ fontSize:11, color:C.muted, marginRight:'auto' }}>
                        {fmt(totalFollowers(inf))} إجمالي
                      </span>
                    )}
                  </div>

                  {/* Price + CTA */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
                    <div>
                      <span style={{ fontSize:10, color:C.muted, display:'block' }}>يبدأ من</span>
                      <span style={{ fontSize:16, fontWeight:800, color:C.orange }}>{inf.price_basic?.toLocaleString() || '—'} ريال</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {inf.avg_rating > 0 && (
                        <span style={{ fontSize:12, color:'#F5A623', fontWeight:700 }}>{'★'.repeat(Math.round(inf.avg_rating))}</span>
                      )}
                      <span style={{ fontSize:11, background:'#EAF7E0', color:C.green, padding:'4px 10px', borderRadius:20, fontWeight:600 }}>
                        {inf.total_campaigns || 0} حملة
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Empty CTA */}
        {!loading && influencers.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 24px', background:C.card, borderRadius:16, border:`2px dashed ${C.border}`, margin:'20px 0 40px' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🌟</div>
            <h3 style={{ fontSize:20, fontWeight:800, color:C.navy, margin:'0 0 8px' }}>كن أول المؤثرين</h3>
            <p style={{ color:C.muted, fontSize:14, margin:'0 0 20px' }}>سجّل كمؤثر وابدأ في قبول حملات الفعاليات</p>
            <a href="/influencer/join" style={{ display:'inline-block', padding:'12px 28px', background:C.orange, borderRadius:10, color:'#fff', fontWeight:700, textDecoration:'none' }}>
              انضم كمؤثر
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
