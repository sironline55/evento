export default function OfflinePage() {
  return (
    <div style={{
      minHeight:'100vh', background:'#1E0A3C',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      fontFamily:'Tajawal,sans-serif', direction:'rtl', padding:24
    }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:72, marginBottom:20 }}>📵</div>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#fff', margin:'0 0 12px' }}>
          لا يوجد اتصال بالإنترنت
        </h1>
        <p style={{ fontSize:15, color:'rgba(255,255,255,.6)', maxWidth:280, lineHeight:1.7, margin:'0 0 32px' }}>
          تحقق من اتصالك بالإنترنت وحاول مجدداً
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding:'14px 36px', background:'#F05537', color:'#fff',
            border:'none', borderRadius:14, fontSize:16, fontWeight:700,
            cursor:'pointer', fontFamily:'inherit'
          }}
        >
          🔄 إعادة المحاولة
        </button>
        <p style={{ fontSize:12, color:'rgba(255,255,255,.3)', marginTop:24 }}>
          بعض الصفحات متاحة offline
        </p>
      </div>
    </div>
  )
}
