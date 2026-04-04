
'use client'
import { useState } from 'react'
import { WorkerService } from '@/services/WorkerService'

const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الطائف', 'تبوك', 'القصيم', 'حائل', 'أبها', 'نجران', 'جازان']

interface Props {
  attendeeId: string
  attendeeName: string
}

export function WorkerOptIn({ attendeeId, attendeeName }: Props) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ city: '', gender: '' as 'male'|'female'|'', daily_rate: '150', skills: [] as string[] })

  const QUICK_SKILLS = ['استقبال', 'صب قهوة', 'تسجيل زوار', 'إدارة حشود', 'توجيه وإرشاد']

  async function submit() {
    if (!form.city || !form.gender) return alert('يرجى اختيار المدينة والجنس')
    setLoading(true)
    try {
      await WorkerService.optInFromAttendee(attendeeId, {
        city: form.city, gender: form.gender as 'male'|'female',
        daily_rate: parseInt(form.daily_rate), skills: form.skills,
        availability: ['sat','sun','mon','tue','wed','thu']
      })
      setDone(true)
    } catch(e) { alert('حدث خطأ') }
    finally { setLoading(false) }
  }

  if (done) return (
    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: 16, textAlign: 'center' }}>
      <p style={{ color: '#166534', fontWeight: 600 }}>✅ تم تسجيلك في قائمة العمال!</p>
      <p style={{ fontSize: 13, color: '#15803d', marginTop: 4 }}>سنتواصل معك عند توفر فرص في {form.city}</p>
    </div>
  )

  return (
    <div style={{ border: '1px solid #d1fae5', borderRadius: 16, overflow: 'hidden', marginTop: 16 }}>
      <div style={{ background: '#f0fdf4', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div>
          <p style={{ fontWeight: 600, color: '#065f46', fontSize: 15 }}>💼 هل تريد العمل في الفعاليات؟</p>
          <p style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>سجّل بياناتك لتصلك فرص عمل في مدينتك</p>
        </div>
        <span style={{ color: '#2B6E64', fontSize: 20 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }} dir="rtl">
          <select value={form.city} onChange={e => setForm({...form, city: e.target.value})}
            style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, background: '#fff' }}>
            <option value="">اختر مدينتك</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(['male','female'] as const).map(g => (
              <button key={g} onClick={() => setForm({...form, gender: g})}
                style={{ padding: '10px', borderRadius: 10, border: '1px solid', borderColor: form.gender === g ? '#2B6E64' : '#e5e7eb', background: form.gender === g ? '#2B6E64' : '#fff', color: form.gender === g ? '#fff' : '#374151', cursor: 'pointer', fontWeight: 500 }}>
                {g === 'male' ? 'ذكر' : 'أنثى'}
              </button>
            ))}
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>مهاراتك الرئيسية</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {QUICK_SKILLS.map(s => (
                <button key={s} onClick={() => setForm({...form, skills: form.skills.includes(s) ? form.skills.filter(x=>x!==s) : [...form.skills,s]})}
                  style={{ padding: '6px 12px', borderRadius: 20, border: 'none', fontSize: 12, cursor: 'pointer', background: form.skills.includes(s) ? '#2B6E64' : '#f3f4f6', color: form.skills.includes(s) ? '#fff' : '#374151' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>الأجر اليومي المقبول:</label>
            <input type="number" value={form.daily_rate} onChange={e => setForm({...form, daily_rate: e.target.value})}
              style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, width: 100 }} />
            <span style={{ fontSize: 13, color: '#666' }}>ريال</span>
          </div>
          <button onClick={submit} disabled={loading}
            style={{ background: '#2B6E64', color: '#fff', padding: '12px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'جاري التسجيل...' : '✅ سجّل الآن مجاناً'}
          </button>
        </div>
      )}
    </div>
  )
}
