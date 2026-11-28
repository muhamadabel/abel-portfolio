# AGENT BRIEF: ABEL ABHINAYA PORTFOLIO (LOCAL DEV)

Dokumen onboarding terbaru untuk AI coding agent (Antigravity, Claude Code, Cursor, Codex, Windsurf) yang mengedit repository portofolio ini secara lokal.

**Prinsip utama:** edit, jalankan server lokal, dan verifikasi di mesin lokal saja. Urusan review akhir, commit, `git push` multi-remote, dan deploy Vercel production ke `https://www.akuabel.my.id` ditangani terpisah oleh owner/Hermes.

---

## 0. Ringkasan Cepat Lingkungan & Perintah

| Item | Nilai |
|---|---|
| Direktori repo | `/Users/user/Documents/abel work/porto/abel-portfolio` |
| URL Live Production | `https://www.akuabel.my.id` |
| Branch Git aktif | `main` |
| Git remotes | `origin` (`abel-portfolio.git`), `abel` (`abel.git` / production Vercel), `portofun` (`portofun.git`) |
| Runtime | Node `v22.23.3`, npm `10.9.9` |
| Stack inti | React `19.2.7`, Vite `8.1.0`, Framer Motion `12.42.0`, Lenis `1.3.25`, Vanilla CSS (`src/styles/global.css`) |
| Port Dev Server | **`http://localhost:5174/`** (`vite.config.js` mengunci `port: 5174, strictPort: true`) |
| Jalankan dev server | `npm run dev` |
| Build check wajib | `npm run build` (sudah split `vendor-react` & `vendor-motion`) |
| Preview hasil build | `npm run preview` (`http://localhost:4173/`) |

Catatan konfigurasi port: `.claude/launch.json` masih mencatat argumen `--port 5173`, sedangkan `vite.config.js` mengunci `port: 5174, strictPort: true`. Selalu gunakan `npm run dev` dan buka `http://localhost:5174/`.

---

## 1. Aturan Git & Batas Kewenangan (LOKAL SAJA)

1. **Dilarang mengubah remote atau memicu deploy:**
   - Dilarang `git push` ke remote mana pun (`origin`, `abel`, `portofun`).
   - Dilarang `git commit` di `main` (biarkan perubahan bersih di working tree untuk review).
   - Dilarang `gh pr create`, `gh pr merge`, `vercel deploy`, atau `npx vercel`.
2. **Dilarang perintah destruktif di working tree:**
   - Jangan pernah jalankan `git restore .`, `git clean -f`, `git reset --hard`, atau `git stash` tanpa izin eksplisit Abel, karena working tree bisa berisi pekerjaan aktif yang belum di-commit.
3. **File yang dilindungi:**
   - **Jangan edit `CLAUDE.md`** tanpa instruksi eksplisit Abel.
4. **Dependensi baru:**
   - Jangan menambahkan package baru di `package.json` tanpa persetujuan Abel terlebih dahulu.

---

## 2. Data Identitas Terkunci (`src/data/content.js`)

Jangan ubah nilai identitas atau tautan resmi berikut tanpa instruksi eksplisit Abel:

| Key di `src/data/content.js` | Nilai Terkunci |
|---|---|
| `profile.name` | `Muhammad Abel Abhinaya Riananto` |
| `profile.display` | `Abel Abhinaya` |
| `profile.role` | `Software Engineer` |
| `profile.institution` / `major` / `cohort` | `Universitas Gadjah Mada` / `TRPL` / `2024` |
| `profile.birthDate` | `17 Juni 2006` |
| `profile.address` | `Pandes RT02, Panggungharjo, Sewon, Bantul` |
| `contact.email` | `muhammadabelabhinaya@mail.ugm.ac.id` |
| `contact.formEndpoint` | `https://formsubmit.co/ajax/muhamadabelugm@gmail.com` |
| `contact.github.url` | `https://github.com/muhamadabel` |
| `contact.linkedin.url` | `https://www.linkedin.com/in/muhammad-abel-abhinaya-riananto-944376326/` |
| `contact.instagram.url` | `https://instagram.com/mhmmdabel._` |
| `contact.tiktok.url` | `https://www.tiktok.com/@muhablee` |

