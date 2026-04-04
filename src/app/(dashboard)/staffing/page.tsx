
'use client'
import { useState, useEffect } from 'react'
import { WorkerService } from '@/services/WorkerService'
import Link from 'next/link'

const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الطائف', 'تبوك', 'القصيم']

export default function StaffingPage() {
  const [workers, setWorkers] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, available: 0 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ city: '', gender: '', min_rate: '', max_rate: '' })
  const [showRequest, setShowRequest] = useState(false)
  const [requestForm, setRequestForm] = useState({ title: '', city: '', event_date: '', duration_hours: '8', workers_needed: '5', role_type: 'استقبال', daily_rate: '150', gender_preference: 'any', description: '' })
  const [requestLoading, setRequestLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [w, s] = await Promise.all([WorkerService.search({ limit: 20 }), WorkerService.getStats()])
      setWorkers(w); setStats(s)
    } catch(e) {}
    finally { setLoading(false) }
  }

  async function search() {
    setLoading(true)
    try {
      const w = await WorkerService.search({ city: filters.city || undefined, gender: filters.gender || undefined, min_rate: filters.min_rate ? parseInt(filters.min_rate) : undefined, max_rate: filters.max_rate ? parseInt(filters.max_rate) : undefined, limit: 20 })
      setWorkers(w)
    } catch(e) {}
    finally { setLoading(false) }
  }

  async function submitRequest() {
    setRequestLoading(true)
    try {
      await WorkerService.createRequest({ ...requestForm as any, duration_hours: parseInt(requestForm.duration_hours), workers_needed: parseInt(requestForm.workers_needed), daily_rate: parseInt(requestForm.daily_rate) })
      setShowRequest(false)
      alert('تم إرسال طلب التوظيف! سنتواصل معك قريباً.')
    } catch(e) { alert('حدث خطأ') }
    finally { setRequestLoading(false) }
  }

  return (
    <div style={{ padding: 24, direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>إدارة الكوادر البشرية</h1>
          <p style={{ color: '#666', fontSize: 14 }}>ابحث عن موظفين مؤهلين لفعالياتك</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/workers/register" target="_blank" style={{ padding: '10px 20px', background: '#f3f4f6', color: '#374151', borderRadius: 10, textDecoration: 'none', fontSize: 14 }}>
            رابط التسجيل للعمال
          </Link>
          <button onClick={() => setShowRequest(true)} style={{ padding: '10px 20px', background: '#2B6E64', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
            + طلب توظيف جديد
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[{ label: 'إجمالي المسجلين', value: stats.total, color: '#2B6E64' }, { label: 'عمال نشطون', value: stats.active, color: '#0891b2' }, { label: 'متاح الآن', value: stats.available, color: '#7c3aed' }].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f0f0f0' }}>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value.toLocaleString('ar')}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
          <select value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})} style={fInp}>
            <option value="">كل المدن</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.gender} onChange={e => setFilters({...filters, gender: e.target.value})} style={fInp}>
            <option value="">ذكر وأنثى</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
          <input type="number" placeholder="أجر من" value={filters.min_rate} onChange={e => setFilters({...filters, min_rate: e.target.value})} style={fInp} />
          <input type="number" placeholder="أجر إلى" value={filters.max_rate} onChange={e => setFilters({...filters, max_rate: e.target.value})} style={fInp} />
        </div>
        <button onClick={search} style={{ background: '#2B6E64', color: '#fff', padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          🔍 بحث
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>جاري التحميل...</div>
      ) : workers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>👥</p>
          <p style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>لا يوجد عمال مسجلون بعد</p>
          <p style={{ color: '#666', marginBottom: 20 }}>شارك رابط التسجيل لبدء بناء قاعدة البيانات</p>
          <Link href="/workers/register" target="_blank" style={{ padding: '12px 24px', background: '#2B6E64', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 600 }}>
            انسخ رابط التسجيل
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {workers.map(w => (
            <div key={w.id} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 52, height: 52, background: w.gender === 'female' ? '#fce7f3' : '#e0f2fe', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {w.gender === 'female' ? '👩' : '👨'}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16 }}>{w.full_name}</p>
                  <p style={{ color: '#666', fontSize: 13 }}>📍 {w.city}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {(w.skills || []).slice(0,3).map((s: string) => (
                  <span key={s} style={{ background: '#f0fdf4', color: '#166534', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>{s}</span>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#2B6E64' }}>{w.daily_rate} ريال</p>
                  <p style={{ fontSize: 12, color: '#999' }}>/ يوم</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 700 }}>{'⭐'.repeat(Math.round(w.rating || 0)) || '—'}</p>
                  <p style={{ fontSize: 11, color: '#999' }}>{w.total_jobs || 0} مهمة</p>
                </div>
                <span style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, background: w.is_available ? '#f0fdf4' : '#fef2f2', color: w.is_available ? '#166534' : '#991b1b' }}>
                  {w.is_available ? 'متاح' : 'مشغول'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '90%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' }} dir="rtl">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>طلب توظيف جديد</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input placeholder="عنوان الطلب *" value={requestForm.title} onChange={e => setRequestForm({...requestForm, title: e.target.value})} style={fInp} />
              <select value={requestForm.city} onChange={e => setRequestForm({...requestForm, city: e.target.value})} style={fInp}>
                <option value="">اختر المدينة *</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={requestForm.event_date} onChange={e => setRequestForm({...requestForm, event_date: e.target.value})} style={fInp} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input type="number" placeholder="عدد الموظفين" value={requestForm.workers_needed} onChange={e => setRequestForm({...requestForm, workers_needed: e.target.value})} style={fInp} />
                <input type="number" placeholder="الأجر / يوم (ريال)" value={requestForm.daily_rate} onChange={e => setRequestForm({...requestForm, daily_rate: e.target.value})} style={fInp} />
              </div>
              <select value={requestForm.gender_preference} onChange={e => setRequestForm({...requestForm, gender_preference: e.target.value})} style={fInp}>
                <option value="any">ذكر وأنثى</option>
                <option value="male">ذكور فقط</option>
                <option value="female">إناث فقط</option>
              </select>
              <textarea placeholder="تفاصيل إضافية (اختياري)" value={requestForm.description} onChange={e => setRequestForm({...requestForm, description: e.target.value})} style={{...fInp, height: 80}} />
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowRequest(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 600 }}>إلغاء</button>
                <button onClick={submitRequest} disabled={requestLoading} style={{ flex: 2, padding: '12px', background: '#2B6E64', color: '#fff', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  {requestLoading ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const fInp: React.CSSProperties = { padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, background: '#fafafa', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
