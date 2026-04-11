'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'

// ── Category config (webook-inspired icons, EventVMS style) ──────────
const CATEGORIES = [
  { key:'all',          icon:'🗓️',  label:'الكل' },
  { key:'رحلات ومغامرات', icon:'🏔️', label:'رحلات' },
  { key:'رياضة ونشاط', icon:'🏃',  label:'رياضة' },
  { key:'موسيقى وفنون', icon:'🎵',  label:'فنون' },
  { key:'أعمال وتقنية', icon:'💼',  label:'أعمال' },
  { key:'تعليم وتطوير', icon:'📚',  label:'تعليم' },
  { key:'طعام وترفيه',  icon:'🍽️',  label:'طعام' },
  { key:'ثقافة ومجتمع', icon:'🎨',  label:'ثقافة' },
  { key:'عروض وترفيه',  icon:'🎪',  label:'ترفيه' },
  { key:'مخيمات',       icon:'🏕️',  label:'مخيمات' },
]

type Org = {
  id:string; name:string; name_ar:string|null; tagline:string|null
  logo_url:string|null; cover_image:string|null; city:string|null
  social_instagram:string|null; social_twitter:string|null
  social_whatsapp:string|null; accent_color:string|null
  website:string|null; description:string|null
}
type Event = {
  id:string; title:string; description:string|null; cover_image:string|null
  start_date:string; end_date:string|null; location:string|null
  category:string|null; category_icon:string|null; is_featured:boolean|null
  price_from:number|null; slug:string|null
}

