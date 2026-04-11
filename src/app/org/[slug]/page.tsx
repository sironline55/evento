'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const CATEGORIES = [
  { key:'all',            icon:'🗓️', label:'الكل' },
  { key:'رحلات ومغامرات', icon:'🏔️', label:'رحلات' },
  { key:'رياضة ونشاط',   icon:'🏃', label:'رياضة' },
  { key:'موسيقى وفنون',  icon:'🎵', label:'فنون' },
  { key:'أعمال وتقنية',  icon:'💼', label:'أعمال' },
  { key:'تعليم وتطوير',  icon:'📚', label:'تعليم' },
  { key:'طعام وترفيه',   icon:'🍽️', label:'طعام' },
  { key:'ثقافة ومجتمع',  icon:'🎨', label:'ثقافة' },
  { key:'عروض وترفيه',   icon:'🎪', label:'ترفيه' },
  { key:'مخيمات',        icon:'🏕️', label:'مخيمات' },
]

type Org = {
  id:string; name:string; name_ar:string|null; tagline:string|null
  logo_url:string|null; cover_image:string|null; city:string|null
  social_instagram:string|null; social_twitter:string|null
  social_whatsapp:string|null; accent_color:string|null
  website:string|null; description:string|null
}
type Ev = {
  id:string; title:string; description:string|null; cover_image:string|null
  start_date:string; end_date:string|null; location:string|null
  category:string|null; category_icon:string|null; is_featured:boolean|null
  price_from:number|null; slug:string|null
}

/* ── Hero auto-rotating slider ─────────────────────────────────────── */
function HeroSlider({ events, accent }: { events:Ev[]; accent:string }) {
  const [idx, setIdx]     = useState(0)
  const [fading, setFading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null)
  const slides = events.filter(e => e.cover_image).slice(0, 6)

  function goTo(i:number) {
    setFading(true)
    setTimeout(() => { setIdx(i); setFading(false) }, 280)
  }

  useEffect(() => {
    if (slides.length <= 1) return
    timerRef.current = setInterval(() => goTo((idx + 1) % slides.length), 4500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [idx, slides.length])

  if (slides.length === 0) return null
  const ev = slides[idx]
  const dateStr = new Date(ev.start_date).toLocaleDateString('ar-SA', { month:'long', day:'numeric' })

  return (
    <div style={{ position:'relative', height:360, overflow:'hidden' }}>
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:`url(${ev.cover_image})`,
        backgroundSize:'cover', backgroundPosition:'center',
        opacity: fading ? 0 : 1, transition:'opacity 0.28s ease',
      }}/>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(10,0,30,0.9) 0%, rgba(10,0,30,0.3) 60%, transparent 100%)' }}/>

      {/* Content */}
      <div style={{ position:'absolute', bottom:0, right:0, left:0, padding:'24px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <span style={{ background:accent, color:'#fff', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
            {ev.category_icon||'🗓️'} {ev.category||'فعالية'}
          </span>
          <span style={{ color:'rgba(255,255,255,0.7)', fontSize:11 }}>📅 {dateStr}</span>
          {ev.location && <span style={{ color:'rgba(255,255,255,0.7)', fontSize:11 }}>📍 {ev.location}</span>}
        </div>
        <h2 style={{ color:'#fff', fontSize:22, fontWeight:900, margin:'0 0 12px', lineHeight:1.3 }}>
          {ev.title}
        </h2>
        <Link href={`/events/${ev.id}`}
          style={{ padding:'9px 20px', background:accent, borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, textDecoration:'none', display:'inline-block' }}>
          اعرف أكثر ←
        </Link>
        {ev.price_from != null && (
          <span style={{ color:'rgba(255,255,255,0.85)', fontSize:13, fontWeight:700, marginRight:12 }}>
            {ev.price_from === 0 ? '🆓 مجاني' : `من ${ev.price_from} ر.س`}
          </span>
        )}
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', display:'flex', gap:5 }}>
          {slides.map((_,i)=>(
            <button key={i} onClick={()=>goTo(i)} style={{
              width:i===idx?20:6, height:6, borderRadius:50,
              background:i===idx?'#fff':'rgba(255,255,255,0.35)',
              border:'none', cursor:'pointer', padding:0, transition:'all 0.3s'
            }}/>
          ))}
        </div>
      )}

      {/* Arrows */}
      {slides.length > 1 && ['right','left'].map((side,si) => (
        <button key={side} onClick={()=>goTo(si===0?(idx-1+slides.length)%slides.length:(idx+1)%slides.length)}
          style={{ position:'absolute', top:'50%', [side]:12, transform:'translateY(-50%)',
            width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.15)',
            border:'none', color:'#fff', fontSize:18, cursor:'pointer' }}>
          {si===0?'‹':'›'}
        </button>
      ))}
    </div>
  )
}

