import { Suspense, useEffect, useRef, Component } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, Float } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
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

const GOLD = '#c79a63'

function Coin() {
  const group = useRef(null)
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
    const g = group.current
    if (!g) return
    const w = state.viewport.width
    const compact = w < 7
    const baseX = compact ? 0 : w * 0.2
    const baseY = compact ? 0.45 : 0
    const d = Math.min(delta, 0.05)

    g.position.x = THREE.MathUtils.damp(g.position.x, baseX + mouse.current.x * 0.4, 3, d)
    g.position.y = THREE.MathUtils.damp(g.position.y, baseY + mouse.current.y * 0.4, 3, d)

    const target = compact ? 1.15 : 1.5
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, target, 4, d))

    if (!REDUCE) {
      g.rotation.y += d * 0.85
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -0.18 + mouse.current.y * 0.2, 3, d)
    } else {
      g.rotation.set(-0.18, -0.5, 0)
    }
  })

  const inner = (
    <group ref={group} scale={0.001}>
      {/* Badan koin (sumbu diputar biar muka menghadap kamera) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, 0.14, 90]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.22} envMapIntensity={1.5} />
      </mesh>
      {/* Rim membulat di tepi */}
      <mesh>
        <torusGeometry args={[1, 0.07, 28, 110]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} envMapIntensity={1.6} />
      </mesh>
      {/* Relief cincin di kedua muka */}
      <mesh position={[0, 0, 0.07]}>
        <torusGeometry args={[0.72, 0.022, 20, 90]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} envMapIntensity={1.4} />
      </mesh>
      <mesh position={[0, 0, -0.07]}>
        <torusGeometry args={[0.72, 0.022, 20, 90]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} envMapIntensity={1.4} />
      </mesh>
      {/* Tonjolan tengah */}
      <mesh position={[0, 0, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.05, 48]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.28} envMapIntensity={1.4} />
      </mesh>
      <mesh position={[0, 0, -0.075]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.05, 48]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.28} envMapIntensity={1.4} />
      </mesh>
    </group>
  )

  if (REDUCE) return inner
  return (
    <Float speed={1} rotationIntensity={0.12} floatIntensity={0.9}>
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
        <ambientLight intensity={0.4} />
        <Suspense fallback={null}>
          <Coin />
          {/* Studio reflections tanpa file HDRI eksternal, dibaked sekali */}
          <Environment resolution={256} frames={1}>
            <color attach="background" args={['#0a0a0a']} />
            <Lightformer form="rect" intensity={3.4} position={[0, 2.6, 3]} scale={[9, 3, 1]} color="#ffffff" />
            <Lightformer form="rect" intensity={1.8} position={[-4, -1, 2]} scale={[5, 5, 1]} color="#ffd6bb" />
            <Lightformer form="ring" intensity={2.4} position={[4, 2.5, -3]} scale={4} color="#b4552d" />
            <Lightformer
              form="rect"
              intensity={2.6}
              rotation-y={Math.PI / 2}
              position={[-6, 1, 0]}
              scale={[18, 1.6, 1]}
              color="#ffffff"
            />
            <Lightformer
              form="rect"
              intensity={2.6}
              rotation-y={Math.PI / 2}
              position={[6, -1.5, 0]}
              scale={[18, 1.6, 1]}
              color="#cfe0ff"
            />
          </Environment>
        </Suspense>
        <EffectComposer disableNormalPass>
          <Bloom mipmapBlur luminanceThreshold={0.65} luminanceSmoothing={0.3} intensity={0.7} radius={0.7} />
        </EffectComposer>
      </Canvas>
    </ErrorBoundary>
  )
}
