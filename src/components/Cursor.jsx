import { useEffect, useRef } from 'react'

// Cursor kustom (dot + ring) khusus perangkat dengan pointer presisi.
export default function Cursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!finePointer) return

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const ring = { x: pos.x, y: pos.y }
    let raf

    const onMove = (e) => {
      pos.x = e.clientX
      pos.y = e.clientY
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`
      }
    }
    const onOver = (e) => {
      if (e.target.closest('a, button, [data-hover]')) {
        ringRef.current?.classList.add('is-hover')
      }
    }
    const onOut = (e) => {
      if (e.target.closest('a, button, [data-hover]')) {
        ringRef.current?.classList.remove('is-hover')
      }
    }

    const loop = () => {
      ring.x += (pos.x - ring.x) * 0.18
      ring.y += (pos.y - ring.y) * 0.18
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.x}px, ${ring.y}px) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    window.addEventListener('mouseout', onOut)
    raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mouseout', onOut)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  )
}
