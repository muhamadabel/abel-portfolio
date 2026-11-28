import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ease } from '../../lib/motion'
import { loadCachedImage, projectImageSrc } from '../../lib/projectImage'

function wrap(i, n) {
  return n > 0 ? ((i % n) + n) % n : 0
}

function offsetOf(i, pos, n) {
  if (n <= 0) return 0
  return wrap(i - pos + n / 2, n) - n / 2
}

function restFor(pos, velocity, max = 3) {
  const throwTo = pos + Math.max(-max, Math.min(max, velocity * 0.17))
  return Math.round(throwTo)
}

function springStep(pos, vel, target, dt, omega = 10.5) {
  const a = (target - pos) * omega * omega - vel * 2 * omega
  const v = vel + a * dt
  return [pos + v * dt, v]
}

// Rasio lanskap 16:10 supaya screenshot situs tampil penuh dan tepi lengkung 3D tak terpotong.
function cardSize(w, h) {
  const isMobile = w < 640
  const maxW = isMobile ? w * 0.78 : Math.min(w * 0.36, 480)
  const cw = Math.min(maxW, h * 1.12)
  const ch = cw * 0.625
  return [Math.round(cw), Math.round(ch)]
}

const VERT = `
attribute vec2 aPos;
uniform vec2 uRes;
uniform vec2 uSize;
uniform float uX;
uniform float uBend;
uniform float uVel;
uniform float uIntro;
uniform float uLift;
varying vec2 vUv;
varying float vX;
void main() {
  vec2 p = vec2(uX + (aPos.x - 0.5) * uSize.x, (aPos.y - 0.5) * uSize.y);
  p.y -= (1.0 - uIntro) * uSize.y * 0.7;
  vec2 n = p / (uRes * 0.5);
  float x = clamp(n.x, -1.45, 1.45);
  n.y *= 1.0 + uBend * x * x;
  n.y += uVel * 0.055 * sin(aPos.x * 3.14159) * (aPos.y - 0.5);
  n.x *= 1.0 - 0.07 * uBend * x * x;
  n.y += uLift;
  vUv = aPos;
  vX = x;
  gl_Position = vec4(n, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform float uAspect;
uniform float uVel;
uniform float uIntro;
uniform float uShift;
uniform float uReady;
uniform float uDark;
varying vec2 vUv;
varying float vX;

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
  uv.x = clamp(uv.x + uShift, 0.002, 0.998);
  uv.y = clamp(uv.y, 0.002, 0.998);

  // Chromatic dispersion halus di tepi lengkung lensa, makin terasa saat di-flick
  float ca = (0.0006 + 0.0036 * vX * vX) * (1.0 + abs(uVel) * 1.4);
  vec3 img = vec3(
    texture2D(uTex, vec2(clamp(uv.x + ca, 0.002, 0.998), uv.y)).r,
    texture2D(uTex, uv).g,
    texture2D(uTex, vec2(clamp(uv.x - ca, 0.002, 0.998), uv.y)).b
  );
  vec3 ph = mix(vec3(0.95, 0.96, 0.98), vec3(0.09, 0.10, 0.13), uDark);
  vec3 c = mix(ph, img, uReady);

  // Kedalaman ruang: kartu samping sedikit meredup halus mengikuti tema
  float edgeFade = min(1.0, vX * vX);
  if (uDark > 0.5) {
    c *= 1.0 - 0.40 * edgeFade;
  } else {
    c = mix(c, vec3(0.96, 0.972, 0.99), 0.28 * edgeFade);
  }

  float radius = min(20.0, min(uSize.x, uSize.y) * 0.085);
  float d = sdRoundBox((vUv - 0.5) * uSize, uSize * 0.5, radius);

  // Bingkai kaca bevel halus + kilau specular atas
  float outerBorder = smoothstep(-2.2, -0.35, d) * smoothstep(0.6, -0.6, d);
  float innerRim = smoothstep(-6.0, -0.8, d) * smoothstep(0.4, -0.8, d);
  vec3 borderCol = mix(vec3(0.80, 0.84, 0.90), vec3(1.0, 1.0, 1.0), 0.58 - 0.34 * uDark);
  c = mix(c, borderCol, outerBorder * (uDark > 0.5 ? 0.42 : 0.78));
  c += innerRim * (uDark > 0.5 ? 0.08 : 0.07);

  // Kilau lembut cahaya studio di tepi atas kartu tengah
  float sheen = smoothstep(0.76, 1.0, vUv.y) * (1.0 - min(1.0, abs(vX) * 1.15));
  c += sheen * (uDark > 0.5 ? 0.055 : 0.04);

  float al = smoothstep(1.0, -1.0, d) * uIntro;
  gl_FragColor = vec4(c * al, al);
}
`

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
 * WebGL 3D Curved Cylindrical Lens Carousel (adaptasi 21st.dev id:44872).
 * Mendukung drag/flick bebas, swipe sentuh, horizontal trackpad scroll, klik samping,
 * dan klik kartu tengah untuk langsung membuka proyek. Tanpa tombol panah ramai.
 */
