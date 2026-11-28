import { useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { achievements, education, organizations, profile } from '../data/content'
import { cardReveal, ease, stagger, viewportOnce } from '../lib/motion'
import { toWebpSrc } from '../lib/projectImage'
import SectionHead from './SectionHead'

const ORG_META = {
  'KMTEDI SV UGM': { short: 'KMTEDI', logo: '/logos/kmtedi.png' },
  'ASSETS TRPL SV UGM': { short: 'ASSETS', logo: '/logos/assets.png' },
  'Jamaah Vokasi Al-Alim SV UGM': { short: 'Al-Alim', logo: '/logos/alalim.png' },
  'Hackathon Crew': { short: 'Hackathon', logo: '/logos/refactory.png' },
}

const EDU_LOGO = {
  'Universitas Gadjah Mada (UGM)': { src: '/logos/ugm.png', kind: 'wordmark' },
  'SMAN 1 Kasihan': { src: '/logos/sman1kasihan.png', kind: 'crest' },
}

const dockSpring = { type: 'spring', stiffness: 420, damping: 34 }

function PortraitCard({ reduceMotion }) {
  const cardRef = useRef(null)

  const onMove = (e) => {
    if (reduceMotion || e.pointerType !== 'mouse' || !cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    cardRef.current.style.setProperty('--mx', `${e.clientX - r.left}px`)
    cardRef.current.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <motion.article
      ref={cardRef}
      className="xpb__card xpb__card--portrait"
      variants={cardReveal}
      onPointerMove={onMove}
    >
      <div className="xpb__portrait-aura" aria-hidden="true" />
      <div className="xpb__portrait-media">
        <picture>
          <source srcSet="/profile.webp" type="image/webp" />
          <img
            src={profile.photo}
            alt={profile.name}
            width="680"
            height="670"
            loading="lazy"
            decoding="async"
            draggable="false"
          />
        </picture>
      </div>
      <div className="xpb__portrait-plate">
        <strong>{profile.display}</strong>
        <span>{profile.role}</span>
      </div>
    </motion.article>
  )
}

export default function Experience() {
  const [activeOrg, setActiveOrg] = useState(0)
  const [activeAward, setActiveAward] = useState(0)
  const reduceMotion = useReducedMotion()

  const org = organizations[activeOrg] || organizations[0]
  const orgVisual = ORG_META[org.org] || { short: org.org, logo: '' }
  const award = achievements[activeAward] || achievements[0]

  const onSpotlightMove = (e) => {
    if (reduceMotion || e.pointerType !== 'mouse') return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  const onDockKey = (e, idx) => {
    const n = organizations.length
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % n
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + n) % n
    if (next < 0) return
    e.preventDefault()
    setActiveOrg(next)
  }

  const onAwardKey = (e, idx) => {
    const n = achievements.length
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % n
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + n) % n
    if (next < 0) return
    e.preventDefault()
    setActiveAward(next)
  }

  return (
    <section id="experience" className="section section--band section--experience">
      <div className="container">
        <SectionHead id="experience" />

        <motion.div
          className="xpb"
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          {/* Baris 1 Kiri (7 col): Panggung Organisasi Interaktif Obsidian */}
          <motion.article
            className="xpb__card xpb__card--org"
            variants={cardReveal}
            onPointerMove={onSpotlightMove}
          >
            <div className="xpb__head">
              <span className="xpb__kicker xpb__kicker--light">Organisasi</span>
            </div>

            <div className="xpb__org-stage">
              <AnimatePresence mode="wait">
                <motion.div
                  key={org.org}
                  className="xpb__org-body"
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.34, ease }}
                >
                  {orgVisual.logo && (
                    <picture className="pic-contents">
                      <source srcSet={toWebpSrc(orgVisual.logo)} type="image/webp" />
                      <img
                        src={orgVisual.logo}
                        alt=""
                        aria-hidden="true"
                        className="xpb__org-watermark"
                        decoding="async"
                        draggable="false"
                      />
                    </picture>
                  )}

                  <div className="xpb__org-meta">
                    {orgVisual.logo && (
                      <span className="xpb__org-emblem" aria-hidden="true">
                        <picture className="pic-contents">
                          <source srcSet={toWebpSrc(orgVisual.logo)} type="image/webp" />
                          <img src={orgVisual.logo} alt="" width="24" height="24" decoding="async" draggable="false" />
                        </picture>
                      </span>
                    )}
                    <span className="xpb__org-name">{org.org}</span>
                    <span className="xpb__org-sep" aria-hidden="true">
                      ·
                    </span>
                    <span className="xpb__org-period">{org.period}</span>
                  </div>

                  <h3 className="xpb__org-role">{org.role}</h3>
                  <p className="xpb__org-desc">{org.desc}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <LayoutGroup id="xp-org-dock">
              <div className="xpb__dock" role="tablist" aria-label="Pilih pengalaman organisasi">
                {organizations.map((item, i) => {
                  const meta = ORG_META[item.org] || { short: item.org, logo: '' }
                  const isActive = i === activeOrg
                  return (
                    <button
                      key={item.org}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`xpb__tab${isActive ? ' is-active' : ''}`}
                      onClick={() => setActiveOrg(i)}
                      onKeyDown={(e) => onDockKey(e, i)}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="xp-org-pill"
                          className="xpb__tab-bg"
                          transition={reduceMotion ? { duration: 0 } : dockSpring}
                          aria-hidden="true"
                        />
                      )}
                      <span className="xpb__tab-inner">
                        <strong className="xpb__tab-name">{meta.short}</strong>
                      </span>
                    </button>
                  )
                })}
              </div>
            </LayoutGroup>
          </motion.article>

          {/* Baris 1 Kanan (5 col): Potret Studio 3D Tilt */}
          <PortraitCard reduceMotion={reduceMotion} />

          {/* Baris 2 Kiri (6 col): Plakat Pencapaian Midnight Sapphire + Switcher Sertifikat Resmi */}
          {award && (
            <motion.article
              className="xpb__card xpb__card--award"
              variants={cardReveal}
              onPointerMove={onSpotlightMove}
            >
              <div className="xpb__head xpb__head--award">
                <span className="xpb__kicker xpb__kicker--light">Pencapaian</span>

                {achievements.length > 1 ? (
                  <LayoutGroup id="xp-award-dock">
                    <div
                      className="xpb__award-dock"
                      role="tablist"
                      aria-label="Pilih pencapaian dan sertifikat"
                    >
                      {achievements.map((item, i) => {
                        const isActive = i === activeAward
                        return (
                          <button
                            key={item.id || item.title}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`xpb__award-tab${isActive ? ' is-active' : ''}`}
                            onClick={() => setActiveAward(i)}
                            onKeyDown={(e) => onAwardKey(e, i)}
                          >
                            {isActive && (
                              <motion.span
                                layoutId="xp-award-pill"
                                className="xpb__award-tab-bg"
                                transition={reduceMotion ? { duration: 0 } : dockSpring}
                                aria-hidden="true"
                              />
                            )}
                            <span className="xpb__award-tab-label">{item.short || item.title}</span>
                          </button>
                        )
                      })}
                    </div>
                  </LayoutGroup>
                ) : (
                  <span className="xpb__year">{award.year}</span>
                )}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={award.id || award.title}
                  className="xpb__award-grid"
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease }}
                >
                  <div className="xpb__award-copy">
                    <div className="xpb__award-body">
                      <h3 className="xpb__award-title">{award.title}</h3>
                      <p className="xpb__award-sub">
                        {award.event} · {award.organizer}
                      </p>
                      {award.detail && (
                        <p className="xpb__award-meta">
                          {award.detail} · {award.year}
                        </p>
                      )}
                    </div>
                  </div>

                  {award.certImage && (
                    <a
                      href={award.certPdf || award.certImage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="xpb__cert"
                      aria-label={`Lihat sertifikat resmi ${award.title}`}
                    >
                      <picture className="pic-contents">
                        <source srcSet={toWebpSrc(award.certImage)} type="image/webp" />
                        <img
                          src={award.certImage}
                          alt={award.certAlt || `Sertifikat ${award.title}`}
                          width="720"
                          height="510"
                          loading="lazy"
                          decoding="async"
                          draggable="false"
                        />
                      </picture>
                    </a>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.article>
          )}

          {/* Baris 2 Kanan (7 col): Kartu Pendidikan Kaca Prismatik (Tanpa Garis Pemisah) */}
          <motion.article
            className="xpb__card xpb__card--edu"
            variants={cardReveal}
            onPointerMove={onSpotlightMove}
          >
            <div className="xpb__head">
              <span className="xpb__kicker">Pendidikan</span>
            </div>

            <div className="xpb__edu-grid">
              {education.map((e, idx) => {
                const eduLogo = EDU_LOGO[e.school]
                return (
                  <div
                    key={e.school}
                    className={`xpb__edu-tile${idx === 0 ? ' xpb__edu-tile--primary' : ''}`}
                  >
                    <div className="xpb__edu-top">
                      {eduLogo && (
                        <picture className="pic-contents">
                          <source srcSet={toWebpSrc(eduLogo.src)} type="image/webp" />
                          <img
                            src={eduLogo.src}
                            alt=""
                            aria-hidden="true"
                            className={`xpb__edu-logo${eduLogo.kind === 'crest' ? ' xpb__edu-logo--crest' : ''}`}
                            height={eduLogo.kind === 'crest' ? 26 : 20}
                            decoding="async"
                            draggable="false"
                          />
                        </picture>
                      )}
                      <span className="xpb__edu-period">{e.period}</span>
                    </div>
                    <h3 className="xpb__edu-school">{e.school}</h3>
                    <p className="xpb__edu-prog">
                      {[e.program, e.degree].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.article>
        </motion.div>
      </div>
    </section>
  )
}
