import { achievements, affiliations, projects } from '../data/content'
import { preloadCachedImage, projectImageSrc, toWebpSrc } from './projectImage'

function withTimeout(promise, ms) {
  let timer = 0
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((resolve) => {
      timer = window.setTimeout(resolve, ms)
    }),
  ])
}

/**
 * Memuat dan men-decode seluruh aset penting situs (logo A, 9 thumbnail proyek WebP,
 * font Inter/Inter Tight, chunk JS lazy section, foto profil, logo afiliasi, dan sertifikat)
 * secara paralel sembari melaporkan progres nyata (0..1).
 *
 * Durasi loading screen menyesuaikan kecepatan jaringan/perangkat:
 * - Di jaringan cepat / sudah ter-cache: tetap tampil mulus minimal `minDurationMs` (~1,35 detik).
 * - Di jaringan lambat: menunggu sampai seluruh aset selesai di-decode (dibatasi `maxWaitMs`).
 */
export function preloadSiteAssets({
  compact = false,
  chunkLoaders = [],
  onProgress,
  minDurationMs = 1350,
  maxWaitMs = 9000,
}) {
  let cancelled = false
  const startedAt = performance.now()
  const tasks = []

  const addTask = (weight, factory) => {
    tasks.push({ weight, factory })
  }

  // 1. Aset prioritas utama (logo inti + 9 tekstur WebGL proyek + font tipografi)
  addTask(2, () => preloadCachedImage('/logo-a.webp'))
  for (const project of projects) {
    const src = projectImageSrc(project.image, compact)
    addTask(2, () => preloadCachedImage(src))
  }
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    addTask(3, () => withTimeout(document.fonts.ready.catch(() => {}), 3500))
  }

  // 2. Chunk JS section di bawah lipatan (FocusDeck, Experience, Skills, CV, Contact, Footer)
  for (const loadChunk of chunkLoaders) {
    addTask(1.5, () => Promise.resolve().then(loadChunk).catch(() => null))
  }

  // 3. Aset visual section bawah versi WebP ringan (foto profil, logo afiliasi/pendidikan, dan pratinjau sertifikat)
  const secondaryImages = new Set(['/profile.webp', '/logos/sman1kasihan.webp'])
  for (const item of affiliations) {
    if (item.logo) secondaryImages.add(toWebpSrc(item.logo))
  }
  for (const item of achievements) {
    if (item.certImage) secondaryImages.add(toWebpSrc(item.certImage))
  }
  for (const src of secondaryImages) {
    addTask(1, () => preloadCachedImage(src))
  }

  const totalWeight = tasks.reduce((sum, item) => sum + item.weight, 0) || 1
  let doneWeight = 0

  const report = () => {
    if (cancelled) return
    onProgress?.(Math.min(1, doneWeight / totalWeight))
  }

  const allDone = Promise.all(
    tasks.map((task) =>
      Promise.resolve()
        .then(task.factory)
        .catch(() => null)
        .finally(() => {
          doneWeight += task.weight
          report()
        }),
    ),
  )

  const readyPromise = withTimeout(allDone, maxWaitMs).then(() => {
    if (cancelled) return
    doneWeight = totalWeight
    report()
    const remaining = Math.max(0, minDurationMs - (performance.now() - startedAt))
    if (remaining <= 0) return
    return new Promise((resolve) => {
      window.setTimeout(resolve, remaining)
    })
  })

  return {
    ready: readyPromise,
    cancel: () => {
      cancelled = true
    },
  }
}
