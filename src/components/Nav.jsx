import { useState } from 'react'
import { profile, sections } from '../data/content'
import { scrollTo } from '../lib/smoothScroll'
import { useScrollSpy, useScrolled } from '../hooks/useScrollSpy'

const IDS = sections.map((s) => s.id)

export default function Nav() {
  const [open, setOpen] = useState(false)
  const active = useScrollSpy(IDS)
  const scrolled = useScrolled()

  const go = (e, id) => {
    e.preventDefault()
    setOpen(false)
    scrollTo('#' + id)
  }

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container nav__inner">
        <a href="#home" className="nav__brand" onClick={(e) => go(e, 'home')}>
          {profile.display}
          <span className="dot" />
        </a>

        <nav className={`nav__links ${open ? 'is-open' : ''}`} aria-label="Navigasi utama">
          {sections
            .filter((s) => s.id !== 'home' && s.id !== 'contact')
            .map((s) => (
              <a
                key={s.id}
                href={'#' + s.id}
                className={`nav__link ${active === s.id ? 'is-active' : ''}`}
                onClick={(e) => go(e, s.id)}
              >
                {s.label}
              </a>
            ))}
          <a href="#contact" className="nav__cta" onClick={(e) => go(e, 'contact')}>
            Ngobrol yuk
          </a>
        </nav>

        <button
          className={`nav__toggle ${open ? 'is-open' : ''}`}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
