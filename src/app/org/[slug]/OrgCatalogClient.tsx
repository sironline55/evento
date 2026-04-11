'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'

// ── SVG Icons (webook-inspired outline) ──────────────────────────────
const I = {
  Cal:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>,
  Mtn:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M3 20l7-14 3.5 7 2.5-4 5 11H3z"/><path d="M17.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"/></svg>,
  Run:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="4" r="1.5"/><path d="m8 21 2-6 3 2 2-4M7 12l2-3 4 2 3-4M16 7l2 3"/></svg>,
  Tent: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M12 2L2 21h20L12 2z"/><path d="M12 2L7 21M12 2l5 19M4 15h16"/></svg>,
  Bag:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M12 12v6M9 15h6"/></svg>,
  Mic:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  Book: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Food: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  ChR:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>,
  ChL:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>,
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
  {n:'Saudi Tourism',bg:'#006B3F',fg:'#fff'},{n:'EY',bg:'#FFE600',fg:'#000'},
  {n:'misk',bg:'#222',fg:'#fff'},{n:'lululemon',bg:'#000',fg:'#fff'},
  {n:'Riyadh Airports',bg:'#00539B',fg:'#fff'},{n:'KPMG',bg:'#00338D',fg:'#fff'},
  {n:'Red Sea Global',bg:'#C41E3A',fg:'#fff'},{n:'Four Seasons',bg:'#C9A96E',fg:'#000'},
  {n:'Bosch',bg:'#EA0016',fg:'#fff'},{n:'elm',bg:'#003087',fg:'#fff'},
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

// ── Hero Slider ───────────────────────────────────────────────────────
function Hero({ events, accent }: { events:Ev[]; accent:string }) {
  const [idx, setIdx] = useState(0)
  const [out, setOut]  = useState(false)
  const timer = useRef<NodeJS.Timeout>()

  const pool = events.filter(e => e.cover_image)
  if (!pool.length) return null

  const go = (i: number) => {
    setOut(true)
    setTimeout(()=>{ setIdx(i); setOut(false) }, 280)
  }

  useEffect(()=>{
    if (pool.length < 2) return
    timer.current = setInterval(()=> go((idx+1) % pool.length), 5500)
    return ()=> clearInterval(timer.current)
  }, [idx, pool.length])

  const ev = pool[idx]
  const d  = new Date(ev.start_date).toLocaleDateString('ar-SA',{month:'long',day:'numeric'})
  const loc = ev.location?.split('،')[0]

  return (
    <div style={{position:'relative', height:500, overflow:'hidden', background:'#000'}}>
      <img src={ev.cover_image!} alt="" style={{
        position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover',
        opacity: out ? 0 : 1, transform: out ? 'scale(1.04)' : 'scale(1)',
        transition:'opacity 0.3s, transform 0.3s',
      }}/>
      {/* Gradients */}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(to top, #080808 0%, rgba(8,8,8,.55) 45%, rgba(8,8,8,.1) 100%)'}}/>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(to right, rgba(8,8,8,.7) 0%, transparent 65%)'}}/>

      {/* Content */}
      <div style={{position:'absolute',bottom:48,right:0,left:0,padding:'0 40px',maxWidth:680,opacity:out?0:1,transition:'opacity 0.3s'}}>
        <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{background:accent,color:'#fff',fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:20,letterSpacing:'.03em'}}>
            {ev.category_icon||'🗓️'} {ev.category||'فعالية'}
          </span>
          {d && <span style={{color:'rgba(255,255,255,.55)',fontSize:12}}>📅 {d}</span>}
          {loc && <span style={{color:'rgba(255,255,255,.55)',fontSize:12}}>📍 {loc}</span>}
        </div>
        <h2 style={{color:'#fff',fontSize:34,fontWeight:900,margin:'0 0 12px',lineHeight:1.2,letterSpacing:'-.5px',textShadow:'0 2px 16px rgba(0,0,0,.5)'}}>
          {ev.title}
        </h2>
        {ev.description && <p style={{color:'rgba(255,255,255,.6)',fontSize:14,margin:'0 0 20px',lineHeight:1.65,maxWidth:520,display:'-webkit-box',overflow:'hidden',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
          {ev.description}
        </p>}
        <div style={{display:'flex',gap:14,alignItems:'center'}}>
          <Link href={`/events/${ev.id}`} style={{
            padding:'12px 30px',background:accent,borderRadius:10,color:'#fff',
            fontWeight:800,fontSize:14,textDecoration:'none',letterSpacing:'-.2px',
            boxShadow:`0 4px 20px ${accent}55`,
          }}>احجز الآن ←</Link>
          {ev.price_from != null && <span style={{color:'#fff',fontSize:15,fontWeight:700,opacity:.9}}>
            {ev.price_from===0 ? 'مجاني 🆓' : `من ${ev.price_from} ر.س`}
          </span>}
        </div>
      </div>

      {/* Dots */}
      {pool.length > 1 && <div style={{position:'absolute',bottom:20,right:40,display:'flex',gap:7,alignItems:'center'}}>
        {pool.map((_,i)=><button key={i} onClick={()=>go(i)} style={{
          width:i===idx?28:7,height:7,borderRadius:50,border:'none',cursor:'pointer',padding:0,
          background:i===idx?'#fff':'rgba(255,255,255,.25)',transition:'all .3s',
        }}/>)}
      </div>}

      {/* Arrows */}
      {pool.length > 1 && <>
        <button onClick={()=>go((idx-1+pool.length)%pool.length)} style={{position:'absolute',top:'50%',right:16,transform:'translateY(-50%)',width:44,height:44,borderRadius:'50%',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)'}}>
          <span style={{width:18,height:18}}><I.ChR/></span>
        </button>
        <button onClick={()=>go((idx+1)%pool.length)} style={{position:'absolute',top:'50%',left:16,transform:'translateY(-50%)',width:44,height:44,borderRadius:'50%',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)'}}>
          <span style={{width:18,height:18}}><I.ChL/></span>
        </button>
      </>}
    </div>
  )
}

// ── Category bar ──────────────────────────────────────────────────────
function CatBar({ cats, active, onSel, accent }: {cats:typeof CATS; active:string; onSel:(k:string)=>void; accent:string}) {
  return (
    <div style={{background:'#0A0A0A',borderBottom:'1px solid rgba(255,255,255,.06)',overflowX:'auto',scrollbarWidth:'none'}}>
      <div style={{display:'flex',gap:2,padding:'4px 20px',width:'max-content'}}>
        {cats.map(c=>{
          const on = c.key===active
          return (
            <button key={c.key} onClick={()=>onSel(c.key)} style={{
              display:'flex',flexDirection:'column',alignItems:'center',gap:5,
              padding:'12px 18px',borderRadius:10,border:'none',cursor:'pointer',
              background: on ? 'rgba(255,255,255,.07)' : 'transparent',
              color: on ? '#fff' : 'rgba(255,255,255,.38)',
              fontFamily:'Tajawal,sans-serif',transition:'all .15s',flexShrink:0,
              position:'relative',
            }}>
              <div style={{width:26,height:26,color:on?accent:undefined,transition:'color .15s'}}><c.Ic/></div>
              <span style={{fontSize:11,fontWeight:on?600:400,whiteSpace:'nowrap',letterSpacing:'.01em'}}>{c.label}</span>
              {on && <div style={{position:'absolute',bottom:0,width:24,height:2.5,background:accent,borderRadius:50}}/>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Clients marquee ───────────────────────────────────────────────────
function Marquee({ clients }: { clients: typeof AMALA_CLIENTS }) {
  if (!clients.length) return null
  const row = [...clients, ...clients, ...clients]
  return (
    <div style={{padding:'22px 0',borderBottom:'1px solid rgba(255,255,255,.04)',overflow:'hidden'}}>
      <p style={{color:'rgba(255,255,255,.2)',fontSize:10,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',textAlign:'center',marginBottom:14}}>يثقون بنا</p>
      <div style={{overflow:'hidden',position:'relative'}}>
        <div style={{display:'flex',gap:14,animation:'mq 28s linear infinite',width:'max-content'}}>
          {row.map((c,i)=>(
            <div key={i} style={{
              background:c.bg,color:c.fg,padding:'7px 18px',borderRadius:6,
              fontSize:11,fontWeight:800,whiteSpace:'nowrap',flexShrink:0,letterSpacing:'.02em',
              border:'1px solid rgba(255,255,255,.06)',
            }}>{c.n}</div>
          ))}
        </div>
      </div>
      <style>{`@keyframes mq{from{transform:translateX(0)}to{transform:translateX(-33.33%)}}`}</style>
    </div>
  )
}

// ── Event card ────────────────────────────────────────────────────────
function Card({ ev, accent }: { ev:Ev; accent:string }) {
  const d   = new Date(ev.start_date).toLocaleDateString('ar-SA',{month:'short',day:'numeric'})
  const loc = ev.location?.split('،')[0]
  const [hov, setHov] = useState(false)
  return (
    <Link href={`/events/${ev.id}`} style={{textDecoration:'none',display:'block',flexShrink:0,width:272}}>
      <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{background:'#111',borderRadius:14,overflow:'hidden',border:`1px solid ${hov?'rgba(255,255,255,.14)':'rgba(255,255,255,.06)'}`,transform:hov?'translateY(-5px)':'none',transition:'all .2s',cursor:'pointer'}}>
        {/* Image */}
        <div style={{height:172,background:'#1a1a1a',position:'relative',overflow:'hidden'}}>
          {ev.cover_image
            ? <img src={ev.cover_image} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block',transform:hov?'scale(1.05)':'scale(1)',transition:'transform .4s'}}/>
            : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:44,opacity:.2}}>{ev.category_icon||'🗓️'}</span></div>
          }
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to top, rgba(17,17,17,.85) 0%, transparent 55%)'}}/>
          {/* Badges */}
          <div style={{position:'absolute',top:10,right:10,left:10,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            {ev.is_featured && <span style={{background:'rgba(0,0,0,.7)',backdropFilter:'blur(8px)',color:'#FFD700',fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20,border:'1px solid rgba(255,215,0,.25)'}}>⭐ مميز</span>}
            {ev.price_from!=null && <span style={{background:ev.price_from===0?'#16a34a':accent,color:'#fff',fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:20,marginRight:'auto'}}>
              {ev.price_from===0?'مجاني':`${ev.price_from} ر.س`}
            </span>}
          </div>
          <span style={{position:'absolute',bottom:10,right:10,background:'rgba(0,0,0,.65)',backdropFilter:'blur(6px)',color:'rgba(255,255,255,.85)',fontSize:10,padding:'3px 8px',borderRadius:20,fontFamily:'Tajawal,sans-serif'}}>
            {ev.category_icon||'🗓️'} {ev.category||''}
          </span>
        </div>
        {/* Text */}
        <div style={{padding:'14px'}}>
          <h3 style={{fontSize:13,fontWeight:700,color:'#fff',margin:'0 0 9px',lineHeight:1.4,display:'-webkit-box',overflow:'hidden',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{ev.title}</h3>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <span style={{color:'rgba(255,255,255,.28)',fontSize:11}}>📅</span>
              <span style={{color:'rgba(255,255,255,.45)',fontSize:11}}>{d}</span>
            </div>
            {loc&&<div style={{display:'flex',gap:6,alignItems:'center'}}>
              <span style={{color:'rgba(255,255,255,.28)',fontSize:11}}>📍</span>
              <span style={{color:'rgba(255,255,255,.45)',fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{loc}</span>
            </div>}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Events carousel ───────────────────────────────────────────────────
function Carousel({ title, events, accent }: { title:string; events:Ev[]; accent:string }) {
  const ref = useRef<HTMLDivElement>(null)
  if (!events.length) return null
  const scroll = (d: 'r'|'l') => ref.current?.scrollBy({left: d==='r'?-580:580, behavior:'smooth'})
  return (
    <section style={{padding:'36px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 28px',marginBottom:20}}>
        <h2 style={{color:'#fff',fontSize:20,fontWeight:800,margin:0,letterSpacing:'-.3px'}}>{title}</h2>
        <div style={{display:'flex',gap:8}}>
          {(['r','l'] as const).map(d=>(
            <button key={d} onClick={()=>scroll(d)} style={{width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'background .15s'}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.12)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.07)'}>
              <span style={{width:15,height:15}}>{d==='r'?<I.ChR/>:<I.ChL/>}</span>
            </button>
          ))}
        </div>
      </div>
      <div ref={ref} style={{display:'flex',gap:14,overflowX:'auto',padding:'4px 28px 16px',scrollbarWidth:'none',scrollSnapType:'x mandatory'}}>
        {events.map(ev=><Card key={ev.id} ev={ev} accent={accent}/>)}
      </div>
    </section>
  )
}

// ── Past events ───────────────────────────────────────────────────────
function Past({ events }: { events:Ev[] }) {
  if (!events.length) return null
  return (
    <section style={{padding:'32px 28px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h2 style={{color:'#fff',fontSize:20,fontWeight:800,margin:0,letterSpacing:'-.3px'}}>📂 الأرشيف</h2>
        <span style={{color:'rgba(255,255,255,.25)',fontSize:12}}>{events.length} فعالية</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10}}>
        {events.map(ev=>{
          const d = new Date(ev.start_date).toLocaleDateString('ar-SA',{month:'short',day:'numeric'})
          return (
            <Link key={ev.id} href={`/events/${ev.id}`} style={{textDecoration:'none'}}>
              <div style={{background:'#0E0E0E',borderRadius:10,overflow:'hidden',border:'1px solid rgba(255,255,255,.05)'}}>
                <div style={{height:96,background:'#1a1a1a',position:'relative'}}>
                  {ev.cover_image?<img src={ev.cover_image} alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:.55}}/>
                  :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:26,opacity:.2}}>{ev.category_icon||'🗓️'}</span></div>}
                </div>
                <div style={{padding:'9px 10px'}}>
                  <p style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,.6)',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.title}</p>
                  <p style={{fontSize:10,color:'rgba(255,255,255,.28)',margin:0}}>📅 {d}</p>
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
  const accent = org.accent_color || '#F05537'
  const [cat, setCat] = useState('all')
  const isAmala = org.slug === 'amala-tours'

  const usedCats = useMemo(()=>{
    const keys = new Set([...upcoming,...past].map(e=>e.category).filter(Boolean))
    return CATS.filter(c=>c.key==='all' || keys.has(c.key))
  },[upcoming,past])

  const upFiltered   = useMemo(()=> cat==='all'?upcoming:upcoming.filter(e=>e.category===cat), [upcoming,cat])
  const pastFiltered = useMemo(()=> cat==='all'?past:past.filter(e=>e.category===cat), [past,cat])
  const sliderEvents = useMemo(()=>[...upcoming.filter(e=>e.is_featured&&e.cover_image),...upcoming.filter(e=>e.cover_image&&!e.is_featured)].slice(0,6),[upcoming])

  return (
    <div style={{minHeight:'100vh',background:'#080808',direction:'rtl',fontFamily:'Tajawal,sans-serif',color:'#fff'}}>

      {/* ── Sticky Header ────────────────────────────────────── */}
      <header style={{position:'sticky',top:0,background:'rgba(8,8,8,.92)',backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)',borderBottom:'1px solid rgba(255,255,255,.06)',zIndex:100}}>
        <div style={{maxWidth:1300,margin:'0 auto',padding:'13px 24px',display:'flex',alignItems:'center',gap:14}}>
          {org.logo_url
            ? <img src={org.logo_url} alt="" style={{width:36,height:36,borderRadius:8,objectFit:'cover',border:'1px solid rgba(255,255,255,.1)'}}/>
            : <div style={{width:36,height:36,background:accent,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:17,flexShrink:0}}>{(org.name_ar||org.name)[0]}</div>
          }
          <div style={{flex:1,minWidth:0}}>
            <h1 style={{color:'#fff',fontSize:15,fontWeight:800,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{org.name_ar||org.name}</h1>
            {org.city&&<p style={{color:'rgba(255,255,255,.3)',fontSize:10,margin:0}}>📍 {org.city}</p>}
          </div>
          <div style={{display:'flex',gap:8,flexShrink:0}}>
            {org.social_whatsapp&&<a href={`https://wa.me/${org.social_whatsapp}`} target="_blank" rel="noopener"
              style={{width:34,height:34,borderRadius:8,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',justifyContent:'center',color:'#25D366',textDecoration:'none'}}>
              <span style={{width:17,height:17}}><I.Wa/></span>
            </a>}
            {org.social_instagram&&<a href={`https://instagram.com/${org.social_instagram}`} target="_blank" rel="noopener"
              style={{width:34,height:34,borderRadius:8,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,.6)',textDecoration:'none'}}>
              <span style={{width:17,height:17}}><I.Inst/></span>
            </a>}
            {org.social_twitter&&<a href={`https://x.com/${org.social_twitter}`} target="_blank" rel="noopener"
              style={{width:34,height:34,borderRadius:8,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,.6)',textDecoration:'none'}}>
              <span style={{width:16,height:16}}><I.X/></span>
            </a>}
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <Hero events={sliderEvents} accent={accent}/>

      {/* ── Org info strip (no-image fallback) ────────────────── */}
      {!sliderEvents.length&&<div style={{padding:'40px 28px',background:'linear-gradient(135deg,#1E0A3C,#080808)'}}>
        <h2 style={{fontSize:30,fontWeight:900,color:'#fff',margin:'0 0 8px',letterSpacing:'-.5px'}}>{org.name_ar||org.name}</h2>
        {org.tagline&&<p style={{color:'rgba(255,255,255,.5)',fontSize:14,margin:0}}>{org.tagline}</p>}
      </div>}

      {/* ── Stats + Social follow strip ────────────────────────── */}
      <div style={{background:'#0D0D0D',borderBottom:'1px solid rgba(255,255,255,.05)',padding:'14px 28px',display:'flex',alignItems:'center',gap:24,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:20}}>
          <div style={{textAlign:'center'}}>
            <p style={{color:'#fff',fontWeight:800,fontSize:20,margin:0}}>{upcoming.length}</p>
            <p style={{color:'rgba(255,255,255,.3)',fontSize:10,margin:0}}>فعالية قادمة</p>
          </div>
          <div style={{textAlign:'center'}}>
            <p style={{color:'#fff',fontWeight:800,fontSize:20,margin:0}}>{past.length}</p>
            <p style={{color:'rgba(255,255,255,.3)',fontSize:10,margin:0}}>فعالية سابقة</p>
          </div>
        </div>
        <div style={{flex:1,display:'flex',gap:12,justifyContent:'flex-end',alignItems:'center',flexWrap:'wrap'}}>
          {org.tagline&&<p style={{color:'rgba(255,255,255,.3)',fontSize:12,margin:0}}>{org.tagline}</p>}
          {org.social_instagram&&<a href={`https://instagram.com/${org.social_instagram}`} target="_blank" rel="noopener"
            style={{display:'flex',alignItems:'center',gap:7,textDecoration:'none',background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.08)',borderRadius:8,padding:'6px 14px'}}>
            <span style={{color:'rgba(255,255,255,.55)',width:15,height:15}}><I.Inst/></span>
            <span style={{color:'rgba(255,255,255,.55)',fontSize:12}}>@{org.social_instagram}</span>
            <span style={{background:accent,color:'#fff',padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700}}>تابع</span>
          </a>}
        </div>
      </div>

      {/* ── Category bar ─────────────────────────────────────── */}
      {usedCats.length > 1 && <CatBar cats={usedCats} active={cat} onSel={setCat} accent={accent}/>}

      {/* ── Clients marquee ──────────────────────────────────── */}
      {isAmala && <Marquee clients={AMALA_CLIENTS}/>}

      {/* ── Events ───────────────────────────────────────────── */}
      <div style={{maxWidth:1300,margin:'0 auto'}}>
        <Carousel
          title={cat==='all' ? '🗓️ الفعاليات القادمة' : (CATS.find(c=>c.key===cat)?.label || cat)}
          events={upFiltered}
          accent={accent}
        />

        {!upFiltered.length&&(
          <div style={{padding:'60px 28px',textAlign:'center'}}>
            <div style={{fontSize:44,opacity:.2,marginBottom:10}}>🗓️</div>
            <p style={{color:'rgba(255,255,255,.3)',fontSize:14}}>لا توجد فعاليات في هذا التصنيف</p>
          </div>
        )}

        <Past events={pastFiltered}/>
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div style={{borderTop:'1px solid rgba(255,255,255,.05)',padding:'20px 28px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <p style={{color:'rgba(255,255,255,.15)',fontSize:11,margin:0}}>© {new Date().getFullYear()} {org.name_ar||org.name}</p>
        <p style={{color:'rgba(255,255,255,.12)',fontSize:11,margin:0}}>مدعوم بـ <span style={{color:'#F05537',fontWeight:700}}>EventVMS</span></p>
      </div>

      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800;900&display=swap" rel="stylesheet"/>
    </div>
  )
}
