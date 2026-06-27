import { useEffect } from 'react'
import Lenis from 'lenis'

// Satu instance Lenis dipakai bareng biar nav bisa scroll halus ke section.
let lenis = null

export function useSmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
    })

    let raf
    const loop = (time) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      lenis = null
    }
  }, [])
}

export function scrollTo(target) {
  if (lenis) {
    lenis.scrollTo(target, { offset: 0, duration: 1.1 })
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    el?.scrollIntoView({ behavior: 'smooth' })
  }
}
