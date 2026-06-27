import { motion } from 'framer-motion'
import Scene3D from './Scene3D'
import { profile } from '../data/content'
import { scrollTo } from '../lib/smoothScroll'

const line = {
  hidden: { y: '115%' },
  show: (i) => ({
    y: 0,
    transition: { duration: 0.95, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
}

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: 0.55 + i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero__scene">
        <Scene3D />
      </div>

      <div className="container hero__inner">
        <motion.div
          className="hero__eyebrow"
          variants={fade}
          custom={0}
          initial="hidden"
          animate="show"
        >
          <span className="pill">
            <span className="live-dot" />
            {profile.availableText}
          </span>
          <span className="eyebrow">
            {profile.name} · {profile.role}
          </span>
        </motion.div>

        <h1 className="hero__title display" aria-label={profile.tagline}>
          <span className="line">
            <motion.span variants={line} custom={0} initial="hidden" animate="show" style={{ display: 'inline-block' }}>
              Everyone
            </motion.span>
          </span>
          <span className="line">
            <motion.span variants={line} custom={1} initial="hidden" animate="show" style={{ display: 'inline-block' }}>
              love <span className="accent">clean</span>
            </motion.span>
          </span>
          <span className="line">
            <motion.span variants={line} custom={2} initial="hidden" animate="show" style={{ display: 'inline-block' }}>
              things.
            </motion.span>
          </span>
        </h1>

        <div className="hero__meta">
          <motion.div variants={fade} custom={1} initial="hidden" animate="show">
            <span className="eyebrow" style={{ display: 'block', marginBottom: '0.7rem' }}>
              {profile.location}
            </span>
            <p className="hero__lead">
              Frontend developer yang suka bikin antarmuka rapi, ringan, dan nyaman dipakai.
            </p>
          </motion.div>

          <motion.div
            className="hero__actions"
            variants={fade}
            custom={2}
            initial="hidden"
            animate="show"
          >
            <button className="btn btn--solid" onClick={() => scrollTo('#work')} data-hover>
              Lihat karya <span className="arrow">↗</span>
            </button>
            <button className="btn btn--ghost" onClick={() => scrollTo('#contact')} data-hover>
              Kontak
            </button>
          </motion.div>
        </div>
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <span>Scroll</span>
        <span className="bar" />
      </div>
    </section>
  )
}