// ── Auto-rotating hero slider ─────────────────────────────────────────
function HeroSlider({ events, accent }: { events: Event[]; accent: string }) {
  const [idx, setIdx] = useState(0)
  const [fading, setFading] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  const featured = events.filter(e => e.cover_image)
  if (featured.length === 0) return null

  function goTo(i: number) {
    setFading(true)
    setTimeout(() => { setIdx(i); setFading(false) }, 300)
  }

  useEffect(() => {
    if (featured.length <= 1) return
    timerRef.current = setInterval(() => {
      goTo((idx + 1) % featured.length)
    }, 4500)
    return () => clearInterval(timerRef.current)
  }, [idx, featured.length])

  const ev = featured[idx]
  const dateStr = new Date(ev.start_date).toLocaleDateString('ar-SA', { month:'long', day:'numeric' })

  return (
    <div style={{ position:'relative', height:380, overflow:'hidden', borderRadius:0 }}>
      {/* Slide image */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:`url(${ev.cover_image})`,
        backgroundSize:'cover', backgroundPosition:'center',
        opacity: fading ? 0 : 1,
        transition:'opacity 0.3s ease',
      }}/>
      {/* Gradient overlay */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(10,0,30,0.92) 0%, rgba(10,0,30,0.4) 50%, rgba(10,0,30,0.1) 100%)' }}/>

      {/* Content */}
      <div style={{ position:'absolute', bottom:0, right:0, left:0, padding:'24px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <span style={{ background:accent, color:'#fff', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20 }}>
            {ev.category_icon || '🗓️'} {ev.category || 'فعالية'}
          </span>
          <span style={{ color:'rgba(255,255,255,0.7)', fontSize:11 }}>📅 {dateStr}</span>
          {ev.location && <span style={{ color:'rgba(255,255,255,0.7)', fontSize:11 }}>📍 {ev.location}</span>}
        </div>
        <h2 style={{ color:'#fff', fontSize:22, fontWeight:900, margin:'0 0 6px', lineHeight:1.3, textShadow:'0 2px 8px rgba(0,0,0,0.5)' }}>
          {ev.title}
        </h2>
        {ev.description && (
          <p style={{ color:'rgba(255,255,255,0.75)', fontSize:12, margin:'0 0 14px', lineHeight:1.5,
            overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
            {ev.description}
          </p>
        )}
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <Link href={`/events/${ev.id}`}
            style={{ padding:'10px 22px', background:accent, border:'none', borderRadius:8, color:'#fff', fontWeight:800, fontSize:13, textDecoration:'none', display:'inline-block' }}>
            اعرف أكثر ←
          </Link>
          {ev.price_from != null && (
            <span style={{ color:'#fff', fontSize:13, fontWeight:700 }}>
              {ev.price_from === 0 ? 'مجاني' : `من ${ev.price_from} ر.س`}
            </span>
          )}
        </div>
      </div>

      {/* Dots */}
      {featured.length > 1 && (
        <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6 }}>
          {featured.map((_,i) => (
            <button key={i} onClick={()=>goTo(i)} style={{
              width: i===idx ? 22 : 7, height:7, borderRadius:50,
              background: i===idx ? '#fff' : 'rgba(255,255,255,0.4)',
              border:'none', cursor:'pointer', padding:0,
              transition:'all 0.3s',
            }}/>
          ))}
        </div>
      )}

      {/* Nav arrows */}
      {featured.length > 1 && (
        <>
          <button onClick={()=>goTo((idx-1+featured.length)%featured.length)}
            style={{ position:'absolute', top:'50%', right:12, transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:18, cursor:'pointer', backdropFilter:'blur(4px)' }}>‹</button>
          <button onClick={()=>goTo((idx+1)%featured.length)}
            style={{ position:'absolute', top:'50%', left:12, transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:18, cursor:'pointer', backdropFilter:'blur(4px)' }}>›</button>
        </>
      )}
    </div>
  )
}

// ── Event Card ─────────────────────────────────────────────────────────
function EventCard({ event, accent, size='normal' }: { event:Event; accent:string; size?:'normal'|'small' }) {
  const dateStr = new Date(event.start_date).toLocaleDateString('ar-SA', {
    month:'short', day:'numeric', weekday: size==='normal' ? 'short' : undefined
  })
  const isSmall = size === 'small'

  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div style={{
        background:'#fff', borderRadius:isSmall?10:14, overflow:'hidden',
        border:'1px solid #DBDAE3', transition:'transform 0.15s, box-shadow 0.15s',
        cursor:'pointer',
      }}
      onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.transform='translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 8px 24px rgba(0,0,0,0.1)' }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow='' }}>
        {/* Image */}
        <div style={{ position:'relative', height: isSmall?110:180, background:`linear-gradient(135deg, #1E0A3C, #3D1A78)`, overflow:'hidden' }}>
          {event.cover_image ? (
            <img src={event.cover_image} alt={event.title}
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize: isSmall?28:40, opacity:0.4 }}>{event.category_icon||'🗓️'}</span>
            </div>
          )}
          {/* Category pill */}
          <div style={{ position:'absolute', top:8, right:8 }}>
            <span style={{ background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:20, backdropFilter:'blur(4px)' }}>
              {event.category_icon||'🗓️'} {event.category||'فعالية'}
            </span>
          </div>
          {/* Featured badge */}
          {event.is_featured && !isSmall && (
            <div style={{ position:'absolute', top:8, left:8 }}>
              <span style={{ background:accent, color:'#fff', fontSize:9, fontWeight:700, padding:'3px 7px', borderRadius:20 }}>⭐ مميز</span>
            </div>
          )}
        </div>
        {/* Info */}
        <div style={{ padding: isSmall?'10px 12px':'14px 14px' }}>
          <h3 style={{ fontSize: isSmall?12:14, fontWeight:700, color:'#1E0A3C', margin:'0 0 5px', lineHeight:1.3,
            overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
            {event.title}
          </h3>
          {!isSmall && (
            <div style={{ display:'flex', flexDirection:'column', gap:3, marginBottom:8 }}>
              <span style={{ fontSize:11, color:'#6F7287' }}>📅 {dateStr}</span>
              {event.location && <span style={{ fontSize:11, color:'#6F7287', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>📍 {event.location}</span>}
            </div>
          )}
          {isSmall && <span style={{ fontSize:10, color:'#6F7287' }}>📅 {dateStr}</span>}
          {event.price_from != null && (
            <div style={{ marginTop: isSmall?4:0 }}>
              <span style={{ fontSize: isSmall?11:13, fontWeight:800, color: event.price_from===0?'#3A7D0A':accent }}>
                {event.price_from === 0 ? '🆓 مجاني' : `من ${event.price_from} ر.س`}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── Main Catalog Client ────────────────────────────────────────────────
export default function OrgCatalogClient({ org, upcoming, past }: {
  org: Org; upcoming: Event[]; past: Event[]
}) {
  const accent = org.accent_color || '#F05537'
  const [activeCategory, setActiveCategory] = useState('all')

  // Get categories actually used
  const usedCategories = useMemo(() => {
    const cats = new Set([...upcoming, ...past].map(e => e.category).filter(Boolean))
    return CATEGORIES.filter(c => c.key === 'all' || cats.has(c.key))
  }, [upcoming, past])

  const filteredUpcoming = useMemo(() =>
    activeCategory === 'all' ? upcoming : upcoming.filter(e => e.category === activeCategory)
  , [upcoming, activeCategory])

  const filteredPast = useMemo(() =>
    activeCategory === 'all' ? past : past.filter(e => e.category === activeCategory)
  , [past, activeCategory])

  const featured = upcoming.filter(e => e.is_featured && e.cover_image)
  const sliderEvents = featured.length > 0 ? featured : upcoming.filter(e => e.cover_image).slice(0, 5)

  return (
    <div style={{ minHeight:'100vh', background:'#F4F2F8', direction:'rtl', fontFamily:'Tajawal, sans-serif' }}>

      {/* ── ORG HEADER ─────────────────────────────────────────────── */}
      <div style={{ background:`linear-gradient(135deg, #1E0A3C 0%, #2D1550 100%)`, padding:'20px 20px 0' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          {/* Logo + Name */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} style={{ width:56, height:56, borderRadius:12, objectFit:'cover', border:'2px solid rgba(255,255,255,0.2)' }}/>
            ) : (
              <div style={{ width:56, height:56, background:accent, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'#fff', fontWeight:900 }}>
                {(org.name_ar||org.name)[0]}
              </div>
            )}
            <div style={{ flex:1 }}>
              <h1 style={{ color:'#fff', fontSize:22, fontWeight:900, margin:0, letterSpacing:'-0.3px' }}>
                {org.name_ar || org.name}
              </h1>
              {org.tagline && <p style={{ color:'rgba(255,255,255,0.65)', fontSize:12, margin:'3px 0 0' }}>{org.tagline}</p>}
              {org.city && <p style={{ color:'rgba(255,255,255,0.45)', fontSize:11, margin:'2px 0 0' }}>📍 {org.city}</p>}
            </div>
            {/* Social links */}
            <div style={{ display:'flex', gap:8 }}>
              {org.social_whatsapp && (
                <a href={`https://wa.me/${org.social_whatsapp}`} target="_blank" rel="noopener"
                  style={{ width:34, height:34, background:'#25D366', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', fontSize:16 }}>💬</a>
              )}
              {org.social_instagram && (
                <a href={`https://instagram.com/${org.social_instagram}`} target="_blank" rel="noopener"
                  style={{ width:34, height:34, background:'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', fontSize:16 }}>📷</a>
              )}
              {org.social_twitter && (
                <a href={`https://x.com/${org.social_twitter}`} target="_blank" rel="noopener"
                  style={{ width:34, height:34, background:'#000', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', color:'#fff', fontWeight:700, fontSize:12 }}>X</a>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div style={{ display:'flex', gap:20, paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            {[
              { v: upcoming.length, l:'فعالية قادمة' },
              { v: past.length,     l:'فعالية سابقة' },
            ].map(s => (
              <div key={s.l}>
                <span style={{ color:'#fff', fontWeight:800, fontSize:18 }}>{s.v}</span>
                <span style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginRight:4 }}>{s.l}</span>
              </div>
            ))}
          </div>

          {/* ── Category filter tabs ───────────────────────────────── */}
          <div style={{ display:'flex', gap:4, overflowX:'auto', padding:'12px 0', scrollbarWidth:'none' }}>
            {usedCategories.map(cat => (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)} style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                padding:'8px 14px', borderRadius:10, border:'none', cursor:'pointer',
                background: activeCategory===cat.key ? accent : 'rgba(255,255,255,0.08)',
                color: activeCategory===cat.key ? '#fff' : 'rgba(255,255,255,0.65)',
                fontWeight: activeCategory===cat.key ? 700 : 400,
                fontSize:11, fontFamily:'Tajawal, sans-serif',
                transition:'all 0.15s', flexShrink:0,
              }}>
                <span style={{ fontSize:20 }}>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── HERO SLIDER ───────────────────────────────────────────────── */}
      {sliderEvents.length > 0 && activeCategory === 'all' && (
        <HeroSlider events={sliderEvents} accent={accent} />
      )}

      <div style={{ maxWidth:960, margin:'0 auto', padding:'20px 16px 60px' }}>

        {/* ── UPCOMING EVENTS ────────────────────────────────────────── */}
        {filteredUpcoming.length > 0 && (
          <section style={{ marginBottom:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h2 style={{ fontSize:18, fontWeight:800, color:'#1E0A3C', margin:0 }}>
                {activeCategory==='all' ? '🗓️ الفعاليات القادمة' : `${usedCategories.find(c=>c.key===activeCategory)?.icon||''} ${usedCategories.find(c=>c.key===activeCategory)?.label||''}`}
              </h2>
              <span style={{ fontSize:12, color:'#6F7287' }}>{filteredUpcoming.length} فعالية</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:14 }}>
              {filteredUpcoming.map(ev => (
                <EventCard key={ev.id} event={ev} accent={accent}/>
              ))}
            </div>
          </section>
        )}

        {filteredUpcoming.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 16px' }}>
            <div style={{ fontSize:48, marginBottom:10 }}>🗓️</div>
            <p style={{ fontSize:15, fontWeight:700, color:'#1E0A3C', margin:'0 0 4px' }}>لا توجد فعاليات قادمة في هذا التصنيف</p>
            <p style={{ fontSize:13, color:'#6F7287' }}>جرّب تصنيفاً آخر أو عد لاحقاً</p>
          </div>
        )}

        {/* ── PAST EVENTS ─────────────────────────────────────────────── */}
        {filteredPast.length > 0 && (
          <section>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <h2 style={{ fontSize:18, fontWeight:800, color:'#1E0A3C', margin:0 }}>📂 الفعاليات السابقة</h2>
              <span style={{ fontSize:11, background:'#EDE9F7', color:'#5B3FA0', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>
                {filteredPast.length}
              </span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:10 }}>
              {filteredPast.map(ev => (
                <EventCard key={ev.id} event={ev} accent={accent} size="small"/>
              ))}
            </div>
          </section>
        )}

        {/* ── EMPTY STATE ──────────────────────────────────────────────── */}
        {upcoming.length === 0 && past.length === 0 && (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <div style={{ fontSize:56, marginBottom:12 }}>🎪</div>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#1E0A3C', margin:'0 0 8px' }}>لا توجد فعاليات بعد</h2>
            <p style={{ color:'#6F7287', fontSize:14 }}>تابع هذا المنظم لتكون أول من يعرف بفعالياته القادمة</p>
            {org.social_whatsapp && (
              <a href={`https://wa.me/${org.social_whatsapp}`} target="_blank" rel="noopener"
                style={{ display:'inline-block', marginTop:16, padding:'12px 28px', background:'#25D366', borderRadius:10, color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none' }}>
                💬 تواصل معنا
              </a>
            )}
          </div>
        )}

      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <div style={{ background:'#1E0A3C', padding:'16px 20px', textAlign:'center' }}>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:11, margin:0 }}>
          مدعوم بـ <span style={{ color:'#F05537', fontWeight:700 }}>EventVMS</span>
        </p>
      </div>

      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800;900&display=swap" rel="stylesheet"/>
    </div>
  )
}
