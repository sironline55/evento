'use client'
import { useState } from 'react'

const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A' }

const ZONES = ['A','B','C','D','E']

export default function StaffParking() {
  const [zone, setZone] = useState('A')
  const [slots, setSlots] = useState<Record<string,('empty'|'taken')[]>>({
    A: Array(20).fill('empty'), B: Array(20).fill('empty'),
    C: Array(20).fill('empty'), D: Array(20).fill('empty'), E: Array(20).fill('empty'),
  })

  function toggle(zone: string, idx: number) {
    setSlots(s => ({ ...s, [zone]: s[zone].map((v,i)=>i===idx?(v==='empty'?'taken':'empty'):v) }))
  }

  const cur = slots[zone]
  const taken = cur.filter(v=>v==='taken').length
  const pct = Math.round(taken/cur.length*100)

  return (
    <div style={{ direction:'rtl' }}>
      <div style={{ background:C.navy, padding:'16px 20px' }}>
        <h1 style={{ color:'#fff', fontSize:18, fontWeight:800, margin:'0 0 12px' }}>🚗 إدارة الباركينغ</h1>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
          {ZONES.map(z => (
            <button key={z} onClick={()=>setZone(z)} style={{ padding:'7px 18px', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:14, fontFamily:'inherit', background:zone===z?C.orange:'rgba(255,255,255,0.15)', color:'#fff', flexShrink:0 }}>منطقة {z}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>منطقة {zone}</p>
            <p style={{ fontSize:12, color:C.muted, margin:'2px 0 0' }}>{taken} / {cur.length} مشغول ({pct}%)</p>
          </div>
          <div style={{ width:60, height:60, borderRadius:'50%', border:`4px solid ${pct>=80?C.orange:C.green}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:13, fontWeight:800, color:pct>=80?C.orange:C.green }}>{pct}%</span>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
          {cur.map((v,i) => (
            <button key={i} onClick={()=>toggle(zone,i)} style={{ aspectRatio:'1', border:`2px solid ${v==='taken'?'#DC2626':C.green}`, borderRadius:8, background:v==='taken'?'#FEF2F2':'#EAF7E0', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, padding:4 }}>
              <span style={{ fontSize:16 }}>{v==='taken'?'🚗':'⬜'}</span>
              <span style={{ fontSize:9, fontWeight:700, color:v==='taken'?'#DC2626':C.green }}>{i+1}</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop:16, display:'flex', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:C.muted }}>
            <div style={{ width:14, height:14, background:'#EAF7E0', border:`1px solid ${C.green}`, borderRadius:3 }}/> متاح
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:C.muted }}>
            <div style={{ width:14, height:14, background:'#FEF2F2', border:'1px solid #DC2626', borderRadius:3 }}/> مشغول
          </div>
        </div>
      </div>
    </div>
  )
}
