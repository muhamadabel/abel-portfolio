import { useState } from 'react'
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

function Visual({ ready }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <motion.div
      className="hero__visual"
      initial={{ opacity: 0 }}
      animate={ready ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="hero__glow" aria-hidden="true" />

      <span className="hero__ringwrap" aria-hidden="true">
        <svg className="hero__ring" viewBox="0 0 200 200">
          <defs>
            <path id="heroRingPath" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" fill="none" />
          </defs>
          <text>
            <textPath href="#heroRingPath">
              MUHAMMAD ABEL ABHINAYA · FRONTEND DEVELOPER ·&nbsp;
            </textPath>
          </text>
        </svg>
        <span className="hero__ring-icon">↓</span>
      </span>

      <span className="hero__dot hero__dot--1" aria-hidden="true" />
      <span className="hero__dot hero__dot--2" aria-hidden="true" />
      <span className="hero__dot hero__dot--3" aria-hidden="true" />

      <motion.div
        className="hero__cutout"
        initial={{ y: 28, opacity: 0 }}
        animate={ready ? { y: 0, opacity: 1 } : { y: 28, opacity: 0 }}
        transition={{ duration: 1.1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src={profile.photo}
          alt={`Foto ${profile.name}`}
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={(e) => setLoaded(e.currentTarget.naturalWidth > 1)}
          onError={() => setLoaded(false)}
        />
        {!loaded && (
          <span className="hero__cutout-fallback" aria-hidden="true">
            {profile.initials}
          </span>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function Hero({ ready }) {
  const state = ready ? 'show' : 'hidden'

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

        <Visual ready={ready} />
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <span>Scroll</span>
        <span className="bar" />
      </div>
    </section>
  )
}
