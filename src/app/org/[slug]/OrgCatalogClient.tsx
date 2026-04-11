'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'

// ── LOCKED COLORS ─────────────────────────────────────────────────────
const C = {
  orange:    '#F97316',
  white:     '#FFFFFF',
  navy:      '#1E1B4B',
  navyDark:  '#17153a',
  grayBg:    '#F9FAFB',
  textDark:  '#111827',
  textMuted: '#6B7280',
  green:     '#22C55E',
  border:    '#E5E7EB',
  borderLt:  '#F3F4F6',
}

// ── SVG Category Icons ────────────────────────────────────────────────
const Ic = {
  All:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>,
  Mtn:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M3 20l7-14 3.5 7 2.5-4 5 11H3z"/></svg>,
  Run:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="12" cy="4" r="1.5"/><path d="m8 21 2-6 3 2 2-4M7 12l2-3 4 2 3-4M16 7l2 3"/></svg>,
  Tent: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M12 2L2 21h20L12 2z"/><path d="M12 2L7 21M12 2l5 19M4 15h16"/></svg>,
  Bag:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M12 12v6M9 15h6"/></svg>,
  Mic:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  Book: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Food: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  Art:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  ChR:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>,
  ChL:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>,
  Inst: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>,
  X:    ()=><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  Wa:   ()=><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>,
  Loc:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Cal2: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>,
  Star: ()=><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
}

const CATS = [
  { key:'all',             IC:Ic.All,  label:'الكل'   },
  { key:'رحلات ومغامرات',  IC:Ic.Mtn,  label:'رحلات'  },
  { key:'رياضة ونشاط',    IC:Ic.Run,  label:'رياضة'  },
  { key:'مخيمات',          IC:Ic.Tent, label:'مخيمات' },
  { key:'أعمال وتقنية',   IC:Ic.Bag,  label:'أعمال'  },
  { key:'موسيقى وفنون',   IC:Ic.Mic,  label:'فنون'   },
  { key:'تعليم وتطوير',   IC:Ic.Book, label:'تعليم'  },
  { key:'طعام وترفيه',    IC:Ic.Food, label:'طعام'   },
  { key:'ثقافة ومجتمع',   IC:Ic.Art,  label:'ثقافة'  },
]

const CLIENTS = [
  'Saudi Tourism Authority','EY','misk Foundation','lululemon',
  'Riyadh Airports','KPMG','Red Sea Global','Four Seasons',
  'Bosch','elm','Al Jomaih','Museums Commission',
]

type Org = {
  id:string; name:string; name_ar:string|null; tagline:string|null; slug:string|null
  logo_url:string|null; cover_image:string|null; city:string|null
  social_instagram:string|null; social_twitter:string|null; social_whatsapp:string|null
  accent_color:string|null; description:string|null
}
type Ev = {
  id:string; title:string; description:string|null; cover_image:string|null
  start_date:string; end_date:string|null; location:string|null
  category:string|null; category_icon:string|null; is_featured:boolean|null
  price_from:number|null; slug:string|null
}

