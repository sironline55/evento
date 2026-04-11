'use client'

const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3' }

interface Props {
  total: number
  page: number
  perPage: number
  onPage: (p: number) => void
}

export default function Pagination({ total, page, perPage, onPage }: Props) {
  const pages = Math.ceil(total / perPage)
  if (pages <= 1) return null

  const start = (page - 1) * perPage + 1
  const end   = Math.min(page * perPage, total)

  // Generate page numbers with ellipsis
  function getPages(): (number|'...')[] {
    if (pages <= 7) return Array.from({ length:pages }, (_,i) => i+1)
    const result: (number|'...')[] = [1]
    if (page > 3) result.push('...')
    for (let i = Math.max(2, page-1); i <= Math.min(pages-1, page+1); i++) result.push(i)
    if (page < pages-2) result.push('...')
    result.push(pages)
    return result
  }

  const btn = (content: React.ReactNode, p: number, active = false, disabled = false) => (
    <button
      key={typeof content === 'number' ? content : String(content)+p}
      onClick={() => !disabled && onPage(p)}
      disabled={disabled}
      style={{
        minWidth: 34, height: 34, padding: '0 8px',
        border: `1px solid ${active ? C.navy : C.border}`,
        borderRadius: 8, background: active ? C.navy : '#fff',
        color: active ? '#fff' : disabled ? '#BBBBBB' : C.navy,
        fontSize: 13, fontWeight: active ? 700 : 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', transition: 'all .15s'
      }}
    >{content}</button>
  )

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'14px 0', flexWrap:'wrap', gap:10 }}>
      <span style={{ fontSize:13, color:C.muted }}>
        عرض {start.toLocaleString('ar-SA')}–{end.toLocaleString('ar-SA')} من {total.toLocaleString('ar-SA')}
      </span>
      <div style={{ display:'flex', gap:4, alignItems:'center' }}>
        {btn('←', page-1, false, page===1)}
        {getPages().map((p, i) =>
          p === '...'
            ? <span key={`dot-${i}`} style={{ padding:'0 4px', color:C.muted }}>…</span>
            : btn(p, p as number, p === page)
        )}
        {btn('→', page+1, false, page===pages)}
      </div>
      <select
        value={perPage}
        onChange={e => onPage(1)}
        style={{ padding:'6px 10px', border:`1px solid ${C.border}`, borderRadius:8,
          fontSize:13, background:'#fff', fontFamily:'inherit', cursor:'pointer', display:'none' }}>
        {[25,50,100].map(n => <option key={n} value={n}>{n} لكل صفحة</option>)}
      </select>
    </div>
  )
}
