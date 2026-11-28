import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { profile, projects } from '../data/content'
import { preloadSiteAssets } from '../lib/assetPreloader'
import { getParticleDpr, particleDotRadius, sampleParticleTitle, sampleWordPixels } from '../lib/particleLayout'
import { getCachedImage, loadCachedImage, projectImageSrc } from '../lib/projectImage'

const TAU = Math.PI * 2
const P_BUCKETS = 4

const nameParts = profile.display.trim().split(/\s+/)
const leftWord = nameParts[0] || profile.display
const rightWord = nameParts.length > 1 ? `${nameParts.slice(1).join(' ')}.` : ''

// Distribusi lintang 3D supaya 9 proyek membentuk bola/globe utuh, namun 3 kartu utama tetap harmonis saat membuka
const LATITUDES = [0.0, 0.34, -0.34, 0.42, -0.40, 0.36, -0.38, 0.28, -0.26]

function computeGlobeRadius(w, h) {
  return Math.min(w * (w < 640 ? 0.46 : 0.34), h * (w < 640 ? 0.34 : 0.42), 400)
}

function computeCoreLogoWidth(w, h) {
  return Math.max(76, Math.min(156, computeGlobeRadius(w, h) * 0.45))
}

const RING_R = 49.5
const RING_CIRC = 2 * Math.PI * RING_R

function computeRingMetrics(w, h) {
  const logoPx = computeCoreLogoWidth(w, h)
  const ringPx = Math.round(logoPx * 1.84)
  const orbitPx = Math.min(w * 0.88, 760)
  const initScale = Math.min(0.85, Math.max(0.22, ringPx / Math.max(1, orbitPx)))
  // Ketebalan stroke dalam satuan viewBox (0..100) agar tetap tipis 1.8px saat loading -> 1.1px saat mengembang penuh
  const strokeInit = +(180 / Math.max(1, ringPx)).toFixed(3)
  const strokeEnd = +(110 / Math.max(1, orbitPx)).toFixed(3)
  return { logoPx, ringPx, orbitPx, initScale, strokeInit, strokeEnd }
}

function wrap(i, n) {
  return n > 0 ? ((i % n) + n) % n : 0
}

function offsetOf(i, pos, n) {
  if (n <= 0) return 0
  return wrap(i - pos + n / 2, n) - n / 2
}