**Privasi:** Jangan menampilkan atau memasukkan nomor telepon/WhatsApp di website portofolio (`src/data/content.js`, `Contact.jsx`, dll.). Jika ada perbedaan data di dokumen lain, laporkan ke Abel tanpa mengubah nilainya sendiri.

---

## 3. Arsitektur UI & Komponen Saat Ini

Komposisi halaman diatur di `src/App.jsx` dalam `<MotionConfig reducedMotion="user">` dengan `useSmoothScroll()` (Lenis aktif di desktop saja, otomatis nonaktif pada `pointer: coarse` dan `prefers-reduced-motion`).

### Urutan Render Aktif (`src/App.jsx`)

1. **`Preloader.jsx` (eager, 2 tahap, tampil sampai `ready === true`)**
   - **Tahap 1 (`phase === 'loading'`):** Loading screen bersih berlogo metalik **A** (`/logo-a.webp`) di tengah layar dengan bar progres tipis & persentase (`0% - 100%`). Melalui `src/lib/assetPreloader.js` dan `preloadCachedImage()` di `src/lib/projectImage.js`, tahap ini memuat & men-decode seluruh aset penting situs (logo A, 9 thumbnail proyek WebP sesuai viewport, font `Inter`/`Inter Tight`, 6 chunk JS lazy section, `/profile.webp`, 11 logo, dan 2 sertifikat). Durasi menyesuaikan kecepatan jaringan/perangkat: minimal ~`1,5` detik di jaringan cepat, dan menunggu otomatis sampai seluruh aset selesai di jaringan lambat (batas pengaman `9` detik).
   - **Tahap 2 (`phase === 'globe'`):** Setelah seluruh aset siap di cache memori, WebGL 3D globe langsung mekar mengelilingi logo **A** tanpa satu pun kartu abu-abu (`getCachedImage()` sinkron pada frame 0), berputar ke kanan berhenti di `Desiltrace` (indeks `0`), membuka ke carousel 3D Hero, lalu logo **A** melesat dari belakang kartu menembus partikel nama `"Abel Abhinaya"`.
   - **Penting:** Ukuran logo Stage 1 (`computeCoreLogoWidth`) identik dengan logo WebGL Stage 2, dan koordinat pendaratan kartu globe & titik huruf disinkronkan subpiksel dengan `.lens-stage__canvas` dan `.particle-title` melalui `heroCardSize()` + `src/lib/particleLayout.js`.

2. **`Nav.jsx` (eager)**
   - Pil melayang `LiquidGlass.jsx` (refraksi SVG optik di Chromium desktop; fallback frosted glass di Safari/mobile/reduced transparency). Auto-hide saat scroll turun (`y > 540`) dan muncul lagi saat scroll naik.
   - Brand `#top` di kiri menampilkan logo **A** transparan (`/logo-a.webp` + fallback `/logo-a.png`) di dalam `.nav__mark` **tanpa latar bulat, border, atau box-shadow**, di kiri teks `Abel Abhinaya`.
   - Link navigasi (`useScrollSpy`): `Karya`, `Fokus`, `Pengalaman`, `Keahlian`, `CV`, plus `ThemeToggle`, tombol `Hubungi`, dan drawer mobile.

3. **`Hero.jsx` (eager)**
   - Lantai grid 3D perspektif (`.hero__floor`) yang bereaksi halus pada pergerakan kursor.
   - `ParticleText.jsx` (`Abel Abhinaya`, interaktif terhadap pointer di desktop dan hemat-CPU saat Preloader masih aktif atau mobile idle), subjudul `Software Engineer · Universitas Gadjah Mada`, dan 2 CTA `Magnetic` (`Buka CV` -> `#cv`, `Hubungi` -> `#contact`).
   - Panggung 3D `CurvedProjectLens.jsx`: carousel silinder lengkung WebGL berisi 9 proyek (`projects` di `content.js`), mendukung drag/flick, trackpad scroll horizontal, klik kartu samping, dan klik kartu tengah untuk langsung membuka URL live proyek. Chips dekoratif `@frontend` dan `@fullstack` melayang di kanan-kiri stage.

4. **`TechMarquee.jsx` (eager)**
   - Pita marquee monokrom berisi 10 logo `affiliations` (`content.js`), berjalan memakai `useAnimationFrame`, otomatis jeda saat hover atau saat keluar viewport (`IntersectionObserver`).

