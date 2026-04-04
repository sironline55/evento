'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const nav = [
  { href: '/', label: 'الرئيسية', emoji: '🏠' },
  { href: '/events', label: 'الفعاليات', emoji: '📅' },
  { href: '/attendees', label: 'المسجلون', emoji: '👥' },
  { href: '/scanner', label: 'الماسح', emoji: '📷' },
  { href: '/staffing', label: 'الكوادر البشرية', emoji: '🤝' },
  { href: '/billing', label: 'الاشتراك', emoji: '💳' },
  { href: '/settings', label: 'الإعدادات', emoji: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{ position:'fixed',top:16,right:16,zIndex:50,background:'#fff',border:'1px solid #e5e7eb',borderRadius:8,padding:'6px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:13 }}
        className="md:hidden"
      >
        {open ? '✕' : '☰'} القائمة
      </button>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',zIndex:30 }} className="md:hidden" />
      )}

      <aside
        style={{ position:'fixed',right:0,top:0,height:'100%',width:240,background:'#fff',borderLeft:'1px solid #f0f0f0',zIndex:40,direction:'rtl',display:'flex',flexDirection:'column' }}
        className={open ? '' : 'hidden md:flex'}
      >
        <div style={{ padding:'24px 20px',borderBottom:'1px solid #f0f0f0' }}>
          <h1 style={{ fontSize:20,fontWeight:700,color:'#2B6E64',margin:0 }}>EventVMS</h1>
          <p style={{ fontSize:11,color:'#9ca3af',marginTop:4,marginBottom:0 }}>نظام إدارة الفعاليات</p>
        </div>

        <nav style={{ padding:12,flex:1,overflowY:'auto' }}>
          {nav.map(({ href, label, emoji }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
                  borderRadius:10,marginBottom:2,textDecoration:'none',fontSize:14,fontWeight:500,
                  background: active ? '#2B6E64' : 'transparent',
                  color: active ? '#fff' : '#374151',
                  transition:'all 0.15s'
                }}
              >
                <span style={{ fontSize:16 }}>{emoji}</span>
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
