'use client'
import { Check, Info, Zap, Star, Rocket } from 'lucide-react'

const C = {
  navy: '#1E0A3C', orange: '#F05537',
  text: '#39364F', muted: '#6F7287',
  border: '#DBDAE3', bg: '#FAFAFA', card: '#FFFFFF',
}

/* Circle check — Qoyod style */
function CheckItem({ text, color }: { text: string; color: string }) {
  const light = color === C.orange ? '#FFF0EC' : color === '#0F6E56' ? '#E6F7F2' : '#F0EDF7'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: light,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Check size={12} strokeWidth={2.8} color={color} />
      </div>
      <span style={{ fontSize: 13.5, color: C.text }}>{text}</span>
    </div>
  )
}

const PLANS = [
  {
    id: 'free',
    name: 'مجاني',
    nameEn: 'Free',
    price: 0,
    period: '',
    icon: Zap,
    color: '#6F7287',
    accent: '#F3F4F6',
    features: ['3 فعاليات شهرياً', '500 حضور لكل فعالية', 'ماسح QR أساسي', 'تقارير بسيطة'],
    current: true,
    cta: 'باقتك الحالية',
  },
  {
    id: 'starter',
    name: 'ستارتر',
    nameEn: 'Starter',
    price: 99,
    period: 'شهرياً',
    icon: Star,
    color: '#0F6E56',
    accent: '#E6F7F2',
    features: ['10 فعاليات شهرياً', '5,000 حضور لكل فعالية', '5 أعضاء فريق', 'تصدير Excel', 'تقارير متقدمة', 'دعم 24/7'],
    current: false,
    cta: 'ابدأ الآن',
  },
  {
    id: 'pro',
    name: 'برو',
    nameEn: 'Pro',
    price: 299,
    period: 'شهرياً',
    icon: Rocket,
    color: C.orange,
    accent: '#FFF0EC',
    features: ['50 فعالية شهرياً', 'حضور غير محدود', '20 عضو فريق', 'إدارة الكوادر', 'علامة تجارية مخصصة', 'واجهة API', 'مدير حساب مخصص'],
    current: false,
    cta: 'ترقية للبرو',
    badge: 'الأكثر شعبية',
  },
]

export default function BillingPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, direction: 'rtl' }}>

      {/* Header — Qoyod style: title + tabs */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '20px 28px 0' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.navy, margin: '0 0 18px', letterSpacing: '-0.3px' }}>
          المالية والاشتراك
        </h1>
        <div style={{ display: 'flex', gap: 0 }}>
          {['الباقة الحالية', 'الفواتير', 'طرق الدفع'].map((t, i) => (
            <button key={t} style={{
              padding: '9px 20px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontFamily: 'inherit',
              fontWeight: i === 0 ? 700 : 400,
              color: i === 0 ? C.orange : C.muted,
              borderBottom: i === 0 ? `2px solid ${C.orange}` : '2px solid transparent',
              marginBottom: -1,
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '28px 24px' }}>

        {/* Current plan banner — Qoyod info box */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: '16px 20px', marginBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 9,
              background: '#F3F4F6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={18} strokeWidth={1.8} color="#6F7287" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>باقتك الحالية</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.navy }}>مجاني</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                3 فعاليات · 500 حضور · ماسح QR
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            border: `1px solid ${C.border}`,
            borderRadius: 20, padding: '5px 12px',
            fontSize: 12, color: C.muted,
          }}>
            <Info size={13} strokeWidth={2} />
            <span>ما عندك اشتراك نشط حالياً</span>
          </div>
        </div>

        {/* Section title — Qoyod style */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, margin: 0 }}>الباقات المتاحة</h2>
          <span style={{
            fontSize: 11, fontWeight: 700, color: C.orange,
            border: `1px solid ${C.orange}`,
            borderRadius: 20, padding: '2px 10px',
          }}>شهري</span>
        </div>

        {/* Plans grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {PLANS.map(plan => {
            const PlanIcon = plan.icon
            return (
              <div key={plan.id} style={{
                background: C.card,
                border: `1.5px solid ${plan.current ? plan.color : plan.id === 'pro' ? C.orange : C.border}`,
                borderRadius: 12,
                padding: '22px 20px',
                position: 'relative',
                boxShadow: plan.id === 'pro' ? '0 4px 20px rgba(240,85,55,0.10)' : 'none',
              }}>
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -11, right: 20,
                    background: C.orange, color: '#fff',
                    fontSize: 11, fontWeight: 700,
                    padding: '2px 12px', borderRadius: 20,
                  }}>
                    {plan.badge}
                  </div>
                )}

                {/* Plan header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: plan.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <PlanIcon size={18} strokeWidth={1.8} color={plan.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.navy }}>{plan.name}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{plan.nameEn}</div>
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                  {plan.price === 0 ? (
                    <span style={{ fontSize: 22, fontWeight: 800, color: C.muted }}>مجاني</span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: C.navy }}>{plan.price}</span>
                      <span style={{ fontSize: 13, color: C.muted }}>ريال / {plan.period}</span>
                    </div>
                  )}
                </div>

                {/* Features — Qoyod circle check style */}
                <div style={{ marginBottom: 18 }}>
                  {plan.features.map(f => (
                    <CheckItem key={f} text={f} color={plan.color} />
                  ))}
                </div>

                {/* CTA */}
                <button style={{
                  width: '100%',
                  padding: '10px 0',
                  border: plan.current ? `1.5px solid ${C.border}` : 'none',
                  borderRadius: 8,
                  background: plan.current ? 'transparent' : plan.color,
                  color: plan.current ? C.muted : '#fff',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: plan.current ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  letterSpacing: '0.02em',
                }}>
                  {plan.cta}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
