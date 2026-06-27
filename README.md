# Abel Portfolio

Website portfolio pribadi Muhammad Abel Abhinaya, frontend developer. Tema terang dan minimalis, dengan smooth scroll, animasi halus, dan satu elemen 3D di hero.

## Tech stack

- React + Vite
- React Three Fiber + drei (elemen 3D di hero)
- Framer Motion (animasi reveal dan micro-interaction)
- Lenis (smooth scroll)
- CSS kustom (tanpa framework), variabel warna terpusat

## Cara menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:5174.

Build untuk produksi:

```bash
npm run build
npm run preview
```

## Ngedit konten

Semua teks dan data dipusatkan di satu file: [`src/data/content.js`](src/data/content.js). Ubah di situ untuk profil, kontak, skill, project, pendidikan, dan stats. Beberapa bagian masih bertanda `TODO` dan perlu dilengkapi (lokasi, jurusan, link CV, angka stats).

## Foto profil

Taruh foto di `public/profile.jpg`. Selama belum ada, bagian About otomatis menampilkan inisial. Begitu file-nya ada, fotonya muncul sendiri tanpa perlu ubah kode.

## Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Di Vercel, import repo-nya. Preset Vite akan terdeteksi otomatis (lihat `vercel.json`).
3. Build command `npm run build`, output `dist`.
4. Setiap push ke branch utama akan auto-redeploy.

## Struktur

```
src/
  components/   # Nav, Hero, Scene3D, About, Skills, Projects, Education, Contact, Footer, Cursor, Reveal
  data/         # content.js (semua teks)
  hooks/        # useScrollSpy
  lib/          # smoothScroll (Lenis)
  styles/       # global.css
```
