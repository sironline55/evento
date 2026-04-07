'use client'
import { useEffect, useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const C = { navy:'#1E0A3C', orange:'#F05537', border:'#DBDAE3', muted:'#6F7287', card:'#FFFFFF', bg:'#FAFAFA' }

export default function NotificationBell() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [open, setOpen]     = useState(false)
  const [notifs, setNotifs] = useState<any[]>([])
  const [userId, setUserId] = useState<string|null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifs.filter(n => !n.is_read).length

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    // Load recent notifications
    sb.from('notifications')
      .select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setNotifs(data || []))

    // Realtime
    const ch = sb.channel('notifs-' + userId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload: any) => {
        setNotifs(n => [payload.new, ...n.slice(0, 19)])
      }).subscribe()

    return () => { sb.removeChannel(ch) }
  }, [userId])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function markAllRead() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    if (!userId) return
    await sb.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    setNotifs(n => n.map(x => ({ ...x, is_read: true })))
  }

  async function markRead(id: string) {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 40, height: 40, display: 'flex', alignItems: 'center',
          justifyContent: 'center', borderRadius: 6, border: 'none',
          background: open ? '#FEF0ED' : 'transparent',
          cursor: 'pointer', position: 'relative', flexShrink: 0
        }}
        title="الإشعارات"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={open ? C.orange : C.muted}>
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 16, height: 16, background: C.orange, borderRadius: '50%',
            fontSize: 9, fontWeight: 800, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff'
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'fixed', top: 8, left: 8, right: 64,
          maxWidth: 340, marginLeft: 'auto',
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: 9999, direction: 'rtl', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F7FA' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: C.navy }}>
              الإشعارات {unread > 0 && <span style={{ background: C.orange, color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, marginRight: 4 }}>{unread}</span>}
            </span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ fontSize: 11, color: C.orange, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                قراءة الكل
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>لا توجد إشعارات</p>
              </div>
            ) : notifs.map((n, i) => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: i < notifs.length - 1 ? `1px solid ${C.border}` : 'none',
                  background: n.is_read ? C.card : '#FEF9F8',
                  cursor: 'pointer', transition: 'background 0.1s'
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8F7FA'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.is_read ? C.card : '#FEF9F8'}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {!n.is_read && (
                    <div style={{ width: 8, height: 8, background: C.orange, borderRadius: '50%', marginTop: 4, flexShrink: 0 }}/>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: n.is_read ? 500 : 700, color: C.navy, margin: 0 }}>{n.title}</p>
                    {n.body && <p style={{ fontSize: 12, color: C.muted, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</p>}
                    <p style={{ fontSize: 10, color: C.muted, margin: '4px 0 0' }}>
                      {new Date(n.created_at).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {n.link && (
                    <Link href={n.link} onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: C.orange, textDecoration: 'none', flexShrink: 0, marginTop: 2 }}>عرض</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
