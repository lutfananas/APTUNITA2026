'use client'

/** Komponen kecil yang dipakai lintas tab: SaveBar, LinkEditor, pill status, meter. */
import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, Plus, X } from 'lucide-react'
import { useStore } from './store'

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

export function statusTone(s?: string): 'default' | 'success' | 'warning' | 'destructive' | 'secondary' {
  switch (s) {
    case 'Final':
    case 'Lengkap':
    case 'Selesai':
      return 'success'
    case 'Review':
    case 'Berjalan':
    case 'Verifikasi':
    case 'Pengisian':
    case 'Draf':
      return 'warning'
    case 'Tidak berlaku':
      return 'destructive'
    default:
      return 'secondary'
  }
}

const TONE_CLASS: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  destructive: 'bg-rose-100 text-rose-800 border-rose-200',
  secondary: 'bg-slate-100 text-slate-600 border-slate-200',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
}

export function StatusPill({ s }: { s?: string }) {
  const tone = statusTone(s)
  return (
    <Badge variant="outline" className={`text-[11px] font-medium ${TONE_CLASS[tone]}`}>
      {s || 'Belum mulai'}
    </Badge>
  )
}

/** Bar simpan: tombol + status "Terakhir disimpan …" */
export function SaveBar({
  path,
  dirty,
  onDirtyChange,
  onSave,
  storedAt,
  storedBy,
  canEdit,
  compact,
}: {
  path: string
  dirty: boolean
  onDirtyChange: (d: boolean) => void
  onSave: () => Promise<boolean>
  storedAt?: string
  storedBy?: string
  canEdit: boolean
  compact?: boolean
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
    <div className="flex flex-wrap items-center gap-3 border-t bg-slate-50/70 px-4 py-3 rounded-b-xl">
      {canEdit ? (
        <Button onClick={doSave} disabled={busy || !dirty} size="sm" className="min-w-32 bg-[#16307d] hover:bg-[#0f2464] text-white">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : dirty ? <Check className="h-4 w-4" /> : <Check className="h-4 w-4 opacity-40" />}
          {busy ? 'Menyimpan…' : 'Simpan'}
        </Button>
      ) : (
        <Badge variant="outline" className="text-[11px] bg-slate-100 text-slate-500 border-slate-200">
          Hanya lihat
        </Badge>
      )}
      <span className={`text-xs ${dirty ? 'font-medium text-amber-700' : 'text-slate-500'}`}>
        {dirty ? 'Ada perubahan belum disimpan' : compact ? '' : fmt(storedAt)}
      </span>
    </div>
  )
}

/** Editor daftar link bukti (nama + URL) dengan chip saran. Pembaruan immutable. */
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
    <div className="space-y-2">
      <div className="space-y-2">
        {links.map((l, i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-2 items-stretch">
            <Input
              type="text"
              placeholder="Nama dokumen"
              aria-label="Nama dokumen bukti"
              value={l.nama}
              disabled={disabled}
              className="sm:w-64"
              onChange={e => patch(i, { nama: e.target.value })}
            />
            <Input
              type="url"
              placeholder="https://drive.google.com/…"
              aria-label="Link bukti"
              value={l.url}
              disabled={disabled}
              className="flex-1"
              onChange={e => patch(i, { url: e.target.value.trim() })}
            />
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Hapus link"
                className="text-slate-400 hover:text-rose-600"
                onClick={() => setLinks(links.filter((_, ix) => ix !== i))}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {isUrl(l.url) && (
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center text-xs text-[#16307d] underline underline-offset-2 px-2">
                Buka
              </a>
            )}
          </div>
        ))}
      </div>
      {!disabled && (
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setLinks([...links, { nama: '', url: '' }])}>
          <Plus className="h-3.5 w-3.5" /> Tambah link bukti
        </Button>
      )}
      {saran.length > 0 && !disabled && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-slate-500 mr-1">Tambah dari daftar bukti yang disarankan:</span>
          {saran.map(nm => (
            <button
              key={nm}
              type="button"
              disabled={have.has(nm)}
              className={`text-[11px] px-2 py-1 rounded-full border transition ${have.has(nm) ? 'opacity-40 border-slate-200 text-slate-400' : 'border-[#16307d]/30 text-[#16307d] hover:bg-[#16307d]/5'}`}
              onClick={() => setLinks([...links, { nama: nm, url: '' }])}
            >
              + {nm}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Label field kecil konsisten. */
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] font-medium text-slate-700">{children}</span>
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11.5px] leading-relaxed text-slate-500">{children}</p>
}

export { Input, Textarea }
