import Reveal from './Reveal'
import { education } from '../data/content'

export default function Education() {
  return (
    <section id="education" className="section section--line">
      <div className="container">
        <div className="section-head">
          <span className="section-index">04 / Pendidikan</span>
          <h2 className="section-title">Pendidikan</h2>
        </div>

        <Reveal>
          <div className="edu__row">
            <h3 className="edu__school">{education.school}</h3>
            <div className="edu__meta">
              <span>{education.program}</span>
              <span className="edu__period">{education.period}</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
