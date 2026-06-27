import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Magnetic from './Magnetic'
import { profile } from '../data/content'
import { scrollTo } from '../lib/smoothScroll'

const lineV = {
  hidden: { y: '115%' },
  show: (i) => ({
    y: 0,
    transition: { duration: 0.9, delay: 0.05 + i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
}

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: 0.4 + i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
}

function Portrait({ ready }) {
  // Foto asli kamu di public/profile.jpg. Sebelum ada, tampil inisial.
  const [loaded, setLoaded] = useState(false)
  return (
    <motion.div
      className="hero__portrait"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
      transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="hero__portrait-accent" aria-hidden="true" />
      <div className="hero__portrait-card">
        <img
          src={profile.photo}
          alt={`Foto ${profile.name}`}
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={(e) => setLoaded(e.currentTarget.naturalWidth > 1)}
          onError={() => setLoaded(false)}
        />
        {!loaded && (
          <div className="fallback" aria-hidden="true">
            {profile.initials}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function Hero({ ready }) {
  const state = ready ? 'show' : 'hidden'
  const tiltRef = useRef(null)

  const onMove = (e) => {
    const el = tiltRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg)`
  }
  const onLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)'
  }

  return (
    <section id="home" className="hero">
      <div className="container hero__inner">
        <div className="hero__text">
          <motion.div className="hero__eyebrow" variants={fade} custom={0} initial="hidden" animate={state}>
            <span className="pill">
              <span className="live-dot" />
              {profile.availableText}
            </span>
            <span className="eyebrow">{profile.location}</span>
          </motion.div>

          <h1 className="hero__title display" aria-label={profile.tagline}>
            <span className="line">
              <motion.span variants={lineV} custom={0} initial="hidden" animate={state} style={{ display: 'inline-block' }}>
                Everyone
              </motion.span>
            </span>
            <span className="line">
              <motion.span variants={lineV} custom={1} initial="hidden" animate={state} style={{ display: 'inline-block' }}>
                love <span className="accent">clean</span>
              </motion.span>
            </span>
            <span className="line">
              <motion.span variants={lineV} custom={2} initial="hidden" animate={state} style={{ display: 'inline-block' }}>
                things.
              </motion.span>
            </span>
          </h1>

          <motion.p className="hero__lead" variants={fade} custom={1} initial="hidden" animate={state}>
            Halo, aku {profile.display}. {profile.role} yang suka bikin antarmuka rapi, ringan, dan nyaman
            dipakai.
          </motion.p>

          <motion.div className="hero__actions" variants={fade} custom={2} initial="hidden" animate={state}>
            <Magnetic>
              <button className="btn btn--solid" onClick={() => scrollTo('#work')} data-hover>
                Lihat karya <span className="arrow">↗</span>
              </button>
            </Magnetic>
            <Magnetic>
              <button className="btn btn--ghost" onClick={() => scrollTo('#contact')} data-hover>
                Kontak
              </button>
            </Magnetic>
          </motion.div>
        </div>

        <div className="hero__portrait-wrap" ref={tiltRef} onMouseMove={onMove} onMouseLeave={onLeave}>
          <Portrait ready={ready} />
        </div>
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <span>Scroll</span>
        <span className="bar" />
      </div>
    </section>
  )
}
