import Reveal from './Reveal'
import { skills } from '../data/content'

const allTech = skills.flatMap((g) => g.items)

export default function Skills() {
  return (
    <section id="skills" className="section section--line">
      <div className="container">
        <div className="section-head">
          <span className="section-index">02 / Keahlian</span>
          <h2 className="section-title">Keahlian</h2>
        </div>

        <Reveal>
          <div className="skills__grid">
            {skills.map((group) => (
              <div className="skill-group" key={group.group}>
                <div className="skill-group__name">{group.group}</div>
                <div className="skill-group__items">
                  {group.items.map((item) => (
                    <span className="skill-chip" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {[...allTech, ...allTech].map((t, i) => (
            <span className="marquee__item" key={i}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
