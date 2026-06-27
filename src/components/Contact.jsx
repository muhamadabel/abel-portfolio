import Reveal from './Reveal'
import { contact } from '../data/content'

export default function Contact() {
  return (
    <section id="contact" className="section section--line contact">
      <div className="container">
        <Reveal>
          <span className="section-index">05 / Kontak</span>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="contact__title display">
            Ngobrol <span style={{ fontStyle: 'italic' }}>yuk?</span>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p style={{ color: 'var(--ink-2)', maxWidth: '46ch', margin: '0 auto 2.2rem' }}>
            Lagi cari frontend developer atau mau ngobrolin sebuah ide? Kirim email aja, aku usahakan
            balas secepatnya.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <a className="btn btn--solid" href={`mailto:${contact.email}`} data-hover>
            {contact.email} <span className="arrow">↗</span>
          </a>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="contact__socials">
            <a className="contact__social" href={contact.github.url} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            <a
              className="contact__social"
              href={contact.linkedin.url}
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn ↗
            </a>
            <a
              className="contact__social"
              href={contact.instagram.url}
              target="_blank"
              rel="noreferrer"
            >
              Instagram ↗
            </a>
            {contact.cv && (
              <a className="contact__social" href={contact.cv} target="_blank" rel="noreferrer">
                CV ↗
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
