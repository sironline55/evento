import React from 'react'

const PULSE = `
@keyframes skPulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
.sk { animation: skPulse 1.6s ease-in-out infinite; background: #E8E6EF; border-radius: 6px; }
`

export function SkeletonLine({ w = '100%', h = 14, r = 6 }: { w?:string|number; h?:number; r?:number }) {
  return (
    <>
      <style>{PULSE}</style>
      <div className="sk" style={{ width:w, height:h, borderRadius:r }}/>
    </>
  )
}

export function SkeletonCard() {
  return (
    <>
      <style>{PULSE}</style>
      <div style={{ background:'#fff', border:'1px solid #DBDAE3', borderRadius:12, overflow:'hidden' }}>
        <div className="sk" style={{ height:80, borderRadius:0 }}/>
        <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 }}>
          <div className="sk" style={{ height:14, width:'70%' }}/>
          <div className="sk" style={{ height:12, width:'50%' }}/>
          <div className="sk" style={{ height:12, width:'40%' }}/>
        </div>
      </div>
    </>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <>
      <style>{PULSE}</style>
      <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 100px', padding:'10px 14px', background:'#F8F7FA', gap:12 }}>
          {[70,60,40,40,40].map((w,i) => <div key={i} className="sk" style={{ height:10, width:`${w}%` }}/>)}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 100px', padding:'14px 14px', borderBottom:'1px solid #DBDAE3', gap:12, alignItems:'center' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <div className="sk" style={{ height:13, width:'75%' }}/>
              <div className="sk" style={{ height:10, width:'50%' }}/>
            </div>
            <div className="sk" style={{ height:11, width:'65%' }}/>
            <div className="sk" style={{ height:11, width:'80%' }}/>
            <div className="sk" style={{ height:11, width:'60%' }}/>
            <div className="sk" style={{ height:22, width:60, borderRadius:10 }}/>
          </div>
        ))}
      </div>
    </>
  )
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <>
      <style>{PULSE}</style>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${count},1fr)`, gap:12 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ background:'#fff', border:'1px solid #DBDAE3', borderRadius:12, padding:'16px 18px' }}>
            <div className="sk" style={{ height:10, width:'60%', marginBottom:8 }}/>
            <div className="sk" style={{ height:28, width:'40%' }}/>
          </div>
        ))}
      </div>
    </>
  )
}

export function SkeletonEventGrid({ count = 6 }: { count?: number }) {
  return (
    <>
      <style>{PULSE}</style>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:16 }}>
        {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i}/>)}
      </div>
    </>
  )
}
