import { useEffect, useRef, useState } from 'react'
import Reveal from './Reveal'
import { projects } from '../data/content'

export default function Projects() {
  const [active, setActive] = useState(null)
  const previewRef = useRef(null)
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0, init: false })

  // Preview mengikuti kursor dengan gerakan halus (lerp).
  useEffect(() => {
    let raf
    const loop = () => {
      const p = pos.current
      if (!p.init) {
        p.x = p.tx
        p.y = p.ty
        p.init = true
      }
      p.x += (p.tx - p.x) * 0.14
      p.y += (p.ty - p.y) * 0.14
      if (previewRef.current) {
        previewRef.current.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onMove = (e) => {
    pos.current.tx = e.clientX
    pos.current.ty = e.clientY
  }

  return (
    <section id="work" className="section section--line">
      <div className="container">
        <div className="section-head">
          <span className="section-index">03 / Karya</span>
          <h2 className="section-title">Karya pilihan</h2>
        </div>

        <div className="work__list" onMouseMove={onMove}>
          {projects.map((p, i) => (
            <Reveal className={`work-item ${active === i ? 'is-active' : ''}`} key={p.id} delay={i * 0.05}>
              <div
                className="work-item__hit"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive((cur) => (cur === i ? null : cur))}
              >
                <div className="work-item__row">
                  <span className="work-item__num">0{i + 1}</span>
                  <h3 className="work-item__title">
                    {p.live ? (
                      <a href={p.live} target="_blank" rel="noreferrer">
                        {p.title}
                      </a>
                    ) : (
                      p.title
                    )}
                    <span className="year">{p.year}</span>
                  </h3>
                  <div className="work-item__meta">
                    <span className="work-item__role">{p.role}</span>
                    <span className="work-item__arrow">↗</span>
                  </div>
                </div>

                <div className="work-item__body">
                  <div className="work-item__body-inner">
                    <p className="work-item__desc">{p.description}</p>
                    <div className="work-item__tags">
                      {p.tags.map((t) => (
                        <span className="tag" key={t}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="work-item__links">
                      {p.live && (
                        <a href={p.live} target="_blank" rel="noreferrer">
                          Lihat live ↗
                        </a>
                      )}
                      {p.repo && (
                        <a href={p.repo} target="_blank" rel="noreferrer">
                          Repo ↗
                        </a>
                      )}
                      {!p.live && !p.repo && (
                        <span style={{ color: 'var(--muted)' }}>Repo privat</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Preview mengikuti kursor (khusus perangkat dengan hover) */}
      <div ref={previewRef} className={`work-preview ${active != null ? 'is-visible' : ''}`} aria-hidden="true">
        {projects.map((p, i) => (
          <div
            key={p.id}
            className="work-preview__card"
            style={{
              opacity: active === i ? 1 : 0,
              background: `linear-gradient(135deg, ${p.preview[0]}, ${p.preview[1]})`,
            }}
          >
            <span className="work-preview__title">{p.title}</span>
            <span className="work-preview__tags">{p.tags.join(' · ')}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
