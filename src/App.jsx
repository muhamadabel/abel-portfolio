import { lazy, Suspense, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { useSmoothScroll } from './lib/smoothScroll'
import Preloader from './components/Preloader'
import Nav from './components/Nav'
import Hero from './components/Hero'
import TechMarquee from './components/TechMarquee'

const loadFocusDeck = () => import('./components/FocusDeck')
const loadExperience = () => import('./components/Experience')
const loadSkills = () => import('./components/Skills')
const loadCVPreview = () => import('./components/CVPreview')
const loadContact = () => import('./components/Contact')
const loadFooter = () => import('./components/Footer')

const chunkLoaders = [loadFocusDeck, loadExperience, loadSkills, loadCVPreview, loadContact, loadFooter]

const FocusDeck = lazy(loadFocusDeck)
const Experience = lazy(loadExperience)
const Skills = lazy(loadSkills)
const CVPreview = lazy(loadCVPreview)
const Contact = lazy(loadContact)
const Footer = lazy(loadFooter)

export default function App() {
  useSmoothScroll()
  const [reveal, setReveal] = useState(false)
  const [ready, setReady] = useState(false)

  return (
    <MotionConfig reducedMotion="user">
      {!ready && (
        <Preloader
          chunkLoaders={chunkLoaders}
          onReveal={() => setReveal(true)}
          onDone={() => {
            setReveal(true)
            setReady(true)
          }}
        />
      )}
      <Nav ready={reveal} />
      <main>
        <Hero reveal={reveal} ready={ready} />
        <TechMarquee />
        <Suspense fallback={null}>
          <FocusDeck />
          <Experience />
          <Skills />
          <CVPreview />
          <Contact />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </MotionConfig>
  )
}