// Identik dengan CurvedProjectLens.jsx agar handoff ke Hero tepat hingga subpiksel
function heroCardSize(w, h) {
  const isMobile = w < 640
  const maxW = isMobile ? w * 0.78 : Math.min(w * 0.36, 480)
  const cw = Math.min(maxW, h * 1.12)
  const ch = cw * 0.625
  return [Math.round(cw), Math.round(ch)]
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
const easeInOutQuart = (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2)
// Kurva terbang partikel: pecah singkat di tepi (10%), lalu melesat mulus melengkung & mengunci presisi di akhir
const easeParticleFlight = (t) => {
  if (t <= 0) return 0
  if (t >= 1) return 1
  if (t < 0.10) return (t / 0.10) * 0.045
  const u = (t - 0.10) / 0.90
  return 0.045 + 0.955 * (1 - Math.pow(1 - u, 3.1))
}

const VERT = `
attribute vec2 aPos;
uniform vec2 uScreen;
uniform vec2 uTargetCenter;
uniform vec2 uTargetSize;
uniform vec2 uHeroCard;
uniform float uHeroX;
uniform float uBend;

uniform float uLon;
uniform float uLat;
uniform float uGlobeR;
uniform vec2 uPatchAng;
uniform float uMorph;
uniform float uIntro;

varying vec2 vUv;
varying float vX;
varying float vDepth;
varying float vMorph;

void main() {
  // 1. Posisi 3D melengkung pada permukaan bola/globe (mekar keluar dari inti logo A lalu memutar ke kanan)
  float patchScale = mix(0.26, 1.0, uIntro);
  float lon = uLon + (aPos.x - 0.5) * (uPatchAng.x * patchScale);
  float lat = uLat + (aPos.y - 0.5) * (uPatchAng.y * patchScale);
  float cLat = cos(lat);
  vec3 sp = vec3(
    cLat * sin(lon),
    sin(lat),
    cLat * cos(lon)
  ) * (uGlobeR * mix(0.22, 1.0, uIntro));

  // Kemiringan poros globe elegan (tilt X + sedikit tilt Z)
  float ax = 0.20;
  float az = -0.14;
  float cx = cos(ax), sx = sin(ax);
  float cz = cos(az), sz = sin(az);
  vec3 r1 = vec3(sp.x, sp.y * cx - sp.z * sx, sp.y * sx + sp.z * cx);
  vec3 r2 = vec3(r1.x * cz - r1.y * sz, r1.x * sz + r1.y * cz, r1.z);

  float camZ = uGlobeR * 2.85;
  float persp = camZ / max(40.0, camZ - r2.z);
  vec2 globeNdc = (r2.xy * persp) / (uScreen * 0.5);

  // 2. Posisi target tepat di dalam kanvas CurvedProjectLens Hero
  vec2 hp = vec2(uHeroX + (aPos.x - 0.5) * uHeroCard.x, (aPos.y - 0.5) * uHeroCard.y);
  vec2 hn = hp / (uTargetSize * 0.5);
  float hx = clamp(hn.x, -1.45, 1.45);
  hn.y *= 1.0 + uBend * hx * hx;
  hn.x *= 1.0 - 0.07 * uBend * hx * hx;
  vec2 heroPx = uTargetCenter + hn * (uTargetSize * 0.5);
  vec2 heroNdc = heroPx / (uScreen * 0.5);

  // 3. Interpolasi mulus dari permukaan globe 3D langsung ke posisi panorama Hero
  vec2 finalNdc = mix(globeNdc, heroNdc, uMorph);

  vUv = aPos;
  vX = hx;
  vDepth = clamp((r2.z / max(1.0, uGlobeR)) * 0.5 + 0.5, 0.0, 1.0);
  vMorph = uMorph;

  gl_Position = vec4(finalNdc, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform float uAspect;
uniform float uShift;
uniform float uReady;
uniform float uDark;
uniform float uIntro;
uniform float uSpinVel;

varying vec2 vUv;
varying float vX;
varying float vDepth;
varying float vMorph;

float sdRoundBox(vec2 q, vec2 b, float r) {
  vec2 d = abs(q) - b + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

void main() {
  float a = uSize.x / uSize.y;
  vec2 uv = vUv - 0.5;
  if (uAspect > a) {
    uv.x *= a / uAspect;
  } else {
    float scaleY = uAspect / a;
    uv.y = (uv.y - 0.5) * scaleY + 0.5;
  }
  uv = uv / 1.03 + 0.5;
  uv.x = clamp(uv.x + uShift * vMorph, 0.002, 0.998);
  uv.y = clamp(uv.y, 0.002, 0.998);

  float ca = mix(0.0018 + uSpinVel * 0.0025, 0.0006 + 0.0036 * vX * vX, vMorph);
  vec3 img = vec3(
    texture2D(uTex, vec2(clamp(uv.x + ca, 0.002, 0.998), uv.y)).r,
    texture2D(uTex, uv).g,
    texture2D(uTex, vec2(clamp(uv.x - ca, 0.002, 0.998), uv.y)).b
  );
  vec3 ph = mix(vec3(0.95, 0.96, 0.98), vec3(0.09, 0.10, 0.13), uDark);
  vec3 c = mix(ph, img, uReady);

  // Kedalaman ruang: belakang globe meredup lembut -> mulus menyatu ke fade tepi panorama Hero
  float globeAtten = 1.0 - vDepth;
  float heroFade = min(1.0, vX * vX);
  if (uDark > 0.5) {
    float dim = mix(0.54 * globeAtten, 0.40 * heroFade, vMorph);
    c *= 1.0 - dim;
  } else {
    float mist = mix(0.42 * globeAtten, 0.28 * heroFade, vMorph);
    c = mix(c, vec3(0.96, 0.972, 0.99), mist);
  }

  float radius = min(20.0, min(uSize.x, uSize.y) * 0.085);
  float d = sdRoundBox((vUv - 0.5) * uSize, uSize * 0.5, radius);

  float outerBorder = smoothstep(-2.2, -0.35, d) * smoothstep(0.6, -0.6, d);
  float innerRim = smoothstep(-6.0, -0.8, d) * smoothstep(0.4, -0.8, d);
  vec3 borderCol = mix(vec3(0.80, 0.84, 0.90), vec3(1.0, 1.0, 1.0), 0.58 - 0.34 * uDark);
  c = mix(c, borderCol, outerBorder * (uDark > 0.5 ? 0.42 : 0.78));
  c += innerRim * (uDark > 0.5 ? 0.08 : 0.07);

  float sheen = smoothstep(0.76, 1.0, vUv.y) * mix(vDepth, 1.0 - min(1.0, abs(vX) * 1.15), vMorph);
  c += sheen * (uDark > 0.5 ? 0.055 : 0.04);

  // Kartu sisi belakang globe sedikit transparan agar terasa seperti bola kaca 3D, lalu solid saat membuka
  float depthAlpha = mix(0.38 + 0.62 * smoothstep(0.05, 0.65, vDepth), 1.0, vMorph);
  float al = smoothstep(1.0, -1.0, d) * uIntro * depthAlpha;
  gl_FragColor = vec4(c * al, al);
}
`

const LOGO_VERT = `
attribute vec2 aPos;
uniform vec2 uScreen;
uniform vec2 uCenter;
uniform vec2 uSize;
uniform float uTiltY;

varying vec2 vUv;

void main() {
  vec2 local = (aPos - 0.5) * (uSize * 1.45);
  float c = cos(uTiltY);
  float s = sin(uTiltY);
  vec3 p = vec3(local.x * c, local.y, -local.x * s);
  float persp = 900.0 / max(120.0, 900.0 - p.z);
  vec2 px = uCenter + p.xy * persp;
  vec2 ndc = px / (uScreen * 0.5);
  vUv = aPos;
  gl_Position = vec4(ndc, 0.0, 1.0);
}
`

const LOGO_FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform float uAlpha;
uniform float uDark;
uniform float uCharge;
uniform float uHaloFade;

varying vec2 vUv;

void main() {
  vec2 imgUv = (vUv - 0.5) * 1.45 + 0.5;
  float inBox = step(0.002, imgUv.x) * step(imgUv.x, 0.998) * step(0.002, imgUv.y) * step(imgUv.y, 0.998);
  vec4 tex = texture2D(uTex, clamp(imgUv, 0.002, 0.998)) * inBox;
  tex.rgb += vec3(0.24, 0.44, 1.0) * uCharge * 0.28 * tex.a;

  float dist = length(vUv - 0.5) * 2.0;
  float radial = smoothstep(0.98, 0.05, dist);
  float aura = radial * radial;

  vec3 lightHalo = vec3(0.14, 0.30, 1.0);
  vec3 darkHalo = vec3(0.28, 0.52, 1.0);
  vec3 haloCol = mix(lightHalo, darkHalo, uDark);
  float haloAlpha = mix(0.22 + uCharge * 0.34, 0.32 + uCharge * 0.38, uDark) * aura * uHaloFade;

  float la = tex.a * uAlpha;
  float ha = haloAlpha * uAlpha;
  vec3 outRgb = tex.rgb * la + haloCol * ha * (1.0 - la);
  float outA = la + ha * (1.0 - la);
  gl_FragColor = vec4(outRgb, outA);
}
`

function buildRocketSparks(count) {
  const out = []
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0.5
    const spread = (t - 0.5) * 0.88 + Math.sin(i * 7.3) * 0.14
    out.push({
      angle: Math.PI * 0.5 + spread,
      xOff: (t - 0.5) * 0.56,
      speed: 0.72 + ((i * 37) % 100) / 110,
      len: 14 + ((i * 23) % 24),
      width: 1.2 + ((i * 13) % 10) * 0.15,
      delay: ((i * 19) % 28) / 100,
      tier: i % 3,
    })
  }
  return out
}

function drawRocketImpulseGlow(pCtx, cx, cy, baseW, charge, dpr) {
  if (charge <= 0.02) return
  const r = baseW * (0.72 + charge * 0.45) * dpr
  const g = pCtx.createRadialGradient(cx, cy, 0, cx, cy, r)
  g.addColorStop(0, `rgba(96, 165, 250, ${(charge * 0.36).toFixed(3)})`)
  g.addColorStop(0.45, `rgba(35, 75, 255, ${(charge * 0.22).toFixed(3)})`)
  g.addColorStop(1, 'rgba(35, 75, 255, 0)')
  pCtx.fillStyle = g
  pCtx.beginPath()
  pCtx.arc(cx, cy, r, 0, TAU)
  pCtx.fill()
}

function drawRocketTrail(pCtx, rocket, { W, H, dpr, isDark, sparks }) {
  const { lp, cx, startY, curY, drawW, drawH } = rocket

  // 1. Expanding sapphire launch shockwave ring at the globe core
  if (lp < 0.65) {
    const sp = lp / 0.65
    const waveR = (26 + easeOutCubic(sp) * Math.min(W, H) * 0.28) * dpr
    const waveAlpha = (1 - sp) * (isDark ? 0.62 : 0.55)
    pCtx.save()
    pCtx.strokeStyle = isDark ? `rgba(120, 178, 255, ${waveAlpha.toFixed(3)})` : `rgba(35, 75, 255, ${waveAlpha.toFixed(3)})`
    pCtx.lineWidth = (3.0 - 2.4 * sp) * dpr
    pCtx.beginPath()
    pCtx.arc(cx, startY, waveR, 0, TAU)
    pCtx.stroke()
    pCtx.restore()
  }

  // 2. Supersonic tapered exhaust plume + twin leg micro-streaks beneath the "A"
  const tailFade = lp > 0.72 ? Math.max(0, 1 - (lp - 0.72) / 0.28) : Math.min(1, lp / 0.08)
  if (tailFade > 0.01) {
    const plumeLen = H * (0.14 + 0.3 * Math.sin(Math.min(1, lp * 1.15) * Math.PI * 0.5)) * dpr
    const nozzleY = curY + drawH * 0.34
    const outerHalfW = drawW * 0.22

    const outerGrad = pCtx.createLinearGradient(cx, nozzleY, cx, nozzleY + plumeLen)
    outerGrad.addColorStop(0, `rgba(35, 75, 255, ${(0.88 * tailFade).toFixed(3)})`)
    outerGrad.addColorStop(0.42, `rgba(96, 165, 250, ${(0.52 * tailFade).toFixed(3)})`)
    outerGrad.addColorStop(1, 'rgba(35, 75, 255, 0)')

    pCtx.fillStyle = outerGrad
    pCtx.beginPath()
    pCtx.moveTo(cx - outerHalfW, nozzleY)
    pCtx.lineTo(cx + outerHalfW, nozzleY)
    pCtx.lineTo(cx + outerHalfW * 0.14, nozzleY + plumeLen)
    pCtx.lineTo(cx - outerHalfW * 0.14, nozzleY + plumeLen)
    pCtx.closePath()
    pCtx.fill()

    // Inner ice-white high-velocity core needle
    const coreLen = plumeLen * 0.72
    const coreHalfW = drawW * 0.085
    const coreGrad = pCtx.createLinearGradient(cx, nozzleY, cx, nozzleY + coreLen)
    coreGrad.addColorStop(0, `rgba(255, 255, 255, ${(0.95 * tailFade).toFixed(3)})`)
    coreGrad.addColorStop(0.5, `rgba(191, 219, 254, ${(0.62 * tailFade).toFixed(3)})`)
    coreGrad.addColorStop(1, 'rgba(191, 219, 254, 0)')

    pCtx.fillStyle = coreGrad
    pCtx.beginPath()
    pCtx.moveTo(cx - coreHalfW, nozzleY)
    pCtx.lineTo(cx + coreHalfW, nozzleY)
    pCtx.lineTo(cx, nozzleY + coreLen)
    pCtx.closePath()
    pCtx.fill()

    // Subtle twin leg thruster streaks at left & right feet of the metallic "A"
    const legSpan = drawW * 0.34
    const legLen = plumeLen * 0.42
    for (let sIdx = -1; sIdx <= 1; sIdx += 2) {
      const lx = cx + sIdx * legSpan
      const lg = pCtx.createLinearGradient(lx, nozzleY, lx, nozzleY + legLen)
      lg.addColorStop(0, `rgba(147, 197, 253, ${(0.52 * tailFade).toFixed(3)})`)
      lg.addColorStop(1, 'rgba(35, 75, 255, 0)')
      pCtx.strokeStyle = lg
      pCtx.lineWidth = 2.4 * dpr
      pCtx.beginPath()
      pCtx.moveTo(lx, nozzleY)
      pCtx.lineTo(lx + sIdx * 4 * dpr, nozzleY + legLen)
      pCtx.stroke()
    }
  }

  // 3. Velocity-stretched thruster sparks shooting downward
  pCtx.save()
  pCtx.lineCap = 'round'
  for (let i = 0; i < sparks.length; i++) {
    const spk = sparks[i]
    const spkElapsed = lp - spk.delay
    if (spkElapsed <= 0 || spkElapsed > 0.78) continue
    const progress = spkElapsed / 0.78
    const dist = easeOutCubic(progress) * H * 0.34 * spk.speed * dpr
    const ox = cx + spk.xOff * drawW + Math.cos(spk.angle) * dist
    const oy = startY + Math.sin(spk.angle) * dist * 0.68
    const streak = spk.len * (1 - progress * 0.55) * dpr
    const alpha = Math.sin(progress * Math.PI) * 0.85
    if (alpha <= 0.02) continue

    if (spk.tier === 0) {
      pCtx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`
    } else if (spk.tier === 1) {
      pCtx.strokeStyle = `rgba(147, 197, 253, ${alpha.toFixed(3)})`
    } else {
      pCtx.strokeStyle = `rgba(35, 75, 255, ${alpha.toFixed(3)})`
    }
    pCtx.lineWidth = spk.width * dpr
    pCtx.beginPath()
    pCtx.moveTo(ox, oy)
    pCtx.lineTo(ox - Math.cos(spk.angle) * streak * 0.35, oy - Math.sin(spk.angle) * streak)
    pCtx.stroke()
  }
  pCtx.restore()
}

