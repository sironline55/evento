'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA',
  card:'#FFFFFF', green:'#3A7D0A',
}

const STATUS: Record<string,{label:string;color:string;bg:string}> = {
  draft:     { label:'مسودة',  color:'#6F7287', bg:'#F3F2F5' },
  published: { label:'نشط',   color:'#3A7D0A', bg:'#EAF7E0' },
  active:    { label:'نشط',   color:'#3A7D0A', bg:'#EAF7E0' },
  completed: { label:'منتهي', color:'#6F7287', bg:'#F3F2F5' },
  cancelled: { label:'ملغي',  color:'#C6341A', bg:'#FDEDEA' },
}

export default function DashboardPage() {
  const [user, setUser]       = useState<any>(null)
  const [stats, setStats]     = useState({ events:0, registrations:0, attended:0, draft:0 })
  const [recent, setRecent]   = useState<any[]>([])
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => setUser(data.user))
    const now = new Date().toISOString()
    Promise.all([
      sb.from('events').select('*', { count:'exact', head:true }),
      sb.from('registrations').select('*', { count:'exact', head:true }),
      sb.from('registrations').select('*', { count:'exact', head:true }).eq('status','attended'),
      sb.from('events').select('*', { count:'exact', head:true }).eq('status','draft'),
      sb.from('events').select('id,title,start_date,end_date,status,location,cover_image,category')
        .order('created_at', { ascending:false }).limit(5),
      sb.from('events').select('id,title,start_date,location,status')
        .eq('status','published').gte('start_date', now)
        .order('start_date', { ascending:true }).limit(3),
    ]).then(([ev,reg,att,dft,rec,upc]) => {
      setStats({
        events: ev.count||0,
        registrations: reg.count||0,
        attended: att.count||0,
        draft: dft.count||0,
      })
      setRecent(rec.data||[])
      setUpcoming(upc.data||[])
      setLoading(false)
    })
  }, [])

  const name = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'مرحباً'

  const formatDate = (d: string) => d
    ? new Date(d).toLocaleDateString('ar-SA', { weekday:'short', month:'short', day:'numeric' })
    : '—'

  const formatDay = (d: string) => d ? new Date(d).getDate() : '—'
  const formatMon = (d: string) => d
    ? new Date(d).toLocaleDateString('ar-SA', { month:'short' }).toUpperCase()
    : ''

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>

      {/* ─── HERO HEADER ─── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #2D1254 100%)`,
        padding: '36px 32px 32px',
        color: '#fff',
      }}>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', margin:'0 0 6px' }}>
          {new Date().toLocaleDateString('ar-SA',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
        <h1 style={{ fontSize:36, fontWeight:800, margin:'0 0 4px', letterSpacing:'-0.5px' }}>
          أهلاً، {name} 👋
        </h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.7)', margin:'0 0 24px' }}>
          إليك نظرة على نشاطك اليوم
        </p>

        {/* Stats inside header */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { label:'فعاليات', value:stats.events,        icon:'📅', href:'/events' },
            { label:'مسجّلون',  value:stats.registrations, icon:'🎟', href:'/attendees' },
            { label:'حضروا',   value:stats.attended,       icon:'✅', href:'/attendees' },
            { label:'مسودات',  value:stats.draft,          icon:'📝', href:'/events' },
          ].map(({ label, value, icon, href }) => (
            <Link key={label} href={href} style={{ textDecoration:'none' }}>
              <div style={{
                background:'rgba(255,255,255,0.12)', borderRadius:10, padding:'16px 14px',
                textAlign:'center', border:'1px solid rgba(255,255,255,0.15)',
                transition:'background 0.15s', cursor:'pointer',
              }}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.2)')}
                onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,0.12)')}
              >
                <div style={{ fontSize:20, marginBottom:6 }}>{icon}</div>
                <div style={{ fontSize:28, fontWeight:800, color:'#fff', lineHeight:1 }}>
                  {loading ? '—' : value.toLocaleString('ar-SA')}
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:4 }}>{label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ padding:'24px 32px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 310px', gap:24, alignItems:'start' }}>

          {/* ─── MAIN COLUMN ─── */}
          <div>

            {/* Quick Actions */}
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:14, fontWeight:700, color:C.muted, margin:'0 0 12px', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                إجراءات سريعة
              </h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                {[
                  { title:'إنشاء فعالية',   desc:'أضف فعالية جديدة',       icon:'➕', href:'/events/new',   bg:'#FEF0ED', border:'#FECFBF', iconBg:'#F05537', iconColor:'#fff' },
                  { title:'ماسح الحضور',    desc:'تحقق من تذاكر الزوار',   icon:'📷', href:'/scanner',      bg:'#EAF7E0', border:'#B7E4A0', iconBg:'#3A7D0A', iconColor:'#fff' },
                  { title:'الزوار',          desc:'إدارة قوائم الحضور',     icon:'👥', href:'/attendees',    bg:'#EEF2FF', border:'#C7D2FE', iconBg:'#4F46E5', iconColor:'#fff' },
                  { title:'التقارير',        desc:'إحصاءات ومبيعات',        icon:'📊', href:'/analytics',    bg:'#FFF8E8', border:'#FDE68A', iconBg:'#B07000', iconColor:'#fff' },
                ].map(card => (
                  <Link key={card.title} href={card.href} style={{ textDecoration:'none' }}>
                    <div style={{
                      background:card.bg, border:`1px solid ${card.border}`,
                      borderRadius:10, padding:'18px 14px', textAlign:'center',
                      cursor:'pointer', transition:'transform 0.12s, box-shadow 0.12s',
                    }}
                      onMouseEnter={e=>{
                        e.currentTarget.style.transform='translateY(-2px)'
                        e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={e=>{
                        e.currentTarget.style.transform='none'
                        e.currentTarget.style.boxShadow='none'
                      }}
                    >
                      <div style={{
                        width:42, height:42, borderRadius:10,
                        background:card.iconBg, color:card.iconColor,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:20, margin:'0 auto 10px',
                      }}>{card.icon}</div>
                      <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:'0 0 3px' }}>{card.title}</p>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>{card.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            {upcoming.length > 0 && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', marginBottom:20 }}>
                <div style={{
                  padding:'14px 20px', borderBottom:`1px solid ${C.border}`,
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  background:'#F8F7FA',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:16 }}>⏰</span>
                    <h2 style={{ fontSize:14, fontWeight:700, margin:0, color:C.navy }}>الفعاليات القادمة</h2>
                  </div>
                  <Link href="/events" style={{ fontSize:12, color:C.orange, textDecoration:'none', fontWeight:700 }}>
                    عرض الكل ←
                  </Link>
                </div>
                {upcoming.map((ev, i) => (
                  <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration:'none' }}>
                    <div style={{
                      display:'flex', alignItems:'center', gap:16, padding:'14px 20px',
                      borderBottom: i < upcoming.length-1 ? `1px solid ${C.border}` : 'none',
                      transition:'background 0.12s',
                    }}
                      onMouseEnter={e=>(e.currentTarget.style.background='#FEF0ED')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                    >
                      {/* Date block */}
                      <div style={{
                        width:48, textAlign:'center', flexShrink:0,
                        background:'#FEF0ED', borderRadius:8, padding:'6px 0',
                        border:`1px solid #FECFBF`,
                      }}>
                        <div style={{ fontSize:9, fontWeight:800, color:C.orange, letterSpacing:'0.1em' }}>
                          {formatMon(ev.start_date)}
                        </div>
                        <div style={{ fontSize:22, fontWeight:800, color:C.navy, lineHeight:1 }}>
                          {formatDay(ev.start_date)}
                        </div>
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontWeight:700, fontSize:14, margin:'0 0 3px', color:C.navy }}>{ev.title}</p>
                        <p style={{ fontSize:12, color:C.muted, margin:0 }}>
                          {ev.location || 'موقع غير محدد'} · {formatDate(ev.start_date)}
                        </p>
                      </div>
                      <span style={{
                        padding:'3px 10px', borderRadius:4, fontSize:11, fontWeight:600,
                        background:'#EAF7E0', color:'#3A7D0A',
                      }}>نشط</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Recent Events */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{
                padding:'14px 20px', borderBottom:`1px solid ${C.border}`,
                display:'flex', justifyContent:'space-between', alignItems:'center',
                background:'#F8F7FA',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:16 }}>📋</span>
                  <h2 style={{ fontSize:14, fontWeight:700, margin:0, color:C.navy }}>آخر الفعاليات</h2>
                </div>
                <Link href="/events" style={{ fontSize:12, color:C.orange, textDecoration:'none', fontWeight:700 }}>
                  عرض الكل ←
                </Link>
              </div>

              {/* Table header */}
              <div style={{
                display:'grid', gridTemplateColumns:'3fr 1.2fr 1fr 80px',
                padding:'8px 20px', fontSize:11, fontWeight:700,
                color:C.muted, letterSpacing:'0.05em',
                background:'#FAFAFA', borderBottom:`1px solid ${C.border}`,
              }}>
                <span>الفعالية</span>
                <span>التاريخ</span>
                <span>الحالة</span>
                <span style={{ textAlign:'center' }}>إجراء</span>
              </div>

              {loading && (
                <div style={{ padding:'32px', textAlign:'center', color:C.muted, fontSize:13 }}>
                  جاري التحميل...
                </div>
              )}

              {!loading && recent.length === 0 && (
                <div style={{ padding:'48px 24px', textAlign:'center' }}>
                  <div style={{ fontSize:56, marginBottom:16 }}>📅</div>
                  <h3 style={{ fontSize:18, fontWeight:700, color:C.navy, margin:'0 0 8px' }}>لا توجد فعاليات بعد</h3>
                  <p style={{ color:C.muted, fontSize:14, margin:'0 0 20px' }}>أنشئ فعاليتك الأولى الآن</p>
                  <Link href="/events/new" style={{
                    display:'inline-block', padding:'11px 24px',
                    background:C.orange, color:'#fff',
                    borderRadius:8, textDecoration:'none',
                    fontWeight:700, fontSize:14,
                  }}>+ إنشاء فعالية</Link>
                </div>
              )}

              {recent.map((ev, i) => {
                const s = STATUS[ev.status] || STATUS.draft
                return (
                  <div key={ev.id} style={{
                    display:'grid', gridTemplateColumns:'3fr 1.2fr 1fr 80px',
                    padding:'13px 20px', alignItems:'center',
                    borderBottom: i < recent.length-1 ? `1px solid ${C.border}` : 'none',
                    transition:'background 0.12s',
                  }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#F8F7FA')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{
                        width:40, textAlign:'center', flexShrink:0,
                      }}>
                        <div style={{ fontSize:9, fontWeight:800, color:C.orange }}>
                          {formatMon(ev.start_date)}
                        </div>
                        <div style={{ fontSize:20, fontWeight:800, color:C.navy, lineHeight:1 }}>
                          {formatDay(ev.start_date)}
                        </div>
                      </div>
                      <div>
                        <p style={{ fontWeight:700, fontSize:13, margin:'0 0 2px', color:C.navy }}>{ev.title}</p>
                        {ev.category && (
                          <p style={{ fontSize:11, color:C.muted, margin:0 }}>{ev.category}</p>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:C.muted }}>{formatDate(ev.start_date)}</div>
                    <span style={{
                      display:'inline-block', padding:'3px 10px', borderRadius:4,
                      fontSize:11, fontWeight:600,
                      background:s.bg, color:s.color,
                    }}>{s.label}</span>
                    <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                      <Link href={`/events/${ev.id}`} style={{
                        padding:'5px 10px', borderRadius:5, fontSize:11, fontWeight:600,
                        background:'#EEF2FF', color:'#4F46E5',
                        textDecoration:'none', border:'1px solid #C7D2FE',
                      }}>عرض</Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ─── SIDEBAR COLUMN ─── */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Create event CTA */}
            <div style={{
              background:`linear-gradient(135deg, ${C.orange} 0%, #C94428 100%)`,
              borderRadius:10, padding:'22px 20px', color:'#fff', textAlign:'center',
            }}>
              <div style={{ fontSize:32, marginBottom:10 }}>🎉</div>
              <h3 style={{ fontSize:15, fontWeight:800, margin:'0 0 6px' }}>أنشئ فعالية جديدة</h3>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.85)', margin:'0 0 16px', lineHeight:1.5 }}>
                ابدأ في بيع التذاكر وإدارة الزوار خلال دقائق
              </p>
              <Link href="/events/new" style={{
                display:'block', padding:'10px', borderRadius:8,
                background:'rgba(255,255,255,0.2)', color:'#fff',
                textDecoration:'none', fontWeight:700, fontSize:13,
                border:'1px solid rgba(255,255,255,0.4)',
                transition:'background 0.15s',
              }}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.3)')}
                onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,0.2)')}
              >+ إنشاء فعالية</Link>
            </div>

            {/* Scanner card */}
            <div style={{
              background:C.card, border:`1px solid ${C.border}`,
              borderRadius:10, padding:'18px 16px',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{
                  width:36, height:36, background:'#EAF7E0',
                  borderRadius:8, display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:18,
                }}>📷</div>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>ماسح التذاكر</p>
                  <p style={{ fontSize:11, color:C.muted, margin:0 }}>تحقق من الحضور فوراً</p>
                </div>
              </div>
              <Link href="/scanner" style={{
                display:'block', textAlign:'center', padding:'9px',
                background:'#EAF7E0', borderRadius:7, color:'#3A7D0A',
                textDecoration:'none', fontWeight:700, fontSize:13,
                border:'1px solid #B7E4A0',
              }}>فتح الماسح</Link>
            </div>

            {/* Quick links */}
            <div style={{
              background:C.card, border:`1px solid ${C.border}`,
              borderRadius:10, overflow:'hidden',
            }}>
              <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, background:'#F8F7FA' }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>روابط سريعة</p>
              </div>
              {[
                { label:'إدارة الكوادر',  href:'/staffing',  icon:'👷' },
                { label:'إعدادات الحساب', href:'/settings',  icon:'⚙️' },
                { label:'خطة الاشتراك',   href:'/billing',   icon:'💳' },
              ].map(({ label, href, icon }) => (
                <Link key={label} href={href} style={{ textDecoration:'none' }}>
                  <div style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding:'11px 16px', borderBottom:`1px solid ${C.border}`,
                    color:C.text, fontSize:13, fontWeight:600,
                    transition:'background 0.12s',
                  }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#F8F7FA')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                  >
                    <span style={{ fontSize:16 }}>{icon}</span>
                    <span>{label}</span>
                    <span style={{ marginRight:'auto', color:C.muted, fontSize:16 }}>←</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Tips */}
            <div style={{
              background:'#F0F4FF', border:'1px solid #C7D2FE',
              borderRadius:10, padding:'16px',
            }}>
              <p style={{ fontSize:12, fontWeight:800, color:'#4F46E5', margin:'0 0 8px' }}>💡 نصيحة</p>
              <p style={{ fontSize:12, color:'#3730A3', margin:0, lineHeight:1.6 }}>
                أضف صوراً احترافية لفعاليتك وارفع نسبة التسجيل بنسبة تصل إلى 40٪
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
