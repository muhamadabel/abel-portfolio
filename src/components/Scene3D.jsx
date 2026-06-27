import { Suspense, useEffect, useRef, Component } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, MeshDistortMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

// Kalau WebGL gagal di perangkat tertentu, halaman tetap jalan.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    if (typeof window !== 'undefined') {
      window.__sceneErr = (error && (error.stack || error.message)) || String(error)
      // eslint-disable-next-line no-console
      console.error('Scene3D error:', error)
    }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

const REDUCE =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function ChromeForm() {
  const mesh = useRef(null)
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useFrame((state, delta) => {
    const m = mesh.current
    if (!m) return
    const w = state.viewport.width
    const compact = w < 7
    const baseX = compact ? 0 : w * 0.19
    const baseY = compact ? 0.5 : 0
    const d = Math.min(delta, 0.05)

    m.position.x = THREE.MathUtils.damp(m.position.x, baseX + mouse.current.x * 0.45, 3, d)
    m.position.y = THREE.MathUtils.damp(m.position.y, baseY + mouse.current.y * 0.45, 3, d)

    const target = compact ? 1.25 : 1.75
    m.scale.setScalar(THREE.MathUtils.damp(m.scale.x, target, 4, d))

    if (!REDUCE) {
      m.rotation.y += d * 0.2
      m.rotation.x = THREE.MathUtils.damp(m.rotation.x, mouse.current.y * 0.35, 3, d)
    }
  })

  const inner = (
    <mesh ref={mesh} scale={0.001}>
      <sphereGeometry args={[1, 96, 96]} />
      <MeshDistortMaterial
        color="#0c0c0d"
        metalness={1}
        roughness={0.16}
        distort={REDUCE ? 0 : 0.3}
        speed={1.3}
        envMapIntensity={1.6}
      />
    </mesh>
  )

  if (REDUCE) return inner
  return (
    <Float speed={1.1} rotationIntensity={0.35} floatIntensity={1.2}>
      {inner}
    </Float>
  )
}

export default function Scene3D() {
  return (
    <ErrorBoundary>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5.2], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.35} />
        <Suspense fallback={null}>
          <ChromeForm />
          {/* Studio reflections tanpa file HDRI eksternal, dibaked sekali biar ringan */}
          <Environment resolution={256} frames={1}>
            <color attach="background" args={['#090909']} />
            <Lightformer form="rect" intensity={3.2} position={[0, 2.6, 3]} scale={[9, 3, 1]} color="#ffffff" />
            <Lightformer form="rect" intensity={1.7} position={[-4, -1, 2]} scale={[5, 5, 1]} color="#ffd6bb" />
            <Lightformer form="ring" intensity={2.2} position={[4, 2.5, -3]} scale={4} color="#b4552d" />
            <Lightformer
              form="rect"
              intensity={2.4}
              rotation-y={Math.PI / 2}
              position={[-6, 1, 0]}
              scale={[18, 1.6, 1]}
              color="#ffffff"
            />
            <Lightformer
              form="rect"
              intensity={2.4}
              rotation-y={Math.PI / 2}
              position={[6, -1.5, 0]}
              scale={[18, 1.6, 1]}
              color="#cfe0ff"
            />
          </Environment>
        </Suspense>
      </Canvas>
    </ErrorBoundary>
  )
}
