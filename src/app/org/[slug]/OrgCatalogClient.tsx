'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'

// ── SVG Icons — outline, webook-style ────────────────────────────────
const I = {
  Cal:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>,
  Mtn:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 20l7-14 3.5 7 2.5-4 5 11H3z"/><path d="M17.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"/></svg>,
  Run:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="4" r="1.5"/><path d="m8 21 2-6 3 2 2-4M7 12l2-3 4 2 3-4M16 7l2 3"/></svg>,
  Tent: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 21h20L12 2z"/><path d="M12 2L7 21M12 2l5 19M4 15h16"/></svg>,
  Bag:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M12 12v6M9 15h6"/></svg>,
  Mic:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  Book: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Food: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  ChR:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  ChL:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  MapPin: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Inst: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>,
  X:    ()=><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  Wa:   ()=><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>,
}

const CATS = [
  { key:'all',             Ic:I.Cal,  label:'الكل'   },
  { key:'رحلات ومغامرات',  Ic:I.Mtn,  label:'رحلات'  },
  { key:'رياضة ونشاط',    Ic:I.Run,  label:'رياضة'  },
  { key:'مخيمات',          Ic:I.Tent, label:'مخيمات' },
  { key:'أعمال وتقنية',   Ic:I.Bag,  label:'أعمال'  },
  { key:'موسيقى وفنون',   Ic:I.Mic,  label:'فنون'   },
  { key:'تعليم وتطوير',   Ic:I.Book, label:'تعليم'  },
  { key:'طعام وترفيه',    Ic:I.Food, label:'طعام'   },
]

const AMALA_CLIENTS = [
  'Saudi Tourism Authority','EY','misk','lululemon','Riyadh Airports',
  'KPMG','Red Sea Global','Four Seasons','Bosch','elm',
]

type Org = {
  id:string; name:string; name_ar:string|null; tagline:string|null; slug:string|null
  logo_url:string|null; cover_image:string|null; city:string|null
  social_instagram:string|null; social_twitter:string|null; social_whatsapp:string|null
  accent_color:string|null; website:string|null; description:string|null
}
type Ev = {
  id:string; title:string; description:string|null; cover_image:string|null
  start_date:string; end_date:string|null; location:string|null
  category:string|null; category_icon:string|null; is_featured:boolean|null
  price_from:number|null; slug:string|null
}

