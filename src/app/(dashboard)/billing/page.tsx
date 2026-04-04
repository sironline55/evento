'use client'
import Link from 'next/link'

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF'
}

export default function Page() {
  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'24px 32px' }}>
        <h1 style={{ fontSize:40, fontWeight:800, margin:0, color:C.navy, letterSpacing:'-1px' }}>المالية</h1>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:16 }}>
        <div style={{ fontSize:64 }}>💳</div>
        <h2 style={{ fontSize:22, fontWeight:700, color:C.navy, margin:0 }}>إدارة الاشتراك والفواتير</h2>
        <p style={{ color:C.muted, fontSize:14 }}>قيد التطوير — ستتاح قريباً</p>
        <Link href="/events" style={{ padding:'10px 24px', background:C.orange, color:'#fff', borderRadius:6, textDecoration:'none', fontWeight:700, fontSize:14 }}>
          العودة للفعاليات
        </Link>
      </div>
    </div>
  )
}
