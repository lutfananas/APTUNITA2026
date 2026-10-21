/**
 * Seed akun pengguna + jadwal default ke database.
 * Password di-hash dengan bcrypt (10 rounds) — tidak pernah disimpan plaintext.
 *
 * Jalankan: bun /home/z/my-project/scripts/seed.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

// Struktur akun mengikuti aplikasi asli (peran + kriteria + label).
const ACCOUNTS: { username: string; role: string; kriteria: string; label: string; password: string }[] = [
  { username: 'ppmunita', role: 'admin', kriteria: '', label: 'Admin Pusat Penjaminan Mutu', password: 'unita2026' },
  { username: 'ppmk1', role: 'user', kriteria: 'Budaya Mutu', label: 'K.1 Budaya Mutu', password: 'unita2026' },
  { username: 'ppmk21', role: 'user', kriteria: 'Relevansi Pendidikan', label: 'K.2.1 Relevansi Pendidikan', password: 'unita2026' },
  { username: 'ppmk22', role: 'user', kriteria: 'Relevansi Penelitian', label: 'K.2.2 Relevansi Penelitian', password: 'unita2026' },
  { username: 'ppmk23', role: 'user', kriteria: 'Relevansi PkM', label: 'K.2.3 Relevansi PkM', password: 'unita2026' },
  { username: 'ppmk3', role: 'user', kriteria: 'Akuntabilitas', label: 'K.3 Akuntabilitas', password: 'unita2026' },
  { username: 'ppmk4', role: 'user', kriteria: 'Diferensiasi Misi', label: 'K.4 Diferensiasi Misi', password: 'unita2026' },
]

const JADWAL_DEFAULT: Record<string, { tahap: string; mulai: string; selesai: string; status: string }> = {
  j01: { tahap: 'Pembentukan tim dan SK penyusun LED & LKPT', mulai: '2026-10-01', selesai: '2026-10-16', status: 'Selesai' },
  j02: { tahap: 'Sosialisasi IAPT 4.1 dan pembagian PIC per sub-indikator', mulai: '2026-10-19', selesai: '2026-10-30', status: 'Berjalan' },
  j03: { tahap: 'Pemetaan posisi awal: simulasi skor Unggul dan 8 syarat perlu', mulai: '2026-10-26', selesai: '2026-11-06', status: 'Rencana' },
  j04: { tahap: 'Pemutakhiran dan validasi data PD Dikti', mulai: '2026-10-26', selesai: '2026-11-27', status: 'Rencana' },
  j05: { tahap: 'Tracer study dan survei kepuasan stakeholder (pelengkap data)', mulai: '2026-11-02', selesai: '2026-12-11', status: 'Rencana' },
  j06: { tahap: 'Pengumpulan bukti dan link bukti per sub-indikator', mulai: '2026-11-02', selesai: '2026-12-18', status: 'Rencana' },
  j07: { tahap: 'Pengisian tabel LKPT (isian perguruan tinggi)', mulai: '2026-11-09', selesai: '2026-12-18', status: 'Rencana' },
  j08: { tahap: 'Draf LED Bab I dan K.1 Budaya Mutu', mulai: '2026-11-09', selesai: '2026-12-04', status: 'Rencana' },
  j09: { tahap: 'Draf LED K.2 Relevansi Pendidikan, Penelitian, PkM', mulai: '2026-11-16', selesai: '2027-01-08', status: 'Rencana' },
  j10: { tahap: 'Draf LED K.3 Akuntabilitas dan K.4 Diferensiasi Misi', mulai: '2026-11-23', selesai: '2027-01-08', status: 'Rencana' },
  j11: { tahap: 'Review internal lintas kriteria', mulai: '2027-01-11', selesai: '2027-01-22', status: 'Rencana' },
  j12: { tahap: 'Revisi draf dan penutupan kekurangan bukti', mulai: '2027-01-25', selesai: '2027-02-05', status: 'Rencana' },
  j13: { tahap: 'Simulasi asesmen kecukupan oleh asesor pendamping', mulai: '2027-02-08', selesai: '2027-02-12', status: 'Rencana' },
  j14: { tahap: 'Revisi akhir, ringkasan eksekutif dan penutup', mulai: '2027-02-15', selesai: '2027-02-26', status: 'Rencana' },
  j15: { tahap: 'Finalisasi tata letak dan pengesahan pimpinan', mulai: '2027-03-01', selesai: '2027-03-12', status: 'Rencana' },
  j16: { tahap: 'Unggah usulan akreditasi ke SAPTO 2.0', mulai: '2027-03-15', selesai: '2027-03-19', status: 'Rencana' },
  j17: { tahap: 'Asesmen kecukupan BAN-PT (perkiraan)', mulai: '2027-04-01', selesai: '2027-05-31', status: 'Rencana' },
  j18: { tahap: 'Persiapan dan asesmen lapangan bila ditetapkan DE (perkiraan)', mulai: '2027-06-01', selesai: '2027-06-30', status: 'Rencana' },
}

async function main() {
  console.log('Seeding akun pengguna…')
  for (const a of ACCOUNTS) {
    const hash = await bcrypt.hash(a.password, 10)
    await db.user.upsert({
      where: { username: a.username },
      update: { role: a.role, kriteria: a.kriteria, label: a.label, passwordHash: hash },
      create: { username: a.username, passwordHash: hash, role: a.role, kriteria: a.kriteria, label: a.label },
    })
    console.log('  ✓', a.username, `(${a.role}${a.kriteria ? ' · ' + a.kriteria : ''})`)
  }

  const existing = await db.entry.count({ where: { category: 'jadwal' } })
  if (existing === 0) {
    console.log('Seeding jadwal default…')
    for (const [id, j] of Object.entries(JADWAL_DEFAULT)) {
      await db.entry.create({ data: { category: 'jadwal', itemKey: id, data: JSON.stringify(j), updatedBy: 'sistem' } })
    }
    console.log('  ✓', Object.keys(JADWAL_DEFAULT).length, 'tahap jadwal')
  } else {
    console.log('Jadwal sudah ada (' + existing + ' baris), dilewati.')
  }
  console.log('Selesai.')
}

main().catch(console.error).finally(() => db.$disconnect())
