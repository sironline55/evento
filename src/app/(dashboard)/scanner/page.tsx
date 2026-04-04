'use client'
import { useState, useRef, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF',
  green:'#3A7D0A', greenBg:'#EAF7E0', greenBorder:'#B7E4A0',
}

type ScanResult = {
  type: 'success'|'warning'|'error'
  message: string
  name?: string
  event?: string
  ticketType?: string
  time?: string
}

type HistoryItem = {
  name: string; event: string; time: string; type: string; id: string
}

const RESULT_STYLES = {
  success: { bg:'#EAF7E0', border:'#3A7D0A', color:'#1A5A00', icon:'✅', label:'تم الحضور' },
  warning: { bg:'#FFF8E8', border:'#B07000', color:'#7A5000', icon:'⚠️', label:'مسجّل مسبقاً' },
  error:   { bg:'#FEF2F2', border:'#DC2626', color:'#B91C1C', icon:'❌', label:'غير صالح' },
}

export default function ScannerPage() {
  const [qrInput, setQrInput]   = useState('')
  const [result, setResult]     = useState<ScanResult|null>(null)
  const [loading, setLoading]   = useState(false)
  const [history, setHistory]   = useState<HistoryItem[]>([])
  const [events, setEvents]     = useState<{id:string;title:string}[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [stats, setStats]       = useState({ scanned:0, success:0, duplicate:0, invalid:0 })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    // Load published events for filter
    sb.from('events').select('id,title')
      .in('status', ['published','active'])
      .order('start_date', { ascending:false })
      .limit(20)
      .then(({ data }) => setEvents(data||[]))
  }, [])

  async function handleScan(code?: string) {
    const qr = (code || qrInput).trim()
    if (!qr || loading) return
    setLoading(true)
    setResult(null)

    try {
      let query = sb.from('registrations')
        .select('id,guest_name,guest_email,status,qr_code,ticket_type,event_id,events(title)')
        .eq('qr_code', qr)

      if (selectedEvent !== 'all') {
        query = query.eq('event_id', selectedEvent)
      }

      const { data: reg } = await query.single()

      const now = new Date()
      const timeStr = now.toLocaleTimeString('ar-SA', { hour:'2-digit', minute:'2-digit' })

      if (!reg) {
        const r: ScanResult = { type:'error', message:'لم يُعثر على هذا الرمز في قاعدة البيانات' }
        setResult(r)
        setStats(s => ({ ...s, scanned:s.scanned+1, invalid:s.invalid+1 }))
      } else if (reg.status === 'attended') {
        const r: ScanResult = {
          type:'warning',
          message:'تم تسجيل الحضور بالفعل',
          name: reg.guest_name,
          event: (reg.events as any)?.title,
          ticketType: reg.ticket_type,
          time: timeStr,
        }
        setResult(r)
        setStats(s => ({ ...s, scanned:s.scanned+1, duplicate:s.duplicate+1 }))
      } else {
        await sb.from('registrations').update({
          status: 'attended',
          checked_in_at: now.toISOString(),
        }).eq('id', reg.id)

        const r: ScanResult = {
          type:'success',
          message:'تم تسجيل الحضور بنجاح',
          name: reg.guest_name,
          event: (reg.events as any)?.title,
          ticketType: reg.ticket_type,
          time: timeStr,
        }
        setResult(r)
        setStats(s => ({ ...s, scanned:s.scanned+1, success:s.success+1 }))
        setHistory(h => [{
          name: reg.guest_name,
          event: (reg.events as any)?.title,
          time: timeStr,
          type: 'success',
          id: reg.id,
        }, ...h.slice(0, 49)])
      }
    } catch (err) {
      setResult({ type:'error', message:'خطأ في الاتصال — تأكد من الإنترنت' })
      setStats(s => ({ ...s, scanned:s.scanned+1, invalid:s.invalid+1 }))
    } finally {
      setLoading(false)
      setQrInput('')
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleScan()
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>

      {/* Header */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'20px 32px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:800, margin:0, color:C.navy }}>📷 ماسح التذاكر</h1>
            <p style={{ color:C.muted, fontSize:13, marginTop:3, margin:0 }}>
              امسح رمز QR أو أدخله يدوياً لتسجيل الحضور
            </p>
          </div>
          <Link href="/events" style={{
            padding:'9px 18px', border:`1px solid ${C.border}`,
            borderRadius:7, color:C.text, textDecoration:'none',
            fontWeight:600, fontSize:13, background:C.card,
          }}>← الفعاليات</Link>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, alignItems:'start' }}>

          {/* LEFT: Scanner */}
          <div>

            {/* Event filter */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:18, marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:700, color:C.navy, display:'block', marginBottom:8 }}>
                🎯 تصفية حسب الفعالية
              </label>
              <select
                value={selectedEvent}
                onChange={e => setSelectedEvent(e.target.value)}
                style={{
                  width:'100%', padding:'10px 14px',
                  border:`1px solid ${C.border}`, borderRadius:7,
                  fontSize:13, color:C.text, background:C.bg,
                  outline:'none', fontFamily:'inherit',
                }}
              >
                <option value="all">جميع الفعاليات</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>

            {/* Main scanner input */}
            <div style={{
              background:C.card, border:`2px solid ${C.border}`,
              borderRadius:12, padding:24, marginBottom:16, textAlign:'center',
            }}>
              <div style={{
                width:80, height:80, borderRadius:16, margin:'0 auto 16px',
                background: loading ? '#FFF8E8' : result?.type === 'success' ? C.greenBg : result?.type === 'error' ? '#FEF2F2' : '#F0F4FF',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:36,
                border: `2px solid ${loading ? '#B07000' : result?.type === 'success' ? C.green : result?.type === 'error' ? '#DC2626' : '#C7D2FE'}`,
                transition:'all 0.3s',
              }}>
                {loading ? '⏳' : result?.type === 'success' ? '✅' : result?.type === 'error' ? '❌' : result?.type === 'warning' ? '⚠️' : '📷'}
              </div>

              <p style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 14px' }}>
                {loading ? 'جاري التحقق...' : 'وجّه الماسح نحو رمز QR أو أدخله يدوياً'}
              </p>

              <input
                ref={inputRef}
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="أدخل رمز التذكرة..."
                disabled={loading}
                style={{
                  width:'100%', padding:'14px 18px',
                  border:`2px solid ${qrInput ? C.orange : C.border}`,
                  borderRadius:10, fontSize:16, outline:'none', fontFamily:'inherit',
                  color:C.navy, background:C.bg, boxSizing:'border-box' as const,
                  textAlign:'center', letterSpacing:'0.15em', transition:'border-color 0.2s',
                  direction:'ltr',
                }}
              />

              <button
                onClick={() => handleScan()}
                disabled={loading || !qrInput.trim()}
                style={{
                  marginTop:12, padding:'13px 32px', border:'none',
                  borderRadius:9, width:'100%',
                  background: qrInput.trim() && !loading ? C.orange : '#D1D5DB',
                  color:'#fff', fontWeight:800, fontSize:15,
                  cursor: qrInput.trim() && !loading ? 'pointer' : 'not-allowed',
                  transition:'background 0.2s',
                }}
              >
                {loading ? '⏳ جاري التحقق...' : '✓ تحقق من التذكرة'}
              </button>

              <p style={{ fontSize:11, color:C.muted, marginTop:10 }}>
                يدعم الماسح الضوئي USB — اضغط Enter بعد المسح
              </p>
            </div>

            {/* Result */}
            {result && (() => {
              const s = RESULT_STYLES[result.type]
              return (
                <div style={{
                  background:s.bg, border:`2px solid ${s.border}`,
                  borderRadius:12, padding:20, marginBottom:16,
                  animation:'fadeIn 0.3s ease',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                    <span style={{ fontSize:28 }}>{s.icon}</span>
                    <div>
                      <p style={{ fontSize:15, fontWeight:800, color:s.color, margin:0 }}>{s.label}</p>
                      <p style={{ fontSize:12, color:s.color, margin:0, opacity:0.8 }}>{result.message}</p>
                    </div>
                  </div>
                  {result.name && (
                    <div style={{
                      background:'rgba(255,255,255,0.6)', borderRadius:8,
                      padding:'10px 14px', marginTop:8,
                    }}>
                      <p style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 3px' }}>
                        👤 {result.name}
                      </p>
                      {result.event && (
                        <p style={{ fontSize:12, color:C.muted, margin:'0 0 2px' }}>📅 {result.event}</p>
                      )}
                      {result.ticketType && (
                        <p style={{ fontSize:12, color:C.muted, margin:0 }}>🎟 {result.ticketType}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Session stats */}
            <div style={{
              display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10,
            }}>
              {[
                { label:'إجمالي المسح', value:stats.scanned, bg:'#F0F4FF', color:'#4F46E5', border:'#C7D2FE' },
                { label:'ناجح',         value:stats.success,   bg:C.greenBg, color:C.green, border:C.greenBorder },
                { label:'مكرر',         value:stats.duplicate, bg:'#FFF8E8', color:'#B07000', border:'#FDE68A' },
                { label:'غير صالح',    value:stats.invalid,   bg:'#FEF2F2', color:'#DC2626', border:'#FECACA' },
              ].map(s => (
                <div key={s.label} style={{
                  background:s.bg, border:`1px solid ${s.border}`,
                  borderRadius:8, padding:'12px 10px', textAlign:'center',
                }}>
                  <p style={{ fontSize:24, fontWeight:800, color:s.color, margin:'0 0 3px' }}>{s.value}</p>
                  <p style={{ fontSize:10, color:s.color, margin:0, opacity:0.8 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: History */}
          <div style={{
            background:C.card, border:`1px solid ${C.border}`,
            borderRadius:10, overflow:'hidden',
          }}>
            <div style={{
              padding:'12px 16px', borderBottom:`1px solid ${C.border}`,
              background:'#F8F7FA',
              display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>
                📜 سجل المسح ({history.length})
              </p>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  style={{
                    fontSize:11, color:C.muted, background:'none',
                    border:'none', cursor:'pointer', padding:'3px 6px',
                    borderRadius:4,
                  }}
                >مسح</button>
              )}
            </div>

            {history.length === 0 ? (
              <div style={{ padding:'40px 16px', textAlign:'center' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
                <p style={{ fontSize:13, color:C.muted, margin:0 }}>
                  سجل المسح فارغ — ابدأ بمسح التذاكر
                </p>
              </div>
            ) : (
              <div style={{ maxHeight:500, overflowY:'auto' }}>
                {history.map((h, i) => (
                  <div key={i} style={{
                    padding:'12px 16px',
                    borderBottom: i < history.length-1 ? `1px solid ${C.border}` : 'none',
                    display:'flex', alignItems:'center', gap:10,
                  }}>
                    <span style={{ fontSize:16 }}>
                      {h.type === 'success' ? '✅' : '⚠️'}
                    </span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{
                        fontSize:13, fontWeight:700, color:C.navy, margin:'0 0 2px',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      }}>{h.name}</p>
                      <p style={{
                        fontSize:11, color:C.muted, margin:0,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      }}>{h.event}</p>
                    </div>
                    <span style={{ fontSize:10, color:C.muted, flexShrink:0 }}>{h.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:none } }
      `}</style>
    </div>
  )
}
