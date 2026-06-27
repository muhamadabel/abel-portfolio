import Reveal from './Reveal'
import { projects } from '../data/content'

export default function Projects() {
  return (
    <section id="work" className="section section--line">
      <div className="container">
        <div className="section-head">
          <span className="section-index">03 / Karya</span>
          <h2 className="section-title">Karya pilihan</h2>
        </div>

        <div className="work__list">
          {projects.map((p, i) => (
            <Reveal className="work-item" key={p.id} delay={i * 0.05}>
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
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