5. **`FocusDeck.jsx` (`#focus`, lazy-loaded)**
   - 3 kartu besar sticky 3D tilt-stacking di desktop (`>= 900px`): `Web & Front End`, `Full-Stack & Data`, `Mobile & Quality`. Di layar sempit (`< 900px`) otomatis rata menumpuk bersih tanpa sticky transform.
   - Preview sayap kiri-kanan membaca `projects[0,1,2,3,4,6]` memakai `<picture>` (`.webp` mobile -> `.webp` desktop -> `.jpg`). Array konfigurasi `cards` berada langsung di `FocusDeck.jsx`.

6. **`Experience.jsx` (`#experience`, lazy-loaded)**
   - Grid Bento `.xpb` 4 kartu:
     - Panggung **Organisasi** (obsidian) dengan 4 tab interaktif (`ORG_META` memetakan logo untuk `KMTEDI SV UGM`, `ASSETS TRPL SV UGM`, `Jamaah Vokasi Al-Alim SV UGM`, `Hackathon Crew`).
     - **PortraitCard** rata tengah tanpa efek tilt 3D menggunakan `/profile.webp` dan fallback `/profile.png` (wajib ada rule `.xpb__portrait-media picture { width: 100%; height: 100%; display: flex; align-items: flex-end; justify-content: center; }` agar foto tidak bergeser kiri).
     - Plakat **Pencapaian** (midnight sapphire) dengan switcher sertifikat `OLIVIA XI` dan `IYEEA 2026` serta tautan ke gambar/PDF di `public/certificates/`.
     - Kartu **Pendidikan** (`.xpb__edu-grid`) menggunakan `EDU_LOGO` (`UGM` dan `SMAN 1 Kasihan`).

7. **`Skills.jsx` (`#skills`, lazy-loaded)**
   - Grid Bento diagonal 4 grup `skills` dari `content.js` (`bentoSpec`: urutan `[0, 1, 3, 2]`, tone `sapphire`, `glass`, `glass`, `obsidian`) dengan sorotan kedekatan pointer via `useProximity.js`.

8. **`CVPreview.jsx` (`#cv`, lazy-loaded)**
   - 3 tombol utama (`Unduh PDF`, `Lihat PDF`, `Salin Link`) menghadap kartu kertas monogram 3D yang menaut ke `/cv-muhammad-abel-abhinaya.pdf`. File sumber HTML/PDF CV juga tersimpan di folder `cv/`.

9. **`Contact.jsx` (`#contact`, lazy-loaded)**
   - Form `.inbox-card.inbox-card--finale` obsidian dengan **satu textarea saja** (`name="message"`) mengirim JSON AJAX ke `contact.formEndpoint` (FormSubmit), tanpa input nama/email dan tanpa alamat email tampil langsung di kartu form.
   - Daftar 4 tautan sosial (`GitHub`, `LinkedIn`, `Instagram`, `TikTok`, tanpa nomor telepon) dengan efek `ScrambleText` dan `useFocus`.

10. **`Footer.jsx` (lazy-loaded)**
    - Footer menampilkan wordmark raksasa `Abel Abhinaya` interaktif (`GridField.jsx` + `useProximity`), jam real-time Yogyakarta WIB (`Clock.jsx`, timezone `Asia/Jakarta`), dan tombol kembali ke atas.
    - Kursor memakai kursor bawaan sistem (native `grab`/`grabbing`/`pointer`). Komponen `Cursor.jsx` (bubble lingkaran hitam besar `Geser`/`Buka`) sengaja tidak dipasang di `App.jsx`.

### File Komponen Lama yang Tidak Dipakai di `App.jsx`
Folder `src/components/` masih menyimpan file warisan yang **tidak di-import** oleh `App.jsx`:
- `About.jsx`, `Archive.jsx`, `Cursor.jsx`, `Education.jsx`, `Projects.jsx`, `Reveal.jsx`, dan `fx/LiquidAccordion.jsx`.
- Di `src/styles/global.css` juga masih ada blok CSS warisan (mis. baris 1678 `Marquee (legacy fallback unused)` dan baris 1721 `Projects Carousel & Cards`).

