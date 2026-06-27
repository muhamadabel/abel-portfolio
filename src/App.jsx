import { useEffect, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { useSmoothScroll } from './lib/smoothScroll'
import Preloader from './components/Preloader'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Education from './components/Education'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  useSmoothScroll()
  const [ready, setReady] = useState(false)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 })

  // Pengaman: hero tetap muncul walau preloader tersendat.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 3500)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <Preloader onReveal={() => setReady(true)} />
      <Cursor />
      <motion.div className="scroll-progress" style={{ width: '100%', scaleX }} aria-hidden="true" />
      <Nav />
      <main>
        <Hero ready={ready} />
        <About />
        <Skills />
        <Projects />
        <Education />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