export default function CurvedProjectLens({ items, warm = true, ready = true, settledIntro = false }) {
  const n = items.length
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [noGL, setNoGL] = useState(false)
  const readyRef = useRef(ready)
  readyRef.current = ready

  const apiRef = useRef({ goTo: () => {} })

  useEffect(() => {
    if (!warm) return
    const canvas = canvasRef.current
    const root = rootRef.current
    if (!canvas || !root || n === 0) return

    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: true, alpha: true })
    if (!gl) {
      setNoGL(true)
      return
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const prog = gl.createProgram()
    gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setNoGL(true)
      return
    }

    gl.useProgram(prog)
    const compactMesh = window.innerWidth < 640
    const mesh = buildGrid(compactMesh ? 18 : 32, compactMesh ? 8 : 12)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const u = {}
    for (const k of ['uRes', 'uSize', 'uX', 'uBend', 'uVel', 'uIntro', 'uTex', 'uAspect', 'uShift', 'uReady', 'uLift', 'uDark']) {
      u[k] = gl.getUniformLocation(prog, k)
    }

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    let disposed = false
    let W = 1
    let H = 1
    let dpr = 1
    let cw = 1
    let ch = 1
    let gap = 1
    let pos = 0
    let vel = 0
    let target = 0
    let intro = reduced.matches || settledIntro ? 1.4 : 0
    let introStart = -1
    let dragging = false
    let dragX = 0
    let dragY = 0
    let dragPos = 0
    let lastX = 0
    let lastT = 0
    let flick = 0
    let movedDist = 0
    let raf = 0
    let last = 0
    let visible = true
    let current = 0
    let isDark = document.documentElement.dataset.theme === 'dark' ? 1 : 0
    let wheelTimer = 0

    const unsubTex = []
    const tex = items.map((s) => {
      const t = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([240, 242, 246, 255]))
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

      const entry = { t, aspect: 1.6, ready: false }
      const unsub = loadCachedImage(projectImageSrc(s.image, compactMesh), (img) => {
        if (disposed) return
        gl.bindTexture(gl.TEXTURE_2D, t)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        entry.aspect = img.naturalWidth / Math.max(1, img.naturalHeight)
        entry.ready = true
        kick()
      })
      if (unsub) unsubTex.push(unsub)
      return entry
    })

    const orderIdx = Array.from({ length: n }, (_, i) => i)

    const resize = (w, h) => {
      W = Math.max(1, w)
      H = Math.max(1, h)
      dpr = W < 640 ? Math.min(1.25, window.devicePixelRatio || 1) : Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ;[cw, ch] = cardSize(W, H)
      gap = cw * (W < 640 ? 0.08 : 0.095)
      gl.viewport(0, 0, canvas.width, canvas.height)
      kick()
    }

    const draw = () => {
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform2f(u.uRes, W, H)
      gl.uniform2f(u.uSize, cw, ch)
      gl.uniform1f(u.uBend, W < 640 ? 0.24 : 0.34)
      gl.uniform1f(u.uVel, reduced.matches ? 0 : Math.max(-1, Math.min(1, vel * 0.11)))
      gl.uniform1f(u.uLift, 0.0)
      gl.uniform1f(u.uDark, isDark)

      const step = cw + gap
      // Urutkan dari yang terjauh ke tengah agar layering rapi (tanpa alokasi array per frame)
      orderIdx.sort((a, b) => Math.abs(offsetOf(b, pos, n)) - Math.abs(offsetOf(a, pos, n)))

      for (const i of orderIdx) {
        const d = offsetOf(i, pos, n)
        const x = d * step
        if (Math.abs(x) > W * 0.5 + step * 1.4) continue
        const dist = Math.abs(d)
        const t = Math.max(0, Math.min(1, (intro - dist * 0.1) / 0.65))
        const eased = 1 - Math.pow(1 - t, 3)

        gl.bindTexture(gl.TEXTURE_2D, tex[i].t)
        gl.uniform1f(u.uX, x)
        gl.uniform1f(u.uIntro, eased)
        gl.uniform1f(u.uAspect, tex[i].aspect)
        gl.uniform1f(u.uReady, tex[i].ready ? 1 : 0)
        gl.uniform1f(u.uShift, Math.max(-0.04, Math.min(0.04, -d * 0.025)))
        gl.drawArrays(gl.TRIANGLES, 0, mesh.length / 2)
      }
    }

    const frame = (now) => {
      raf = 0
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now

      if (intro < 1.4 && readyRef.current) {
        if (introStart < 0) introStart = now
        intro = Math.min(1.4, (now - introStart) / 860)
      }

      if (!dragging) {
        if (reduced.matches) {
          pos = target
          vel = 0
        } else {
          ;[pos, vel] = springStep(pos, vel, target, dt)
        }
      }

      const idx = wrap(Math.round(pos), n)
      if (idx !== current) {
        current = idx
        setActiveIndex(idx)
      }

      draw()
      const settled =
        !dragging &&
        Math.abs(target - pos) < 0.0005 &&
        Math.abs(vel) < 0.001 &&
        (intro >= 1.4 || reduced.matches)
      if (settled) {
        pos = target
        draw()
        last = 0
      } else if (visible) {
        raf = requestAnimationFrame(frame)
      }
    }

    function kick() {
      if (!raf && visible && !disposed) raf = requestAnimationFrame(frame)
    }

    apiRef.current.goTo = (targetIdx) => {
      const curWrapped = wrap(Math.round(target), n)
      let diff = targetIdx - curWrapped
      if (diff > n / 2) diff -= n
      if (diff < -n / 2) diff += n
      target = Math.round(target) + diff
      kick()
    }

    const onDown = (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      clearTimeout(wheelTimer)
      dragging = true
      dragX = lastX = e.clientX
      dragY = e.clientY
      lastT = e.timeStamp
      dragPos = pos
      flick = 0
      movedDist = 0
      canvas.setPointerCapture(e.pointerId)
      kick()
    }

    const onMove = (e) => {
      if (!dragging) return
      const dx = e.clientX - dragX
      const dy = e.clientY - dragY
      movedDist = Math.max(movedDist, Math.hypot(dx, dy))
      const step = Math.max(1, cw + gap)
      const p = dragPos - dx / step
      const dts = Math.max(1, e.timeStamp - lastT) / 1000
      flick = flick * 0.6 + (-(e.clientX - lastX) / step / dts) * 0.4
      vel = flick
      lastX = e.clientX
      lastT = e.timeStamp
      pos = p
      kick()
    }

    const onUp = (e) => {
      if (!dragging) return
      dragging = false

      // Klik tanpa geser: klik samping -> putar ke tengah; klik tengah -> buka proyek live
      if (movedDist < 7) {
        const rect = canvas.getBoundingClientRect()
        const relX = e.clientX - (rect.left + rect.width / 2)
        if (Math.abs(relX) < cw * 0.48) {
          const proj = items[wrap(Math.round(pos), n)]
          if (proj && (proj.live || proj.repo)) {
            window.open(proj.live || proj.repo, '_blank', 'noreferrer')
          }
        } else {
          target = Math.round(target) + (relX > 0 ? 1 : -1)
        }
        kick()
        return
      }

      target = restFor(pos, flick)
      vel = flick
      kick()
    }

    // Trackpad geser horizontal 2 jari langsung memutar carousel 3D
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 3) return
      e.preventDefault()
      const step = Math.max(1, cw + gap)
      pos += e.deltaX / (step * 1.15)
      target = pos
      vel = e.deltaX / step
      kick()
      clearTimeout(wheelTimer)
      wheelTimer = window.setTimeout(() => {
        target = Math.round(pos)
        kick()
      }, 110)
    }

    const onKey = (e) => {
      if (e.key === 'ArrowRight') {
        target = Math.round(target) + 1
        kick()
      } else if (e.key === 'ArrowLeft') {
        target = Math.round(target) - 1
        kick()
      }
    }

    let roRaf = 0
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      cancelAnimationFrame(roRaf)
      roRaf = requestAnimationFrame(() => {
        if (!disposed) resize(width, height)
      })
    })
    ro.observe(canvas.parentElement || canvas)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry ? entry.isIntersecting : true
      if (visible) kick()
    })
    io.observe(root)

    const themeObs = new MutationObserver(() => {
      isDark = document.documentElement.dataset.theme === 'dark' ? 1 : 0
      kick()
    })
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    root.addEventListener('keydown', onKey)

    // Pastikan intro berjalan begitu preloader selesai
    const readyCheck = window.setInterval(() => {
      if (readyRef.current) {
        kick()
        clearInterval(readyCheck)
      }
    }, 100)

    return () => {
      disposed = true
      unsubTex.forEach((fn) => fn())
      clearInterval(readyCheck)
      clearTimeout(wheelTimer)
      cancelAnimationFrame(raf)
      cancelAnimationFrame(roRaf)
      ro.disconnect()
      io.disconnect()
      themeObs.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('wheel', onWheel)
      root.removeEventListener('keydown', onKey)
      tex.forEach((entry) => gl.deleteTexture(entry.t))
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
    }
  }, [items, n, settledIntro, warm])

  const active = items[activeIndex] || items[0]

  return (
    <div
      ref={rootRef}
      className={`lens-stage${ready ? '' : ' lens-stage--masked'}`}
      tabIndex={0}
      aria-label="Galeri proyek 3D, geser kiri atau kanan untuk menjelajah"
    >
      <div className="lens-stage__viewport">
        {noGL ? (
          <a
            href={active.live || active.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="lens-stage__fallback"
          >
            <picture className="pic-contents">
              <source media="(max-width: 639px)" srcSet={projectImageSrc(active.image, true)} type="image/webp" />
              <source srcSet={projectImageSrc(active.image, false)} type="image/webp" />
              <img src={active.image} alt={`Pratinjau proyek ${active.title}`} width="1024" height="640" decoding="async" />
            </picture>
          </a>
        ) : (
          <canvas ref={canvasRef} className="lens-stage__canvas" />
        )}
      </div>

      {/* Caption editorial bersih di bawah stage: tanpa bulet-bulet, tanpa panah, tanpa pill */}
      <div className="lens-caption">
        <div className="lens-caption__bar">
          <a
            href={active.live || active.repo}
            target="_blank"
            rel="noreferrer"
            className="lens-caption__main"
          >
            <motion.span
              key={active.id}
              className="lens-caption__inner"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease }}
            >
              <strong className="lens-caption__title">{active.title}</strong>
              <span className="lens-caption__cat">{active.category}</span>
            </motion.span>
          </a>

          {active.repo && active.repo !== active.live && (
            <a
              href={active.repo}
              target="_blank"
              rel="noreferrer"
              className="lens-caption__repo"
              aria-label={`Repositori GitHub ${active.title}`}
            >
              GitHub
            </a>
          )}
        </div>

        <div className="lens-rail" role="tablist" aria-label="Pilih pratinjau proyek">
          {items.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={p.title}
              className={`lens-rail__seg${i === activeIndex ? ' is-active' : ''}`}
              onClick={() => apiRef.current.goTo(i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