Jangan buang waktu mengedit `Projects.jsx` atau `About.jsx` jika niatnya mengubah halaman aktif. Halaman proyek aktif berada di **`Hero.jsx` -> `CurvedProjectLens.jsx` + `Preloader.jsx` + `src/data/content.js`**, sedangkan bagian pengalaman & profil ada di **`Experience.jsx`**.

---

## 4. Peta File Penting

```text
index.html                  Meta SEO, favicon suite, JSON-LD, preload /logo-a.webp & desiltrace.webp, <noscript>
vite.config.js              Port 5174 (strictPort: true), manualChunks vendor-react & vendor-motion
vercel.json                 Redirect akuabel.my.id -> www, cache headers (/assets, /projects, /logos)
src/
  main.jsx                  Mount React + import global.css
  App.jsx                   Orkestrasi komponen eager + lazy Suspense
  data/content.js           Sumber data utama (profile, contact, education, organizations, achievements, projects[9], skills, affiliations, cvHighlights)
  styles/global.css         Seluruh token & styling (sekitar 4.100 baris; lihat peta baris di bagian 6)
  lib/
    motion.js               Preset spring & variant Framer Motion (ease, cardReveal, blurUp, stagger, dll.)
    particleLayout.js       Sampling piksel judul & subpixel DPR bersama antara Preloader & ParticleText
    projectImage.js         Helper projectImageSrc() (.jpg -> .webp desktop / mobile/) & cache gambar bersama
    smoothScroll.js         Lenis desktop-only + helper scrollTo()
  hooks/
    useFocus.js             Sibling dimming (opacity saja, tanpa blur)
    useScrollSpy.js         Pendeteksi section aktif untuk Nav
  components/
    Preloader.jsx           3D WebGL globe + logo roket "A" + transisi partikel nama ke Hero
    Nav.jsx                 Pill navbar LiquidGlass + logo transparan /logo-a.webp
    Hero.jsx                Floor 3D + ParticleText + CTA + CurvedProjectLens
    TechMarquee.jsx         Marquee 10 logo afiliasi (useAnimationFrame)
    FocusDeck.jsx           3 kartu fokus 3D sticky tilt-stacking + preview proyek kiri/kanan
    Experience.jsx          Bento Organisasi (4 tab), Portrait 3D, Award switcher, Pendidikan
    Skills.jsx              Bento 4 grup keahlian
    CVPreview.jsx           Tombol unduh/lihat/salin CV + kertas monogram 3D
    Contact.jsx             Form 1 textarea (FormSubmit AJAX) + daftar tautan sosial
    Footer.jsx              Wordmark GridField + jam WIB + back to top
    ThemeToggle.jsx         Switch tema (key localStorage: 'abel-theme', default 'light')
    fx/CurvedProjectLens.jsx Carousel WebGL lengkung 3D + fallback DOM bila WebGL gagal
    fx/ParticleText.jsx     Judul Hero partikel HTML5 Canvas interaktif
    fx/LiquidGlass.jsx      Filter refraksi SVG berbasis Snell's law + fallback browser non-Chromium
    fx/GridField.jsx        Canvas grid interaktif di Footer
    fx/ScrambleText.jsx     Efek scramble huruf saat hover tautan
    fx/Spotlight.jsx        Spotlight pointer
    fx/useProximity.js      Efek bobot/jarak kursor pada huruf/chip (selector .plet / custom)
public/
  logo-a.webp, logo-a.png   Logo metalik 3D "A" transparan (Preloader roket & Nav brand)
  favicon.ico, favicon-{48x48,96x96,192x192,512x512}.png, apple-touch-icon.png, site.webmanifest
  og-image.jpg              Preview Open Graph / Twitter 1200x630
  profile.webp, profile.png Foto studio
  cv-muhammad-abel-abhinaya.pdf   Berkas CV publik
  projects/*.webp           Thumbnail desktop (1280x800)
  projects/mobile/*.webp    Thumbnail mobile ringan (640x400)
  projects/*.jpg            Fallback & URL gambar metadata SEO/JSON-LD
  logos/*.png               11 logo institusi/organisasi/mitra
  certificates/*.{jpg,pdf}  Sertifikat OLIVIA XI 2026 & IYEEA 2026
```

---