// ── Hero Slider ────────────────────────────────────────────────────────
function HeroSlider({ events }: { events: Ev[] }) {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(false)
  const tmr = useRef<NodeJS.Timeout>()
  const pool = events.filter(e => e.cover_image)
  if (!pool.length) return null

  const go = (i: number) => {
    setFade(true)
    setTimeout(() => { setIdx(i); setFade(false) }, 250)
  }

  useEffect(() => {
    if (pool.length < 2) return
    tmr.current = setInterval(() => go((idx + 1) % pool.length), 5000)
    return () => clearInterval(tmr.current)
  }, [idx, pool.length])

  const ev = pool[idx]
  const d = new Date(ev.start_date).toLocaleDateString('ar-SA', { weekday:'short', month:'long', day:'numeric' })

  return (
    <div style={{ position:'relative', height:440, overflow:'hidden', background:C.navyDark }}>
      {/* Image */}
      <img src={ev.cover_image!} alt="" style={{
        position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover',
        opacity: fade ? 0 : 0.65,
        transform: fade ? 'scale(1.03)' : 'scale(1)',
        transition:'opacity 0.28s, transform 0.28s',
      }}/>
      {/* Overlay — navy-based gradient, no alien colors */}
      <div style={{position:'absolute',inset:0,background:`linear-gradient(to top, ${C.navyDark}EE 0%, ${C.navyDark}99 40%, ${C.navyDark}33 100%)`}}/>
      <div style={{position:'absolute',inset:0,background:`linear-gradient(to right, ${C.navyDark}CC 0%, transparent 60%)`}}/>

      {/* Content */}
      <div style={{
        position:'absolute', bottom:0, right:0, left:0,
        padding:'28px 40px 36px', maxWidth:700,
        opacity: fade ? 0 : 1, transition:'opacity 0.28s',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, flexWrap:'wrap' }}>
          {ev.is_featured && (
            <span style={{ display:'flex', alignItems:'center', gap:4, background:C.orange, color:C.white, fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, letterSpacing:'.03em' }}>
              <span style={{width:10,height:10,color:C.white}}><Ic.Star/></span> مميز
            </span>
          )}
          {ev.category && (
            <span style={{ background:'rgba(255,255,255,.15)', backdropFilter:'blur(8px)', color:C.white, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, border:'1px solid rgba(255,255,255,.2)' }}>
              {ev.category_icon||'🗓️'} {ev.category}
            </span>
          )}
        </div>
        <h2 style={{ color:C.white, fontSize:32, fontWeight:900, margin:'0 0 10px', lineHeight:1.22, letterSpacing:'-.4px' }}>
          {ev.title}
        </h2>
        <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
          <span style={{ display:'flex', alignItems:'center', gap:5, color:'rgba(255,255,255,.7)', fontSize:12 }}>
            <span style={{width:14,height:14}}><Ic.Cal2/></span> {d}
          </span>
          {ev.location && <span style={{ display:'flex', alignItems:'center', gap:5, color:'rgba(255,255,255,.7)', fontSize:12 }}>
            <span style={{width:14,height:14}}><Ic.Loc/></span> {ev.location.split('،')[0]}
          </span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Link href={`/events/${ev.id}`} style={{
            padding:'11px 28px', background:C.orange, borderRadius:8, color:C.white,
            fontWeight:800, fontSize:14, textDecoration:'none', display:'inline-block',
            boxShadow:`0 4px 18px ${C.orange}66`,
          }}>
            احجز الآن ←
          </Link>
          {ev.price_from != null && (
            <span style={{ color:C.white, fontSize:14, fontWeight:700, opacity:.9 }}>
              {ev.price_from === 0 ? '🆓 مجاني' : `من ${ev.price_from} ر.س`}
            </span>
          )}
        </div>
      </div>

      {/* Pagination dots */}
      {pool.length > 1 && (
        <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6, alignItems:'center' }}>
          {pool.map((_,i) => (
            <button key={i} onClick={() => go(i)} style={{
              width: i === idx ? 24 : 7, height:7, borderRadius:50, border:'none', cursor:'pointer', padding:0,
              background: i === idx ? C.orange : 'rgba(255,255,255,.35)',
              transition:'all .3s',
            }}/>
          ))}
        </div>
      )}

      {/* Nav arrows — webook style */}
      {pool.length > 1 && (
        <>
          <button onClick={() => go((idx - 1 + pool.length) % pool.length)} style={{
            position:'absolute', top:'50%', right:16, transform:'translateY(-50%)',
            width:40, height:40, borderRadius:'50%', background:C.white, border:'none',
            color:C.textDark, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 2px 12px rgba(0,0,0,.2)',
          }}>
            <span style={{width:18,height:18}}><Ic.ChR/></span>
          </button>
          <button onClick={() => go((idx + 1) % pool.length)} style={{
            position:'absolute', top:'50%', left:16, transform:'translateY(-50%)',
            width:40, height:40, borderRadius:'50%', background:C.white, border:'none',
            color:C.textDark, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 2px 12px rgba(0,0,0,.2)',
          }}>
            <span style={{width:18,height:18}}><Ic.ChL/></span>
          </button>
        </>
      )}
    </div>
  )
}

