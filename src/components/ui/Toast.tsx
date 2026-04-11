'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'
type Toast = { id: string; type: ToastType; message: string; duration?: number }

const ICONS: Record<ToastType, string> = {
  success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️'
}
const COLORS: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: { bg: '#EAF7E0', border: '#9DE07B', color: '#166534' },
  error:   { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' },
  info:    { bg: '#E6F1FB', border: '#93C5FD', color: '#185FA5' },
  warning: { bg: '#FFF8E8', border: '#F5D56B', color: '#854F0B' },
}

const ToastContext = createContext<{
  toast: (message: string, type?: ToastType, duration?: number) => void
}>({ toast: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success', duration = 3500) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message, duration }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10,
        pointerEvents: 'none', minWidth: 280, maxWidth: 420
      }}>
        {toasts.map(t => {
          const c = COLORS[t.type]
          return (
            <div key={t.id} style={{
              background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12,
              padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'Tajawal, sans-serif', fontSize: 14, fontWeight: 600,
              color: c.color, direction: 'rtl', pointerEvents: 'all',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              animation: 'toastIn 0.25s ease',
            }}>
              <span style={{ fontSize: 18 }}>{ICONS[t.type]}</span>
              {t.message}
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateY(-12px) scale(0.96); }
          to   { opacity:1; transform:translateY(0)    scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
