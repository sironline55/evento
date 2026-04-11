'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#F4F2F8', card:'#FFFFFF', green:'#3A7D0A' }

const CATEGORIES = [
  { key:'all',              icon:'\uD83D\uDDD3\uFE0F', label:'\u0627\u0644\u0643\u0644' },
  { key:'\u0631\u062D\u0644\u0627\u062A \u0648\u0645\u063A\u0627\u0645\u0631\u0627\u062A', icon:'\uD83C\uDFD4\uFE0F', label:'\u0631\u062D\u0644\u0627\u062A' },
  { key:'\u0631\u064A\u0627\u0636\u0629 \u0648\u0646\u0634\u0627\u0637', icon:'\uD83C\uDFC3', label:'\u0631\u064A\u0627\u0636\u0629' },
  { key:'\u0645\u0648\u0633\u064A\u0642\u0649 \u0648\u0641\u0646\u0648\u0646', icon:'\uD83C\uDFB5', label:'\u0641\u0646\u0648\u0646' },
  { key:'\u0623\u0639\u0645\u0627\u0644 \u0648\u062A\u0642\u0646\u064A\u0629', icon:'\uD83D\uDCBC', label:'\u0623\u0639\u0645\u0627\u0644' },
  { key:'\u062A\u0639\u0644\u064A\u0645 \u0648\u062A\u0637\u0648\u064A\u0631', icon:'\uD83D\uDCDA', label:'\u062A\u0639\u0644\u064A\u0645' },
  { key:'\u0637\u0639\u0627\u0645 \u0648\u062A\u0631\u0641\u064A\u0647', icon:'\uD83C\uDF7D\uFE0F', label:'\u0637\u0639\u0627\u0645' },
  { key:'\u062B\u0642\u0627\u0641\u0629 \u0648\u0645\u062C\u062A\u0645\u0639', icon:'\uD83C\uDFA8', label:'\u062B\u0642\u0627\u0641\u0629' },
  { key:'\u0639\u0631\u0648\u0636 \u0648\u062A\u0631\u0641\u064A\u0647', icon:'\uD83C\uDFAA', label:'\u062A\u0631\u0641\u064A\u0647' },
  { key:'\u0645\u062E\u064A\u0645\u0627\u062A', icon:'\uD83C\uDFD5\uFE0F', label:'\u0645\u062E\u064A\u0645\u0627\u062A' },
]

type OrgType = {
  id:string; name:string; name_ar:string|null; tagline:string|null
  logo_url:string|null; city:string|null; accent_color:string|null
  social_instagram:string|null; social_twitter:string|null; social_whatsapp:string|null
  description:string|null
}
type EventType = {
  id:string; title:string; description:string|null; cover_image:string|null
  start_date:string; location:string|null; category:string|null
  category_icon:string|null; is_featured:boolean|null; price_from:number|null
}

