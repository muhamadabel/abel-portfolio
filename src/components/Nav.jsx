import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { profile, sections } from '../data/content'
import { scrollTo } from '../lib/smoothScroll'
import { useScrollSpy } from '../hooks/useScrollSpy'
import { ease, springSoft } from '../lib/motion'
import ThemeToggle from './ThemeToggle'
import LiquidGlass from './fx/LiquidGlass'

const navItems = [
  { id: 'work', label: 'Karya', target: '#top' },
  { id: 'focus', label: 'Fokus', target: '#focus' },
  ...sections
    .filter((s) => s.id !== 'work' && s.id !== 'contact')
    .map((s) => ({ id: s.id, label: s.label, target: `#${s.id}` })),
]

const spyIds = ['top', 'focus', 'experience', 'skills', 'cv', 'contact']

export default function Nav({ ready }) {
  const active = useScrollSpy(spyIds)
  const [hovered, setHovered] = useState(null)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const last = useRef(0)

  const { scrollY } = useScroll()

  // Sembunyi saat scroll turun, muncul lagi saat scroll naik.
  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 24)
    setHidden(y > 540 && y > last.current && !open)
    last.current = y
  })

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (e, target) => {
    e.preventDefault()
    setOpen(false)
    scrollTo(target)
    history.replaceState(null, '', target === '#top' ? location.pathname : target)
  }

  return (
    <motion.header
      className={`nav no-print${scrolled ? ' is-scrolled' : ''}`}
      initial={{ y: -24, opacity: 0 }}
      animate={ready ? { y: hidden ? -96 : 0, opacity: 1 } : { y: -24, opacity: 0 }}
      transition={{ duration: 0.6, ease }}
    >
      <LiquidGlass
        className="nav__inner"
        radius={999}
        bevelDepth={14}
        scale={28}
        aberration={3}
        frost={0.7}
      >
        <a href="#top" className="nav__brand" onClick={(e) => go(e, '#top')}>
          <span className="nav__mark">
            <picture>
              <source srcSet="/logo-a.webp" type="image/webp" />
              <img src="/logo-a.png" alt="Logo Abel Abhinaya" width="28" height="18" decoding="async" />
            </picture>
          </span>
          <span className="nav__name">{profile.display}</span>
        </a>

        <nav className="nav__links" aria-label="Navigasi utama" onMouseLeave={() => setHovered(null)}>
          {navItems.map((item) => {
            const isActive = active === item.id
            return (
              <a
                key={item.id}
                href={item.target}
                className={`nav__link${isActive ? ' is-active' : ''}`}
                aria-current={isActive ? 'true' : undefined}
                onMouseEnter={() => setHovered(item.id)}
                onFocus={() => setHovered(item.id)}
                onBlur={() => setHovered(null)}
                onClick={(e) => go(e, item.target)}
              >
                {hovered === item.id && (
                  <motion.span className="nav__hover-pill" layoutId="nav-hover" transition={springSoft} />
                )}
                <span className="nav__label">
                  {isActive && <motion.span className="nav__dot" layoutId="nav-dot" transition={springSoft} aria-hidden="true" />}
                  {item.label}
                </span>
              </a>
            )
          })}
        </nav>

        <div className="nav__actions">
          <ThemeToggle />
          <a
            href="#contact"
            className={`nav__cta${active === 'contact' ? ' is-active' : ''}`}
            onClick={(e) => go(e, '#contact')}
          >
            Hubungi
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden="true">
              <path d="M7 17 17 7M7 7h10v10" />
            </svg>
          </a>
          <button
            type="button"
            className={`nav__burger${open ? ' is-open' : ''}`}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
          >
            <span />
            <span />
          </button>
        </div>
      </LiquidGlass>

      <AnimatePresence>
        {open && (
          <motion.nav
            className="nav__sheet"
            aria-label="Navigasi mobile"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.35, ease }}
          >
            {[...navItems, { id: 'contact', label: 'Hubungi', target: '#contact' }].map((item, i) => (
              <motion.a
                key={item.id}
                href={item.target}
                className={`nav__sheet-link${active === item.id ? ' is-active' : ''}`}
                onClick={(e) => go(e, item.target)}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease, delay: 0.04 + 0.04 * i }}
              >
                {item.label}
              </motion.a>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
