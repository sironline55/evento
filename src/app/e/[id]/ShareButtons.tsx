'use client'
import { useState } from 'react'

const C = { muted:'#6F7287', border:'#DBDAE3', card:'#FFFFFF', navy:'#1E0A3C' }

export default function ShareButtons({ eventTitle, pageUrl, accent }: {
  eventTitle: string
  pageUrl: string
  accent: string
}) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      alert(pageUrl)
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({ title: eventTitle, url: pageUrl })
    } else {
      copyLink()
    }
  }

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${eventTitle}\nسجّل الآن: ${pageUrl}`)}`
  const xUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(eventTitle)}&url=${encodeURIComponent(pageUrl)}`

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
      <div>
        <p style={{ fontWeight:700, color:C.navy, fontSize:14, margin:0 }}>شارك الفعالية</p>
        <p style={{ color:C.muted, fontSize:12, margin:'3px 0 0' }}>أرسل الرابط لأصدقائك</p>
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <button onClick={copyLink} style={{
          padding:'8px 14px', background: copied ? '#EAF7E0' : '#F8F7FA',
          color: copied ? '#166534' : C.navy,
          border:`1px solid ${copied ? '#9DE07B' : C.border}`,
          borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit'
        }}>
          {copied ? '✅ تم النسخ' : '🔗 نسخ الرابط'}
        </button>
        <a href={waUrl} target="_blank" rel="noopener" style={{
          padding:'8px 14px', background:'#25D366', color:'#fff',
          borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:600
        }}>واتساب</a>
        <a href={xUrl} target="_blank" rel="noopener" style={{
          padding:'8px 14px', background:'#000', color:'#fff',
          borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:600
        }}>X</a>
        <button onClick={nativeShare} style={{
          padding:'8px 14px', background:'#F8F7FA', color:C.navy,
          border:`1px solid ${C.border}`, borderRadius:8,
          fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit'
        }}>📤 مشاركة</button>
      </div>
    </div>
  )
}