// ── Hero Slider — webook structure, EventVMS colors ───────────────────
function Hero({ events }: { events:Ev[] }) {
  const [idx, setIdx] = useState(0)
  const [fading, setFading] = useState(false)
  const timer = useRef<NodeJS.Timeout>()
  const pool = events.filter(e => e.cover_image)
  if (!pool.length) return null

  const go = (i:number) => {
    setFading(true)
    setTimeout(()=>{ setIdx(i); setFading(false) }, 280)
  }

  useEffect(()=>{
    if (pool.length < 2) return
    timer.current = setInterval(()=> go((idx+1)%pool.length), 5000)
    return ()=> clearInterval(timer.current)
  },[idx, pool.length])

  const ev = pool[idx]
  const dateStr = new Date(ev.start_date).toLocaleDateString('ar-SA',{weekday:'short',month:'long',day:'numeric'})
  const loc = ev.location?.split('،')[0]

  return (
    <div style={{position:'relative', height:460, overflow:'hidden', background:'#1E1B4B'}}>
      {/* Image with overlay */}
      <img src={ev.cover_image!} alt="" style={{
        position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover',
        opacity: fading ? 0 : 0.55, transition:'opacity 0.3s ease',
      }}/>
      {/* Deep gradient — navy to transparent */}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(100deg, #1E1B4B 0%, rgba(30,27,75,0.82) 45%, rgba(30,27,75,0.25) 100%)'}}/>

      {/* Text content — right side (RTL) */}
      <div style={{position:'absolute',top:0,right:0,bottom:0,width:'55%',display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 48px',opacity:fading?0:1,transition:'opacity 0.28s'}}>
        {/* Category + date pills */}
        <div style={{display:'flex',gap:10,marginBottom:18,alignItems:'center',flexWrap:'wrap'}}>
          {ev.category && <span style={{background:'#F97316',color:'#FFFFFF',fontSize:11,fontWeight:700,padding:'4px 13px',borderRadius:20,letterSpacing:'.04em'}}>
            {ev.category_icon||''} {ev.category}
          </span>}
          <span style={{color:'rgba(255,255,255,.65)',fontSize:12,display:'flex',alignItems:'center',gap:5}}>
            <span style={{width:14,height:14,opacity:.7}}><I.Cal/></span>{dateStr}
          </span>
          {loc && <span style={{color:'rgba(255,255,255,.65)',fontSize:12,display:'flex',alignItems:'center',gap:5}}>
            <span style={{width:14,height:14,opacity:.7}}><I.MapPin/></span>{loc}
          </span>}
        </div>

        <h2 style={{color:'#FFFFFF',fontSize:32,fontWeight:900,margin:'0 0 14px',lineHeight:1.22,letterSpacing:'-.4px'}}>
          {ev.title}
        </h2>

        {ev.description && <p style={{color:'rgba(255,255,255,.65)',fontSize:13,margin:'0 0 26px',lineHeight:1.7,display:'-webkit-box',overflow:'hidden',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
          {ev.description}
        </p>}

        <div style={{display:'flex',gap:14,alignItems:'center'}}>
          <Link href={`/events/${ev.id}`} style={{
            padding:'12px 28px',background:'#F97316',borderRadius:10,color:'#FFFFFF',
            fontWeight:800,fontSize:14,textDecoration:'none',letterSpacing:'-.1px',
            boxShadow:'0 6px 22px rgba(249,115,22,.45)',display:'inline-block',
          }}>احجز الآن ←</Link>
          {ev.price_from != null && <span style={{color:'#FFFFFF',fontSize:15,fontWeight:800,opacity:.9}}>
            {ev.price_from===0 ? '🆓 مجاني' : `من ${ev.price_from} ر.س`}
          </span>}
        </div>
      </div>

      {/* Dots navigation */}
      {pool.length > 1 && (
        <div style={{position:'absolute',bottom:22,left:'50%',transform:'translateX(-50%)',display:'flex',gap:8,alignItems:'center'}}>
          {pool.map((_,i)=>(
            <button key={i} onClick={()=>go(i)} style={{
              width:i===idx?26:7, height:7, borderRadius:50, border:'none', cursor:'pointer', padding:0,
              background:i===idx?'#F97316':'rgba(255,255,255,.35)', transition:'all .3s',
            }}/>
          ))}
        </div>
      )}

      {/* Arrow buttons */}
      {pool.length > 1 && <>
        <button onClick={()=>go((idx-1+pool.length)%pool.length)} style={{
          position:'absolute',top:'50%',right:20,transform:'translateY(-50%)',
          width:42,height:42,borderRadius:'50%',background:'rgba(255,255,255,.12)',
          border:'1px solid rgba(255,255,255,.2)',color:'#FFFFFF',cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)',
        }}><span style={{width:18,height:18}}><I.ChR/></span></button>
        <button onClick={()=>go((idx+1)%pool.length)} style={{
          position:'absolute',top:'50%',left:20,transform:'translateY(-50%)',
          width:42,height:42,borderRadius:'50%',background:'rgba(255,255,255,.12)',
          border:'1px solid rgba(255,255,255,.2)',color:'#FFFFFF',cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)',
        }}><span style={{width:18,height:18}}><I.ChL/></span></button>
      </>}
    </div>
  )
}

// ── Category filter bar — webook structure ────────────────────────────
function CatBar({ cats, active, onSel }: { cats:typeof CATS; active:string; onSel:(k:string)=>void }) {
  return (
    <div style={{background:'#FFFFFF',borderBottom:'1px solid #E5E7EB',overflowX:'auto',scrollbarWidth:'none'}}>
      <div style={{display:'flex',gap:0,padding:'0 20px',maxWidth:1200,margin:'0 auto',width:'max-content'}}>
        {cats.map(c=>{
          const on = c.key === active
          return (
            <button key={c.key} onClick={()=>onSel(c.key)} style={{
              display:'flex',flexDirection:'column',alignItems:'center',gap:6,
              padding:'14px 20px',border:'none',cursor:'pointer',
              background:'transparent',fontFamily:'Tajawal,sans-serif',
              color: on ? '#F97316' : '#6B7280',
              position:'relative',transition:'color .15s',flexShrink:0,
            }}
            onMouseEnter={e=>{ if(!on)(e.currentTarget as HTMLElement).style.color='#111827' }}
            onMouseLeave={e=>{ if(!on)(e.currentTarget as HTMLElement).style.color='#6B7280' }}>
              <div style={{width:24,height:24,color:on?'#F97316':'#6B7280',transition:'color .15s'}}><c.Ic/></div>
              <span style={{fontSize:11,fontWeight:on?700:400,whiteSpace:'nowrap'}}>{c.label}</span>
              {on && <div style={{position:'absolute',bottom:0,right:12,left:12,height:2.5,background:'#F97316',borderRadius:'2px 2px 0 0'}}/>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Clients marquee — light background ───────────────────────────────
function Marquee({ clients }: { clients:string[] }) {
  if (!clients.length) return null
  const row = [...clients,...clients,...clients]
  return (
    <div style={{background:'#F9FAFB',borderBottom:'1px solid #E5E7EB',padding:'18px 0'}}>
      <p style={{color:'#6B7280',fontSize:10,fontWeight:700,letterSpacing:'.14em',textTransform:'uppercase',textAlign:'center',margin:'0 0 12px'}}>عملاؤنا</p>
      <div style={{overflow:'hidden'}}>
        <div style={{display:'flex',gap:12,animation:'mq 30s linear infinite',width:'max-content'}}>
          {row.map((c,i)=>(
            <div key={i} style={{
              background:'#FFFFFF',color:'#111827',padding:'7px 20px',borderRadius:8,
              fontSize:12,fontWeight:700,whiteSpace:'nowrap',flexShrink:0,
              border:'1px solid #E5E7EB',boxShadow:'0 1px 3px rgba(0,0,0,.06)',
            }}>{c}</div>
          ))}
        </div>
      </div>
      <style>{`@keyframes mq{from{transform:translateX(0)}to{transform:translateX(-33.33%)}}`}</style>
    </div>
  )
}

// ── Event card — webook proportions, EventVMS colors ─────────────────
function EventCard({ ev }: { ev:Ev }) {
  const dateStr = new Date(ev.start_date).toLocaleDateString('ar-SA',{weekday:'short',month:'short',day:'numeric'})
  const loc = ev.location?.split('،')[0]
  const [hov, setHov] = useState(false)

  return (
    <Link href={`/events/${ev.id}`} style={{textDecoration:'none',display:'block',flexShrink:0,width:280}}>
      <div
        onMouseEnter={()=>setHov(true)}
        onMouseLeave={()=>setHov(false)}
        style={{
          background:'#FFFFFF',borderRadius:14,overflow:'hidden',
          border:'1px solid #E5E7EB',cursor:'pointer',
          boxShadow: hov ? '0 12px 32px rgba(0,0,0,.10)' : '0 2px 8px rgba(0,0,0,.05)',
          transform: hov ? 'translateY(-4px)' : 'none',
          transition:'all .2s ease',
        }}>

        {/* Image container — webook 16:9 proportion */}
        <div style={{position:'relative',height:168,background:'#F9FAFB',overflow:'hidden'}}>
          {ev.cover_image
            ? <img src={ev.cover_image} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block',transform:hov?'scale(1.06)':'scale(1)',transition:'transform .4s ease'}}/>
            : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontSize:44,opacity:.15}}>{ev.category_icon||'🗓️'}</span>
              </div>
          }
          {/* Top badges row */}
          <div style={{position:'absolute',top:10,right:10,left:10,display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:6}}>
            {ev.is_featured && (
              <span style={{background:'#FFFFFF',color:'#F97316',fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:20,boxShadow:'0 1px 4px rgba(0,0,0,.12)'}}>⭐ مميز</span>
            )}
            {ev.price_from != null && (
              <span style={{background:ev.price_from===0?'#22C55E':'#F97316',color:'#FFFFFF',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,marginRight:'auto'}}>
                {ev.price_from===0?'مجاني':ev.price_from+' ر.س'}
              </span>
            )}
          </div>
          {/* Category pill bottom */}
          {ev.category && (
            <div style={{position:'absolute',bottom:10,right:10}}>
              <span style={{background:'rgba(30,27,75,.75)',color:'#FFFFFF',fontSize:10,fontWeight:600,padding:'3px 10px',borderRadius:20,backdropFilter:'blur(4px)'}}>
                {ev.category_icon||''} {ev.category}
              </span>
            </div>
          )}
        </div>

        {/* Card body */}
        <div style={{padding:'14px 16px 16px'}}>
          <h3 style={{fontSize:14,fontWeight:700,color:'#111827',margin:'0 0 10px',lineHeight:1.4,display:'-webkit-box',overflow:'hidden',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
            {ev.title}
          </h3>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{width:13,height:13,color:'#6B7280',flexShrink:0}}><I.Cal/></span>
              <span style={{fontSize:12,color:'#6B7280'}}>{dateStr}</span>
            </div>
            {loc && (
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{width:13,height:13,color:'#6B7280',flexShrink:0}}><I.MapPin/></span>
                <span style={{fontSize:12,color:'#6B7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{loc}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Horizontal Carousel — webook-style ───────────────────────────────
function Carousel({ title, events }: { title:string; events:Ev[] }) {
  const ref = useRef<HTMLDivElement>(null)
  if (!events.length) return null

  const scroll = (dir:'r'|'l') => {
    ref.current?.scrollBy({ left: dir==='r' ? -600 : 600, behavior:'smooth' })
  }

  return (
    <section style={{padding:'36px 0 28px',borderBottom:'1px solid #E5E7EB'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 28px',maxWidth:1200,margin:'0 auto',marginBottom:20}}>
        <h2 style={{fontSize:19,fontWeight:800,color:'#111827',margin:0,letterSpacing:'-.3px'}}>
          {title}
          <span style={{fontSize:13,fontWeight:500,color:'#6B7280',marginRight:10}}>{events.length} فعالية</span>
        </h2>
        <div style={{display:'flex',gap:8}}>
          {(['r','l'] as const).map(d=>(
            <button key={d} onClick={()=>scroll(d)} style={{
              width:36,height:36,borderRadius:'50%',
              background:'#F9FAFB',border:'1px solid #E5E7EB',
              color:'#111827',cursor:'pointer',display:'flex',
              alignItems:'center',justifyContent:'center',transition:'all .15s',
            }}
            onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background='#F97316'; (e.currentTarget as HTMLElement).style.color='#FFFFFF'; (e.currentTarget as HTMLElement).style.borderColor='#F97316' }}
            onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background='#F9FAFB'; (e.currentTarget as HTMLElement).style.color='#111827'; (e.currentTarget as HTMLElement).style.borderColor='#E5E7EB' }}>
              <span style={{width:15,height:15}}>{d==='r'?<I.ChR/>:<I.ChL/>}</span>
            </button>
          ))}
        </div>
      </div>
      <div ref={ref} style={{display:'flex',gap:16,overflowX:'auto',padding:'4px 28px 12px',scrollbarWidth:'none',scrollSnapType:'x mandatory'}}>
        {events.map(ev=><EventCard key={ev.id} ev={ev}/>)}
      </div>
    </section>
  )
}

// ── Past events — compact grid ─────────────────────────────────────
function PastGrid({ events }: { events:Ev[] }) {
  if (!events.length) return null
  return (
    <section style={{padding:'32px 28px 40px',maxWidth:1200,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <h2 style={{fontSize:19,fontWeight:800,color:'#111827',margin:0,letterSpacing:'-.3px'}}>الأرشيف</h2>
        <span style={{background:'#F9FAFB',color:'#6B7280',fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,border:'1px solid #E5E7EB'}}>{events.length} فعالية</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))',gap:12}}>
        {events.map(ev=>{
          const d = new Date(ev.start_date).toLocaleDateString('ar-SA',{month:'short',day:'numeric',year:'numeric'})
          return (
            <Link key={ev.id} href={`/events/${ev.id}`} style={{textDecoration:'none'}}>
              <div style={{background:'#FFFFFF',borderRadius:10,overflow:'hidden',border:'1px solid #E5E7EB',transition:'box-shadow .15s'}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow='0 4px 14px rgba(0,0,0,.08)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow='none'}>
                <div style={{height:90,background:'#F9FAFB',position:'relative',overflow:'hidden'}}>
                  {ev.cover_image
                    ? <img src={ev.cover_image} alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:.6}}/>
                    : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:24,opacity:.2}}>{ev.category_icon||'🗓️'}</span></div>
                  }
                  <div style={{position:'absolute',inset:0,background:'rgba(30,27,75,.3)'}}/>
                  {ev.category && <span style={{position:'absolute',bottom:5,right:6,background:'rgba(249,115,22,.9)',color:'#FFFFFF',fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:10}}>
                    {ev.category_icon||''} {ev.category}
                  </span>}
                </div>
                <div style={{padding:'9px 10px 11px'}}>
                  <p style={{fontSize:11,fontWeight:600,color:'#111827',margin:'0 0 3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.title}</p>
                  <p style={{fontSize:10,color:'#6B7280',margin:0}}>{d}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

// ── Main ──────────────────────────────────────────────────────────────
export default function OrgCatalogClient({ org, upcoming, past }: { org:Org; upcoming:Ev[]; past:Ev[] }) {
  const [cat, setCat]     = useState('all')
  const isAmala = org.slug === 'amala-tours'

  const usedCats = useMemo(()=>{
    const keys = new Set([...upcoming,...past].map(e=>e.category).filter(Boolean))
    return CATS.filter(c => c.key==='all' || keys.has(c.key))
  },[upcoming,past])

  const upFiltered   = useMemo(()=> cat==='all'?upcoming:upcoming.filter(e=>e.category===cat),[upcoming,cat])
  const pastFiltered = useMemo(()=> cat==='all'?past:past.filter(e=>e.category===cat),[past,cat])
  const sliderPool   = useMemo(()=>[...upcoming.filter(e=>e.is_featured&&e.cover_image),...upcoming.filter(e=>e.cover_image&&!e.is_featured)].slice(0,6),[upcoming])

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',direction:'rtl',fontFamily:'Tajawal,sans-serif'}}>

      {/* ── Sticky Header ─────────────────────────────────── */}
      <header style={{position:'sticky',top:0,background:'rgba(255,255,255,.95)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderBottom:'1px solid #E5E7EB',zIndex:100}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px',height:62,display:'flex',alignItems:'center',gap:14}}>
          {/* Logo */}
          {org.logo_url
            ? <img src={org.logo_url} alt="" style={{width:38,height:38,borderRadius:8,objectFit:'cover',border:'1px solid #E5E7EB',flexShrink:0}}/>
            : <div style={{width:38,height:38,background:'#1E1B4B',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'#FFFFFF',fontWeight:900,fontSize:16,flexShrink:0}}>
                {(org.name_ar||org.name)[0]}
              </div>
          }
          {/* Name + city */}
          <div style={{flex:1,minWidth:0}}>
            <p style={{color:'#111827',fontSize:15,fontWeight:800,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{org.name_ar||org.name}</p>
            {org.city && <p style={{color:'#6B7280',fontSize:11,margin:0}}>📍 {org.city}</p>}
          </div>
          {/* Social icons */}
          <div style={{display:'flex',gap:8,flexShrink:0}}>
            {org.social_whatsapp && (
              <a href={`https://wa.me/${org.social_whatsapp}`} target="_blank" rel="noopener"
                style={{width:36,height:36,borderRadius:8,background:'#F9FAFB',border:'1px solid #E5E7EB',display:'flex',alignItems:'center',justifyContent:'center',color:'#22C55E',textDecoration:'none',transition:'all .15s'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#22C55E';(e.currentTarget as HTMLElement).style.color='#fff'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#F9FAFB';(e.currentTarget as HTMLElement).style.color='#22C55E'}}>
                <span style={{width:18,height:18}}><I.Wa/></span>
              </a>
            )}
            {org.social_instagram && (
              <a href={`https://instagram.com/${org.social_instagram}`} target="_blank" rel="noopener"
                style={{width:36,height:36,borderRadius:8,background:'#F9FAFB',border:'1px solid #E5E7EB',display:'flex',alignItems:'center',justifyContent:'center',color:'#6B7280',textDecoration:'none',transition:'all .15s'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#F97316';(e.currentTarget as HTMLElement).style.color='#fff';(e.currentTarget as HTMLElement).style.borderColor='#F97316'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#F9FAFB';(e.currentTarget as HTMLElement).style.color='#6B7280';(e.currentTarget as HTMLElement).style.borderColor='#E5E7EB'}}>
                <span style={{width:17,height:17}}><I.Inst/></span>
              </a>
            )}
            {org.social_twitter && (
              <a href={`https://x.com/${org.social_twitter}`} target="_blank" rel="noopener"
                style={{width:36,height:36,borderRadius:8,background:'#F9FAFB',border:'1px solid #E5E7EB',display:'flex',alignItems:'center',justifyContent:'center',color:'#6B7280',textDecoration:'none',transition:'all .15s'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#111827';(e.currentTarget as HTMLElement).style.color='#fff';(e.currentTarget as HTMLElement).style.borderColor='#111827'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#F9FAFB';(e.currentTarget as HTMLElement).style.color='#6B7280';(e.currentTarget as HTMLElement).style.borderColor='#E5E7EB'}}>
                <span style={{width:16,height:16}}><I.X/></span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Slider ─────────────────────────────────── */}
      <Hero events={sliderPool}/>

      {/* ── Org info bar (stats + tagline) ─────────────── */}
      <div style={{background:'#FFFFFF',borderBottom:'1px solid #E5E7EB'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'16px 28px',display:'flex',alignItems:'center',gap:32,flexWrap:'wrap'}}>
          <div style={{display:'flex',gap:28}}>
            <div>
              <span style={{color:'#111827',fontWeight:800,fontSize:22,lineHeight:1}}>{upcoming.length}</span>
              <span style={{color:'#6B7280',fontSize:11,display:'block',marginTop:2}}>فعالية قادمة</span>
            </div>
            <div style={{width:1,background:'#E5E7EB'}}/>
            <div>
              <span style={{color:'#111827',fontWeight:800,fontSize:22,lineHeight:1}}>{past.length}</span>
              <span style={{color:'#6B7280',fontSize:11,display:'block',marginTop:2}}>فعالية سابقة</span>
            </div>
          </div>
          {org.tagline && <p style={{color:'#6B7280',fontSize:13,margin:0,flex:1,minWidth:200}}>{org.tagline}</p>}
          {/* Follow strip */}
          {org.social_instagram && (
            <a href={`https://instagram.com/${org.social_instagram}`} target="_blank" rel="noopener"
              style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none',background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:8,padding:'7px 14px'}}>
              <span style={{color:'#6B7280',width:15,height:15}}><I.Inst/></span>
              <span style={{color:'#6B7280',fontSize:12}}>@{org.social_instagram}</span>
              <span style={{background:'#F97316',color:'#FFFFFF',padding:'2px 9px',borderRadius:6,fontSize:10,fontWeight:700}}>تابع</span>
            </a>
          )}
        </div>
      </div>

      {/* ── Category filter bar ─────────────────────────── */}
      {usedCats.length > 1 && <CatBar cats={usedCats} active={cat} onSel={setCat}/>}

      {/* ── Clients marquee ─────────────────────────────── */}
      {isAmala && <Marquee clients={AMALA_CLIENTS}/>}

      {/* ── Upcoming events carousel ────────────────────── */}
      <div style={{background:'#F9FAFB'}}>
        {upFiltered.length > 0
          ? <Carousel
              title={cat==='all' ? '🗓️ الفعاليات القادمة' : (CATS.find(c=>c.key===cat)?.label||cat)}
              events={upFiltered}
            />
          : <div style={{padding:'60px 28px',textAlign:'center'}}>
              <div style={{fontSize:44,opacity:.15,marginBottom:10}}>🗓️</div>
              <p style={{color:'#6B7280',fontSize:14,margin:0}}>لا توجد فعاليات في هذا التصنيف</p>
            </div>
        }

        {/* Past events */}
        <PastGrid events={pastFiltered}/>
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer style={{background:'#1E1B4B',color:'#FFFFFF'}}>
        {/* Main footer */}
        <div style={{maxWidth:1200,margin:'0 auto',padding:'36px 28px',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:32}}>
          {/* Col 1: Brand */}
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              {org.logo_url
                ? <img src={org.logo_url} alt="" style={{width:34,height:34,borderRadius:6,objectFit:'cover'}}/>
                : <div style={{width:34,height:34,background:'#F97316',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'#fff',fontSize:16}}>{(org.name_ar||org.name)[0]}</div>
              }
              <span style={{fontWeight:800,fontSize:15,color:'#FFFFFF'}}>{org.name_ar||org.name}</span>
            </div>
            {org.tagline && <p style={{color:'rgba(255,255,255,.5)',fontSize:12,lineHeight:1.6,margin:'0 0 16px'}}>{org.tagline}</p>}
            {org.city && <p style={{color:'rgba(255,255,255,.4)',fontSize:11,margin:0}}>📍 {org.city}</p>}
          </div>

          {/* Col 2: Quick links */}
          <div>
            <h4 style={{color:'rgba(255,255,255,.45)',fontSize:10,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',margin:'0 0 14px'}}>الفعاليات</h4>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {upcoming.slice(0,4).map(ev=>(
                <Link key={ev.id} href={`/events/${ev.id}`} style={{color:'rgba(255,255,255,.65)',fontSize:12,textDecoration:'none',transition:'color .15s'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='#F97316'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,.65)'}>
                  → {ev.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 3: Contact */}
          <div>
            <h4 style={{color:'rgba(255,255,255,.45)',fontSize:10,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',margin:'0 0 14px'}}>تواصل معنا</h4>
            <div style={{display:'flex',gap:10}}>
              {org.social_whatsapp && (
                <a href={`https://wa.me/${org.social_whatsapp}`} target="_blank" rel="noopener"
                  style={{width:36,height:36,borderRadius:8,background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.1)',display:'flex',alignItems:'center',justifyContent:'center',color:'#22C55E',textDecoration:'none'}}>
                  <span style={{width:17,height:17}}><I.Wa/></span>
                </a>
              )}
              {org.social_instagram && (
                <a href={`https://instagram.com/${org.social_instagram}`} target="_blank" rel="noopener"
                  style={{width:36,height:36,borderRadius:8,background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.1)',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,.6)',textDecoration:'none'}}>
                  <span style={{width:17,height:17}}><I.Inst/></span>
                </a>
              )}
              {org.social_twitter && (
                <a href={`https://x.com/${org.social_twitter}`} target="_blank" rel="noopener"
                  style={{width:36,height:36,borderRadius:8,background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.1)',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,.6)',textDecoration:'none'}}>
                  <span style={{width:16,height:16}}><I.X/></span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{borderTop:'1px solid rgba(255,255,255,.07)',padding:'14px 28px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
          <p style={{color:'rgba(255,255,255,.25)',fontSize:11,margin:0}}>© {new Date().getFullYear()} {org.name_ar||org.name}. جميع الحقوق محفوظة.</p>
          <p style={{color:'rgba(255,255,255,.2)',fontSize:11,margin:0}}>مدعوم بـ <span style={{color:'#F97316',fontWeight:700}}>EventVMS</span></p>
        </div>
      </footer>

      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet"/>
    </div>
  )
}
