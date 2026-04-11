'use client'
import { useEffect, useState } from 'react'

export default function PWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(reg => console.log('[SW] Registered', reg.scope))
        .catch(err => console.warn('[SW] Error', err))
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Capture install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      // Show banner after 3 seconds
      setTimeout(() => setShowBanner(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler as any)

    // iOS detection
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isInStandalone = window.navigator.standalone
    if (isIOS && !isInStandalone) {
      setTimeout(() => setShowBanner(true), 5000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler as any)
  }, [])

  async function install() {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setShowBanner(false)
    setInstallPrompt(null)
  }

  if (!showBanner || isInstalled) return null

  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

  return (
    <div style={{
      position:'fixed', bottom: 80, left: 16, right: 16, zIndex: 9998,
      background:'#1E0A3C', border:'1px solid rgba(255,255,255,.2)',
      borderRadius: 16, padding:'16px 18px',
      boxShadow:'0 8px 32px rgba(0,0,0,.4)',
      display:'flex', alignItems:'center', gap:14,
      fontFamily:'Tajawal,sans-serif', direction:'rtl',
      animation:'slideUp .3s ease'
    }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ width:44, height:44, background:'#F05537', borderRadius:10,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:22, flexShrink:0 }}>
        🎪
      </div>

      <div style={{ flex:1 }}>
        <p style={{ fontSize:14, fontWeight:700, color:'#fff', margin:'0 0 2px' }}>
          ثبّت التطبيق
        </p>
        <p style={{ fontSize:12, color:'rgba(255,255,255,.6)', margin:0 }}>
          {isIOS
            ? 'اضغط على مشاركة ← إضافة إلى الشاشة الرئيسية'
            : 'أضف EventVMS لشاشتك الرئيسية'}
        </p>
      </div>

      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
        {!isIOS && (
          <button onClick={install} style={{
            padding:'8px 14px', background:'#F05537', color:'#fff',
            border:'none', borderRadius:8, fontSize:13, fontWeight:700,
            cursor:'pointer', fontFamily:'inherit'
          }}>تثبيت</button>
        )}
        <button onClick={() => setShowBanner(false)} style={{
          padding:'8px 12px', background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.7)',
          border:'none', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit'
        }}>✕</button>
      </div>
    </div>
  )
}
