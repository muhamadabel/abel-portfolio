import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// Layar pembuka: hitung 0 sampai 100, lalu tirai naik membuka hero.
export default function Preloader({ onReveal }) {
  const [count, setCount] = useState(0)
  const [exit, setExit] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dur = reduce ? 350 : 1500
    let raf
    let start = null
    const tick = (t) => {
      if (start === null) start = t
      const p = Math.min((t - start) / dur, 1)
      setCount(Math.round(p * 100))
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setTimeout(() => {
          setExit(true)
          onReveal?.()
        }, 220)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      className="preloader"
      initial={{ y: 0 }}
      animate={{ y: exit ? '-100%' : 0 }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
      aria-hidden="true"
    >
      <div className="preloader__inner">
        <span className="preloader__name">Muhammad Abel Abhinaya</span>
        <span className="preloader__count">{count}</span>
      </div>
      <div className="preloader__bar">
        <span style={{ transform: `scaleX(${count / 100})` }} />
      </div>
    </motion.div>
  )
}
