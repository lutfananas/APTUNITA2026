'use client'

/**
 * Store global aplikasi: sesi pengguna, data isian dari database,
 * dan fungsi simpan (POST /api/save) dengan pelacakan dirty.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { INS as INS_LOCAL, NK_KR as NK_KR_LOCAL, type DenyCtx } from '@/lib/accreditation'

export interface SessionUser {
  username: string
  role: string
  kriteria: string
  label: string
}

// Payload isian per kategori (mengikuti struktur aplikasi asli)
export interface IsianData {
  status: string
  pic: string
  sim_u: string
  analisis: string
  narasi_url: string
  catatan: string
  bukti: { nama: string; url: string }[]
}
export interface LkptData {
  status: string
  pic: string
  terisi: number | ''
  file_url: string
  catatan: string
  bukti: { nama: string; url: string }[]
}
export interface NaskahData {
  status: string
  penulis: string
  halaman: number | ''
  draf_url: string
  catatan: string
}
export interface ProdiRow {
  jenjang: string
  prodi: string
  status: string
  sk: string
  kadaluarsa: string
}
export interface IdentitasData {
  [field: string]: string | ProdiRow[]
  sk_url: string
  prodi: ProdiRow[]
}
export interface AnggotaTim {
  nama: string
  nidn: string
  jabatan: string
  peran: string
  tanggal: string
}
export interface TimData {
  anggota: AnggotaTim[]
  sk_tim_url: string
}
export interface JadwalItem {
  tahap: string
  mulai: string
  selesai: string
  status: string
}

export interface AppState {
  isian: Record<string, Partial<IsianData> & { diubah_pada?: string; diubah_oleh?: string }>
  lkpt: Record<string, Partial<LkptData> & { diubah_pada?: string; diubah_oleh?: string }>
  naskah: Record<string, Partial<NaskahData> & { diubah_pada?: string; diubah_oleh?: string }>
  profil: {
    identitas?: (Partial<IdentitasData> & { diubah_pada?: string; diubah_oleh?: string }) | undefined
    tim?: (Partial<TimData> & { diubah_pada?: string; diubah_oleh?: string }) | undefined
  }
  jadwal: Record<string, JadwalItem & { diubah_pada?: string; diubah_oleh?: string }>
}

const EMPTY: AppState = { isian: {}, lkpt: {}, naskah: {}, profil: {}, jadwal: {} }

interface Ctx {
  user: SessionUser | null
  data: AppState
  loading: boolean
  saving: string | null
  toast: string | null
  showToast: (t: string) => void
  reload: () => Promise<void>
  save: (category: string, itemKey: string, payload: unknown) => Promise<boolean>
  login: (u: string, p: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  canWrite: (category: string, itemKey: string) => boolean
  /** Popup larangan: konteks percobaan ubah yang ditolak (null = tertutup). */
  deny: DenyCtx | null
  showDenied: (ctx: DenyCtx) => void
  closeDenied: () => void
  /** Filter kriteria diminta dari luar (tombol "Ke butir K.x saya"). */
  krFocus: string | null
  requestKrFocus: (kr: string) => void
  clearKrFocus: () => void
}

const StoreCtx = createContext<Ctx | null>(null)

export function useStore(): Ctx {
  const c = useContext(StoreCtx)
  if (!c) throw new Error('useStore di luar provider')
  return c
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [data, setData] = useState<AppState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [deny, setDeny] = useState<DenyCtx | null>(null)
  const [krFocus, setKrFocus] = useState<string | null>(null)

  const showDenied = useCallback((ctx: DenyCtx) => setDeny(ctx), [])
  const closeDenied = useCallback(() => setDeny(null), [])
  const requestKrFocus = useCallback((kr: string) => setKrFocus(kr), [])
  const clearKrFocus = useCallback(() => setKrFocus(null), [])

  const showToast = useCallback((t: string) => {
    setToast(t)
    setTimeout(() => setToast(null), 2600)
  }, [])

  const reload = useCallback(async () => {
    const r = await fetch('/api/state', { cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      if (j.ok) {
        setData({
          isian: j.data.isian || {},
          lkpt: j.data.lkpt || {},
          naskah: j.data.naskah || {},
          profil: j.data.profil || {},
          jadwal: j.data.jadwal || {},
        })
      }
    }
  }, [])

  // Sesi awal
  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/auth/me', { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          if (j.ok && j.user) {
            setUser(j.user)
            await reload()
          }
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [reload])

  const login = useCallback(
    async (username: string, password: string) => {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const j = await r.json()
      if (j.ok) {
        setUser(j.user)
        await reload()
        return { ok: true }
      }
      return { ok: false, error: j.error || 'Gagal masuk' }
    },
    [reload],
  )

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setData(EMPTY)
  }, [])

  const save = useCallback(
    async (category: string, itemKey: string, payload: unknown) => {
      const key = `${category}/${itemKey}`
      setSaving(key)
      try {
        const r = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, itemKey, data: payload }),
        })
        const j = await r.json()
        if (j.ok) {
          setData(prev => {
            const next: AppState = {
              ...prev,
              isian: { ...prev.isian },
              lkpt: { ...prev.lkpt },
              naskah: { ...prev.naskah },
              profil: { ...prev.profil },
              jadwal: { ...prev.jadwal },
            }
            const stored = { ...(payload as object), diubah_pada: j.updatedAt, diubah_oleh: j.updatedBy }
            if (category === 'isian') next.isian[itemKey] = stored
            else if (category === 'lkpt') next.lkpt[itemKey] = stored
            else if (category === 'naskah') next.naskah[itemKey] = stored
            else if (category === 'jadwal') next.jadwal[itemKey] = stored as unknown as JadwalItem
            else if (category === 'profil') next.profil[itemKey === 'tim' ? 'tim' : 'identitas'] = stored
            return next
          })
          return true
        }
        showToast(j.error || 'Gagal menyimpan')
        return false
      } catch {
        showToast('Koneksi gagal — coba lagi')
        return false
      } finally {
        setSaving(null)
      }
    },
    [showToast],
  )

  const canWrite = useCallback(
    (category: string, itemKey: string) => {
      if (!user) return false
      if (user.role === 'admin') return true
      if (category === 'lkpt') return true // LKPT kolaboratif; profil & jadwal hanya admin
      if (category === 'isian') {
        const it = INS_LOCAL.find(x => x.kode === itemKey)
        return !!it && it.kriteria === user.kriteria
      }
      if (category === 'naskah') return NK_KR_LOCAL[itemKey] === user.kriteria
      return false
    },
    [user],
  )

  const value = useMemo(
    () => ({ user, data, loading, saving, toast, showToast, reload, save, login, logout, canWrite, deny, showDenied, closeDenied, krFocus, requestKrFocus, clearKrFocus }),
    [user, data, loading, saving, toast, showToast, reload, save, login, logout, canWrite, deny, showDenied, closeDenied, krFocus, requestKrFocus, clearKrFocus],
  )
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}
