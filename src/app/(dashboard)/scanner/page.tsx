'use client'
import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF'
}

export default function ScannerPage() {
  const [qrInput, setQrInput]   = useState('')
  const [result, setResult]     = useState<any>(null)
  const [loading, setLoading]   = useState(false)
  const [history, setHistory]   = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleScan(code: string) {
    if (!code.trim() || loading) return
    setLoading(true)
    setResult(null)
    try {
      const { data: reg } = await sb.from('registrations')
        .select('id,guest_name,guest_email,guest_phone,status,qr_code,events(title)')
        .eq('qr_code', code.trim())
        .single()

      if (!reg) {
        setResult({ type:'error', message:'لم يُعثر على هذا الرمز' })
      } else if (reg.status === 'attended') {
        setResult({ type:'warning', message:'تم التحقق مسبقاً', name: reg.guest_name, event: (reg.events as any)?.title })
      } else {
        await sb.from('registrations').update({ status:'attended', checked_in_at: new Date().toISOString() }).eq('id', reg.id)
        setResult({ type:'success', message:'تم التحقق بنجاح ✓', name: reg.guest_name, event: (reg.events as any)?.title })
        setHistory(h => [{ name: reg.guest_name, event: (reg.events as any)?.title, time: new Date().toLocaleTimeString('ar-SA'), type:'success' }, ...h.slice(0, 19)])
      }
    } catch {
      setResult({ type:'error', message:'خطأ في الاتصال' })
    } finally {
      setLoading(false)
      setQrInput('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const RESULT_STYLES: Record<string,{bg:string;border:string;color:string;icon:string}> = {
    success: { bg:'#EAF7E0', border:'#3A7D0A', color:'#1A5A00', icon:'✅' },
    warning: { bg:'#FFF8E8', border:'#B07000', color:'#7A5000', icon:'⚠️' },
    error:   { bg:'#FEF2F2', border:'#DC2626', color:'#B91C1C', icon:'❌' },
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'24px 32px' }}>
        <h1 style={{ fontSize:40, fontWeight:800, margin:0, color:C.navy, letterSpacing:'-1px' }}>ماسح التذاكر</h1>
        <p style={{ color:C.muted, fontSize:13, marginTop:4 }}>امسح رمز QR للتحقق من الحضور</p>
      </div>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'28px 24px' }}>

        {/* Scanner input */}
        <div style={{ background:C.card, border:`2px solid ${C.border}`, borderRadius:16, padding:24, marginBottom:20, textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>📷</div>
          <p style={{ fontSize:15, fontWeight:600, color:C.navy, margin:'0 0 16px' }}>
            وجّه الماسح نحو رمز QR أو أدخله يدوياً
          </p>
          <input
            ref={inputRef}
            value={qrInput}
            onChange={e => setQrInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleScan(qrInput) }}
            placeholder="رمز التذكرة..."
            style={{
              width:'100%', padding:'14px 18px', border:`2px solid ${C.border}`,
              borderRadius:10, fontSize:16, outline:'none', fontFamily:'inherit',
              color:C.text, background:C.bg, boxSizing:'border-box' as const,
              textAlign:'center', letterSpacing:'0.1em'
            }}
          />
          <button onClick={() => handleScan(qrInput)} disabled={loading || !qrInput.trim()} style={{
            marginTop:14, padding:'12px 32px', border:'none', borderRadius:8,
            background: qrInput.trim() ? C.orange : '#D1D5DB',
            color:'#fff', fontWeight:700, fontSize:15, cursor: qrInput.trim() ? 'pointer' : 'not-allowed',
            width:'100%', transition:'background 0.2s'
          }}>
            {loading ? 'جاري التحقق...' : 'تحقق من التذكرة'}
          </button>
        </div>

        {/* Result */}
        {result && (() => {
          const s = RESULT_STYLES[result.type] || RESULT_STYLES.error
          return (
            <div style={{ background:s.bg, border:`2px solid ${s.border}`, borderRadius:14, padding:20, marginBottom:20, textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:8 }}>{s.icon}</div>
              <p style={{ fontSize:18, fontWeight:700, color:s.color, margin:'0 0 6px' }}>{result.message}</p>
              {result.name && <p style={{ fontSize:15, fontWeight:600, color:C.navy, margin:'0 0 4px' }}>{result.name}</p>}
              {result.event && <p style={{ fontSize:13, color:C.muted, margin:0 }}>📅 {result.event}</p>}
            </div>
          )
        })()}

        {/* History */}
        {history.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}` }}>
              <h2 style={{ fontSize:15, fontWeight:700, margin:0, color:C.navy }}>آخر عمليات المسح ({history.length})</h2>
            </div>
            {history.map((h,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 18px', borderBottom: i<history.length-1 ? `1px solid ${C.border}` : 'none' }}>
                <span style={{ fontSize:18 }}>{h.type==='success'?'✅':'⚠️'}</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:600, fontSize:13, margin:0, color:C.navy }}>{h.name}</p>
                  <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{h.event}</p>
                </div>
                <span style={{ fontSize:11, color:C.muted }}>{h.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
