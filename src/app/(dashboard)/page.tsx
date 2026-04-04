'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A'
}

const STATUS: Record<string,{label:string;color:string;bg:string}> = {
  draft:     {label:'مسودة',  color:'#6F7287', bg:'#F8F7FA'},
  published: {label:'نشط',   color:'#3A7D0A', bg:'#EAF7E0'},
  active:    {label:'نشط',   color:'#3A7D0A', bg:'#EAF7E0'},
  completed: {label:'منتهي', color:'#6F7287', bg:'#F8F7FA'},
  cancelled: {label:'ملغي',  color:'#C6341A', bg:'#FDEDEA'},
}

const CATS = [
  { icon:'🎵', label:'موسيقى' },
  { icon:'🍔', label:'طعام' },
  { icon:'💼', label:'أعمال' },
  { icon:'🎨', label:'فنون' },
  { icon:'⚽', label:'رياضة' },
  { icon:'💻', label:'تقنية' },
  { icon:'❤️', label:'خيري' },
  { icon:'🕌', label:'ديني' },
]

function StatCard({ icon, label, value, href, color }: any) {
  return (
    <Link href={href} style={{ textDecoration:'none' }}>
      <div style={{
        background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
        padding:'18px 20px', cursor:'pointer', transition:'box-shadow 0.15s'
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
      >
        <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
        <p style={{ fontSize:30, fontWeight:800, color:color||C.navy, margin:'0 0 2px', fontVariantNumeric:'tabular-nums' }}>{value}</p>
        <p style={{ fontSize:12, color:C.muted, margin:0 }}>{label}</p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser]   = useState<any>(null)
  const [stats, setStats] = useState({ events:0, regs:0, attended:0, upcoming:0 })
  const [recent, setRecent] = useState<any[]>([])
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => setUser(data.user))
    const now = new Date().toISOString()
    Promise.all([
      sb.from('events').select('*',{count:'exact',head:true}),
      sb.from('registrations').select('*',{count:'exact',head:true}),
      sb.from('registrations').select('*',{count:'exact',head:true}).eq('status','attended'),
      sb.from('events').select('*',{count:'exact',head:true}).gte('start_date',now).eq('status','published'),
      sb.from('events').select('id,title,start_date,status,location,cover_image,category').order('created_at',{ascending:false}).limit(6),
      sb.from('events').select('id,title,start_date,location,cover_image').gte('start_date',now).eq('status','published').order('start_date',{ascending:true}).limit(3),
    ]).then(([ev,reg,att,up,rec,upc])=>{
      setStats({ events:ev.count||0, regs:reg.count||0, attended:att.count||0, upcoming:up.count||0 })
      setRecent(rec.data||[])
      setUpcoming(upc.data||[])
      setLoading(false)
    })
  },[])

  const name = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'مرحباً'

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) router.push(`/events?q=${encodeURIComponent(search)}`)
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>

      {/* ══ Hero Banner ══ */}
      <div style={{
        background:`linear-gradient(135deg, ${C.navy} 0%, #3D1A78 100%)`,
        padding:'48px 32px 40px',
        position:'relative', overflow:'hidden'
      }}>
        {/* decorative circles */}
        <div style={{ position:'absolute', top:-60, left:-60, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
        <div style={{ position:'absolute', bottom:-40, right:80, width:160, height:160, borderRadius:'50%', background:'rgba(240,85,55,0.15)' }}/>

        <p style={{ color:'rgba(255,255,255,0.65)', fontSize:13, margin:'0 0 6px' }}>
          {new Date().toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </p>
        <h1 style={{ fontSize:34, fontWeight:800, color:'#fff', margin:'0 0 20px', letterSpacing:'-0.5px', position:'relative' }}>
          أهلاً، {name} 👋
        </h1>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ display:'flex', gap:0, maxWidth:520, position:'relative' }}>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="ابحث عن فعالية..."
            style={{
              flex:1, padding:'14px 20px', border:'none', borderRadius:'8px 0 0 8px',
              fontSize:15, outline:'none', color:C.text, background:'#fff',
              fontFamily:'inherit'
            }}
          />
          <button type="submit" style={{
            padding:'0 24px', background:C.orange, border:'none',
            borderRadius:'0 8px 8px 0', color:'#fff', fontWeight:700,
            fontSize:14, cursor:'pointer', whiteSpace:'nowrap'
          }}>🔍 بحث</button>
        </form>
      </div>

      {/* ══ Stats Row ══ */}
      <div style={{ padding:'20px 24px 0' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          <StatCard icon="📅" label="إجمالي الفعاليات"  value={loading?'—':stats.events}   href="/events"    color={C.navy}/>
          <StatCard icon="🎟" label="إجمالي التذاكر"   value={loading?'—':stats.regs}     href="/attendees" color="#7B4FBF"/>
          <StatCard icon="✅" label="حضروا الفعاليات"  value={loading?'—':stats.attended} href="/attendees" color={C.green}/>
          <StatCard icon="🔜" label="فعاليات قادمة"    value={loading?'—':stats.upcoming} href="/events"    color={C.orange}/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20, alignItems:'start' }}>

          {/* ── Left Column ── */}
          <div>

            {/* Quick Actions */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20, marginBottom:20 }}>
              <h2 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 14px' }}>إجراءات سريعة</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {[
                  { href:'/events/new', icon:'➕', label:'فعالية جديدة', bg:'#F05537', fg:'#fff' },
                  { href:'/scanner',    icon:'📷', label:'مسح الحضور',   bg:'#EAF7E0', fg:C.green },
                  { href:'/attendees',  icon:'👥', label:'إدارة الزوار', bg:'#EDE9F7', fg:'#7B4FBF' },
                  { href:'/analytics',  icon:'📊', label:'التقارير',     bg:'#FEF0ED', fg:C.orange },
                ].map(q => (
                  <Link key={q.href} href={q.href} style={{ textDecoration:'none' }}>
                    <div style={{
                      background:q.bg, borderRadius:8, padding:'14px 10px',
                      textAlign:'center', cursor:'pointer',
                      transition:'opacity 0.15s'
                    }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity='0.85'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity='1'}
                    >
                      <div style={{ fontSize:22, marginBottom:6 }}>{q.icon}</div>
                      <p style={{ fontSize:11, fontWeight:700, color:q.fg, margin:0 }}>{q.label}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20, marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <h2 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>تصفح حسب التصنيف</h2>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {CATS.map(c=>(
                  <Link key={c.label} href={`/events?category=${encodeURIComponent(c.label)}`} style={{ textDecoration:'none' }}>
                    <div style={{
                      display:'flex', alignItems:'center', gap:6,
                      padding:'7px 14px', border:`1px solid ${C.border}`,
                      borderRadius:20, background:C.bg, cursor:'pointer',
                      fontSize:13, color:C.text, fontWeight:600,
                      transition:'all 0.15s'
                    }}
                      onMouseEnter={e=>{
                        (e.currentTarget as HTMLElement).style.borderColor = C.orange
                        ;(e.currentTarget as HTMLElement).style.color = C.orange
                      }}
                      onMouseLeave={e=>{
                        (e.currentTarget as HTMLElement).style.borderColor = C.border
                        ;(e.currentTarget as HTMLElement).style.color = C.text
                      }}
                    >
                      <span>{c.icon}</span>
                      <span>{c.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Events */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h2 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>آخر الفعاليات</h2>
                <Link href="/events" style={{ fontSize:12, color:C.orange, textDecoration:'none', fontWeight:600 }}>عرض الكل</Link>
              </div>

              {loading ? (
                <div style={{ padding:32, textAlign:'center', color:C.muted, fontSize:13 }}>جاري التحميل...</div>
              ) : recent.length === 0 ? (
                <div style={{ padding:40, textAlign:'center' }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
                  <p style={{ color:C.muted, fontSize:13, margin:'0 0 16px' }}>لا توجد فعاليات بعد</p>
                  <Link href="/events/new" style={{
                    display:'inline-block', padding:'10px 24px', background:C.orange,
                    color:'#fff', borderRadius:6, textDecoration:'none', fontWeight:700, fontSize:13
                  }}>أنشئ أول فعالية</Link>
                </div>
              ) : (
                <>
                  {/* Table header */}
                  <div style={{
                    display:'grid', gridTemplateColumns:'1fr 120px 100px 80px',
                    padding:'10px 20px', background:'#F8F7FA',
                    borderBottom:`1px solid ${C.border}`
                  }}>
                    {['الفعالية','التاريخ','الموقع','الحالة'].map(h=>(
                      <span key={h} style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase' }}>{h}</span>
                    ))}
                  </div>
                  {recent.map((ev, i) => {
                    const st = STATUS[ev.status] || STATUS.draft
                    return (
                      <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration:'none' }}>
                        <div style={{
                          display:'grid', gridTemplateColumns:'1fr 120px 100px 80px',
                          padding:'14px 20px', borderBottom: i < recent.length-1 ? `1px solid ${C.border}` : 'none',
                          alignItems:'center', transition:'background 0.1s'
                        }}
                          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#FAFAFA'}
                          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
                        >
                          <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                            {ev.cover_image ? (
                              <img src={ev.cover_image} alt="" style={{ width:36, height:36, borderRadius:6, objectFit:'cover', flexShrink:0 }}/>
                            ) : (
                              <div style={{ width:36, height:36, background:'#EDE9F7', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>📅</div>
                            )}
                            <div style={{ minWidth:0 }}>
                              <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ev.title}</p>
                              {ev.category && <p style={{ fontSize:11, color:C.muted, margin:0 }}>{ev.category}</p>}
                            </div>
                          </div>
                          <span style={{ fontSize:12, color:C.muted }}>
                            {ev.start_date ? new Date(ev.start_date).toLocaleDateString('ar-SA',{month:'short',day:'numeric'}) : '—'}
                          </span>
                          <span style={{ fontSize:12, color:C.muted, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {ev.location || '—'}
                          </span>
                          <span style={{
                            display:'inline-block', padding:'3px 8px', borderRadius:20,
                            fontSize:11, fontWeight:700, color:st.color, background:st.bg
                          }}>{st.label}</span>
                        </div>
                      </Link>
                    )
                  })}
                </>
              )}
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Create CTA */}
            <div style={{
              background:`linear-gradient(135deg, ${C.orange}, #D9442A)`,
              borderRadius:10, padding:20, color:'#fff', textAlign:'center'
            }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🚀</div>
              <h3 style={{ fontSize:15, fontWeight:800, margin:'0 0 6px' }}>أنشئ فعالية الآن</h3>
              <p style={{ fontSize:12, opacity:0.85, margin:'0 0 16px' }}>ابدأ في دقيقتين فقط</p>
              <Link href="/events/new" style={{
                display:'block', padding:'10px', background:'#fff',
                borderRadius:6, textDecoration:'none', fontWeight:700,
                fontSize:13, color:C.orange
              }}>+ فعالية جديدة</Link>
            </div>

            {/* Upcoming Events */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'14px 16px', borderBottom:`1px solid ${C.border}` }}>
                <h3 style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>🔜 القادمة قريباً</h3>
              </div>
              {upcoming.length === 0 ? (
                <p style={{ padding:16, fontSize:12, color:C.muted, margin:0 }}>لا توجد فعاليات قادمة</p>
              ) : upcoming.map((ev,i) => (
                <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration:'none' }}>
                  <div style={{
                    padding:'12px 16px',
                    borderBottom: i < upcoming.length-1 ? `1px solid ${C.border}` : 'none',
                    display:'flex', gap:10, alignItems:'center'
                  }}>
                    <div style={{
                      width:36, height:36, background:'#FEF0ED', borderRadius:6,
                      display:'flex', flexDirection:'column', alignItems:'center',
                      justifyContent:'center', flexShrink:0
                    }}>
                      <span style={{ fontSize:11, fontWeight:800, color:C.orange, lineHeight:1 }}>
                        {new Date(ev.start_date).getDate()}
                      </span>
                      <span style={{ fontSize:9, color:C.orange }}>
                        {new Date(ev.start_date).toLocaleDateString('ar-SA',{month:'short'})}
                      </span>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <p style={{ fontSize:12, fontWeight:700, color:C.navy, margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ev.title}</p>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>{ev.location||'—'}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Scanner shortcut */}
            <Link href="/scanner" style={{ textDecoration:'none' }}>
              <div style={{
                background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
                padding:16, display:'flex', alignItems:'center', gap:12,
                cursor:'pointer', transition:'box-shadow 0.15s'
              }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow='none'}
              >
                <div style={{ width:44, height:44, background:'#EAF7E0', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>📷</div>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>ماسح الحضور</p>
                  <p style={{ fontSize:11, color:C.muted, margin:0 }}>امسح رموز QR التذاكر</p>
                </div>
              </div>
            </Link>

            {/* Attendees shortcut */}
            <Link href="/attendees" style={{ textDecoration:'none' }}>
              <div style={{
                background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
                padding:16, display:'flex', alignItems:'center', gap:12, cursor:'pointer',
                transition:'box-shadow 0.15s'
              }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow='none'}
              >
                <div style={{ width:44, height:44, background:'#EDE9F7', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>👥</div>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>إدارة الزوار</p>
                  <p style={{ fontSize:11, color:C.muted, margin:0 }}>عرض وتسجيل الحضور</p>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </div>

      {/* bottom space for mobile nav */}
      <div className="h-20 md:h-0"/>
    </div>
  )
}
