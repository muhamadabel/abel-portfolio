import { useEffect, useRef } from 'react'
import { useAnimationFrame, useReducedMotion } from 'framer-motion'
import { affiliations } from '../data/content'
import { toWebpSrc } from '../lib/projectImage'

export default function TechMarquee() {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const pausedRef = useRef(false)
  const visibleRef = useRef(true)
  const groupWidthRef = useRef(0)
  const xRef = useRef(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const track = trackRef.current
    const section = sectionRef.current
    if (!track || !section) return

    const firstGroup = track.firstElementChild
    const updateWidth = () => {
      if (firstGroup) groupWidthRef.current = firstGroup.offsetWidth || 0
    }
    updateWidth()

    const ro = firstGroup ? new ResizeObserver(updateWidth) : null
    if (ro && firstGroup) ro.observe(firstGroup)

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry ? entry.isIntersecting : true
      },
      { threshold: 0.01 },
    )
    io.observe(section)

    return () => {
      ro?.disconnect()
      io.disconnect()
    }
  }, [])

  useAnimationFrame((_, delta) => {
    if (reduceMotion || pausedRef.current || !visibleRef.current || !trackRef.current) return
    const groupW = groupWidthRef.current
    if (!groupW) return
    xRef.current -= Math.min(delta, 40) * 0.038
    if (xRef.current <= -groupW) xRef.current += groupW
    trackRef.current.style.transform = `translate3d(${xRef.current.toFixed(2)}px,0,0)`
  })

  return (
    <section
      ref={sectionRef}
      className="lmarq no-print"
      aria-label="Institusi, organisasi, dan mitra kolaborasi"
      onMouseEnter={() => {
        pausedRef.current = true
      }}
      onMouseLeave={() => {
        pausedRef.current = false
      }}
    >
      <div className="lmarq__track" ref={trackRef}>
        {[0, 1].map((dup) => (
          <div className="lmarq__group" key={dup} aria-hidden={dup === 1}>
            {affiliations.map((item) => (
              <div className="lmarq__item" key={`${dup}-${item.id}`} title={item.name}>
                {item.kind === 'lockup' ? (
                  <div className="lmarq__lockup">
                    <picture className="pic-contents">
                      <source srcSet={toWebpSrc(item.logo)} type="image/webp" />
                      <img
                        src={item.logo}
                        alt={dup === 0 ? item.name : ''}
                        className="lmarq__img lmarq__img--emblem"
                        width="32"
                        height="32"
                        decoding="async"
                        draggable="false"
                      />
                    </picture>
                    <span className="lmarq__text">
                      <strong>{item.label}</strong>
                      <span>{item.sub}</span>
                    </span>
                  </div>
                ) : (
                  <picture className="pic-contents">
                    <source srcSet={toWebpSrc(item.logo)} type="image/webp" />
                    <img
                      src={item.logo}
                      alt={dup === 0 ? item.name : ''}
                      className="lmarq__img lmarq__img--wordmark"
                      style={item.scale ? { '--logo-scale': item.scale } : undefined}
                      height="26"
                      decoding="async"
                      draggable="false"
                    />
                  </picture>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
