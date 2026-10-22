'use client'

/**
 * Komponen kecil lintas tab dengan kelas desain asli:
 * SaveBar (savebar), LinkEditor (links/lnk/chip), pill status, Shield larangan.
 */
import React from 'react'
import { Check, Loader2, Plus, X } from 'lucide-react'
import { useStore } from './store'
import type { DenyCtx } from '@/lib/accreditation'

export const ST_OPTIONS = ['Belum mulai', 'Draf', 'Review', 'Final']
export const ST_LKPT_OPTIONS = ['Belum mulai', 'Pengisian', 'Verifikasi', 'Lengkap', 'Tidak berlaku']
export const KERANGKA_DEFAULT = [
  '1. Kondisi saat ini (TS): …',
  '2. Capaian terhadap deskriptor Unggul (sertakan angka/persentase dan tahunnya): …',
  '3. Tren 3 tahun terakhir: …',
  '4. Akar masalah / faktor pendukung dan penghambat: …',
  '5. Tindak lanjut yang sudah dijalankan dan hasilnya: …',
  '6. Rencana pengembangan (target dan waktu): …',
].join('\n')

export const isUrl = (u?: string) => /^https?:\/\/\S+$/i.test(u || '')

export const cleanLinks = (l?: { nama: string; url: string }[]) =>
  (l || []).map(x => ({ nama: (x.nama || '').trim(), url: (x.url || '').trim() })).filter(x => x.nama || x.url)

export function statusTone(s?: string): 'ok' | 'bad' | 'na' | '' {
  switch (s) {
    case 'Final':
    case 'Lengkap':
    case 'Selesai':
      return 'ok'
    case 'Tidak berlaku':
      return 'bad'
    default:
      return 'na'
  }
}

export function StatusPill({ s, glass }: { s?: string; glass?: boolean }) {
  return (
    <span className={`pill ${statusTone(s)}${glass ? ' glass' : ''}`}>{s || 'Belum mulai'}</span>
  )
}

/** Label field — dipakai di dalam wrapper .field atau .ask/.fill */
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span>{children}</span>
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <small>{children}</small>
}

/**
 * Perisai larangan: overlay transparan di atas area isian milik akun lain.
 * Isian TETAP TERLIHAT, tetapi setiap klik memunculkan popup larangan.
 */
export function Shield({ ctx }: { ctx: DenyCtx }) {
  const { showDenied } = useStore()
  return (
    <div
      className="shield"
      title="Terkunci untuk akun ini"
      aria-hidden="true"
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        showDenied(ctx)
      }}
    />
  )
}

/** Bar simpan gaya asli: tombol pri + pesan status + info penyimpan terakhir. */
export function SaveBar({
  path,
  dirty,
  onDirtyChange,
  onSave,
  storedAt,
  storedBy,
  canEdit,
}: {
  path: string
  dirty: boolean
  onDirtyChange: (d: boolean) => void
  onSave: () => Promise<boolean>
  storedAt?: string
  storedBy?: string
  canEdit: boolean
}) {
  const { saving, showToast } = useStore()
  const busy = saving === path
  const fmt = (iso?: string) => {
    if (!iso) return 'Belum pernah disimpan'
    const d = new Date(iso)
    if (isNaN(+d)) return 'Belum pernah disimpan'
    return `Terakhir disimpan${storedBy ? ' oleh ' + storedBy : ''} · ${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  const doSave = async () => {
    const ok = await onSave()
    if (ok) {
      onDirtyChange(false)
      showToast('Tersimpan ke database ✓')
    }
  }
  return (
    <div className="savebar">
      {canEdit ? (
        <button type="button" className="btn pri" onClick={doSave} disabled={busy || !dirty} style={!dirty ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {busy ? 'Menyimpan…' : 'Simpan ke database'}
        </button>
      ) : (
        <span className="pill lock">Hanya lihat · terkunci untuk akun ini</span>
      )}
      <span className="msg" data-s={dirty ? 'dirty' : undefined}>
        {dirty ? 'Ada perubahan belum disimpan' : ''}
      </span>
      <span className="who">{fmt(storedAt)}</span>
    </div>
  )
}

/** Editor daftar link bukti gaya asli (nama + URL + tombol hapus ikon) + chip saran. */
export function LinkEditor({
  links,
  setLinks,
  disabled,
  saran = [],
}: {
  links: { nama: string; url: string }[]
  setLinks: (l: { nama: string; url: string }[]) => void
  disabled: boolean
  saran?: string[]
}) {
  const have = new Set(links.map(l => (l.nama || '').trim()))
  const patch = (i: number, p: Partial<{ nama: string; url: string }>) => setLinks(links.map((x, ix) => (ix === i ? { ...x, ...p } : x)))
  return (
    <div className="links">
      {links.map((l, i) => (
        <div key={i} className="lnk">
          <input
            type="text"
            placeholder="Nama dokumen"
            aria-label="Nama dokumen bukti"
            value={l.nama}
            disabled={disabled}
            onChange={e => patch(i, { nama: e.target.value })}
          />
          <input
            type="url"
            placeholder="https://drive.google.com/…"
            aria-label="Link bukti"
            value={l.url}
            disabled={disabled}
            onChange={e => patch(i, { url: e.target.value.trim() })}
          />
          {isUrl(l.url) ? (
            <a className="openlink" style={{ width: 32, textAlign: 'center' }} href={l.url} target="_blank" rel="noopener noreferrer" title="Buka link">
              ↗
            </a>
          ) : (
            <button type="button" className="icon" aria-label="Hapus link" disabled={disabled} onClick={() => setLinks(links.filter((_, ix) => ix !== i))}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button type="button" className="btn ghost" onClick={() => setLinks([...links, { nama: '', url: '' }])}>
          <Plus className="h-3.5 w-3.5" /> Tambah link bukti
        </button>
      )}
      {saran.length > 0 && !disabled && (
        <div className="chips">
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Saran bukti:</span>
          {saran.map(nm => (
            <button key={nm} type="button" className="chip" disabled={have.has(nm)} onClick={() => setLinks([...links, { nama: nm, url: '' }])}>
              + {nm}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