// ── Category Filter — webook icon grid layout ─────────────────────────
function CategoryBar({ cats, active, onSel }: { cats:typeof CATS; active:string; onSel:(k:string)=>void }) {
  return (
    <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, overflowX:'auto', scrollbarWidth:'none' }}>
      <div style={{ display:'flex', gap:0, padding:'0 16px', width:'max-content', maxWidth:'100%' }}>
        {cats.map(c => {
          const on = c.key === active
          return (
            <button key={c.key} onClick={() => onSel(c.key)} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              padding:'14px 20px', border:'none', cursor:'pointer', background:'transparent',
              color: on ? C.orange : C.textMuted,
              fontFamily:'Tajawal,sans-serif', fontSize:11, fontWeight: on ? 700 : 400,
              transition:'color .15s', position:'relative', flexShrink:0, minWidth:68,
            }}>
              <div style={{ width:24, height:24, transition:'color .15s' }}><c.IC/></div>
              <span style={{ whiteSpace:'nowrap' }}>{c.label}</span>
              {/* webook-style active underline */}
              <div style={{
                position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)',
                width: on ? 28 : 0, height:2.5, background:C.orange, borderRadius:50,
                transition:'width .2s',
              }}/>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Clients marquee ───────────────────────────────────────────────────
function ClientsMarquee({ names }: { names: string[] }) {
  const row = [...names, ...names, ...names]
  return (
    <div style={{ background:C.white, borderBottom:`1px solid ${C.borderLt}`, padding:'18px 0' }}>
      <p style={{ color:C.textMuted, fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', textAlign:'center', marginBottom:12 }}>يثقون بنا</p>
      <div style={{ overflow:'hidden' }}>
        <div style={{ display:'flex', gap:12, animation:'marquee 30s linear infinite', width:'max-content' }}>
          {row.map((n, i) => (
            <div key={i} style={{
              padding:'6px 18px', borderRadius:6, border:`1px solid ${C.border}`,
              background:C.grayBg, color:C.textMuted, fontSize:11, fontWeight:600,
              whiteSpace:'nowrap', flexShrink:0,
            }}>{n}</div>
          ))}
        </div>
      </div>
      <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-33.33%)}}`}</style>
    </div>
  )
}

// ── Event Card — webook proportions ───────────────────────────────────
function EventCard({ ev, size='normal' }: { ev:Ev; size?:'normal'|'small' }) {
  const d   = new Date(ev.start_date).toLocaleDateString('ar-SA', size==='normal' ? { weekday:'short', month:'short', day:'numeric' } : { month:'short', day:'numeric' })
  const loc = ev.location?.split('،')[0]
  const [hov, setHov] = useState(false)
  const isSmall = size === 'small'

  return (
    <Link href={`/events/${ev.id}`} style={{ textDecoration:'none', display:'block', flexShrink:0, width: isSmall ? 180 : 280 }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          background:C.white, borderRadius:12, overflow:'hidden',
          border:`1px solid ${hov ? C.border : C.borderLt}`,
          boxShadow: hov ? '0 8px 24px rgba(0,0,0,.09)' : '0 1px 4px rgba(0,0,0,.05)',
          transform: hov ? 'translateY(-4px)' : 'none',
          transition:'all .2s', cursor:'pointer',
        }}
      >
        {/* Image container */}
        <div style={{ position:'relative', height: isSmall ? 120 : 180, background:C.grayBg, overflow:'hidden' }}>
          {ev.cover_image ? (
            <img src={ev.cover_image} alt="" style={{
              width:'100%', height:'100%', objectFit:'cover', display:'block',
              transform: hov ? 'scale(1.04)' : 'scale(1)', transition:'transform .4s',
            }}/>
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize: isSmall ? 28 : 40, opacity:.25 }}>{ev.category_icon||'🗓️'}</span>
            </div>
          )}
          {/* Price badge — top left */}
          {ev.price_from != null && (
            <div style={{ position:'absolute', top:10, left:10 }}>
              <span style={{
                background: ev.price_from === 0 ? C.green : C.orange,
                color:C.white, fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20,
              }}>
                {ev.price_from === 0 ? 'مجاني' : `${ev.price_from} ر.س`}
              </span>
            </div>
          )}
          {/* Featured badge — top right */}
          {ev.is_featured && !isSmall && (
            <div style={{ position:'absolute', top:10, right:10 }}>
              <span style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(249,115,22,.9)', color:C.white, fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:20 }}>
                <span style={{width:9,height:9}}><Ic.Star/></span> مميز
              </span>
            </div>
          )}
          {/* Category pill — bottom */}
          {ev.category && !isSmall && (
            <div style={{ position:'absolute', bottom:10, right:10 }}>
              <span style={{ background:'rgba(255,255,255,.92)', color:C.textDark, fontSize:10, fontWeight:600, padding:'3px 9px', borderRadius:20, border:`1px solid ${C.border}` }}>
                {ev.category_icon||'🗓️'} {ev.category}
              </span>
            </div>
          )}
        </div>

        {/* Card body */}
        <div style={{ padding: isSmall ? '10px 12px' : '14px 16px' }}>
          <h3 style={{
            fontSize: isSmall ? 11 : 14, fontWeight:700, color:C.textDark,
            margin:'0 0 7px', lineHeight:1.35,
            display:'-webkit-box', overflow:'hidden', WebkitLineClamp: isSmall ? 1 : 2, WebkitBoxOrient:'vertical',
          }}>{ev.title}</h3>

          {!isSmall && (
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <span style={{ display:'flex', alignItems:'center', gap:5, color:C.textMuted, fontSize:11 }}>
                <span style={{width:12,height:12,flexShrink:0}}><Ic.Cal2/></span> {d}
              </span>
              {loc && <span style={{ display:'flex', alignItems:'center', gap:5, color:C.textMuted, fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                <span style={{width:12,height:12,flexShrink:0}}><Ic.Loc/></span> {loc}
              </span>}
            </div>
          )}

          {isSmall && (
            <span style={{ display:'flex', alignItems:'center', gap:4, color:C.textMuted, fontSize:10 }}>
              <span style={{width:11,height:11}}><Ic.Cal2/></span> {d}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── Horizontal Carousel — webook layout ───────────────────────────────
function Carousel({ title, subtitle, events, size='normal' }: { title:string; subtitle?:string; events:Ev[]; size?:'normal'|'small' }) {
  const ref = useRef<HTMLDivElement>(null)
  if (!events.length) return null
  const scroll = (d: 'r'|'l') => ref.current?.scrollBy({ left: d==='r' ? -600 : 600, behavior:'smooth' })

  return (
    <section style={{ padding:'32px 0', borderBottom:`1px solid ${C.borderLt}` }}>
      {/* Section header — webook spacing */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', padding:'0 28px', marginBottom:18 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800, color:C.textDark, margin:0, letterSpacing:'-.3px' }}>{title}</h2>
          {subtitle && <p style={{ fontSize:12, color:C.textMuted, margin:'3px 0 0' }}>{subtitle}</p>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {(['r','l'] as const).map(d => (
            <button key={d} onClick={() => scroll(d)} style={{
              width:34, height:34, borderRadius:'50%', border:`1px solid ${C.border}`,
              background:C.white, color:C.textDark, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'background .15s, border-color .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.grayBg; (e.currentTarget as HTMLElement).style.borderColor = C.textMuted }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.white; (e.currentTarget as HTMLElement).style.borderColor = C.border }}>
              <span style={{width:14,height:14}}>{d==='r'?<Ic.ChR/>:<Ic.ChL/>}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Scrollable row */}
      <div ref={ref} style={{
        display:'flex', gap:14, overflowX:'auto', padding:'4px 28px 8px',
        scrollbarWidth:'none', scrollSnapType:'x mandatory',
      }}>
        {events.map(ev => <EventCard key={ev.id} ev={ev} size={size}/>)}
      </div>
    </section>
  )
}

// ── Past events grid (small cards) ────────────────────────────────────
function PastGrid({ events }: { events: Ev[] }) {
  if (!events.length) return null
  return (
    <section style={{ padding:'28px 28px 36px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:C.textDark, margin:0 }}>الأرشيف</h2>
        <span style={{ fontSize:12, color:C.textMuted, background:C.grayBg, padding:'3px 10px', borderRadius:20, border:`1px solid ${C.border}` }}>{events.length} فعالية</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))', gap:12 }}>
        {events.map(ev => <EventCard key={ev.id} ev={ev} size="small"/>)}
      </div>
    </section>
  )
}

// ── Main Client Component ──────────────────────────────────────────────
export default function OrgCatalogClient({ org, upcoming, past }: { org:Org; upcoming:Ev[]; past:Ev[] }) {
  const [cat, setCat] = useState('all')
  const isAmala = org.slug === 'amala-tours'

  const usedCats = useMemo(() => {
    const keys = new Set([...upcoming, ...past].map(e => e.category).filter(Boolean))
    return CATS.filter(c => c.key === 'all' || keys.has(c.key))
  }, [upcoming, past])

  const upFiltered   = useMemo(() => cat === 'all' ? upcoming : upcoming.filter(e => e.category === cat), [upcoming, cat])
  const pastFiltered = useMemo(() => cat === 'all' ? past : past.filter(e => e.category === cat), [past, cat])
  const featured     = useMemo(() => upcoming.filter(e => e.is_featured && e.cover_image), [upcoming])
  const sliderPool   = featured.length ? featured : upcoming.filter(e => e.cover_image).slice(0, 5)

  return (
    <div style={{ minHeight:'100vh', background:C.grayBg, direction:'rtl', fontFamily:'Tajawal,sans-serif' }}>

      {/* ── STICKY HEADER — webook spacing ──────────────────── */}
      <header style={{
        position:'sticky', top:0, background:C.white, zIndex:100,
        borderBottom:`1px solid ${C.border}`,
        boxShadow:'0 1px 8px rgba(0,0,0,.06)',
      }}>
        <div style={{ maxWidth:1300, margin:'0 auto', padding:'0 24px', height:64, display:'flex', alignItems:'center', gap:16 }}>
          {/* Logo */}
          {org.logo_url ? (
            <img src={org.logo_url} alt="" style={{ width:38, height:38, borderRadius:9, objectFit:'cover', border:`1px solid ${C.border}`, flexShrink:0 }}/>
          ) : (
            <div style={{ width:38, height:38, background:C.navy, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', color:C.white, fontWeight:900, fontSize:18, flexShrink:0 }}>
              {(org.name_ar || org.name)[0]}
            </div>
          )}

          {/* Name + tagline */}
          <div style={{ flex:1, minWidth:0 }}>
            <h1 style={{ fontSize:16, fontWeight:800, color:C.textDark, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {org.name_ar || org.name}
            </h1>
            {org.tagline && <p style={{ fontSize:11, color:C.textMuted, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{org.tagline}</p>}
          </div>

          {/* Nav links — webook style */}
          <nav style={{ display:'flex', gap:4, alignItems:'center' }}>
            {[['الفعاليات', '#events'], ['السابقة', '#past']].map(([l, h]) => (
              <a key={l} href={h} style={{
                padding:'7px 14px', borderRadius:8, color:C.textMuted, fontSize:13,
                fontWeight:500, textDecoration:'none', fontFamily:'Tajawal,sans-serif',
                transition:'color .15s, background .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.textDark; (e.currentTarget as HTMLElement).style.background = C.grayBg }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.textMuted; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                {l}
              </a>
            ))}
          </nav>

          {/* Social icons — webook sizing */}
          <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
            {org.social_whatsapp && (
              <a href={`https://wa.me/${org.social_whatsapp}`} target="_blank" rel="noopener"
                style={{ width:36, height:36, borderRadius:8, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:'#25D366', textDecoration:'none', background:C.white }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.grayBg}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.white}>
                <span style={{width:18,height:18}}><Ic.Wa/></span>
              </a>
            )}
            {org.social_instagram && (
              <a href={`https://instagram.com/${org.social_instagram}`} target="_blank" rel="noopener"
                style={{ width:36, height:36, borderRadius:8, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:C.textMuted, textDecoration:'none', background:C.white }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.grayBg}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.white}>
                <span style={{width:18,height:18}}><Ic.Inst/></span>
              </a>
            )}
            {org.social_twitter && (
              <a href={`https://x.com/${org.social_twitter}`} target="_blank" rel="noopener"
                style={{ width:36, height:36, borderRadius:8, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:C.textDark, textDecoration:'none', background:C.white }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.grayBg}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.white}>
                <span style={{width:17,height:17}}><Ic.X/></span>
              </a>
            )}
          </div>
        </div>

        {/* Category bar — attached to header bottom */}
        {usedCats.length > 1 && <CategoryBar cats={usedCats} active={cat} onSel={setCat}/>}
      </header>

      {/* ── HERO SLIDER ─────────────────────────────────────── */}
      {sliderPool.length > 0 && cat === 'all' && <HeroSlider events={sliderPool}/>}

      {/* ── ORG STATS STRIP ─────────────────────────────────── */}
      <div id="events" style={{
        background:C.white, borderBottom:`1px solid ${C.border}`,
        padding:'14px 28px', display:'flex', alignItems:'center', gap:32, flexWrap:'wrap',
      }}>
        <div style={{ display:'flex', gap:28 }}>
          {[
            { v: upcoming.length, l:'فعالية قادمة' },
            { v: past.length,     l:'فعالية سابقة' },
          ].map(s => (
            <div key={s.l} style={{ display:'flex', alignItems:'baseline', gap:5 }}>
              <span style={{ fontSize:22, fontWeight:800, color:C.navy }}>{s.v}</span>
              <span style={{ fontSize:12, color:C.textMuted }}>{s.l}</span>
            </div>
          ))}
        </div>
        {org.tagline && <p style={{ color:C.textMuted, fontSize:13, margin:0, flex:1 }}>{org.tagline}</p>}
        {/* Follow CTA — webook style */}
        {org.social_instagram && (
          <a href={`https://instagram.com/${org.social_instagram}`} target="_blank" rel="noopener"
            style={{
              display:'flex', alignItems:'center', gap:8, textDecoration:'none',
              border:`1px solid ${C.border}`, borderRadius:8, padding:'7px 16px',
              background:C.white, transition:'background .15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.grayBg}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.white}>
            <span style={{width:16,height:16,color:C.textMuted}}><Ic.Inst/></span>
            <span style={{fontSize:12,color:C.textMuted}}>@{org.social_instagram}</span>
            <span style={{background:C.orange,color:C.white,fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:6}}>تابع</span>
          </a>
        )}
      </div>

      {/* ── CLIENTS MARQUEE ─────────────────────────────────── */}
      {isAmala && <ClientsMarquee names={CLIENTS}/>}

      {/* ── EVENTS CONTENT ──────────────────────────────────── */}
      <div style={{ maxWidth:1300, margin:'0 auto', background:C.white }}>

        {upFiltered.length > 0 ? (
          <Carousel
            title={cat === 'all' ? 'الفعاليات القادمة' : (CATS.find(c => c.key === cat)?.label || cat)}
            subtitle={cat === 'all' ? `${upFiltered.length} فعالية متاحة` : undefined}
            events={upFiltered}
          />
        ) : (
          <div style={{ padding:'60px 28px', textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:10 }}>🗓️</div>
            <p style={{ fontSize:16, fontWeight:700, color:C.textDark, margin:'0 0 6px' }}>لا توجد فعاليات في هذا التصنيف</p>
            <p style={{ fontSize:13, color:C.textMuted }}>جرّب تصنيفاً آخر</p>
          </div>
        )}

        {/* Past section */}
        <div id="past">
          <PastGrid events={pastFiltered}/>
        </div>

      </div>

      {/* ── FOOTER — webook column layout ───────────────────── */}
      <footer style={{ background:C.navy, color:C.white, padding:'36px 28px 24px', marginTop:0 }}>
        <div style={{ maxWidth:1300, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:32, marginBottom:28, flexWrap:'wrap' }}>
            {/* Col 1 — Brand */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                {org.logo_url ? (
                  <img src={org.logo_url} alt="" style={{ width:32, height:32, borderRadius:7, objectFit:'cover', border:'1px solid rgba(255,255,255,.15)' }}/>
                ) : (
                  <div style={{ width:32, height:32, background:C.orange, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:16 }}>
                    {(org.name_ar || org.name)[0]}
                  </div>
                )}
                <span style={{ fontWeight:800, fontSize:15, letterSpacing:'-.2px' }}>{org.name_ar || org.name}</span>
              </div>
              {org.tagline && <p style={{ color:'rgba(255,255,255,.5)', fontSize:12, lineHeight:1.6, margin:'0 0 14px', maxWidth:280 }}>{org.tagline}</p>}
              {/* Social icons in footer — webook sizing */}
              <div style={{ display:'flex', gap:8 }}>
                {org.social_instagram && (
                  <a href={`https://instagram.com/${org.social_instagram}`} target="_blank" rel="noopener"
                    style={{ width:34, height:34, borderRadius:7, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.6)', textDecoration:'none' }}>
                    <span style={{width:17,height:17}}><Ic.Inst/></span>
                  </a>
                )}
                {org.social_twitter && (
                  <a href={`https://x.com/${org.social_twitter}`} target="_blank" rel="noopener"
                    style={{ width:34, height:34, borderRadius:7, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.6)', textDecoration:'none' }}>
                    <span style={{width:16,height:16}}><Ic.X/></span>
                  </a>
                )}
                {org.social_whatsapp && (
                  <a href={`https://wa.me/${org.social_whatsapp}`} target="_blank" rel="noopener"
                    style={{ width:34, height:34, borderRadius:7, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#25D366', textDecoration:'none' }}>
                    <span style={{width:17,height:17}}><Ic.Wa/></span>
                  </a>
                )}
              </div>
            </div>

            {/* Col 2 — Quick links */}
            <div>
              <h4 style={{ color:'rgba(255,255,255,.4)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', margin:'0 0 14px' }}>روابط سريعة</h4>
              {['الفعاليات القادمة','الأرشيف','تواصل معنا'].map(l => (
                <p key={l} style={{ margin:'0 0 9px' }}>
                  <a href="#" style={{ color:'rgba(255,255,255,.55)', fontSize:13, textDecoration:'none', fontFamily:'Tajawal,sans-serif' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.white}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.55)'}>
                    {l}
                  </a>
                </p>
              ))}
            </div>

            {/* Col 3 — Contact */}
            <div>
              <h4 style={{ color:'rgba(255,255,255,.4)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', margin:'0 0 14px' }}>تواصل</h4>
              {org.social_whatsapp && (
                <p style={{ display:'flex', alignItems:'center', gap:7, color:'rgba(255,255,255,.55)', fontSize:12, margin:'0 0 9px' }}>
                  <span style={{width:14,height:14,color:'#25D366'}}><Ic.Wa/></span>
                  {org.social_whatsapp}
                </p>
              )}
              {org.city && (
                <p style={{ display:'flex', alignItems:'center', gap:7, color:'rgba(255,255,255,.55)', fontSize:12, margin:0 }}>
                  <span style={{width:14,height:14}}><Ic.Loc/></span>
                  {org.city}، المملكة العربية السعودية
                </p>
              )}
            </div>
          </div>

          {/* Footer bottom bar */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,.07)', paddingTop:18, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
            <p style={{ color:'rgba(255,255,255,.25)', fontSize:11, margin:0 }}>
              © {new Date().getFullYear()} {org.name_ar || org.name}. جميع الحقوق محفوظة.
            </p>
            <p style={{ color:'rgba(255,255,255,.2)', fontSize:11, margin:0 }}>
              مدعوم بـ <span style={{ color:C.orange, fontWeight:700 }}>EventVMS</span>
            </p>
          </div>
        </div>
      </footer>

      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
    </div>
  )
}
