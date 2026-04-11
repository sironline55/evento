'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#F4F3F8', card:'#FFFFFF', green:'#16a34a', red:'#DC2626' }

const ROLE_CONFIG: Record<string,{label:string;bg:string;color:string}> = {
  super_admin: { label:'مالك',   bg:'#F3F0F8', color:'#7C3AED' },
  admin:       { label:'مشرف',   bg:'#FEF0ED', color:C.orange },
  member:      { label:'عضو',    bg:'#F0FDF4', color:C.green },
  staff:       { label:'كادر',   bg:'#EFF6FF', color:'#1D4ED8' },
}

export default function UsersPage() {
  const sb = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])
  const [users, setUsers]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [saving, setSaving]   = useState<string|null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data } = await sb.from('profiles').select('id, role, full_name, created_at').order('created_at', { ascending:false })
      setUsers(data || [])
    } finally { setLoading(false) }
  }

  async function changeRole(userId: string, newRole: string) {
    setSaving(userId)
    try {
      await sb.from('profiles').update({ role: newRole }).eq('id', userId)
      setUsers(u => u.map(x => x.id === userId ? { ...x, role: newRole } : x))
    } finally { setSaving(null) }
  }

  const filtered = users.filter(u => {
    const matchSearch = !search || (u.full_name||'').toLowerCase().includes(search.toLowerCase()) || u.id.includes(search)
    const matchRole   = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div style={{ padding:'28px 32px', direction:'rtl' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>👥 إدارة المستخدمين</h1>
        <p style={{ color:C.muted, fontSize:13, margin:0 }}>جميع حسابات المستخدمين على المنصة — {users.length} مستخدم</p>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 بحث بالاسم أو ID..."
          style={{ padding:'9px 13px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, outline:'none', background:C.card, fontFamily:'inherit', flex:1, maxWidth:280 }}/>
        <div style={{ display:'flex', gap:6 }}>
          {['all','super_admin','admin','member','staff'].map(r => (
            <button key={r} onClick={()=>setRoleFilter(r)} style={{
              padding:'7px 14px', border:'none', borderRadius:7, cursor:'pointer',
              fontWeight:600, fontSize:11, fontFamily:'inherit',
              background: roleFilter===r ? C.navy : C.card,
              color: roleFilter===r ? '#fff' : C.muted,
              border: `1px solid ${roleFilter===r ? C.navy : C.border}`,
            }}>{r==='all'?'الكل':ROLE_CONFIG[r]?.label||r}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'إجمالي',   val:users.length, color:C.navy },
          { label:'ملاك',     val:users.filter(u=>u.role==='super_admin').length, color:'#7C3AED' },
          { label:'مشرفون',   val:users.filter(u=>u.role==='admin').length, color:C.orange },
          { label:'أعضاء',    val:users.filter(u=>u.role==='member'||!u.role).length, color:C.green },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:22, fontWeight:800, color }}>{val}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:C.muted }}>⏳ جاري التحميل...</div>
      ) : (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8F7FA', borderBottom:`1px solid ${C.border}` }}>
                {['المستخدم','الدور','تاريخ الانضمام','الإجراءات'].map(h => (
                  <th key={h} style={{ padding:'11px 16px', textAlign:'right', fontWeight:600, color:C.muted, fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} style={{ padding:'40px 16px', textAlign:'center', color:C.muted }}>لا توجد نتائج</td></tr>
              ) : filtered.map((u, i) => {
                const roleConf = ROLE_CONFIG[u.role] || { label:u.role||'—', bg:'#F3F4F6', color:C.muted }
                return (
                  <tr key={u.id} style={{ borderBottom: i<filtered.length-1?`1px solid ${C.border}`:'none' }}>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(135deg,${C.navy},${C.orange})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>
                          {(u.full_name||'?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:0 }}>{u.full_name||'بدون اسم'}</p>
                          <p style={{ fontSize:11, color:C.muted, margin:0, fontFamily:'monospace' }}>{u.id.slice(0,16)}...</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:50, background:roleConf.bg, color:roleConf.color }}>{roleConf.label}</span>
                    </td>
                    <td style={{ padding:'13px 16px', fontSize:12, color:C.muted }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('ar-SA') : '—'}
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <select
                        value={u.role||'member'}
                        onChange={e=>changeRole(u.id, e.target.value)}
                        disabled={saving===u.id}
                        style={{ padding:'5px 10px', border:`1px solid ${C.border}`, borderRadius:7, fontSize:12, fontFamily:'inherit', cursor:'pointer', background:C.card }}
                      >
                        <option value="member">عضو</option>
                        <option value="staff">كادر</option>
                        <option value="admin">مشرف</option>
                        <option value="super_admin">مالك</option>
                      </select>
                      {saving===u.id && <span style={{ fontSize:11, color:C.muted, marginRight:8 }}>⏳</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
