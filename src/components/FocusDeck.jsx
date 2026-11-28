import { useEffect, useRef } from 'react'
import { useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion'
import { projects } from '../data/content'
import { projectImageSrc } from '../lib/projectImage'

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

// Matematika 3D Tilt-Stacking adaptasi 21st.dev id:44650 (kedhareswer/tilt-stack-scroll)
function pose(p, i, reduced, compact) {
  const enter = i === 0 ? 1 : clamp(p - (i - 1), 0, 1)
  const depth = clamp(p - i, 0, 2.5)
  if (reduced) {
    return { y: 0, scale: 1, rx: 0, rz: 0, shade: Math.min(depth, 1) * 0.35, opacity: enter >= 1 ? 1 : enter }
  }
  const e = easeOut(enter)
  const lift = compact ? 2.1 : 3.2
  const enterAlpha = i === 0 ? 1 : clamp(enter / 0.08, 0, 1)
  const exitAlpha = depth > 2.2 ? clamp((2.6 - depth) / 0.4, 0, 1) : 1
  return {
    y: (1 - e) * 155 - depth * lift,
    scale: (1 - depth * 0.055) * (0.92 + 0.08 * e),
    rx: (1 - e) * 16 - depth * 7,
    rz: (1 - e) * (i % 2 ? 3 : -3),
    shade: Math.min(depth, 2) * 0.22,
    opacity: Math.min(enterAlpha, exitAlpha),
  }
}

const toTransform = (q) =>
  `translate3d(0,${q.y.toFixed(3)}%,0) perspective(1400px) rotateX(${q.rx.toFixed(3)}deg) rotateZ(${q.rz.toFixed(3)}deg) scale(${q.scale.toFixed(4)})`

const cards = [
  {
    id: 'frontend',
    tone: 'blue',
    title: 'Web & Front End',
    desc: 'Antarmuka web yang cepat, presisi, dan responsif dari sistem desain hingga kode produksi.',
    tags: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    previews: [projects[0], projects[1]].filter(Boolean),
  },
  {
    id: 'fullstack',
    tone: 'dark',
    title: 'Full-Stack & Data',
    desc: 'Arsitektur aplikasi end-to-end dengan autentikasi aman, integrasi API, dan basis data terstruktur.',
    tags: ['Node.js', 'PostgreSQL', 'Prisma', 'Supabase'],
    previews: [projects[2], projects[3]].filter(Boolean),
  },
  {
    id: 'mobile-qa',
    tone: 'light',
    title: 'Mobile & Quality',
    desc: 'Pengembangan aplikasi mobile lintas platform yang ringan dengan alur pengujian terotomasi.',
    tags: ['React Native', 'Expo', 'Selenium', 'Cucumber'],
    previews: [projects[4], projects[6]].filter(Boolean),
  },
]

export default function FocusDeck() {
  const trackRef = useRef(null)
  const cardEls = useRef([])
  const shadeEls = useRef([])
  const stepEls = useRef([])
  const reduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  const n = cards.length

  const paint = (progress) => {
    const compact = typeof window !== 'undefined' && window.innerWidth < 900
    if (compact) {
      for (let i = 0; i < n; i++) {
        const el = cardEls.current[i]
        if (el) {
          el.style.transform = ''
          el.style.opacity = ''
        }
        const sh = shadeEls.current[i]
        if (sh) sh.style.opacity = '0'
      }
      return
    }
    const p = clamp(progress, 0, 1) * (n - 1)
    for (let i = 0; i < n; i++) {
      const el = cardEls.current[i]
      if (!el) continue
      const q = pose(p, i, reduceMotion, false)
      el.style.transform = toTransform(q)
      el.style.opacity = String(q.opacity)
      const sh = shadeEls.current[i]
      if (sh) sh.style.opacity = String(q.shade)
    }
    const active = Math.round(p)
    stepEls.current.forEach((dot, idx) => {
      if (!dot) return
      dot.dataset.active = idx === active ? 'true' : 'false'
    })
  }

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    paint(v)
  })

  useEffect(() => {
    const sync = () => paint(scrollYProgress.get())
    sync()
    window.addEventListener('resize', sync, { passive: true })
    return () => window.removeEventListener('resize', sync)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion])

  return (
    <section
      id="focus"
      ref={trackRef}
      className="fdeck-track is-sticky"
      style={{ height: `calc(100svh * ${n - 0.35})` }}
      aria-label="Fokus keahlian"
    >
      <div className="fdeck-stage">
        <div className="container fdeck-shell">
          <header className="fdeck-head">
            <h2 className="section-title">Fokus</h2>

            <div className="fdeck-steps" aria-hidden="true">
              {cards.map((c, idx) => (
                <span
                  key={c.id}
                  ref={(el) => (stepEls.current[idx] = el)}
                  className="fdeck-step"
                  data-active={idx === 0 ? 'true' : 'false'}
                />
              ))}
            </div>
          </header>

          <div className="fdeck-cards">
            {cards.map((card, i) => (
              <article
                key={card.id}
                ref={(el) => (cardEls.current[i] = el)}
                className={`fcard fcard--${card.tone}`}
                style={{ zIndex: i + 1, '--card-i': i }}
              >
                <div className="fcard__shade" ref={(el) => (shadeEls.current[i] = el)} aria-hidden="true" />

                <div className="fcard__grid">
                  {/* Kiri: preview proyek menghadap miring 3D ke tengah */}
                  {card.previews[0] && (
                    <div className="fcard__wing fcard__wing--left">
                      <a
                        href={card.previews[0].live || card.previews[0].repo}
                        target="_blank"
                        rel="noreferrer"
                        className="fcard__showcase"
                        aria-label={`Buka proyek ${card.previews[0].title}`}
                      >
                        <span className="fcard__frame fcard__frame--left">
                          <picture>
                            <source
                              media="(max-width: 639px)"
                              srcSet={projectImageSrc(card.previews[0].image, true)}
                              type="image/webp"
                            />
                            <source srcSet={projectImageSrc(card.previews[0].image, false)} type="image/webp" />
                            <img
                              src={card.previews[0].image}
                              alt={`Pratinjau proyek ${card.previews[0].title}`}
                              width="1024"
                              height="640"
                              loading="lazy"
                              decoding="async"
                              draggable="false"
                            />
                          </picture>
                        </span>
                        <span className="fcard__cap">
                          {card.previews[0].title}
                          <span className="fcard__cap-arrow" aria-hidden="true">
                            ↗
                          </span>
                        </span>
                      </a>
                    </div>
                  )}

                  {/* Tengah: tipografi judul, deskripsi, dan stack inti rata tengah */}
                  <div className="fcard__center">
                    <div className="fcard__copy">
                      <h3 className="fcard__title">{card.title}</h3>
                      <p className="fcard__desc">{card.desc}</p>
                      {card.tags?.length > 0 && (
                        <ul className="fcard__tags" aria-label={`Teknologi utama ${card.title}`}>
                          {card.tags.map((tag) => (
                            <li key={tag} className="fcard__tag">
                              {tag}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Kanan: preview proyek menghadap miring 3D ke tengah */}
                  {card.previews[1] && (
                    <div className="fcard__wing fcard__wing--right">
                      <a
                        href={card.previews[1].live || card.previews[1].repo}
                        target="_blank"
                        rel="noreferrer"
                        className="fcard__showcase"
                        aria-label={`Buka proyek ${card.previews[1].title}`}
                      >
                        <span className="fcard__frame fcard__frame--right">
                          <picture>
                            <source
                              media="(max-width: 639px)"
                              srcSet={projectImageSrc(card.previews[1].image, true)}
                              type="image/webp"
                            />
                            <source srcSet={projectImageSrc(card.previews[1].image, false)} type="image/webp" />
                            <img
                              src={card.previews[1].image}
                              alt={`Pratinjau proyek ${card.previews[1].title}`}
                              width="1024"
                              height="640"
                              loading="lazy"
                              decoding="async"
                              draggable="false"
                            />
                          </picture>
                        </span>
                        <span className="fcard__cap">
                          {card.previews[1].title}
                          <span className="fcard__cap-arrow" aria-hidden="true">
                            ↗
                          </span>
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