function compileShader(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  return s
}

function buildGrid(segX, segY) {
  const out = []
  for (let y = 0; y < segY; y++) {
    for (let x = 0; x < segX; x++) {
      const x0 = x / segX
      const x1 = (x + 1) / segX
      const y0 = y / segY
      const y1 = (y + 1) / segY
      out.push(x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1)
    }
  }
  return new Float32Array(out)
}

/**
 * Preloader 2 tahap:
 * 1. Loading screen berlogo A yang menyesuaikan kecepatan perangkat/jaringan (minimal ~1,5 detik)
 *    sambil memuat dan men-decode seluruh aset penting situs (9 tekstur WebP, font, chunk JS, foto, logo).
 * 2. Setelah seluruh aset siap, WebGL 3D Globe langsung mekar mengelilingi logo A tanpa kartu abu-abu,
 *    melebur ke Hero, lalu logo A melesat menembus judul partikel "Abel Abhinaya".
 */
export default function Preloader({ onReveal, onDone, chunkLoaders = [] }) {
  const reduceMotion = useReducedMotion()
  const rocketCanvasRef = useRef(null)
  const canvasRef = useRef(null)
  const particleCanvasRef = useRef(null)
  const leftTextRef = useRef(null)
  const rightTextRef = useRef(null)
  const ringArcRef = useRef(null)
  const pctTextRef = useRef(null)

  const [phase, setPhase] = useState('loading') // 'loading' | 'globe'
  const [meterDone, setMeterDone] = useState(false)
  const [webglActive, setWebglActive] = useState(false)
  const [unfolding, setUnfolding] = useState(false)
  const [ringMetrics, setRingMetrics] = useState(() =>
    typeof window !== 'undefined'
      ? computeRingMetrics(window.innerWidth, window.innerHeight)
      : { logoPx: 120, ringPx: 220, orbitPx: 760, initScale: 0.29, strokeInit: 0.82, strokeEnd: 0.145 },
  )

  const onRevealRef = useRef(onReveal)
  const onDoneRef = useRef(onDone)
  const chunkLoadersRef = useRef(chunkLoaders)
  onRevealRef.current = onReveal
  onDoneRef.current = onDone
  chunkLoadersRef.current = chunkLoaders

  // Tahap 1: Preload & decode seluruh aset web sembari mengisi cincin orbit di sekeliling logo A
  useEffect(() => {
    if (phase !== 'loading') return

    let disposed = false
    let rafId = 0
    let handoffTimer = 0
    let targetP = 0
    let displayP = 0
    let lastNow = 0
    let assetsDone = false
    let handoffScheduled = false

    const compact = window.innerWidth < 640
    const minDurationMs = reduceMotion ? 600 : 1200
    const startedAt = performance.now()

    const syncMetrics = () => {
      setRingMetrics(computeRingMetrics(window.innerWidth, window.innerHeight))
    }
    syncMetrics()
    window.addEventListener('resize', syncMetrics, { passive: true })

    const controller = preloadSiteAssets({
      compact,
      chunkLoaders: chunkLoadersRef.current,
      minDurationMs,
      maxWaitMs: 9000,
      onProgress: (ratio) => {
        targetP = Math.max(targetP, ratio)
      },
    })

    controller.ready.then(() => {
      if (disposed) return
      targetP = 1
      assetsDone = true
    })

    const paintMeter = (p) => {
      if (ringArcRef.current) {
        ringArcRef.current.style.strokeDashoffset = (RING_CIRC * (1 - p)).toFixed(2)
      }
      if (pctTextRef.current) {
        pctTextRef.current.textContent = `${Math.round(p * 100)}%`
      }
    }

    const tick = (now) => {
      if (disposed) return
      const dt = lastNow ? Math.min(0.05, Math.max(0.001, (now - lastNow) / 1000)) : 1 / 60
      lastNow = now
      const elapsed = Math.max(0, now - startedAt)
      const timeCap = easeOutCubic(Math.min(1, elapsed / minDurationMs))
      const desired = assetsDone ? 1 : Math.min(targetP, timeCap, 0.98)

      const rate = assetsDone ? 20 : 9.5
      displayP += (desired - displayP) * (1 - Math.exp(-rate * dt))
      if (assetsDone && 1 - displayP < 0.006) {
        displayP = 1
      }
      paintMeter(displayP)

      if (assetsDone && displayP >= 1) {
        if (!handoffScheduled) {
          handoffScheduled = true
          setMeterDone(true)
          // Jeda singkat 80ms saat cincin menutup penuh 360 derajat, lalu langsung mengembang jadi orbit globe
          handoffTimer = window.setTimeout(() => {
            if (disposed) return
            if (reduceMotion) {
              onRevealRef.current?.()
              onDoneRef.current?.()
            } else {
              setPhase('globe')
            }
          }, 80)
        }
        return
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      disposed = true
      cancelAnimationFrame(rafId)
      clearTimeout(handoffTimer)
      window.removeEventListener('resize', syncMetrics)
      controller.cancel()
    }
  }, [phase, reduceMotion])

  // Tahap 2: WebGL 3D Globe (seluruh tekstur sudah ter-decode di cache memori -> 0 kartu abu-abu & 0 lag)
  useEffect(() => {
    if (phase !== 'globe') return

    if (reduceMotion) {
      onRevealRef.current?.()
      const t = setTimeout(() => onDoneRef.current?.(), 140)
      return () => clearTimeout(t)
    }

    const canvas = canvasRef.current
    if (!canvas) {
      onRevealRef.current?.()
      onDoneRef.current?.()
      return
    }

    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: true, alpha: true })
    if (!gl) {
      onRevealRef.current?.()
      const t = setTimeout(() => onDoneRef.current?.(), 300)
      return () => clearTimeout(t)
    }

    const prog = gl.createProgram()
    gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      onRevealRef.current?.()
      onDoneRef.current?.()
      return
    }

    // Program WebGL kedua khusus untuk logo 3D "A" di pusat bola globe
    const logoProg = gl.createProgram()
    gl.attachShader(logoProg, compileShader(gl, gl.VERTEX_SHADER, LOGO_VERT))
    gl.attachShader(logoProg, compileShader(gl, gl.FRAGMENT_SHADER, LOGO_FRAG))
    gl.linkProgram(logoProg)
    const logoProgReady = Boolean(gl.getProgramParameter(logoProg, gl.LINK_STATUS))

    const uLogo = {}
    if (logoProgReady) {
      for (const k of ['uScreen', 'uCenter', 'uSize', 'uTiltY', 'uTex', 'uAlpha', 'uDark', 'uCharge', 'uHaloFade']) {
        uLogo[k] = gl.getUniformLocation(logoProg, k)
      }
    }
    const logoLoc = logoProgReady ? gl.getAttribLocation(logoProg, 'aPos') : -1
    const logoQuad = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
    const logoBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, logoBuf)
    gl.bufferData(gl.ARRAY_BUFFER, logoQuad, gl.STATIC_DRAW)

    gl.useProgram(prog)
    const compactMesh = window.innerWidth < 640
    const mesh = buildGrid(compactMesh ? 16 : 28, compactMesh ? 8 : 12)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const u = {}
    for (const k of [
      'uScreen',
      'uTargetCenter',
      'uTargetSize',
      'uHeroCard',
      'uHeroX',
      'uBend',
      'uLon',
      'uLat',
      'uGlobeR',
      'uPatchAng',
      'uMorph',
      'uIntro',
      'uTex',
      'uSize',
      'uAspect',
      'uShift',
      'uReady',
      'uDark',
      'uSpinVel',
    ]) {
      u[k] = gl.getUniformLocation(prog, k)
    }

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    let disposed = false

    const logoTex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, logoTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    const logoState = { tex: logoTex, img: null, aspect: 1.56, ready: false }
    let unsubLogo = null
    const cachedLogo = getCachedImage('/logo-a.webp')
    if (cachedLogo) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cachedLogo)
      logoState.img = cachedLogo
      logoState.aspect = cachedLogo.naturalWidth / Math.max(1, cachedLogo.naturalHeight)
      logoState.ready = true
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]))
      unsubLogo = loadCachedImage('/logo-a.webp', (img) => {
        if (disposed) return
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, logoTex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        logoState.img = img
        logoState.aspect = img.naturalWidth / Math.max(1, img.naturalHeight)
        logoState.ready = true
      })
    }

    const rocketSparks = buildRocketSparks(compactMesh ? 18 : 34)
    const n = projects.length
    const unsubTex = []
    const tex = projects.map((s) => {
      const t = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

      const imgSrc = projectImageSrc(s.image, compactMesh)
      const cached = getCachedImage(imgSrc)
      if (cached) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cached)
        return {
          t,
          aspect: cached.naturalWidth / Math.max(1, cached.naturalHeight),
          ready: true,
        }
      }

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([240, 242, 246, 255]))
      const entry = { t, aspect: 1.6, ready: false }
      const unsub = loadCachedImage(imgSrc, (img) => {
        if (disposed) return
        gl.bindTexture(gl.TEXTURE_2D, t)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        entry.aspect = img.naturalWidth / Math.max(1, img.naturalHeight)
        entry.ready = true
      })
      if (unsub) unsubTex.push(unsub)
      return entry
    })

    const rCanvas = rocketCanvasRef.current
    const rCtx = rCanvas ? rCanvas.getContext('2d', { alpha: true }) : null
    const pCanvas = particleCanvasRef.current
    const pCtx = pCanvas ? pCanvas.getContext('2d', { alpha: true }) : null

    let W = window.innerWidth
    let H = window.innerHeight
    let dpr = 1

    // Hitung posisi target persis dari kanvas Hero di bawah tanpa forced reflow per frame
    const measureTarget = () => {
      const targetEl = document.querySelector('.lens-stage__canvas')
      if (targetEl) {
        const r = targetEl.getBoundingClientRect()
        if (r.width > 10 && r.height > 10) {
          const cx = r.left + r.width * 0.5 - W * 0.5
          const cy = H * 0.5 - (r.top + r.height * 0.5)
          return { cx, cy, tw: r.width, th: r.height }
        }
      }
      const fallbackH = Math.max(248, Math.min(392, H * 0.39))
      return { cx: 0, cy: -H * 0.14, tw: W, th: fallbackH }
    }

    let targetMetrics = null
    const syncSize = () => {
      W = Math.max(1, window.innerWidth)
      H = Math.max(1, window.innerHeight)
      dpr = getParticleDpr(W)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      if (rCanvas) {
        rCanvas.width = Math.round(W * dpr)
        rCanvas.height = Math.round(H * dpr)
      }
      if (pCanvas) {
        pCanvas.width = Math.round(W * dpr)
        pCanvas.height = Math.round(H * dpr)
      }
      targetMetrics = measureTarget()
    }
    syncSize()
    window.addEventListener('resize', syncSize, { passive: true })

    // Bangun partikel tepat saat "Abel" & "Abhinaya." pecah menjadi titik-titik menuju judul raksasa Hero
    let morphParticles = null
    const buildTextMorphParticles = () => {
      const heroCanvas = document.querySelector('.particle-title')
      const heroWrap = document.querySelector('.particle-title-wrap')
      const heroRect = (heroCanvas || heroWrap)?.getBoundingClientRect()
      if (!heroRect || heroRect.width < 20) return []

      const leftEl = leftTextRef.current
      const rightEl = rightTextRef.current
      const leftRect = leftEl
        ? leftEl.getBoundingClientRect()
        : { left: 48, top: H * 0.5 - 16, width: 72, height: 32 }
      const rightRect = rightEl
        ? rightEl.getBoundingClientRect()
        : { left: W - 168, top: H * 0.5 - 16, width: 120, height: 32 }

      const leftFs = leftEl ? parseFloat(getComputedStyle(leftEl).fontSize) || 28 : 28
      const rightFs = rightEl ? parseFloat(getComputedStyle(rightEl).fontSize) || 28 : 28

      const leftOrigins = sampleWordPixels(leftWord, leftRect, leftFs, '500')
      const rightOrigins = sampleWordPixels(rightWord || leftWord, rightRect, rightFs, '500')
      const sampled = sampleParticleTitle(profile.display, heroRect.width, dpr)

      // Offset posisi kanvas target ke ruang piksel layar penuh (dpr)
      const offX = (heroRect.left + (heroRect.width - sampled.cssW) * 0.5) * dpr
      const offY = (heroRect.top + (heroRect.height - sampled.cssH) * 0.5) * dpr

      // Bagi titik target kiri ("Abel") dan kanan ("Abhinaya") agar masing-masing pecah dari katanya sendiri
      const leftPts = []
      const rightPts = []
      for (let i = 0; i < sampled.points.length; i++) {
        const pt = sampled.points[i]
        if (pt.group === 0) leftPts.push(pt)
        else rightPts.push(pt)
      }

      const out = []
      const makeSwarm = (targets, origins, sideSign) => {
        const oLen = origins.length
        const tLen = Math.max(1, targets.length)
        for (let i = 0; i < targets.length; i++) {
          const pt = targets[i]
          // Pemetaan urutan ruang yang stabil + sedikit acak organik agar pecahnya terasa hidup
          const mappedIdx = Math.min(oLen - 1, Math.floor((i / tLen) * oLen))
          const jitterIdx = (mappedIdx + Math.floor((Math.random() - 0.5) * 18) + oLen) % oLen
          const orig = origins[jitterIdx]

          const ox = (orig.x + (Math.random() - 0.5) * 2.2) * dpr
          const oy = (orig.y + (Math.random() - 0.5) * 2.2) * dpr
          const tx = offX + pt.tx
          const ty = offY + pt.ty

          // Busur Bezier organik melengkung ke atas-tengah dengan efek sebaran partikel di udara
          const midX = (ox + tx) * 0.5
          const midY = (oy + ty) * 0.5
          const arcLift = (64 + Math.random() * 145) * dpr
          const swirlX = (sideSign * (24 + Math.random() * 72) + (Math.random() - 0.5) * 165) * dpr
          const swirlY = (-arcLift + (Math.random() - 0.5) * 96 * dpr)

          const cx = midX + swirlX
          const cy = midY + swirlY

          // Stagger halus dari tepi dalam menuju tepi luar agar kata terasa larut beruntun
          const normPos = i / tLen
          const edgeOrder = sideSign < 0 ? 1 - normPos : normPos
          const delay = edgeOrder * 0.15 + Math.random() * 0.07
          const r = particleDotRadius(sampled.compact, dpr)
          const bucket = Math.min(P_BUCKETS - 1, Math.floor(Math.random() * P_BUCKETS))
          const spark = Math.random() < 0.58 ? 0.62 + Math.random() * 0.38 : 0

          out.push({
            ox,
            oy,
            cx,
            cy,
            tx,
            ty,
            delay,
            r,
            bucket,
            spark,
            group: sideSign < 0 ? 0 : 1,
            dx: 0,
            dy: 0,
            dr: r,
            wx: 0,
            wy: 0,
            wvx: 0,
            wvy: 0,
            wakeHeat: 0,
          })
        }
      }

      makeSwarm(leftPts, leftOrigins, -1)
      makeSwarm(rightPts, rightOrigins, 1)
      return out
    }

    const pBaseBuckets = Array.from({ length: P_BUCKETS }, () => [])
    const pHeatBuckets = Array.from({ length: P_BUCKETS }, () => [])

    const SPIN_DURATION = compactMesh ? 0.95 : 1.44 // detik berputar 3D globe ke kanan
    const PARTICLE_START = compactMesh ? 0.86 : 1.32 // saat "Abel" & "Abhinaya." pecah menjadi titik-titik
    const PARTICLE_DURATION = compactMesh ? 0.66 : 0.92 // titik "Abel Abhinaya" terbentuk utuh sebelum roket melintas
    const MORPH_START = compactMesh ? 0.92 : 1.42 // mulai membuka mulus globe -> panorama Hero
    const MORPH_DURATION = compactMesh ? 0.62 : 0.86
    const CROUCH_START = compactMesh ? 1.28 : 1.88 // logo masih di dalam inti globe/belakang Desiltrace sambil bersiap mengisi daya
    const LAUNCH_AT = compactMesh ? 1.48 : 2.16 // meluncur lurus dari dalam (belakang Desiltrace) menembus titik "Abel Abhinaya"
    const LAUNCH_DUR = compactMesh ? 0.56 : 0.68
    const REVEAL_AT = compactMesh ? 1.84 : 2.60 // munculkan subjudul, tombol CTA, dan Nav tepat saat roket menembus ke atas
    const TOTAL_END = compactMesh ? 2.24 : 3.12 // jeda tenang supaya partikel yang terbelah kembali mengunci rapi

    let startTime = -1
    let startedUnfold = false
    let revealed = false
    let finished = false
    let firstFrameDrawn = false
    let raf = 0

    // Kemiringan poros globe untuk sorting kedalaman z back-to-front
    const ax = 0.20
    const sx = Math.sin(ax)
    const cx = Math.cos(ax)

    const frame = (now) => {
      if (disposed) return
      if (startTime < 0) startTime = now
      const t = (now - startTime) / 1000
      // Mekar radial selaras dengan ekspansi cincin orbit (0 -> 0.68 detik)
      const intro = easeOutCubic(Math.min(1, t / 0.68))

      // Putaran globe ke kanan (sudut naik dari -2.25*pi menuju 0 tepat di Desiltrace)
      const spinT = Math.min(1, t / SPIN_DURATION)
      const spinEase = easeOutCubic(spinT)
      const spinAngle = -Math.PI * 2.25 * (1 - spinEase)
      const spinVel = Math.max(0, 1 - spinT)

      const morphRaw = Math.max(0, Math.min(1, (t - MORPH_START) / MORPH_DURATION))
      const morph = easeInOutQuart(morphRaw)

      if (t >= PARTICLE_START && !startedUnfold) {
        startedUnfold = true
        targetMetrics = measureTarget()
        morphParticles = buildTextMorphParticles()
        setUnfolding(true)
      }

      if (t >= REVEAL_AT && !revealed) {
        revealed = true
        onRevealRef.current?.()
      }

      const { cx: tcx, cy: tcy, tw, th } = targetMetrics || measureTarget()
      const [cw, ch] = heroCardSize(tw, th)
      const gap = cw * (tw < 640 ? 0.08 : 0.095)
      const step = cw + gap
      const bend = tw < 640 ? 0.24 : 0.34
      const globeR = computeGlobeRadius(W, H)
      const isDark = document.documentElement.dataset.theme === 'dark' ? 1 : 0

      // Ukuran sudut tiap kartu di permukaan bola agar besar, tajam, dan utuh membentuk globe 3D
      const patchLon = W < 640 ? 0.72 : 0.68
      const patchLat = patchLon * 0.625

      const baseLogoW = computeCoreLogoWidth(W, H)
      const baseLogoH = baseLogoW / logoState.aspect
      // Logo A sudah hadir penuh di tengah dari tahap loading, lalu berdenyut halus saat memekarkan globe
      const idleBlend = easeOutCubic(Math.min(1, t / 0.55))
      const bloomPulse = Math.sin(Math.min(1, t / 0.52) * Math.PI)
      const crouchP =
        t > CROUCH_START ? easeInOutQuart(Math.min(1, (t - CROUCH_START) / (LAUNCH_AT - CROUCH_START))) : 0
      const coreRestY = tcy * 0.40
      const launchOriginY = coreRestY - 16
      const hoverY = Math.sin(t * 4.4) * 5.5 * idleBlend * (1 - crouchP)

      const isLaunching = t >= LAUNCH_AT
      const rawLaunch = isLaunching ? t - LAUNCH_AT : -1
      const lp = isLaunching ? Math.max(0, Math.min(1, rawLaunch / LAUNCH_DUR)) : 0
      const rocketEase = isLaunching ? Math.pow(lp, 2.2) : 0

      // Koordinat WebGL Y-up (+ ke atas): tetap di dalam globe/belakang Desiltrace hingga melesat menembus "Abel Abhinaya"
      const logoCenterY = isLaunching
        ? launchOriginY + rocketEase * (H * 0.92 + baseLogoH)
        : hoverY * (1 - morph) + coreRestY * morph - 16 * crouchP

      const stretchEase = isLaunching ? easeOutCubic(Math.min(1, lp / 0.35)) : 0
      const pulseScale = 1 + 0.065 * bloomPulse
      const logoScaleX = isLaunching
        ? 1.09 - 0.25 * stretchEase
        : pulseScale * (1 + 0.09 * crouchP)
      const logoScaleY = isLaunching
        ? 0.89 + 0.41 * stretchEase
        : pulseScale * (1 - 0.11 * crouchP)
      const logoTiltY = isLaunching ? 0 : Math.sin(t * 2.5) * 0.24 * idleBlend * (1 - crouchP)
      const logoFade = isLaunching ? (lp > 0.82 ? Math.max(0, 1 - (lp - 0.82) / 0.18) : 1) : 1
      const logoCharge = isLaunching ? Math.max(0.25, 1 - lp * 0.7) : Math.max(crouchP, bloomPulse * 0.45)
      const logoHaloFade = isLaunching ? Math.max(0, 1 - Math.min(1, lp / 0.25)) : 1
      const showInsideGlobe =
        logoProgReady && logoState.ready && logoLoc >= 0 && logoFade > 0.01 && rawLaunch <= LAUNCH_DUR + 0.04

      const drawCoreLogo = () => {
        gl.useProgram(logoProg)
        gl.bindBuffer(gl.ARRAY_BUFFER, logoBuf)
        gl.enableVertexAttribArray(logoLoc)
        gl.vertexAttribPointer(logoLoc, 2, gl.FLOAT, false, 0, 0)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, logoState.tex)
        gl.uniform1i(uLogo.uTex, 0)
        gl.uniform2f(uLogo.uScreen, W, H)
        gl.uniform2f(uLogo.uCenter, 0, logoCenterY)
        gl.uniform2f(uLogo.uSize, baseLogoW * logoScaleX, baseLogoH * logoScaleY)
        gl.uniform1f(uLogo.uTiltY, logoTiltY)
        gl.uniform1f(uLogo.uAlpha, logoFade)
        gl.uniform1f(uLogo.uDark, isDark)
        gl.uniform1f(uLogo.uCharge, logoCharge)
        gl.uniform1f(uLogo.uHaloFade, logoHaloFade)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        gl.useProgram(prog)
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
      }

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(prog)
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(u.uScreen, W, H)
      gl.uniform2f(u.uTargetCenter, tcx, tcy)
      gl.uniform2f(u.uTargetSize, tw, th)
      gl.uniform2f(u.uHeroCard, cw, ch)
      gl.uniform1f(u.uBend, bend)
      gl.uniform1f(u.uGlobeR, globeR)
      gl.uniform2f(u.uPatchAng, patchLon, patchLat)
      gl.uniform1f(u.uMorph, morph)
      gl.uniform1f(u.uIntro, intro)
      gl.uniform2f(u.uSize, cw, ch)
      gl.uniform1f(u.uDark, isDark)
      gl.uniform1f(u.uSpinVel, spinVel)

      // Hitung posisi & urutan gambar: di fase globe urut dari z belakang -> logo pusat -> z depan
      const drawList = projects.map((_, i) => {
        const d = offsetOf(i, 0, n)
        const baseLon = d * ((Math.PI * 2) / n)
        const lon = baseLon + spinAngle
        const lat = LATITUDES[i % LATITUDES.length]
        const zRaw = Math.cos(lat) * Math.cos(lon)
        const yRaw = Math.sin(lat)
        const zTilt = yRaw * sx + zRaw * cx
        return { i, d, lon, lat, zTilt }
      })

      if (morph < 0.55) {
        drawList.sort((a, b) => a.zTilt - b.zTilt)
      } else {
        drawList.sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
      }

      let drawnLogo = false
      for (const item of drawList) {
        if (showInsideGlobe && !drawnLogo && (morph < 0.55 ? item.zTilt >= 0 : item.d === 0)) {
          drawCoreLogo()
          drawnLogo = true
        }
        const { i, d, lon, lat } = item
        const heroX = d * step
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, tex[i].t)
        gl.uniform1i(u.uTex, 0)
        gl.uniform1f(u.uLon, lon)
        gl.uniform1f(u.uLat, lat)
        gl.uniform1f(u.uHeroX, heroX)
        gl.uniform1f(u.uAspect, tex[i].aspect)
        gl.uniform1f(u.uReady, tex[i].ready ? 1 : 0)
        gl.uniform1f(u.uShift, Math.max(-0.04, Math.min(0.04, -d * 0.025)))
        gl.drawArrays(gl.TRIANGLES, 0, mesh.length / 2)
      }
      if (showInsideGlobe && !drawnLogo) {
        drawCoreLogo()
      }

      const rocket =
        isLaunching && rawLaunch <= LAUNCH_DUR + 0.22
          ? {
              lp,
              cx: W * 0.5 * dpr,
              startY: (H * 0.5 - launchOriginY) * dpr,
              curY: (H * 0.5 - logoCenterY) * dpr,
              drawW: baseLogoW * logoScaleX * dpr,
              drawH: baseLogoH * logoScaleY * dpr,
            }
          : null

      // 1. Kanvas asap/api roket & shockwave (z-index 1): tepat DI BELAKANG kartu globe/Desiltrace
      if (rCtx && rCanvas) {
        rCtx.clearRect(0, 0, rCanvas.width, rCanvas.height)
        if (t >= CROUCH_START && !isLaunching) {
          drawRocketImpulseGlow(rCtx, W * 0.5 * dpr, (H * 0.5 - logoCenterY) * dpr, baseLogoW, crouchP, dpr)
        }
        if (rocket) {
          drawRocketTrail(rCtx, rocket, {
            W,
            H,
            dpr,
            isDark: isDark > 0.5,
            sparks: rocketSparks,
          })
        }
      }

      // 2. Kanvas partikel nama (z-index 4): hanya titik "Abel Abhinaya" yang terbelah aerodinamis oleh roket
      if (pCtx && pCanvas) {
        pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height)
        if (morphParticles && morphParticles.length > 0 && t >= PARTICLE_START) {
          const elapsed = t - PARTICLE_START
          const globalP = Math.max(0, Math.min(1, elapsed / PARTICLE_DURATION))
          const fadeIn = Math.min(1, elapsed / 0.11)

          const baseR = isDark ? 244 : 17
          const baseG = isDark ? 246 : 18
          const baseB = isDark ? 251 : 22
          const actR = isDark ? 96 : 35
          const actG = isDark ? 152 : 75
          const actB = 255
          const aMin = isDark ? 0.66 : 0.72
          const aSpan = isDark ? 0.30 : 0.25

          const wakeActive = rocket && rocket.lp <= 0.92
          const rocketNoseX = rocket ? rocket.cx : 0
          const rocketNoseY = rocket ? rocket.curY - rocket.drawH * 0.15 : 0
          const blastR = baseLogoW * 1.24 * dpr
          const wakeEnd = LAUNCH_AT + LAUNCH_DUR
          const wakeLock =
            t > wakeEnd
              ? Math.max(0, Math.min(1, (TOTAL_END - 0.04 - t) / Math.max(0.14, TOTAL_END - 0.04 - wakeEnd)))
              : 1

          for (let b = 0; b < P_BUCKETS; b++) {
            pBaseBuckets[b].length = 0
            pHeatBuckets[b].length = 0
          }

          for (let i = 0; i < morphParticles.length; i++) {
            const pt = morphParticles[i]
            const span = Math.max(0.25, 1 - pt.delay)
            const localT = Math.max(0, Math.min(1, (globalP - pt.delay) / span))
            const uEase = easeParticleFlight(localT)
            const inv = 1 - uEase

            // Kurva Bezier kuadratik: pecah halus -> mengunci tajam -> bereaksi membuka saat roket menembus nama
            const bx = inv * inv * pt.ox + 2 * inv * uEase * pt.cx + uEase * uEase * pt.tx
            const by = inv * inv * pt.oy + 2 * inv * uEase * pt.cy + uEase * uEase * pt.ty

            if (wakeActive) {
              const rx = bx + pt.wx - rocketNoseX
              const ry = by + pt.wy - rocketNoseY
              const dist = Math.hypot(rx, ry)
              if (dist < blastR) {
                const imp = Math.pow(1 - dist / blastR, 2)
                const dirX = dist > 1 ? rx / dist : pt.group === 0 ? -1 : 1
                const dirY = dist > 1 ? ry / dist : -0.4
                pt.wvx += dirX * imp * 16 * dpr
                pt.wvy += (dirY * 0.45 - 0.35) * imp * 12 * dpr
                pt.wakeHeat = Math.min(1, pt.wakeHeat + imp * 1.15)
              }
            }

            pt.wvx = (pt.wvx - pt.wx * 0.16) * 0.78
            pt.wvy = (pt.wvy - pt.wy * 0.16) * 0.78
            pt.wx += pt.wvx
            pt.wy += pt.wvy
            pt.wakeHeat *= 0.9

            pt.dx = bx + pt.wx * wakeLock
            pt.dy = by + pt.wy * wakeLock

            const flight = Math.sin(uEase * Math.PI)
            pt.dr = pt.r * (0.76 + 0.24 * uEase + 0.28 * flight + pt.wakeHeat * wakeLock * 0.35)
            const heat = Math.max(pt.spark * flight, pt.wakeHeat * wakeLock)

            if (heat > 0.05) {
              const hb = Math.min(P_BUCKETS - 1, Math.floor(heat * P_BUCKETS))
              pHeatBuckets[hb].push(pt)
            } else {
              pBaseBuckets[pt.bucket].push(pt)
            }
          }

          for (let b = 0; b < P_BUCKETS; b++) {
            const list = pBaseBuckets[b]
            if (!list.length) continue
            const alpha = ((aMin + ((b + 0.5) / P_BUCKETS) * aSpan) * fadeIn).toFixed(2)
            pCtx.fillStyle = `rgba(${baseR},${baseG},${baseB},${alpha})`
            pCtx.beginPath()
            for (let i = 0; i < list.length; i++) {
              const pt = list[i]
              pCtx.moveTo(pt.dx + pt.dr, pt.dy)
              pCtx.arc(pt.dx, pt.dy, pt.dr, 0, TAU)
            }
            pCtx.fill()
          }

          for (let b = 0; b < P_BUCKETS; b++) {
            const list = pHeatBuckets[b]
            if (!list.length) continue
            const h = (b + 0.6) / P_BUCKETS
            const rCol = Math.round(baseR + (actR - baseR) * h)
            const gCol = Math.round(baseG + (actG - baseG) * h)
            const bCol = Math.round(baseB + (actB - baseB) * h)
            const alpha = Math.min(1, (aMin + 0.5 * aSpan + h * 0.18) * fadeIn).toFixed(2)
            pCtx.fillStyle = `rgba(${rCol},${gCol},${bCol},${alpha})`
            pCtx.beginPath()
            for (let i = 0; i < list.length; i++) {
              const pt = list[i]
              pCtx.moveTo(pt.dx + pt.dr, pt.dy)
              pCtx.arc(pt.dx, pt.dy, pt.dr, 0, TAU)
            }
            pCtx.fill()
          }
        }
      }

      if (!firstFrameDrawn) {
        firstFrameDrawn = true
        setWebglActive(true)
      }

      if (t >= TOTAL_END && !finished) {
        finished = true
        onDoneRef.current?.()
        return
      }

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', syncSize)
      unsubLogo?.()
      unsubTex.forEach((fn) => fn())
      tex.forEach((entry) => gl.deleteTexture(entry.t))
      gl.deleteTexture(logoTex)
      gl.deleteBuffer(buf)
      gl.deleteBuffer(logoBuf)
      gl.deleteProgram(prog)
      if (logoProg) gl.deleteProgram(logoProg)
    }
  }, [phase, reduceMotion])

  const inGlobe = phase === 'globe'
  const orbitInitialScale = +ringMetrics.initScale.toFixed(4)

  return (
    <div className={`preloader preloader--globe no-print${unfolding ? ' is-unfolding' : ''}`} aria-hidden="true">
      {/* Latar yang perlahan transparan tepat saat globe mulai terbuka menuju Hero */}
      <motion.div
        className="preloader__backdrop"
        initial={{ opacity: 1 }}
        animate={{ opacity: unfolding ? 0 : 1 }}
        transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Tahap 1 -> Jembatan ke Globe: Logo A + cincin orbit progres yang mengembang langsung jadi lingkar globe */}
      <div
        className={`preloader__loader${inGlobe ? ' is-expanding' : ''}${webglActive ? ' is-webgl-live' : ''}`}
        style={{
          '--ring-size': `${ringMetrics.ringPx}px`,
          '--orbit-size': `${ringMetrics.orbitPx}px`,
          '--ring-init-scale': orbitInitialScale,
          '--ring-stroke-init': ringMetrics.strokeInit,
          '--ring-stroke-end': ringMetrics.strokeEnd,
        }}
      >
        <div className="preloader__logo-stage">
          <span className="preloader__logo-aura" />

          <svg
            className="preloader__ring"
            viewBox="0 0 100 100"
            width={ringMetrics.orbitPx}
            height={ringMetrics.orbitPx}
          >
            <g className="preloader__ring-group">
              <circle className="preloader__ring-track" cx="50" cy="50" r={RING_R} />
              <circle
                ref={ringArcRef}
                className="preloader__ring-arc"
                cx="50"
                cy="50"
                r={RING_R}
                strokeDasharray={RING_CIRC.toFixed(2)}
                strokeDashoffset={RING_CIRC.toFixed(2)}
              />
            </g>
          </svg>

          <picture className="preloader__logo-picture">
            <source srcSet="/logo-a.webp" type="image/webp" />
            <img
              src="/logo-a.png"
              alt=""
              className="preloader__logo-img"
              width={ringMetrics.logoPx}
              height={Math.round(ringMetrics.logoPx * (328 / 512))}
              style={{ width: `${ringMetrics.logoPx}px` }}
              decoding="async"
              fetchPriority="high"
              draggable="false"
            />
          </picture>

          <span ref={pctTextRef} className={`preloader__pct${meterDone || inGlobe ? ' is-done' : ''}`}>
            0%
          </span>
        </div>
      </div>

      {/* Lingkar orbit globe yang menyambung langsung dari skala cincin loading hingga diameter penuh */}
      {inGlobe && (
        <motion.div
          className="preloader__orbit"
          initial={{ opacity: 0, scale: orbitInitialScale }}
          animate={unfolding ? { opacity: 0, scale: 1.25 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
        />
      )}

      {/* Teks editorial minimal meluncur keluar selaras dengan mekarnya globe */}
      {inGlobe && (
        <>
          <motion.span
            className="preloader__side preloader__side--left"
            initial={{ opacity: 0, x: 34 }}
            animate={unfolding ? { opacity: 0, x: 0 } : { opacity: 1, x: 0 }}
            transition={{ duration: unfolding ? 0.13 : 0.64, ease: [0.22, 1, 0.36, 1] }}
          >
            <span ref={leftTextRef}>{leftWord}</span>
          </motion.span>

          <motion.span
            className="preloader__side preloader__side--right"
            initial={{ opacity: 0, x: -34 }}
            animate={unfolding ? { opacity: 0, x: 0 } : { opacity: 1, x: 0 }}
            transition={{ duration: unfolding ? 0.13 : 0.64, ease: [0.22, 1, 0.36, 1] }}
          >
            <span ref={rightTextRef}>{rightWord}</span>
          </motion.span>
        </>
      )}

      {/* Kanvas 2D asap roket & shockwave: tepat DI BELAKANG kartu 3D WebGL */}
      <canvas ref={rocketCanvasRef} className="preloader__rocket" />

      {/* Kanvas WebGL penuh layar: 3D Globe mekar dari inti logo A -> melebur langsung ke Hero */}
      <canvas ref={canvasRef} className="preloader__canvas" />

      {/* Kanvas 2D penuh layar: "Abel" & "Abhinaya." pecah menjadi titik-titik -> membentuk judul besar Hero */}
      <canvas ref={particleCanvasRef} className="preloader__particles" />

      {inGlobe && (
        <motion.p
          className="preloader__foot"
          initial={{ opacity: 0, y: 12 }}
          animate={unfolding ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          {profile.role} · {profile.institution}
        </motion.p>
      )}
    </div>
  )
}
