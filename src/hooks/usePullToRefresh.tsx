'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

interface Options {
  onRefresh: () => Promise<void> | void
  threshold?: number
}

export function usePullToRefresh({ onRefresh, threshold = 80 }: Options) {
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const isPulling = useRef(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0 && window.scrollY === 0) {
      setPulling(true)
      setPullDistance(Math.min(delta * 0.5, threshold + 20))
      if (delta > threshold * 0.5) e.preventDefault()
    }
  }, [threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return
    isPulling.current = false
    if (pullDistance >= threshold * 0.8) {
      setRefreshing(true)
      setPullDistance(40)
      try { await onRefresh() } catch {}
      setRefreshing(false)
    }
    setPulling(false)
    setPullDistance(0)
  }, [pullDistance, threshold, onRefresh])

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const PullIndicator = () => {
    if (!pulling && !refreshing) return null
    return (
      <div style={{
        position: 'fixed', top: 0, left: '50%',
        transform: `translateX(-50%) translateY(${refreshing ? 0 : pullDistance - 40}px)`,
        zIndex: 9999, background: '#1E0A3C',
        padding: '10px 24px', borderRadius: '0 0 20px 20px',
        fontSize: 13, fontWeight: 700, color: '#fff',
        fontFamily: 'Tajawal,sans-serif',
        display: 'flex', alignItems: 'center', gap: 8,
        transition: refreshing ? 'none' : 'transform .1s',
        boxShadow: '0 4px 20px rgba(0,0,0,.3)'
      }}>
        <span style={{
          display: 'inline-block',
          animation: refreshing ? 'spin 1s linear infinite' : 'none',
          fontSize: 16
        }}>
          {refreshing ? '🔄' : pullDistance >= 64 ? '↑' : '↓'}
        </span>
        {refreshing ? 'جاري التحديث...' : pullDistance >= 64 ? 'اترك للتحديث' : 'اسحب للتحديث'}
      </div>
    )
  }

  return { PullIndicator, refreshing }
}
