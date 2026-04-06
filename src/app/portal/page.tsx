'use client'
export const dynamic = 'force-dynamic'
import Link from 'next/link'

const C = { navy:'#1E0A3C', orange:'#F05537', card:'#FFFFFF', border:'#DBDAE3', muted:'#6F7287' }

const PORTALS = [
  {
    href: '/super-admin',
    icon: '👑',
    title: 'بوابة الإدارة العليا',
    subtitle: 'Super Admin',
    desc: 'إدارة شركات الفعاليات، الباقات، الميزات، وإحصاءات المنصة',
    color: '#1E0A3C',
    bg: 'linear-gradient(135deg, #1E0A3C 0%, #3D1A78 100%)',
    badge: 'Platform Owner',
  },
  {
    href: '/login',
    icon: '🏢',
    title: 'بوابة المنظم',
    subtitle: 'Event Organizer',
    desc: 'إدارة الفعاليات، الكوادر، الزوار، التذاكر، والتقارير',
    color: '#F05537',
    bg: 'linear-gradient(135deg, #F05537 0%, #D9442A 100%)',
    badge: 'Organizer',
  },
  {
    href: '/staff/login',
    icon: '👷',
    title: 'بوابة الكادر',
    subtitle: 'Staff Portal',
    desc: 'ماسح التذاكر، استقبال الضيوف، إدارة الحشود، الباركينغ',
    color: '#0070B8',
    bg: 'linear-gradient(135deg, #0070B8 0%, #005A94 100%)',
    badge: 'Staff',
  },
  {
    href: '/ticket',
    icon: '🎟',
    title: 'بوابة الزائر',
    subtitle: 'Visitor',
    desc: 'عرض تذكرتك الرقمية، رمز QR، وتفاصيل الفعالية',
    color: '#3A7D0A',
    bg: 'linear-gradient(135deg, #3A7D0A 0%, #2D6208 100%)',
    badge: 'Visitor',
  },
]

export default function PortalPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#FAFAFA', direction:'rtl' }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, #1E0A3C, #3D1A78)`, padding:'48px 24px', textAlign:'center' }}>
        <div style={{ width:52, height:52, background:'#F05537', borderRadius:12, display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
          <span style={{ color:'#fff', fontWeight:800, fontSize:22 }}>E</span>
        </div>
        <h1 style={{ color:'#fff', fontSize:32, fontWeight:800, margin:'0 0 8px', letterSpacing:'-0.5px' }}>EventVMS</h1>
        <p style={{ color:'rgba(255,255,255,0.65)', fontSize:15, margin:0 }}>نظام إدارة الفعاليات والكوادر البشرية</p>
      </div>

      {/* Portals grid */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'40px 16px' }}>
        <p style={{ textAlign:'center', color:C.muted, fontSize:14, marginBottom:32, fontWeight:600 }}>اختر البوابة المناسبة لك</p>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20 }}>
          {PORTALS.map(p => (
            <Link key={p.href} href={p.href} style={{ textDecoration:'none' }}>
              <div style={{
                background:C.card, border:`1px solid ${C.border}`, borderRadius:16,
                overflow:'hidden', transition:'transform 0.2s, box-shadow 0.2s', cursor:'pointer'
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 12px 40px rgba(0,0,0,0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow='none' }}
              >
                {/* Top band */}
                <div style={{ background:p.bg, padding:'28px 24px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-20, left:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>
                  <div style={{ fontSize:40, marginBottom:10 }}>{p.icon}</div>
                  <span style={{ display:'inline-block', background:'rgba(255,255,255,0.2)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 10px', borderRadius:20, marginBottom:8, letterSpacing:1 }}>
                    {p.badge}
                  </span>
                  <h2 style={{ color:'#fff', fontSize:18, fontWeight:800, margin:0 }}>{p.title}</h2>
                  <p style={{ color:'rgba(255,255,255,0.7)', fontSize:12, margin:'2px 0 0' }}>{p.subtitle}</p>
                </div>

                {/* Description */}
                <div style={{ padding:'18px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                  <p style={{ fontSize:13, color:C.muted, margin:0, lineHeight:1.6 }}>{p.desc}</p>
                  <div style={{
                    width:36, height:36, background:p.color, borderRadius:'50%',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#fff', fontSize:16, flexShrink:0
                  }}>←</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p style={{ textAlign:'center', color:C.muted, fontSize:12, marginTop:32 }}>
          EventVMS © 2025 — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  )
}
