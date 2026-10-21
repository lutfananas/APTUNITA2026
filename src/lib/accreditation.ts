/**
 * Logika izin server-side + akses data statis akreditasi.
 * Port dari sistem perm() aplikasi asli — sekarang DIEKSEKUSI DI SERVER.
 */
import raw from '@/data/accreditation.json'

export interface InsIndicator {
  kode: string
  nama: string
  kriteria: string
  sasaran: string
  aspek: string
  sumber_data: string
  ambang_u: string
  sp_u: boolean
  tabel_lkpt: string
  tanya: string[]
  kunci: string[]
  bukti_saran: string[]
  kerangka: string
}

export const KR = raw.KR as [string, string][]
export const ST = raw.ST as string[]
export const BLN = raw.BLN as string[]
export const BUKTI = raw.BUKTI as Record<string, string[]>
export const INS = raw.INS as InsIndicator[]
export const LKPT = raw.LKPT as [string, string, string, string, string, string, string][]
export const NASKAH = raw.NASKAH as [string, string, number | null, string][]
export const IDN = raw.IDN as [string, string][]
export const UNCOUNTED = raw.UNCOUNTED as string[]
export const NK_KR = raw.NK_KR as Record<string, string>
export const KRITERIA_LIST = KR.map(k => k[0])

export const JADWAL_STATUS = ['Rencana', 'Berjalan', 'Selesai']

/** Kode tampilan kriteria: "Budaya Mutu" -> "K.1" */
export const krKode = (kriteria: string) => (KR.find(x => x[0] === kriteria) || [])[1] || ''
/** Warna kriteria K.1–K.6 (urutan sama dengan KR) */
export const krColor = (kriteria: string) => KR.findIndex(x => x[0] === kriteria)
export const KR_HEX = ['#1f3c94', '#0f6f8f', '#6a3fb5', '#b8572c', '#9a7410', '#2f7a3a']

/**
 * Pemilik akun per kriteria — dipakai pesan popup larangan:
 * "Bagian ini diisi oleh akun <owner>."
 */
export const OWNER: Record<string, string> = {
  'Budaya Mutu': 'ppmk1',
  'Relevansi Pendidikan': 'ppmk21',
  'Relevansi Penelitian': 'ppmk22',
  'Relevansi PkM': 'ppmk23',
  Akuntabilitas: 'ppmk3',
  'Diferensiasi Misi': 'ppmk4',
}

/** Konteks percobaan akses yang ditolak — menentukan isi popup. */
export type DenyCtx =
  | { kind: 'isian'; kode: string; kr: string }
  | { kind: 'naskah'; id: string; nama: string }
  | { kind: 'admin'; nama: string }

export interface SessionLike {
  username: string
  role: string
  kriteria: string
}

/**
 * Cek izin tulis untuk satu path kategori/itemKey.
 * - admin: penuh ke semuanya (isian, lkpt, naskah, profil, jadwal)
 * - user : hanya kriteria miliknya untuk isian & naskah terkait; LKPT terbuka
 *          (sesuai perilaku asli: kolaboratif antar kriteria)
 */
export function canWrite(acc: SessionLike, category: string, itemKey: string): boolean {
  if (acc.role === 'admin') return true
  if (category === 'lkpt') return true // LKPT kolaboratif antar kriteria (sesuai aplikasi asli)
  if (category === 'isian') {
    const it = INS.find(x => x.kode === itemKey)
    return !!it && it.kriteria === acc.kriteria
  }
  if (category === 'naskah') return NK_KR[itemKey] === acc.kriteria
  return false // profil & jadwal: hanya admin
}

/** Validasi payload JSON (maks 200 KB) untuk mencegah abuse. */
export function sanitizePayload(data: unknown): string | null {
  if (data === null || data === undefined || typeof data !== 'object') return null
  try {
    const json = JSON.stringify(data)
    if (json.length > 200_000) return null
    JSON.parse(json) // round-trip valid
    return json
  } catch {
    return null
  }
}
