'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import Link from 'next/link'


const C = { navy:'#1C1C3B', primary:'#F47D31', cream:'#FBF8F5', teal:'#7EC8C8', card:'#FFFFFF', border:'#F0EDE8', muted:'#8B8FA8' }
const PLANS = ['free','starter','pro','enterprise']
const PLAN_LABELS: Record<string,string> = { free:'مجاني', starter:'ستارتر', pro:'برو', enterprise:'إنتربرايز' }
const STATUSES = ['trial','active','suspended','cancelled']
const STATUS_LABELS: Record<string,string> = { trial:'تجريبي', active:'نشط', suspended:'معلق', cancelled:'ملغي' }
const FEATURES_LABELS: Record<string,string> = {
  qr_scan:'مسح QR', excel_export:'تصدير Excel', custom_branding:'علامة تجارية مخصصة',
  api_access:'وصول API', staffing:'إدارة الكوادر', analytics:'تقارير متقدمة',
  custom_domain:'دومين مخصص', white_label:'White Label'
}

export default function OrgDetailPage() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { id } = useParams()
  const [org, setOrg] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { if (id) loadData() }, [id])

  async function loadData() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const [{ data: orgData }, { data: membersData }] = await Promise.all([
      sb.from('organizations').select('*').eq('id', id).single(),
      sb.from('org_members').select('id,email,full_name,role,status').eq('org_id', id).order('created_at')
    ])
    setOrg(orgData); setMembers(membersData || []); setLoading(false)
  }

  async function save() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    setSaving(true)
    await sb.from('organizations').update({
      plan: org.plan, status: org.status, max_events: org.max_events,
      max_members: org.max_members, max_attendees_per_event: org.max_attendees_per_event,
      features: org.features, updated_at: new Date().toISOString()
    }).eq('id', id)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  function toggleFeature(key: string) {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    setOrg((prev: any) => ({ ...prev, features: { ...prev.features, [key]: !prev.features?.[key] } }))
  }

  const inp: React.CSSProperties = { padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:10, fontSize:14, outline:'none', background:'#FAFAF8', fontFamily:'inherit', width:'100%', boxSizing:'border-box' }

  if (loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>جاري التحميل...</div>
  if (!org) return <div style={{padding:40,textAlign:'center',color:C.muted}}>الشركة غير موجودة</div>

  return (
    <div style={{padding:'28px 24px',direction:'rtl',maxWidth:820,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <Link href="/super-admin/organizations" style={{color:C.muted,textDecoration:'none',fontSize:13}}>← الشركات</Link>
        <span style={{color:C.border}}>/</span>
        <span style={{fontSize:14,fontWeight:600,color:C.navy}}>{org.name}</span>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:20}}>
        <button onClick={save} disabled={saving} style={{background:saved?'#1A7A4A':C.primary,color:'#fff',padding:'11px 28px',borderRadius:50,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,boxShadow:'0 4px 12px rgba(244,125,49,0.3)',transition:'background 0.3s'}}>
          {saving?'جاري الحفظ...':saved?'✓ تم الحفظ':'حفظ التغييرات'}
        </button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div style={{background:C.card,borderRadius:20,padding:24,border:`1px solid ${C.border}`}}>
          <h2 style={{fontSize:16,fontWeight:700,margin:'0 0 18px',color:C.navy}}>معلومات الشركة</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div><label style={{fontSize:12,fontWeight:600,color:C.muted,display:'block',marginBottom:6}}>اسم الشركة</label>
              <input value={org.name||''} onChange={e=>setOrg({...org,name:e.target.value})} style={inp}/></div>
            <div><label style={{fontSize:12,fontWeight:600,color:C.muted,display:'block',marginBottom:6}}>الإيميل</label>
              <input value={org.email||''} onChange={e=>setOrg({...org,email:e.target.value})} style={inp}/></div>
          </div>
        </div>
        <div style={{background:C.card,borderRadius:20,padding:24,border:`1px solid ${C.border}`}}>
          <h2 style={{fontSize:16,fontWeight:700,margin:'0 0 18px',color:C.navy}}>الباقة والحالة</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div><label style={{fontSize:12,fontWeight:600,color:C.muted,display:'block',marginBottom:6}}>الباقة</label>
              <select value={org.plan} onChange={e=>setOrg({...org,plan:e.target.value})} style={inp}>
                {PLANS.map(p=><option key={p} value={p}>{PLAN_LABELS[p]}</option>)}</select></div>
            <div><label style={{fontSize:12,fontWeight:600,color:C.muted,display:'block',marginBottom:6}}>الحالة</label>
              <select value={org.status} onChange={e=>setOrg({...org,status:e.target.value})} style={inp}>
                {STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
          </div>
        </div>
        <div style={{background:C.card,borderRadius:20,padding:24,border:`1px solid ${C.border}`}}>
          <h2 style={{fontSize:16,fontWeight:700,margin:'0 0 18px',color:C.navy}}>الحدود القصوى</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
            {[{key:'max_events',label:'الفعاليات'},{key:'max_members',label:'أعضاء الفريق'},{key:'max_attendees_per_event',label:'الزوار/فعالية'}].map(({key,label})=>(
              <div key={key}><label style={{fontSize:12,fontWeight:600,color:C.muted,display:'block',marginBottom:6}}>{label}</label>
                <input type="number" value={org[key]??''} onChange={e=>setOrg({...org,[key]:parseInt(e.target.value)||0})} style={inp}/></div>
            ))}
          </div>
        </div>
        <div style={{background:C.card,borderRadius:20,padding:24,border:`1px solid ${C.border}`}}>
          <h2 style={{fontSize:16,fontWeight:700,margin:'0 0 18px',color:C.navy}}>الميزات المفعّلة</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
            {Object.entries(FEATURES_LABELS).map(([key,label])=>{
              const enabled=org.features?.[key]??false
              return (
                <div key={key} onClick={()=>toggleFeature(key)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderRadius:12,cursor:'pointer',background:enabled?'#F0F9F6':'#FAFAF8',border:`1px solid ${enabled?'#7EC8C8':C.border}`,transition:'all 0.2s'}}>
                  <span style={{fontSize:13,fontWeight:500,color:enabled?'#0F6E56':C.muted}}>{label}</span>
                  <div style={{width:36,height:20,borderRadius:50,background:enabled?C.teal:'#D1D5DB',position:'relative',transition:'background 0.2s'}}>
                    <div style={{position:'absolute',top:2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s',left:enabled?18:2}}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div style={{background:C.card,borderRadius:20,padding:24,border:`1px solid ${C.border}`}}>
          <h2 style={{fontSize:16,fontWeight:700,margin:'0 0 18px',color:C.navy}}>أعضاء الفريق ({members.length})</h2>
          {members.length===0?<p style={{color:C.muted,fontSize:13}}>لا يوجد أعضاء بعد</p>:members.map((m,i)=>(
            <div key={m.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:i<members.length-1?`1px solid ${C.border}`:'none'}}>
              <div>
                <p style={{fontWeight:600,fontSize:13,margin:0,color:C.navy}}>{m.full_name||m.email}</p>
                <p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>{m.email}</p>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontSize:11,color:C.muted}}>{m.role}</span>
                <span style={{padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:600,background:m.status==='active'?'#E8F8F0':'#FFF8E8',color:m.status==='active'?'#1A7A4A':'#B07000'}}>{m.status==='active'?'نشط':'مدعو'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