## 5. Aturan Desain, Animasi & Performa (Wajib Dipatuhi)

1. **Zero em-dash (`U+2014`):** Jangan tulis karakter em-dash (`U+2014`) di `.jsx`, `.js`, `.css`, `.html`, atau `.md`. Pakai `-`, `·`, `:`, atau koma.
2. **Tanpa AI slop:** Tidak ada badge status klise ("Available for work" pill di UI), slogan kosong, statistik fiktif, atau testimoni karangan. Teks faktual dan ringkas.
3. **Light mode adalah default:** `<html lang="id" data-theme="light">` di `index.html` dan fallback `'light'` di `ThemeToggle.jsx`. Setiap edit visual wajib dicek di mode terang dan gelap (`[data-theme='dark']`).
4. **Jangan pakai `filter: blur(...)` untuk reveal/dimming animasi:** Gunakan `opacity` dan `transform` (CPU/GPU lebih ringan, menghindari blur saat scroll). Catatan: `drop-shadow(...)` statis di `.nav__mark img` diperbolehkan.
5. **Logo Navbar wajib transparan:** `.nav__mark` di `src/styles/global.css` harus tetap `background: transparent; border: none; box-shadow: none;` agar `/logo-a.webp` melayang bersih tanpa lingkaran gelap di belakangnya.
6. **Jaga sinkronisasi Preloader -> Hero:**
   - Ukuran kartu & jarak di `Preloader.jsx` (`heroCardSize`) harus identik dengan `CurvedProjectLens.jsx` (`cardSize`).
   - Dimensi kanvas teks judul di `Preloader.jsx` harus terus memanggil helper bersama `src/lib/particleLayout.js` (`sampleParticleTitle`, `computeParticleBox`, `getParticleDpr`).
   - Jika mengubah posisi vertikal `.hero__top` atau `.hero__stage` di CSS, uji ulang jalannya animasi preloader dari detik `0` hingga selesai.
7. **Pipa Gambar WebP & Performa Mobile:**
   - `projectImageSrc(path, compact)` di `src/lib/projectImage.js` mengasumsikan `item.image` di `content.js` bertipe `/projects/<slug>.jpg` dan otomatis memetakannya ke `/projects/<slug>.webp` (desktop) atau `/projects/mobile/<slug>.webp` (mobile `< 640px`).
   - Jangan hapus preload `desiltrace` dan `/logo-a.webp` di `index.html`, serta jangan memanggil `Image()` terpisah di komponen lain jika bisa memakai `loadCachedImage()`.
