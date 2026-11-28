const imageCache = new Map()

/**
 * Mengonversi path thumbnail `/projects/nama.jpg` menjadi format WebP
 * resolusi desktop (`1024x640`) atau mobile (`560x350`).
 */
export function projectImageSrc(path, compact = false) {
  if (!path) return ''
  if (!path.startsWith('/projects/') || !path.endsWith('.jpg')) return path
  const file = path.slice('/projects/'.length, -4)
  return compact ? `/projects/mobile/${file}.webp` : `/projects/${file}.webp`
}

/**
 * Mengonversi path `.png` atau `.jpg` di folder aset publik (`/logos/`, `/certificates/`, dll.)
 * ke pasangan `.webp` ringan yang sudah dikompresi.
 */
export function toWebpSrc(path) {
  if (!path) return ''
  return path.replace(/\.(png|jpe?g)$/i, '.webp')
}

/**
 * Mengembalikan instance Image siap pakai secara sinkron bila sudah selesai dimuat.
 */
export function getCachedImage(src) {
  if (!src) return null
  const img = imageCache.get(src)
  return img && img.complete && img.naturalWidth > 0 ? img : null
}

/**
 * Mengambil dan men-decode Image secara asinkron lalu menyimpannya di cache memori bersama.
 * Selalu resolve (tidak pernah reject) agar preloader tidak pernah tersangkut bila satu aset gagal.
 */
export function preloadCachedImage(src) {
  if (!src || typeof Image === 'undefined') return Promise.resolve(null)
  let img = imageCache.get(src)
  if (!img) {
    img = new Image()
    img.decoding = 'async'
    img.src = src
    imageCache.set(src, img)
  }

  const settleDecode = () => {
    if (typeof img.decode === 'function') {
      return img.decode().catch(() => {}).then(() => img)
    }
    return Promise.resolve(img)
  }

  if (img.complete) {
    return img.naturalWidth > 0 ? settleDecode() : Promise.resolve(null)
  }

  return new Promise((resolve) => {
    const cleanup = () => {
      img.removeEventListener('load', onLoad)
      img.removeEventListener('error', onError)
    }
    const onLoad = () => {
      cleanup()
      settleDecode().then(resolve)
    }
    const onError = () => {
      cleanup()
      resolve(null)
    }
    img.addEventListener('load', onLoad, { once: true })
    img.addEventListener('error', onError, { once: true })
  })
}

/**
 * Mengambil instance Image bersama yang di-cache di memori agar Preloader
 * dan CurvedProjectLens berbagi aset hasil decode yang sama tanpa fetch ganda.
 */
export function loadCachedImage(src, onLoad) {
  if (!src) return null
  let img = imageCache.get(src)
  if (!img) {
    img = new Image()
    img.decoding = 'async'
    img.src = src
    imageCache.set(src, img)
  }

  if (img.complete && img.naturalWidth > 0) {
    let active = true
    if (onLoad) {
      queueMicrotask(() => {
        if (active) onLoad(img)
      })
    }
    return () => {
      active = false
    }
  } else if (onLoad) {
    const handle = () => onLoad(img)
    img.addEventListener('load', handle, { once: true })
    return () => img.removeEventListener('load', handle)
  }
  return () => {}
}