// ── Hero Slider ─────────────────────────────────────────────────────────
function HeroSlider({ events, accent }: { events:EventType[]; accent:string }) {
  const [idx, setIdx] = useState(0)
  const [fading, setFading] = useState(false)
  const timer = useRef<any>(null)

  const slides = events.filter(e => e.cover_image)
  const total = slides.length

  function goTo(i:number) {
    setFading(true)
    setTimeout(() => { setIdx(i); setFading(false) }, 280)
  }

  useEffect(() => {
    if (total <= 1) return
    timer.current = setInterval(() => setIdx(i => (i + 1) % total), 4500)
    return () => clearInterval(timer.current)
  }, [total])

  useEffect(() => {
    clearInterval(timer.current)
    timer.current = setInterval(() => setIdx(i => (i + 1) % total), 4500)
    return () => clearInterval(timer.current)
  }, [idx, total])

  if (total === 0) return null
  const ev = slides[idx]
  const date = new Date(ev.start_date).toLocaleDateString('ar-SA', { month:'long', day:'numeric' })

  return (
    <div style={{ position:'relative', height:360, overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`url(${ev.cover_image})`, backgroundSize:'cover', backgroundPosition:'center', opacity:fading?0:1, transition:'opacity 0.28s ease' }}/>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(10,0,30,0.9) 0%, rgba(10,0,30,0.35) 55%, transparent 100%)' }}/>
      <div style={{ position:'absolute', bottom:0, right:0, left:0, padding:'20px' }}>
        <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
          <span style={{ background:accent, color:'#fff', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20 }}>
            {ev.category_icon || '\uD83D\uDDD3\uFE0F'} {ev.category || 'فعالية'}
          </span>
          <span style={{ color:'rgba(255,255,255,0.75)', fontSize:11 }}>\uD83D\uDCC5 {date}</span>
          {ev.location && <span style={{ color:'rgba(255,255,255,0.75)', fontSize:11 }}>\uD83D\uDCCD {ev.location}</span>}
        </div>
        <h2 style={{ color:'#fff', fontSize:21, fontWeight:900, margin:'0 0 10px', lineHeight:1.3 }}>{ev.title}</h2>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <Link href={`/events/${ev.id}`} style={{ padding:'9px 20px', background:accent, borderRadius:8, color:'#fff', fontWeight:800, fontSize:13, textDecoration:'none', display:'inline-block' }}>
            اعرف أكثر ←
          </Link>
          {ev.price_from != null && (
            <span style={{ color:'#fff', fontSize:13, fontWeight:700 }}>
              {ev.price_from === 0 ? 'مجاني' : `من ${ev.price_from} ر.س`}
            </span>
          )}
        </div>
      </div>
      {total > 1 && (
        <>
          <button onClick={() => goTo((idx - 1 + total) % total)} style={{ position:'absolute', top:'50%', right:12, transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.18)', border:'none', color:'#fff', fontSize:20, cursor:'pointer', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
          <button onClick={() => goTo((idx + 1) % total)} style={{ position:'absolute', top:'50%', left:12, transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.18)', border:'none', color:'#fff', fontSize:20, cursor:'pointer', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
          <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6 }}>
            {slides.map((_,i) => (
              <button key={i} onClick={() => goTo(i)} style={{ width:i===idx?22:7, height:7, borderRadius:50, background:i===idx?'#fff':'rgba(255,255,255,0.4)', border:'none', cursor:'pointer', padding:0, transition:'all 0.3s' }}/>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Event Card ──────────────────────────────────────────────────────────
function EventCard({ event, accent, small=false }: { event:EventType; accent:string; small?:boolean }) {
  const date = new Date(event.start_date).toLocaleDateString('ar-SA', { month:'short', day:'numeric', weekday: small ? undefined : 'short' })
  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div
        style={{ background:'#fff', borderRadius:small?10:14, overflow:'hidden', border:'1px solid #DBDAE3', transition:'transform 0.15s, box-shadow 0.15s', cursor:'pointer' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform='translateY(-3px)'; el.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)' }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform=''; el.style.boxShadow='' }}
      >
        <div style={{ position:'relative', height:small?110:180, background:'linear-gradient(135deg,#1E0A3C,#3D1A78)', overflow:'hidden' }}>
          {event.cover_image
            ? <img src={event.cover_image} alt={event.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:small?28:40, opacity:0.4 }}>{event.category_icon||'\uD83D\uDDD3\uFE0F'}</span></div>
          }
          <div style={{ position:'absolute', top:8, right:8 }}>
            <span style={{ background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:20 }}>
              {event.category_icon||'\uD83D\uDDD3\uFE0F'} {event.category||'فعالية'}
            </span>
          </div>
          {event.is_featured && !small && (
            <div style={{ position:'absolute', top:8, left:8 }}>
              <span style={{ background:accent, color:'#fff', fontSize:9, fontWeight:700, padding:'3px 7px', borderRadius:20 }}>⭐ مميز</span>
            </div>
          )}
        </div>
        <div style={{ padding:small?'10px 12px':'14px' }}>
          <h3 style={{ fontSize:small?12:14, fontWeight:700, color:'#1E0A3C', margin:'0 0 5px', lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box' as any, WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any }}>
            {event.title}
          </h3>
          {!small && event.location && <p style={{ fontSize:11, color:'#6F7287', margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>\uD83D\uDCCD {event.location}</p>}
          <p style={{ fontSize:11, color:'#6F7287', margin:0 }}>\uD83D\uDCC5 {date}</p>
          {event.price_from != null && (
            <p style={{ fontSize:small?11:13, fontWeight:800, color:event.price_from===0?'#3A7D0A':accent, margin:'4px 0 0' }}>
              {event.price_from === 0 ? '\uD83C\uDD13 مجاني' : `من ${event.price_from} ر.س`}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── Main Catalog ────────────────────────────────────────────────────────
export default function OrgCatalogClient({ org, upcoming, past }: {
  org: OrgType; upcoming: EventType[]; past: EventType[]
}) {
  const accent = org.accent_color || '#F05537'
  const [cat, setCat] = useState('all')

  const usedCats = useMemo(() => {
    const used = new Set([...upcoming, ...past].map(e => e.category).filter(Boolean) as string[])
    return CATEGORIES.filter(c => c.key === 'all' || used.has(c.key))
  }, [upcoming, past])

  const filtUp  = useMemo(() => cat === 'all' ? upcoming : upcoming.filter(e => e.category === cat), [upcoming, cat])
  const filtPast = useMemo(() => cat === 'all' ? past    : past.filter(e => e.category === cat),    [past, cat])

  const sliderEvs = useMemo(() => {
    const featured = upcoming.filter(e => e.is_featured && e.cover_image)
    return featured.length > 0 ? featured : upcoming.filter(e => e.cover_image).slice(0, 5)
  }, [upcoming])

  const orgName = org.name_ar || org.name

  return (
    <div style={{ minHeight:'100vh', background:'#F4F2F8', direction:'rtl', fontFamily:'Tajawal, sans-serif' }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1E0A3C 0%,#2D1550 100%)', padding:'20px 20px 0' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>

          {/* Org info */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
            {org.logo_url
              ? <img src={org.logo_url} alt={orgName} style={{ width:56, height:56, borderRadius:12, objectFit:'cover', border:'2px solid rgba(255,255,255,0.2)' }}/>
              : <div style={{ width:56, height:56, background:accent, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'#fff', fontWeight:900, flexShrink:0 }}>{orgName[0]}</div>
            }
            <div style={{ flex:1, minWidth:0 }}>
              <h1 style={{ color:'#fff', fontSize:21, fontWeight:900, margin:0 }}>{orgName}</h1>
              {org.tagline && <p style={{ color:'rgba(255,255,255,0.65)', fontSize:12, margin:'3px 0 0' }}>{org.tagline}</p>}
              {org.city && <p style={{ color:'rgba(255,255,255,0.45)', fontSize:11, margin:'2px 0 0' }}>\uD83D\uDCCD {org.city}</p>}
            </div>
            <div style={{ display:'flex', gap:8, flexShrink:0 }}>
              {org.social_whatsapp && (
                <a href={`https://wa.me/${org.social_whatsapp}`} target="_blank" rel="noopener"
                   style={{ width:34, height:34, background:'#25D366', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', fontSize:16 }}>\uD83D\uDCAC</a>
              )}
              {org.social_instagram && (
                <a href={`https://instagram.com/${org.social_instagram}`} target="_blank" rel="noopener"
                   style={{ width:34, height:34, background:'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', fontSize:16 }}>\uD83D\uDCF7</a>
              )}
              {org.social_twitter && (
                <a href={`https://x.com/${org.social_twitter}`} target="_blank" rel="noopener"
                   style={{ width:34, height:34, background:'#000', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', color:'#fff', fontWeight:700, fontSize:13 }}>X</a>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:20, paddingBottom:14, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <span style={{ color:'#fff', fontWeight:800, fontSize:18 }}>{upcoming.length}</span>
              <span style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginRight:5 }}>فعالية قادمة</span>
            </div>
            <div>
              <span style={{ color:'#fff', fontWeight:800, fontSize:18 }}>{past.length}</span>
              <span style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginRight:5 }}>فعالية سابقة</span>
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ display:'flex', gap:4, overflowX:'auto', padding:'12px 0', scrollbarWidth:'none' as any }}>
            {usedCats.map(c => (
              <button key={c.key} onClick={() => setCat(c.key)} style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                padding:'8px 14px', borderRadius:10, border:'none', cursor:'pointer',
                background:cat===c.key ? accent : 'rgba(255,255,255,0.08)',
                color:cat===c.key ? '#fff' : 'rgba(255,255,255,0.65)',
                fontWeight:cat===c.key ? 700 : 400, fontSize:11,
                fontFamily:'Tajawal, sans-serif', transition:'all 0.15s', flexShrink:0,
              }}>
                <span style={{ fontSize:20 }}>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Slider */}
      {sliderEvs.length > 0 && cat === 'all' && (
        <HeroSlider events={sliderEvs} accent={accent}/>
      )}

      {/* Content */}
      <div style={{ maxWidth:960, margin:'0 auto', padding:'20px 16px 60px' }}>

        {/* Upcoming */}
        {filtUp.length > 0 && (
          <section style={{ marginBottom:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h2 style={{ fontSize:18, fontWeight:800, color:'#1E0A3C', margin:0 }}>
                {cat === 'all' ? '\uD83D\uDDD3\uFE0F الفعاليات القادمة' : `${usedCats.find(c=>c.key===cat)?.icon||''} ${usedCats.find(c=>c.key===cat)?.label||''}`}
              </h2>
              <span style={{ fontSize:12, color:'#6F7287' }}>{filtUp.length} فعالية</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:14 }}>
              {filtUp.map(ev => <EventCard key={ev.id} event={ev} accent={accent}/>)}
            </div>
          </section>
        )}

        {filtUp.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 16px' }}>
            <div style={{ fontSize:48, marginBottom:10 }}>\uD83D\uDDD3\uFE0F</div>
            <p style={{ fontSize:15, fontWeight:700, color:'#1E0A3C', margin:'0 0 4px' }}>لا توجد فعاليات قادمة في هذا التصنيف</p>
            <p style={{ fontSize:13, color:'#6F7287' }}>جرّب تصنيفاً آخر أو عد لاحقاً</p>
          </div>
        )}

        {/* Past */}
        {filtPast.length > 0 && (
          <section>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <h2 style={{ fontSize:18, fontWeight:800, color:'#1E0A3C', margin:0 }}>\uD83D\uDCC2 الفعاليات السابقة</h2>
              <span style={{ fontSize:11, background:'#EDE9F7', color:'#5B3FA0', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>{filtPast.length}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
              {filtPast.map(ev => <EventCard key={ev.id} event={ev} accent={accent} small/>)}
            </div>
          </section>
        )}

        {upcoming.length === 0 && past.length === 0 && (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <div style={{ fontSize:56, marginBottom:12 }}>\uD83C\uDFAA</div>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#1E0A3C', margin:'0 0 8px' }}>لا توجد فعاليات بعد</h2>
            <p style={{ color:'#6F7287', fontSize:14 }}>تابع هذا المنظم لتكون أول من يعرف بفعالياته القادمة</p>
            {org.social_whatsapp && (
              <a href={`https://wa.me/${org.social_whatsapp}`} target="_blank" rel="noopener"
                 style={{ display:'inline-block', marginTop:16, padding:'12px 28px', background:'#25D366', borderRadius:10, color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none' }}>
                \uD83D\uDCAC تواصل معنا
              </a>
            )}
          </div>
        )}

      </div>

      {/* Footer */}
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
