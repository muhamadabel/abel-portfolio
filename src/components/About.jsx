import { useState } from 'react'
import Reveal from './Reveal'
import { profile, stats } from '../data/content'

function Photo() {
  // Tampilkan inisial sampai ada foto asli yang benar-benar termuat.
  // Begitu kamu taruh public/profile.jpg, fotonya otomatis muncul.
  const [loaded, setLoaded] = useState(false)
  return (
    <figure className="about__photo">
      <img
        src={profile.photo}
        alt={`Foto ${profile.name}`}
        loading="lazy"
        style={{ opacity: loaded ? 1 : 0 }}
        onLoad={(e) => setLoaded(e.currentTarget.naturalWidth > 1)}
        onError={() => setLoaded(false)}
      />
      {!loaded && (
        <div className="fallback" aria-hidden="true">
          {profile.initials}
        </div>
      )}
      <figcaption>{profile.name}</figcaption>
    </figure>
  )
}

export default function About() {
  return (
    <section id="about" className="section section--line">
      <div className="container">
        <div className="section-head">
          <span className="section-index">01 / Tentang</span>
          <h2 className="section-title">Tentang</h2>
        </div>

        <div className="about__grid">
          <div className="about__bio">
            {profile.bio.map((para, i) => (
              <Reveal as="p" key={i} delay={i * 0.08}>
                {para}
              </Reveal>
            ))}

            <div className="stats">
              {stats.map((s, i) => (
                <Reveal className="stat" key={s.label} delay={i * 0.06}>
                  <div className="stat__value">{s.value}</div>
                  <div className="stat__label">{s.label}</div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={0.1}>
            <Photo />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
