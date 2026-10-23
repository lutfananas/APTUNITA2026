# APT UNITA 2026 — Lembar Kerja Akreditasi Perguruan Tinggi

Aplikasi web database untuk persiapan akreditasi **Universitas Tulungagung (UNITA)** menuju status **Terakreditasi Unggul** berdasarkan:

- **Instrumen IAPT 4.1** (Lampiran PerBAN-PT No. 35 Tahun 2025)
- **Permendiktisaintek No. 39 Tahun 2025** jo. **No. 10 Tahun 2026** tentang Penjaminan Mutu Pendidikan Tinggi

## Fitur

- **Indikator LED** — 65 butir pada 6 kelompok kriteria (K.1 Budaya Mutu, K.2.1 Pendidikan, K.2.2 Penelitian, K.2.3 PkM, K.3 Akuntabilitas, K.4 Diferensiasi Misi) dengan 8 butir Syarat Perlu Unggul (SPU)
- **Tabel LKPT** — 24 tabel dengan kolom isian **persis mengikuti Panduan Penyusunan LKPT IAPT 4.1**: header bergrup dua tingkat, baris tetap/dinamis, sel abu pola tabel resmi, penanda huruf (d1 =, e1 =, f1 =) dan tag jumlah (NPS =, NDT =, NA1 =, NPT =)
- **Naskah LED** — 14 naskah per bab dengan pembatasan per kriteria
- **Izin per akun** — tiap kriteria dijaga akun pemiliknya; isian kriteria lain tertutup perisai transparan dengan popup larangan (data tetap terlihat, tidak bisa diubah); server menegakkan izin yang sama
- **Persistensi database** — seluruh isian tersimpan di SQLite via Prisma (`/api/state`, `/api/save`) disertai audit log (login/simpan/penolakan)
- **Jadwal** — 18 tahapan default persiapan hingga unggah SAPTO 2.0 (15–19 Maret 2027), dapat digeser admin
- **UI khas** — replika desain asli: IBM Plex Sans/Mono + Literata, hero foto kampus, ring simulasi Unggul, kartu liquid glass

## Akun bawaan

| Akun | Peran |
|------|-------|
| `ppmunita` | Admin Pusat Penjaminan Mutu (akses penuh) |
| `ppmk1` | K.1 Budaya Mutu |
| `ppmk21` | K.2.1 Relevansi Pendidikan |
| `ppmk22` | K.2.2 Relevansi Penelitian |
| `ppmk23` | K.2.3 Relevansi PkM |
| `ppmk3` | K.3 Akuntabilitas |
| `ppmk4` | K.4 Diferensiasi Misi |

Kata sandi awal seluruh akun: `unita2026` (segera ganti di produksi).

## Menjalankan

```bash
bun install
bun run db:push        # inisialisasi skema Prisma (SQLite)
bun run dev            # http://localhost:3000
```

## Struktur

```
src/app/                     route & API (auth, state, save, jadwal)
src/components/accreditation/ tab aplikasi (ringkasan, LED, LKPT, naskah, jadwal, profil)
src/components/accreditation/lkpt-grid.tsx  grid isian LKPT sesuai format resmi
src/data/accreditation.json  instrumen: 65 INS, 24 LKPT (+LKPT_GRID), 14 NASKAH, akun, jadwal
prisma/schema.prisma         skema database (User, Entry, AuditLog)
landing/                     landing page statis (versi awal, tayang di aptunita.pages.dev)
```

## Catatan deploy

- Versi **statis** (landing) tayang di `https://aptunita.pages.dev` (Cloudflare Pages).
- Aplikasi **fullstack** ini membutuhkan runtime server + database (API route + Prisma/SQLite), sehingga tidak dapat di-host pada Cloudflare Pages statis — gunakan Vercel/VPS/Workers+D1.

Dikelola oleh Pusat Penjaminan Mutu UNITA · Task Force Persiapan Akreditasi.
