'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { QRService } from '@/services/QRService'
import jsQR from 'jsqr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [scanning, setScanning] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [stats, setStats] = useState({ total: 0, attended: 0, registered: 0 })
  const [result, setResult] = useState<{ valid: boolean; message: string; registration?: any } | null>(null)
  const [manualSearch, setManualSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [allRegistrations, setAllRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    if (selectedEventId) loadRegistrations()
  }, [selectedEventId])

  async function loadEvents() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    const { data: evs } = await supabase
      .from('events')
      .select('id, title, start_date')
      .eq('created_by', data.user.id)
      .order('start_date', { ascending: false })
    setEvents(evs || [])
    if (evs && evs.length > 0) setSelectedEventId(evs[0].id)
  }

  async function loadRegistrations() {
    setLoading(true)
    try {
      const { registrations, stats: s } = await QRService.getEventRegistrations(selectedEventId)
      setAllRegistrations(registrations)
      setStats(s)
    } catch(e) {}
    finally { setLoading(false) }
  }

  const startScanning = async () => {
    setResult(null)
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        scanLoop()
      }
    } catch(e) {
      alert('لا يمكن الوصول للكاميرا')
      setScanning(false)
    }
  }

  const stopScanning = () => {
    setScanning(false)
    cancelAnimationFrame(animRef.current)
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
  }

  const scanLoop = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !scanning) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      })
      if (code?.data) {
        handleQRDetected(code.data)
        return
      }
    }
    animRef.current = requestAnimationFrame(scanLoop)
  }, [scanning])

  async function handleQRDetected(qrData: string) {
    stopScanning()
    setLoading(true)
    try {
      const res = await QRService.validateAndCheckIn(qrData)
      setResult(res)
      if (res.valid) loadRegistrations()
    } catch(e) {
      setResult({ valid: false, message: 'خطأ في التحقق' })
    } finally { setLoading(false) }
  }

  function handleSearch(q: string) {
    setManualSearch(q)
    if (q.length < 2) { setSearchResults([]); return }
    const results = allRegistrations.filter(r =>
      r.guest_name?.toLowerCase().includes(q.toLowerCase()) ||
      r.guest_phone?.includes(q) ||
      r.guest_email?.toLowerCase().includes(q.toLowerCase())
    )
    setSearchResults(results)
  }

  async function checkInManual(reg: any) {
    setLoading(true)
    try {
      await supabase
        .from('registrations')
        .update({ status: 'attended', checked_in_at: new Date().toISOString(), check_in_method: 'manual' })
        .eq('id', reg.id)
      setResult({ valid: true, message: 'تم تسجيل الدخول يدوياً ✅', registration: reg })
      setSearchResults([])
      setManualSearch('')
      loadRegistrations()
    } catch(e) {} finally { setLoading(false) }
  }

  const pct = stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0

  return (
    <div style={{ padding: 24, direction: 'rtl', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>🎫 ماسح QR</h1>

      {/* اختيار الفعالية */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, border: '1px solid #f0f0f0' }}>
        <label style={{ fontSize: 13, color: '#666', marginBottom: 8, display: 'block' }}>الفعالية</label>
        <select
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 15 }}
        >
          <option value="">اختر الفعالية</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      </div>

      {/* الإحصائيات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'إجمالي المسجلين', value: stats.total, color: '#2B6E64' },
          { label: 'حضروا', value: stats.attended, color: '#0891b2' },
          { label: 'نسبة الحضور', value: pct + '%', color: '#7c3aed' }
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f0f0f0', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* الكاميرا */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f0f0f0' }}>
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>📷 مسح QR Code</h3>
          <div style={{ position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', aspectRatio: '1', marginBottom: 16 }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {!scanning && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 48 }}>📷</span>
                <p style={{ color: '#fff', fontSize: 14 }}>اضغط للمسح</p>
              </div>
            )}
            {scanning && (
              <div style={{ position: 'absolute', inset: 0, border: '3px solid #2B6E64', borderRadius: 12, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '25%', left: '25%', right: '25%', bottom: '25%', border: '2px dashed #2B6E64', borderRadius: 8 }} />
              </div>
            )}
          </div>
          {!scanning ? (
            <button
              onClick={startScanning}
              disabled={!selectedEventId}
              style={{ width: '100%', padding: '12px', background: selectedEventId ? '#2B6E64' : '#e5e7eb', color: selectedEventId ? '#fff' : '#999', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 600, cursor: selectedEventId ? 'pointer' : 'not-allowed' }}
            >
              🚀 ابدأ المسح
            </button>
          ) : (
            <button
              onClick={stopScanning}
              style={{ width: '100%', padding: '12px', background: '#ef4444', color: '#fff', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >
              ⏹ إيقاف المسح
            </button>
          )}
        </div>

        {/* النتيجة + البحث اليدوي */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* نتيجة المسح */}
          {result && (
            <div style={{ background: result.valid ? '#f0fdf4' : '#fef2f2', border: `1px solid ${result.valid ? '#86efac' : '#fca5a5'}`, borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: result.valid ? '#166534' : '#991b1b', marginBottom: 8 }}>
                {result.valid ? '✅' : '❌'} {result.message}
              </p>
              {result.registration && (
                <div style={{ fontSize: 14, color: '#374151' }}>
                  <p>👤 {result.registration.guest_name}</p>
                  {result.registration.guest_phone && <p>📱 {result.registration.guest_phone}</p>}
                  <p>🎫 {result.registration.ticket_type || 'عام'}</p>
                </div>
              )}
              <button onClick={() => { setResult(null); startScanning() }} style={{ marginTop: 12, padding: '8px 16px', background: '#2B6E64', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13 }}>
                مسح آخر
              </button>
            </div>
          )}

          {/* البحث اليدوي */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f0f0f0', flex: 1 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>🔍 بحث يدوي</h3>
            <input
              value={manualSearch}
              onChange={e => handleSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الجوال..."
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <div style={{ marginTop: 12, maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchResults.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f9fafb', borderRadius: 10 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{r.guest_name}</p>
                    <p style={{ fontSize: 12, color: '#666' }}>{r.guest_phone || r.guest_email || ''}</p>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: r.status === 'attended' ? '#d1fae5' : '#fef9c3', color: r.status === 'attended' ? '#065f46' : '#713f12' }}>
                      {r.status === 'attended' ? 'حضر' : 'مسجل'}
                    </span>
                  </div>
                  {r.status !== 'attended' && (
                    <button onClick={() => checkInManual(r)} style={{ padding: '6px 14px', background: '#2B6E64', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      تسجيل
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