8. **Kontak = satu textarea:** Jangan menambah field Nama/Email/Nomor di `Contact.jsx`.
9. **Responsivitas Mobile `390px`:** Pastikan zero horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`). Hormati `@media (prefers-reduced-motion: reduce)`.

---

## 6. Peta Baris `src/styles/global.css`

Agar tidak membaca 4.100 baris CSS sekaligus, langsung lompat ke bagian terkait:

| Baris | Bagian |
|---|---|
| `1 - 100` | Design tokens `:root` (Light) & `[data-theme='dark']` |
| `361 - 535` | `.preloader`, transisi handoff ke Hero, & `.nav__mark` transparan |
| `536 - 769` | `.nav` (pil Liquid Glass, `.nav__brand`, `.nav__links`, `.nav__sheet`) |
| `770 - 1135` | `.hero`, lantai grid `.hero__floor`, `.hero__chip`, `.lens-stage` |
| `1136 - 1244` | `.lmarq` (Affiliation Logo Marquee) |
| `1245 - 1677` | `.fdeck-*` & `.fcard*` (FocusDeck 3D sticky & breakpoint `< 900px`) |
| `1678 - 2020` | Selector legacy tidak terpakai (`Marquee` lama & `Projects Carousel` lama) |
| `2021 - 2648` | `.xpb*` (Experience Bento: Organisasi, Portrait, Award, Pendidikan) |
| `2649 - 2865` | `.sbento*` (Skills Bento & tactile keycaps) |
| `2866 - 3312` | `.cv-*` (CV Architectural Stage & kertas 3D) |
| `3313 - 3755` | `.contact`, `.inbox-*`, `.socials`, `.clock`, `.footer`, `.toast` |
| `3756 - 4026` | Breakpoint tablet (`768px`), desktop (`992px`), reduced-motion, interaktif |
| `4027 - 4118` | `@media print` |

---

## 7. Menambah atau Mengubah Proyek (Daftar Aktif Saat Ini: 9 Proyek)

Daftar di `src/data/content.js` saat ini: `01 Desiltrace`, `02 SurveyMETER`, `03 Simonev Renaksi`, `04 Pemilwa KMTEDI`, `05 Hongfilms`, `06 Rongsok.in`, `07 Somnia`, `08 Simpondok`, `09 TNA Sekolah Rakyat`.

Jika menambah atau mengganti proyek `<slug>`:
1. Siapkan 3 file aset gambar bersih (rasio ~`16:10`):
   - `public/projects/<slug>.webp` (`1280x800`, desktop)
   - `public/projects/mobile/<slug>.webp` (`640x400`, mobile)
   - `public/projects/<slug>.jpg` (fallback `<img>` & referensi metadata SEO)
2. Tambah item baru di array `projects` pada `src/data/content.js` (`image: '/projects/<slug>.jpg'`, `tint` sesuai warna aksen situs proyek) dan rapikan urutan `num` (`01`..`0N`).
3. Perbarui daftar `ItemList` JSON-LD dan `<noscript>` di `index.html` (termasuk `<link rel="preload" as="image" imagesrcset=...>` bila item pertama `projects[0]` berubah).
4. Cek apakah `FocusDeck.jsx` (`cards` memakai indeks `projects[0,1,2,3,4,6]`) masih memunculkan pasangan preview yang diinginkan.

---

## 8. Alur Kerja & Verifikasi Wajib Sebelum Selesai

1. Cek `git status --short` dulu agar tahu file mana yang memang sedang diubah.
2. Untuk perubahan teks/data profil/proyek/org/award/skill, edit `src/data/content.js`. Untuk UI aktif, baca range baris relevan saja sebelum mengedit.
3. Jalankan dev server `npm run dev` (atau cek apakah port `5174` sudah menyala) lalu verifikasi visual desktop & mobile (`1440px` dan `390px`, light & dark mode).
   - Catatan macOS: Chrome headless native bisa dipakai cepat untuk desktop (`--window-size=1440,900`), namun viewport `< ~500px` di jendela macOS headless bisa ter-clip lebar minimum OS. Untuk audit `390px`, pakai mobile emulation DevTools / Playwright atau inspect `scrollWidth <= innerWidth` via JS eval.
4. Jalankan build & audit em-dash dalam satu perintah:
   ```bash
   cd "/Users/user/Documents/abel work/porto/abel-portfolio" && npm run build && python3 -c "from pathlib import Path; print('em-dash hits:', [str(p) for p in [*Path('src').rglob('*'), Path('index.html'), Path('AGENT_BRIEF.md')] if p.is_file() and p.suffix in {'.jsx','.js','.css','.html','.md'} and '\u2014' in p.read_text(errors='ignore')])"
   ```
5. Laporkan ringkasan file berubah, hasil build, hasil audit em-dash (`[]`), serta hasil verifikasi desktop/mobile **tanpa melakukan `git commit` atau `git push`**.

---

## 9. Template Prompt Siap Pakai untuk Agent Baru

Salin teks berikut ke agent baru saat ingin mulai mengedit secara lokal:

```text
Kamu akan mengedit proyek portofolio lokal milik Muhammad Abel Abhinaya di:
/Users/user/Documents/abel work/porto/abel-portfolio

Sebelum mengubah kode apa pun:
1. Baca AGENT_BRIEF.md di root proyek sampai selesai sebagai panduan arsitektur, aturan desain, dan batasan Git lokal.
2. Jangan mengedit CLAUDE.md, jangan menambah dependency baru tanpa izin, dan JANGAN pernah menjalankan git commit atau git push (cukup tinggalkan perubahan terverifikasi di working tree lokal).
3. Jalankan `git status --short` untuk melihat kondisi tree saat ini.

Tugas saya kali ini:
[TULIS PERMINTAAN EDIT KAMU DI SINI]

Setelah selesai, wajib jalankan `npm run build`, audit bebas karakter em-dash (U+2014), dan laporkan perubahan beserta hasil pengecekannya.
```
