'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF'
}

const TABS = [
  { id:'profile', label:'ملف المنظِّم' },
  { id:'team',    label:'إدارة الفريق' },
  { id:'plan',    label:'إدارة الباقة' },
]

export default function SettingsPage() {
  const [tab, setTab]       = useState('profile')
  const [user, setUser]     = useState<any>(null)
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const router = useRouter()

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setName(data.user?.user_metadata?.full_name || '')
      setEmail(data.user?.email || '')
    })
  }, [])

  async function saveProfile() {
    setSaving(true)
    await sb.auth.updateUser({ data: { full_name: name } })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function signOut() {
    await sb.auth.signOut()
    router.push('/login')
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8,
    fontSize:14, outline:'none', fontFamily:'inherit', color:C.text, background:C.card, boxSizing:'border-box'
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'24px 32px 0' }}>
        <h1 style={{ fontSize:40, fontWeight:800, margin:'0 0 20px', color:C.navy, letterSpacing:'-1px' }}>إعدادات المنظمة</h1>
        <div style={{ display:'flex' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'10px 20px', background:'none', border:'none', cursor:'pointer', fontSize:14,
              fontWeight:tab===t.id?700:400,
              color:tab===t.id?C.orange:C.muted,
              borderBottom:tab===t.id?`2px solid ${C.orange}`:'2px solid transparent',
              transition:'all 0.15s', marginBottom:-1
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:720, margin:'0 auto', padding:'28px 24px' }}>

        {/* Profile tab */}
        {tab === 'profile' && (
          <div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, marginBottom:16 }}>
              <h2 style={{ fontSize:17, fontWeight:700, color:C.navy, margin:'0 0 4px' }}>ملف المنظِّم</h2>
              <p style={{ fontSize:13, color:C.muted, margin:'0 0 20px' }}>معلومات تظهر للزوار على صفحات الفعاليات</p>
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:6 }}>الاسم الكامل</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="اسم المنظم أو الشركة" style={inp} />
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:6 }}>البريد الإلكتروني</label>
                <input value={email} disabled style={{ ...inp, background:'#F9F8F6', color:C.muted }} />
                <p style={{ fontSize:11, color:C.muted, marginTop:4 }}>البريد الإلكتروني لا يمكن تغييره</p>
              </div>
              <button onClick={saveProfile} disabled={saving} style={{
                padding:'10px 24px', border:'none', borderRadius:6,
                background: saved ? '#3A7D0A' : C.orange,
                color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', transition:'background 0.3s'
              }}>
                {saving ? 'جاري الحفظ...' : saved ? '✓ تم الحفظ' : 'حفظ التغييرات'}
              </button>
            </div>

            {/* Account */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
              <h2 style={{ fontSize:17, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>الحساب</h2>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                <div>
                  <p style={{ fontWeight:600, fontSize:14, margin:0, color:C.text }}>تسجيل الخروج</p>
                  <p style={{ fontSize:12, color:C.muted, margin:'2px 0 0' }}>تسجيل الخروج من الحساب الحالي</p>
                </div>
                <button onClick={signOut} style={{ padding:'8px 18px', border:`1px solid ${C.border}`, borderRadius:6, background:C.card, fontSize:13, fontWeight:600, cursor:'pointer', color:C.text }}>
                  تسجيل خروج
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team tab */}
        {tab === 'team' && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:C.navy, margin:'0 0 4px' }}>إدارة الفريق</h2>
            <p style={{ fontSize:13, color:C.muted, margin:'0 0 20px' }}>قريباً — ستتمكن من دعوة أعضاء وتحديد صلاحياتهم</p>
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
              <p style={{ fontWeight:600, color:C.navy, margin:'0 0 8px' }}>ميزة قيد التطوير</p>
              <p style={{ color:C.muted, fontSize:13 }}>ستتاح في النسخة القادمة</p>
            </div>
          </div>
        )}

        {/* Plan tab */}
        {tab === 'plan' && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>باقتك الحالية</h2>
            <div style={{ background:'#F8F7FA', borderRadius:10, padding:16, marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ fontWeight:700, fontSize:18, color:C.navy, margin:0 }}>🆓 مجاني</p>
                  <p style={{ fontSize:13, color:C.muted, margin:'4px 0 0' }}>3 فعاليات · 500 زائر · ماسح QR</p>
                </div>
                <span style={{ padding:'4px 12px', borderRadius:6, background:'#F3F4F6', fontSize:12, fontWeight:600, color:C.muted }}>الباقة الحالية</span>
              </div>
            </div>
            <p style={{ fontWeight:600, color:C.navy, margin:'0 0 12px' }}>ترقية الباقة</p>
            {[
              { name:'ستارتر', price:'99 ريال/شهر', color:'#0F6E56', features:'10 فعاليات · 5 أعضاء · تصدير Excel' },
              { name:'برو', price:'299 ريال/شهر', color:C.orange, features:'50 فعالية · 20 عضو · كوادر + علامة تجارية' },
            ].map(plan => (
              <div key={plan.name} style={{ border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ fontWeight:700, color:plan.color, margin:0, fontSize:15 }}>{plan.name}</p>
                  <p style={{ fontSize:12, color:C.muted, margin:'4px 0 0' }}>{plan.features}</p>
                </div>
                <div style={{ textAlign:'left' }}>
                  <p style={{ fontWeight:700, color:C.navy, margin:'0 0 6px', fontSize:15 }}>{plan.price}</p>
                  <button style={{ padding:'7px 16px', border:'none', borderRadius:6, background:plan.color, color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                    ترقية
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
