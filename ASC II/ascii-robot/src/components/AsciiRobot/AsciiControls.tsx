import { useEffect, useRef } from 'react'

interface ControlState {
  x: number
  y: number
}

interface UseAsciiControlsOptions {
  rotationRef: React.MutableRefObject<ControlState>
  zoomRef: React.MutableRefObject<number>
  target: React.RefObject<HTMLElement>
  defaultRotation?: ControlState
  defaultZoom?: number
  zoomMin?: number
  zoomMax?: number
}

/**
 * Manages drag-to-rotate (mouse + touch) with inertia,
 * scroll-to-zoom, and smooth reset — all via refs (no re-renders).
 */
export function useAsciiControls({
  rotationRef,
  zoomRef,
  target,
  defaultRotation = { x: 0.1, y: 0 },
  defaultZoom = 5,
  zoomMin = 2.5,
  zoomMax = 9,
}: UseAsciiControlsOptions) {

  const velRef   = useRef({ x: 0, y: 0 })
  const dragRef  = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false, lastX: 0, lastY: 0,
  })
  const resetRef = useRef(false)

  /* ── Inertia tick (called externally each RAF) ────────── */
  const tick = () => {
    if (resetRef.current) {
      /* Smoothly interpolate back to default */
      const dx = defaultRotation.x - rotationRef.current.x
      const dy = defaultRotation.y - rotationRef.current.y
      const dz = defaultZoom       - zoomRef.current

      rotationRef.current.x += dx * 0.08
      rotationRef.current.y += dy * 0.08
      zoomRef.current        += dz * 0.08

      if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001 && Math.abs(dz) < 0.01) {
        rotationRef.current.x = defaultRotation.x
        rotationRef.current.y = defaultRotation.y
        zoomRef.current        = defaultZoom
        resetRef.current       = false
      }
      return
    }

    if (!dragRef.current.active) {
      /* Dampen velocity */
      velRef.current.x *= 0.88
      velRef.current.y *= 0.88
      rotationRef.current.x = Math.max(
        -0.55,
        Math.min(0.55, rotationRef.current.x + velRef.current.x)
      )
      rotationRef.current.y += velRef.current.y
    }
  }

  const reset = () => { resetRef.current = true }

  /* ── Attach event listeners ───────────────────────────── */
  useEffect(() => {
    const el = target.current
    if (!el) return

    /* ── Mouse ──────────────────────────────────────────── */
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY }
      velRef.current  = { x: 0, y: 0 }
      resetRef.current = false
      el.style.cursor = 'grabbing'
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return
      const dx = e.clientX - dragRef.current.lastX
      const dy = e.clientY - dragRef.current.lastY
      dragRef.current.lastX = e.clientX
      dragRef.current.lastY = e.clientY

      const sensitivity = 0.008
      velRef.current.y = dx * sensitivity
      velRef.current.x = dy * sensitivity * 0.5

      rotationRef.current.y += velRef.current.y
      rotationRef.current.x = Math.max(
        -0.55,
        Math.min(0.55, rotationRef.current.x + velRef.current.x)
      )
    }

    const onMouseUp = () => {
      dragRef.current.active = false
      el.style.cursor = 'grab'
    }

    /* ── Wheel zoom ─────────────────────────────────────── */
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomRef.current = Math.max(
        zoomMin,
        Math.min(zoomMax, zoomRef.current - e.deltaY * 0.005)
      )
    }

    /* ── Touch ──────────────────────────────────────────── */
    let touchStart: { x: number; y: number } | null = null
    let pinchStart: number | null = null

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        dragRef.current = {
          active: true,
          lastX: e.touches[0].clientX,
          lastY: e.touches[0].clientY,
        }
        velRef.current  = { x: 0, y: 0 }
        resetRef.current = false
      } else if (e.touches.length === 2) {
        const a = e.touches[0], b = e.touches[1]
        pinchStart = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
        dragRef.current.active = false
        touchStart = null
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 1 && dragRef.current.active) {
        const dx = e.touches[0].clientX - dragRef.current.lastX
        const dy = e.touches[0].clientY - dragRef.current.lastY
        dragRef.current.lastX = e.touches[0].clientX
        dragRef.current.lastY = e.touches[0].clientY

        const sensitivity = 0.008
        velRef.current.y = dx * sensitivity
        velRef.current.x = dy * sensitivity * 0.5

        rotationRef.current.y += velRef.current.y
        rotationRef.current.x = Math.max(
          -0.55,
          Math.min(0.55, rotationRef.current.x + velRef.current.x)
        )
      } else if (e.touches.length === 2 && pinchStart !== null) {
        const a = e.touches[0], b = e.touches[1]
        const newDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
        const delta = (newDist - pinchStart) * 0.01
        zoomRef.current = Math.max(zoomMin, Math.min(zoomMax, zoomRef.current + delta))
        pinchStart = newDist
      }
    }

    const onTouchEnd = () => {
      dragRef.current.active = false
      touchStart = null
      pinchStart = null
    }

    el.addEventListener('mousedown',  onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    el.addEventListener('wheel',      onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove',  onTouchMove,  { passive: false })
    el.addEventListener('touchend',   onTouchEnd)

    el.style.cursor = 'grab'

    return () => {
      el.removeEventListener('mousedown',  onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
      el.removeEventListener('wheel',      onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  }, [target, rotationRef, zoomRef, zoomMin, zoomMax, defaultRotation, defaultZoom])

  return { tick, reset }
}
