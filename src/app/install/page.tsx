export default function InstallPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#1E0A3C,#3D1A78)',
      direction: 'rtl', fontFamily: 'Tajawal,sans-serif',
      padding: '32px 20px'
    }}>

      {/* App Icon */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 96, height: 96, background: '#F05537',
          borderRadius: 22, margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 44, boxShadow: '0 8px 32px rgba(240,85,55,.4)'
        }}>🎪</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>EventVMS</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', margin: 0 }}>منصة إدارة الفعاليات</p>
      </div>

      {/* iOS Instructions */}
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 20, padding: '20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ fontSize: 28 }}></div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>iPhone / iPad</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', margin: 0 }}>Safari فقط</p>
          </div>
        </div>
        {[
          { step: '1', icon: '🌐', text: 'افتح Safari وانتقل للرابط' },
          { step: '2', icon: '📤', text: 'اضغط زر المشاركة في الأسفل (أو الأعلى)' },
          { step: '3', icon: '➕', text: 'اختر "إضافة إلى الشاشة الرئيسية"' },
          { step: '4', icon: '✅', text: 'اضغط "إضافة" — سيظهر الأيقونة فوراً' },
        ].map(s => (
          <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, background: '#F05537', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 900, color: '#fff', flexShrink: 0
            }}>{s.step}</div>
            <div style={{ paddingTop: 4 }}>
              <span style={{ fontSize: 18, marginLeft: 6 }}>{s.icon}</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,.85)' }}>{s.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Android Instructions */}
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 20, padding: '20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ fontSize: 28 }}>🤖</div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Android</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', margin: 0 }}>Chrome أو Edge</p>
          </div>
        </div>
        {[
          { step: '1', icon: '🌐', text: 'افتح Chrome وانتقل للرابط' },
          { step: '2', icon: '🔔', text: 'ستظهر رسالة "تثبيت التطبيق" تلقائياً' },
          { step: '3', icon: '📲', text: 'أو اضغط ⋮ (القائمة) → "إضافة للشاشة الرئيسية"' },
          { step: '4', icon: '✅', text: 'اضغط "تثبيت" — التطبيق جاهز!' },
        ].map(s => (
          <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, background: '#3A7D0A', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 900, color: '#fff', flexShrink: 0
            }}>{s.step}</div>
            <div style={{ paddingTop: 4 }}>
              <span style={{ fontSize: 18, marginLeft: 6 }}>{s.icon}</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,.85)' }}>{s.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 20, padding: '20px', marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>🚀 مميزات تطبيق الجوال</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            '⚡ يعمل بدون إنترنت',
            '🔔 إشعارات فورية',
            '📷 ماسح QR مباشر',
            '🚀 أسرع من الموقع',
            '📱 تجربة نيتف',
            '🔒 آمن 100%',
          ].map(f => (
            <div key={f} style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', display: 'flex', gap: 6, alignItems: 'center' }}>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* App URL */}
      <div style={{ textAlign: 'center', marginBottom: 80 }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>رابط التطبيق</p>
        <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 12, padding: '10px 20px', display: 'inline-block' }}>
          <code style={{ fontSize: 13, color: '#F05537', direction: 'ltr' }}>evento-h2ir.vercel.app</code>
        </div>
      </div>
    </div>
  )
}
