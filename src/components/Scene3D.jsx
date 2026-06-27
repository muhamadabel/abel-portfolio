import { Suspense, useEffect, useRef, Component } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

// Kalau WebGL gagal di perangkat tertentu, jangan sampai halaman ikut error.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

function Blob() {
  const mesh = useRef(null)
  const mouse = useRef({ x: 0, y: 0 })
  const reduce = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

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
    const baseX = compact ? 0 : w * 0.22
    const baseY = compact ? 0.4 : 0

    m.position.x = THREE.MathUtils.lerp(m.position.x, baseX + mouse.current.x * 0.4, 0.05)
    m.position.y = THREE.MathUtils.lerp(m.position.y, baseY + mouse.current.y * 0.4, 0.05)

    const target = compact ? 1.35 : 1.95
    m.scale.setScalar(THREE.MathUtils.lerp(m.scale.x, target, 0.08))

    if (!reduce.current) {
      m.rotation.y += delta * 0.18
      m.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.16
    }
  })

  return (
    <mesh ref={mesh} scale={0.001}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial
        color="#c2693f"
        distort={reduce.current ? 0 : 0.32}
        speed={1.5}
        roughness={0.38}
        metalness={0.06}
      />
    </mesh>
  )
}

export default function Scene3D() {
  return (
    <ErrorBoundary>
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: [0, 0, 6], fov: 34 }}
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[4, 6, 5]} intensity={1.4} />
        <directionalLight position={[-6, -3, -4]} intensity={0.5} color="#ffd9c0" />
        <Suspense fallback={null}>
          <Blob />
        </Suspense>
      </Canvas>
    </ErrorBoundary>
  )
}
