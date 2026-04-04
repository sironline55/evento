
'use client'
import { useState } from 'react'
import { WorkerService } from '@/services/WorkerService'

const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الطائف', 'تبوك', 'القصيم', 'حائل', 'أبها', 'نجران', 'جازان']
const SKILLS = ['استقبال ضيوف', 'صب قهوة وشاي', 'تسجيل الزوار', 'إدارة الحشود', 'التوجيه والإرشاد', 'المساعدة اللوجستية', 'التنسيق الميداني', 'الأمن والسلامة', 'التصوير', 'دعم تقني']
const EVENT_TYPES = ['مؤتمرات', 'معارض', 'حفلات', 'مهرجانات', 'فعاليات حكومية', 'مجالس واجتماعات', 'افتتاحيات', 'رياضية']
const DAYS = [
  { key: 'sat', label: 'السبت' },
  { key: 'sun', label: 'الأحد' },
  { key: 'mon', label: 'الاثنين' },
  { key: 'tue', label: 'الثلاثاء' },
  { key: 'wed', label: 'الأربعاء' },
  { key: 'thu', label: 'الخميس' },
  { key: 'fri', label: 'الجمعة' },
]

export default function WorkerRegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', city: '', gender: '' as 'male' | 'female' | '',
    age: '', skills: [] as string[], experience_years: '0', daily_rate: '150',
    availability: [] as string[], event_types: [] as string[]
  })

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  async function submit() {
    setLoading(true)
    try {
      await WorkerService.register({
        full_name: form.full_name, phone: form.phone, email: form.email || undefined,
        city: form.city, gender: form.gender as 'male' | 'female',
        age: form.age ? parseInt(form.age) : undefined,
        skills: form.skills, experience_years: parseInt(form.experience_years),
        daily_rate: parseInt(form.daily_rate), availability: form.availability,
        event_types: form.event_types, source: 'self_registered'
      })
      setDone(true)
    } catch (e) { alert('حدث خطأ، يرجى المحاولة مرة أخرى') }
    finally { setLoading(false) }
  }

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8faf9' }} dir="rtl">
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>تم التسجيل بنجاح!</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>سنتواصل معك قريباً عند توفر فرصة مناسبة في مدينتك</p>
        <p style={{ fontSize: 13, color: '#999' }}>يمكنك مشاركة رابط التسجيل مع أصدقائك</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9f6 0%, #e8f4f0 100%)' }} dir="rtl">
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: '#2B6E64', borderRadius: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>👤</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>سجّل للعمل في الفعاليات</h1>
          <p style={{ color: '#666', fontSize: 14 }}>انضم لأكثر من آلاف المسجلين وابدأ العمل في الفعاليات السعودية</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= s ? '#2B6E64' : '#e5e7eb', transition: 'background 0.3s' }} />
            ))}
          </div>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 4 }}>المعلومات الأساسية</h3>
              <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                placeholder="الاسم الكامل *" style={inp} />
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                placeholder="رقم الجوال * (05xxxxxxxx)" style={inp} type="tel" />
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                placeholder="البريد الإلكتروني (اختياري)" style={inp} type="email" />
              <select value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={inp}>
                <option value="">اختر المدينة *</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button onClick={() => setForm({...form, gender: 'male'})}
                  style={{ ...gBtn, background: form.gender === 'male' ? '#2B6E64' : '#f3f4f6', color: form.gender === 'male' ? '#fff' : '#374151' }}>
                  ذكر
                </button>
                <button onClick={() => setForm({...form, gender: 'female'})}
                  style={{ ...gBtn, background: form.gender === 'female' ? '#2B6E64' : '#f3f4f6', color: form.gender === 'female' ? '#fff' : '#374151' }}>
                  أنثى
                </button>
              </div>
              <input value={form.age} onChange={e => setForm({...form, age: e.target.value})}
                placeholder="العمر (اختياري)" style={inp} type="number" min="18" max="65" />
              <button onClick={() => { if (!form.full_name || !form.phone || !form.city || !form.gender) return alert('يرجى تعبئة الحقول المطلوبة'); setStep(2) }}
                style={nextBtn}>التالي →</button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 4 }}>المهارات والخبرة</h3>
              <div>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>اختر مهاراتك (يمكن اختيار أكثر من واحدة)</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SKILLS.map(s => (
                    <button key={s} onClick={() => setForm({...form, skills: toggle(form.skills, s)})}
                      style={{ ...tag, background: form.skills.includes(s) ? '#2B6E64' : '#f3f4f6', color: form.skills.includes(s) ? '#fff' : '#374151' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>أنواع الفعاليات المفضلة</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {EVENT_TYPES.map(e => (
                    <button key={e} onClick={() => setForm({...form, event_types: toggle(form.event_types, e)})}
                      style={{ ...tag, background: form.event_types.includes(e) ? '#2B6E64' : '#f3f4f6', color: form.event_types.includes(e) ? '#fff' : '#374151' }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#666' }}>سنوات الخبرة في الفعاليات</label>
                <select value={form.experience_years} onChange={e => setForm({...form, experience_years: e.target.value})} style={{...inp, marginTop: 8}}>
                  <option value="0">لا خبرة سابقة</option>
                  <option value="1">سنة</option>
                  <option value="2">2 سنوات</option>
                  <option value="3">3 سنوات</option>
                  <option value="5">5+ سنوات</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(1)} style={backBtn}>← السابق</button>
                <button onClick={() => { if (form.skills.length === 0) return alert('اختر مهارة واحدة على الأقل'); setStep(3) }} style={{...nextBtn, flex: 1}}>التالي →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 4 }}>الإتاحة والأجر</h3>
              <div>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>أيام الإتاحة للعمل</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {DAYS.map(d => (
                    <button key={d.key} onClick={() => setForm({...form, availability: toggle(form.availability, d.key)})}
                      style={{ ...tag, background: form.availability.includes(d.key) ? '#2B6E64' : '#f3f4f6', color: form.availability.includes(d.key) ? '#fff' : '#374151', textAlign: 'center' }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#666' }}>الأجر المقبول لليوم (ريال سعودي)</label>
                <input value={form.daily_rate} onChange={e => setForm({...form, daily_rate: e.target.value})}
                  style={{...inp, marginTop: 8}} type="number" min="50" max="2000" />
                <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>متوسط السوق: 150-300 ريال/يوم</p>
              </div>
              <div style={{ background: '#f0f9f6', borderRadius: 12, padding: 16, border: '1px solid #d1fae5' }}>
                <p style={{ fontSize: 13, color: '#065f46', fontWeight: 500 }}>✅ بياناتك محمية ومؤمنة</p>
                <p style={{ fontSize: 12, color: '#047857', marginTop: 4 }}>لن نشارك بياناتك مع أي جهة دون موافقتك. ستتلقى إشعارات فقط عند توفر فرصة مناسبة.</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(2)} style={backBtn}>← السابق</button>
                <button onClick={submit} disabled={loading || form.availability.length === 0}
                  style={{...nextBtn, flex: 1, opacity: loading || form.availability.length === 0 ? 0.6 : 1}}>
                  {loading ? 'جاري التسجيل...' : '✅ أكمل التسجيل'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#9ca3af' }}>
          هل أنت شركة فعاليات؟ <a href="/workers/companies" style={{ color: '#2B6E64' }}>سجّل هنا</a>
        </p>
      </div>
    </div>
  )
}

const inp: React.CSSProperties = { padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 15, width: '100%', outline: 'none', background: '#fafafa', boxSizing: 'border-box', fontFamily: 'inherit' }
const nextBtn: React.CSSProperties = { background: '#2B6E64', color: '#fff', padding: '14px 24px', borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '100%' }
const backBtn: React.CSSProperties = { background: '#f3f4f6', color: '#374151', padding: '14px 20px', borderRadius: 12, border: 'none', fontSize: 14, cursor: 'pointer' }
const gBtn: React.CSSProperties = { padding: '12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 15, cursor: 'pointer', fontWeight: 500 }
const tag: React.CSSProperties = { padding: '8px 14px', borderRadius: 20, border: 'none', fontSize: 13, cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }
