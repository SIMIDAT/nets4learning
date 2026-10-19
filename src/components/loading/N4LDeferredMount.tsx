import { useEffect, useRef, useState, type ReactNode } from 'react'
import { scheduleIdle } from '@core/scheduler/idleQueue'

type N4LDeferredMountProps = {
  children  : ReactNode
  /** Alto mientras espera, para que la página no salte al montarse */
  minHeight?: number
}

/**
 * Monta su contenido cuando le toca en la cola de tiempo libre o, antes, si se acerca a la vista. Así una página larga
 * no pinta de golpe todo lo que aún no se ve (TODO-worker.md, fase 6)
 */
export default function N4LDeferredMount({ children, minHeight = 240 }: N4LDeferredMountProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (mounted) return
    const cancel = scheduleIdle(() => setMounted(true))
    let observer: IntersectionObserver | undefined
    if (ref.current !== null && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setMounted(true)
      }, { rootMargin: '400px 0px' })
      observer.observe(ref.current)
    }
    return () => {
      cancel()
      observer?.disconnect()
    }
  }, [mounted])

  if (mounted) return <>{children}</>
  return <div ref={ref} style={{ minHeight }} aria-busy={true} data-testid={'Test-DeferredMount'} />
}
