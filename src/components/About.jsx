import Reveal from './Reveal'
import { profile, education } from '../data/content'

const facts = [
  { k: 'Lokasi', v: profile.location },
  { k: 'Fokus', v: 'React, Next.js, Laravel' },
  { k: 'Pendidikan', v: `${education.program}, UGM` },
  { k: 'Angka keberuntungan', v: '21' },
]

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
          </div>

          <Reveal className="about__facts" delay={0.1}>
            <ul className="facts">
              {facts.map((f) => (
                <li className="fact" key={f.k}>
                  <span className="fact__k">{f.k}</span>
                  <span className="fact__v">{f.v}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