/* ── Event card ────────────────────────────────────────────────────── */
function EventCard({ ev, accent, small=false }: { ev:Ev; accent:string; small?:boolean }) {
  const dateStr = new Date(ev.start_date).toLocaleDateString('ar-SA', { month:'short', day:'numeric' })
  return (
    <Link href={`/events/${ev.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div style={{
        background:'#fff', borderRadius:small?10:14, overflow:'hidden',
        border:'1px solid #E0DDE8', transition:'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.transform='translateY(-3px)'; el.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)' }}
      onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.transform=''; el.style.boxShadow='' }}>
        <div style={{ position:'relative', height:small?110:180, background:'linear-gradient(135deg,#1E0A3C,#3D1A78)', overflow:'hidden' }}>
          {ev.cover_image
            ? <img src={ev.cover_image} alt={ev.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:small?28:42, opacity:0.35 }}>{ev.category_icon||'🗓️'}</span>
              </div>
          }
          <span style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:20 }}>
            {ev.category_icon||'🗓️'} {ev.category||'فعالية'}
          </span>
          {ev.is_featured && !small && (
            <span style={{ position:'absolute', top:8, left:8, background:accent, color:'#fff', fontSize:9, fontWeight:700, padding:'3px 7px', borderRadius:20 }}>⭐ مميز</span>
          )}
        </div>
        <div style={{ padding:small?'10px 12px':'14px' }}>
          <h3 style={{ fontSize:small?12:14, fontWeight:700, color:'#1E0A3C', margin:'0 0 5px', lineHeight:1.3,
            overflow:'hidden', textOverflow:'ellipsis',
            display:'-webkit-box' as any, WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any }}>
            {ev.title}
          </h3>
          <p style={{ fontSize:11, color:'#6F7287', margin:'0 0 5px' }}>📅 {dateStr}</p>
          {!small && ev.location && <p style={{ fontSize:11, color:'#6F7287', margin:'0 0 5px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>📍 {ev.location}</p>}
          {ev.price_from != null && (
            <span style={{ fontSize:small?11:13, fontWeight:800, color:ev.price_from===0?'#3A7D0A':accent }}>
              {ev.price_from===0?'🆓 مجاني':`من ${ev.price_from} ر.س`}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ── Main page ─────────────────────────────────────────────────────── */
export default function OrgCatalogPage() {
  const params   = useParams()
  const slug     = params?.slug as string
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [org,      setOrg]      = useState<Org|null>(null)
  const [upcoming, setUpcoming] = useState<Ev[]>([])
  const [past,     setPast]     = useState<Ev[]>([])
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeCat, setActiveCat] = useState('all')

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      const { data: o } = await sb.from('organizations')
        .select('*').eq('slug', slug).eq('catalog_enabled', true).maybeSingle()
      if (!o) { setNotFound(true); setLoading(false); return }
      setOrg(o)

      const now = new Date().toISOString()
      const [{ data: up }, { data: pa }] = await Promise.all([
        sb.from('events').select('id,title,description,cover_image,start_date,end_date,location,category,category_icon,is_featured,price_from,slug')
          .eq('org_id', o.id).eq('is_public', true).in('status', ['published','active'])
          .gte('start_date', now).order('is_featured', { ascending:false }).order('start_date', { ascending:true }).limit(20),
        sb.from('events').select('id,title,cover_image,start_date,location,category,category_icon,slug')
          .eq('org_id', o.id).eq('is_public', true)
          .lt('start_date', now).order('start_date', { ascending:false }).limit(12),
      ])
      setUpcoming(up || [])
      setPast(pa || [])
      setLoading(false)
    })()
  }, [slug])

  const accent = org?.accent_color || '#F05537'

  const usedCats = useMemo(() => {
    const cats = new Set([...upcoming, ...past].map(e => e.category).filter(Boolean) as string[])
    return CATEGORIES.filter(c => c.key==='all' || cats.has(c.key))
  }, [upcoming, past])

  const filtUp = activeCat==='all' ? upcoming : upcoming.filter(e => e.category===activeCat)
  const filtPa = activeCat==='all' ? past     : past.filter(e => e.category===activeCat)

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F4F2F8', direction:'rtl' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🎪</div>
        <p style={{ color:'#6F7287', fontSize:14 }}>جاري التحميل...</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F4F2F8', direction:'rtl' }}>
      <div style={{ textAlign:'center', padding:32 }}>
        <div style={{ fontSize:56, marginBottom:12 }}>🔍</div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#1E0A3C', margin:'0 0 8px' }}>المنظم غير موجود</h1>
        <p style={{ color:'#6F7287', fontSize:14 }}>تحقق من الرابط أو تواصل مع المنظم</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#F4F2F8', direction:'rtl', fontFamily:"'Tajawal', sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#1E0A3C,#2D1550)', padding:'20px 20px 0' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>

          {/* Logo + info */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
            {org?.logo_url
              ? <img src={org.logo_url} alt="" style={{ width:54, height:54, borderRadius:12, objectFit:'cover', border:'2px solid rgba(255,255,255,0.2)' }}/>
              : <div style={{ width:54, height:54, background:accent, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'#fff', fontWeight:900, flexShrink:0 }}>
                  {(org?.name_ar||org?.name||'?')[0]}
                </div>
            }
            <div style={{ flex:1, minWidth:0 }}>
              <h1 style={{ color:'#fff', fontSize:21, fontWeight:900, margin:'0 0 3px' }}>{org?.name_ar||org?.name}</h1>
              {org?.tagline && <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{org.tagline}</p>}
              {org?.city   && <p style={{ color:'rgba(255,255,255,0.4)', fontSize:11, margin:0 }}>📍 {org.city}</p>}
            </div>
            <div style={{ display:'flex', gap:7, flexShrink:0 }}>
              {org?.social_whatsapp && (
                <a href={`https://wa.me/${org.social_whatsapp}`} target="_blank" rel="noopener"
                  style={{ width:34, height:34, background:'#25D366', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', fontSize:16 }}>💬</a>
              )}
              {org?.social_instagram && (
                <a href={`https://instagram.com/${org.social_instagram}`} target="_blank" rel="noopener"
                  style={{ width:34, height:34, background:'linear-gradient(135deg,#f09433,#dc2743)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', fontSize:16 }}>📷</a>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:20, paddingBottom:14, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            {[{v:upcoming.length,l:'فعالية قادمة'},{v:past.length,l:'فعالية سابقة'}].map(s=>(
              <div key={s.l}>
                <span style={{ color:'#fff', fontWeight:800, fontSize:18 }}>{s.v}</span>
                <span style={{ color:'rgba(255,255,255,0.45)', fontSize:11, marginRight:5 }}>{s.l}</span>
              </div>
            ))}
          </div>

          {/* Category tabs */}
          <div style={{ display:'flex', gap:4, overflowX:'auto', padding:'12px 0 0', scrollbarWidth:'none' }}>
            {usedCats.map(cat=>(
              <button key={cat.key} onClick={()=>setActiveCat(cat.key)} style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                padding:'8px 14px', borderRadius:10, border:'none', cursor:'pointer',
                background: activeCat===cat.key ? accent : 'rgba(255,255,255,0.08)',
                color: activeCat===cat.key ? '#fff' : 'rgba(255,255,255,0.6)',
                fontWeight: activeCat===cat.key ? 700 : 400,
                fontSize:11, fontFamily:"Tajawal, sans-serif", transition:'all 0.15s', flexShrink:0,
              }}>
                <span style={{ fontSize:19 }}>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Slider ─────────────────────────────────────────────────── */}
      {upcoming.filter(e=>e.cover_image).length > 0 && activeCat==='all' && (
        <HeroSlider events={upcoming} accent={accent} />
      )}

      {/* ── Content ────────────────────────────────────────────────── */}
      <div style={{ maxWidth:960, margin:'0 auto', padding:'20px 16px 60px' }}>

        {/* Upcoming */}
        {filtUp.length > 0 && (
          <section style={{ marginBottom:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h2 style={{ fontSize:17, fontWeight:800, color:'#1E0A3C', margin:0 }}>
                {activeCat==='all' ? '🗓️ الفعاليات القادمة' : `${usedCats.find(c=>c.key===activeCat)?.icon||''} ${usedCats.find(c=>c.key===activeCat)?.label||''}`}
              </h2>
              <span style={{ fontSize:12, color:'#6F7287' }}>{filtUp.length} فعالية</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px,1fr))', gap:14 }}>
              {filtUp.map(ev=><EventCard key={ev.id} ev={ev} accent={accent}/>)}
            </div>
          </section>
        )}

        {filtUp.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 20px' }}>
            <div style={{ fontSize:44, marginBottom:8 }}>🗓️</div>
            <p style={{ fontWeight:700, color:'#1E0A3C', fontSize:15, margin:'0 0 4px' }}>لا توجد فعاليات قادمة</p>
            <p style={{ color:'#6F7287', fontSize:13 }}>جرّب تصنيفاً آخر أو عد لاحقاً</p>
          </div>
        )}

        {/* Past */}
        {filtPa.length > 0 && (
          <section>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <h2 style={{ fontSize:17, fontWeight:800, color:'#1E0A3C', margin:0 }}>📂 الفعاليات السابقة</h2>
              <span style={{ fontSize:11, background:'#EDE9F7', color:'#5B3FA0', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>{filtPa.length}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(155px,1fr))', gap:10 }}>
              {filtPa.map(ev=><EventCard key={ev.id} ev={ev} accent={accent} small/>)}
            </div>
          </section>
        )}

        {upcoming.length===0 && past.length===0 && (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <div style={{ fontSize:52, marginBottom:12 }}>🎪</div>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#1E0A3C', margin:'0 0 8px' }}>لا توجد فعاليات بعد</h2>
            {org?.social_whatsapp && (
              <a href={`https://wa.me/${org.social_whatsapp}`} target="_blank" rel="noopener"
                style={{ display:'inline-block', marginTop:16, padding:'12px 28px', background:'#25D366', borderRadius:10, color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none' }}>
                💬 تواصل معنا
              </a>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background:'#1E0A3C', padding:'14px', textAlign:'center' }}>
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:11, margin:0 }}>
          مدعوم بـ <span style={{ color:'#F05537', fontWeight:700 }}>EventVMS</span>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
