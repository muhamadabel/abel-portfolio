// =============================================================
//  KONTEN PORTFOLIO ABEL
//  Semua teks dipusatkan di sini biar gampang diubah.
//  Bagian bertanda TODO masih perlu kamu konfirmasi.
// =============================================================

export const profile = {
  name: 'Muhammad Abel Abhinaya',
  display: 'Abel',
  role: 'Frontend Developer',
  tagline: 'Everyone love clean things',
  location: 'Yogyakarta, Indonesia', // TODO: konfirmasi lokasi
  available: true,
  availableText: 'Terbuka untuk kerja sama',
  bio: [
    'Frontend developer yang suka memperhatikan detail sampai rapi. Sehari-hari memakai React, Next.js, dan Laravel untuk membangun sistem yang nyaman dipakai dan mudah dirawat.',
    'Buat aku, hasil yang baik itu bukan cuma jalan, tapi juga enak dilihat dan gampang dirawat. Aku senang mengurus hal-hal kecil yang sering kelewat, dari rapinya struktur kode sampai detail kecil di tampilan.',
  ],
  // Taruh foto di public/profile.jpg (kalau belum ada, otomatis tampil inisial).
  photo: '/profile.jpg',
  initials: 'MA',
}

export const contact = {
  email: 'muhamadabelugm@gmail.com',
  github: { label: 'GitHub', handle: 'muhamadabel', url: 'https://github.com/muhamadabel' },
  linkedin: {
    label: 'LinkedIn',
    handle: 'Muhammad Abel Abhinaya',
    url: 'https://www.linkedin.com/in/muhammad-abel-abhinaya-riananto-944376326/',
  },
  instagram: { label: 'Instagram', handle: '@mhmmdabel._', url: 'https://instagram.com/mhmmdabel._' },
  cv: '/cv-muhammad-abel-abhinaya.pdf',
}

export const skills = [
  { group: 'Bahasa', items: ['JavaScript', 'TypeScript', 'PHP', 'Java'] },
  { group: 'Frontend', items: ['React', 'Next.js', 'Tailwind CSS'] },
  { group: 'Backend', items: ['Laravel', 'Node.js'] },
  { group: 'Tools & Testing', items: ['Git', 'Figma', 'Selenium', 'Cucumber'] },
]

export const projects = [
  {
    id: 'sia-ugn',
    title: 'SIA UGN',
    year: '2025',
    role: 'Frontend Developer',
    summary:
      'Sistem Informasi Akademik universitas, fokus di modul dosen seperti BKD, PAK, dan pengabdian.',
    description:
      'Membangun antarmuka modul dosen dengan React dan menyambungkannya ke backend Laravel lewat REST API. Fokusnya bikin alur isian yang panjang tetap terasa rapi dan nyaman diisi.',
    highlights: [
      'Modul dosen: BKD, PAK, dan pengabdian',
      'Integrasi REST API ke backend Laravel',
      'Form panjang dengan validasi dan alur yang jelas',
    ],
    tags: ['React', 'Laravel', 'REST API'],
    preview: ['#c2693f', '#7a2f1a'],
    live: 'https://sia.trisuladana.com/',
    repo: '',
  },
  {
    id: 'rongsokin',
    title: 'Rongsokin',
    year: '2025',
    role: 'Mobile Developer',
    summary: 'Aplikasi jual-beli barang rongsok dan daur ulang dengan alur yang sederhana.',
    description:
      'Dibangun dengan Flutter, menekankan tampilan yang bersih dan alur yang mudah diikuti supaya transaksi barang bekas terasa ringan.',
    highlights: ['Dibangun dengan Flutter (Dart)', 'Fokus UI bersih dan alur sederhana'],
    tags: ['Flutter', 'Dart', 'Mobile'],
    preview: ['#4f9d6a', '#24503a'],
    live: 'https://rongsokin.vercel.app/',
    repo: '',
  },
  {
    id: 'e2e-testing',
    title: 'E2E Testing Suite',
    year: '2025',
    role: 'QA / Automation',
    summary: 'Automation testing untuk modul dosen pakai Java, Selenium, dan Cucumber.',
    description:
      'Menyusun pengujian end-to-end dengan pola Page Object Model supaya skenario tetap rapi dan gampang dirawat. Semua skenario berhasil lewat.',
    highlights: ['21 dari 21 skenario PASS', 'Pola Page Object Model', 'BDD dengan Cucumber'],
    tags: ['Java', 'Selenium', 'Cucumber'],
    preview: ['#3a3f4a', '#16181d'],
    live: '',
    repo: '',
  },
]

export const education = {
  school: 'Universitas Gadjah Mada',
  program: 'Teknologi Rekayasa Perangkat Lunak',
  period: '2022 sampai sekarang', // TODO: konfirmasi tahun masuk
}

export const stats = [
  { value: '3+', label: 'Tahun ngoding' }, // TODO: konfirmasi
  { value: '3', label: 'Project tampil di sini' },
  { value: '21', label: 'Angka keberuntungan' },
]

// Penanda di navigasi dan urutan section
export const sections = [
  { id: 'home', label: 'Beranda' },
  { id: 'about', label: 'Tentang' },
  { id: 'skills', label: 'Keahlian' },
  { id: 'work', label: 'Karya' },
  { id: 'contact', label: 'Kontak' },
]
