import { profile } from '../data/content'
import { scrollTo } from '../lib/smoothScroll'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>
          © {year} {profile.name}
        </span>
        <span>Dibuat dengan React, Vite, dan Three.js</span>
        <button className="footer__top" onClick={() => scrollTo('#home')} data-hover>
          Kembali ke atas ↑
        </button>
      </div>
    </footer>
  )
}
