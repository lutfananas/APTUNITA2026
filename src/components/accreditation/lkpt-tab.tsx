'use client'

/**
 * Tab Tabel LKPT: 24 tabel dengan kolom yang diminta + form isian
 * (status, PIC, keterisian %, link file, catatan, link bukti).
 */
import React, { useMemo, useState } from 'react'
import { useStore } from './store'
import { LKPT } from '@/lib/accreditation'
import type { LkptData } from './store'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronDown, FileSpreadsheet, Search } from 'lucide-react'
import { FieldHint, FieldLabel, LinkEditor, SaveBar, StatusPill, ST_LKPT_OPTIONS, cleanLinks } from './ui-bits'

export function LkptTab() {
  const { data } = useStore()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(LKPT[0][0])

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    if (!qq) return LKPT
    return LKPT.filter(([id, tab, jud, , src, kolom]) =>
      `${id} ${tab} ${jud} ${src} ${kolom}`.toLowerCase().includes(qq),
    )
  }, [q])

  const lengkap = LKPT.filter(([id]) => data.lkpt[id]?.status === 'Lengkap').length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari tabel (kode, judul, sumber)…" aria-label="Cari tabel LKPT" className="pl-9 bg-white" />
        </div>
        <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 text-[11.5px]">
          {lengkap}/{LKPT.length} Lengkap
        </Badge>
      </div>

      <div className="space-y-2.5">
        {filtered.map(([id, tab, jud, ind, src, kolom, cat]) => (
          <LkptRow key={id} id={id} tab={tab} jud={jud} ind={ind} src={src} kolom={kolom} cat={cat} open={open === id} onToggle={() => setOpen(o => (o === id ? null : id))} />
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-8">Tidak ada tabel yang cocok dengan pencarian.</p>}
      </div>
    </div>
  )
}

function LkptRow({ id, tab, jud, ind, src, kolom, cat, open, onToggle }: { id: string; tab: string; jud: string; ind: string; src: string; kolom: string; cat: string; open: boolean; onToggle: () => void }) {
  const { data, save, canWrite } = useStore()
  const stored = data.lkpt[id] || {}
  const rw = canWrite('lkpt', id)
  const [d, setD] = useState<LkptData>({
    status: stored.status || 'Belum mulai',
    pic: stored.pic || '',
    terisi: (stored.terisi ?? '') as number | '',
    file_url: stored.file_url || '',
    catatan: stored.catatan || '',
    bukti: cleanLinks(stored.bukti),
  })
  const [dirty, setDirty] = useState(false)
  const mut = (p: Partial<LkptData>) => { setD(prev => ({ ...prev, ...p })); setDirty(true) }

  const doSave = async () => {
    const ok = await save('lkpt', id, {
      ...d,
      pic: d.pic.trim(),
      terisi: d.terisi === '' ? '' : Math.max(0, Math.min(100, Number(d.terisi))),
      bukti: cleanLinks(d.bukti),
    })
    return ok
  }

  const pct = Number(d.terisi ?? 0) || 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50/80 transition">
        <span className="font-mono text-[12px] font-bold text-[#16307d] bg-[#16307d]/5 border border-[#16307d]/15 rounded-md px-2 py-1 shrink-0">{id}</span>
        <span className="hidden sm:inline font-mono text-[10.5px] text-slate-400 shrink-0 w-20">{tab}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13.5px] font-semibold text-slate-800 truncate">{jud}</span>
          <span className="block text-[11px] text-slate-400 truncate">Indikator {ind} · {src}</span>
        </span>
        <span className="hidden md:flex items-center gap-2 shrink-0">
          {pct > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden inline-block">
                <span className="block h-full bg-[#16307d] rounded-full" style={{ width: `${pct}%` }} />
              </span>
              <span className="text-[10.5px] text-slate-500 w-8">{pct}%</span>
            </span>
          )}
          <StatusPill s={d.status} />
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-slate-100">
          <div className="p-4 lg:p-5 grid gap-5 lg:grid-cols-2">
            <div className="space-y-3 rounded-xl bg-slate-50/80 border border-slate-100 p-4 text-[13px] leading-relaxed text-slate-600">
              <div>
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 mb-1"><FileSpreadsheet className="h-3.5 w-3.5 text-[#16307d]" />Kolom yang diminta</p>
                <p>{kolom}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-slate-700 mb-1">Ketentuan</p>
                <p>{cat}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-slate-700 mb-1">Sumber</p>
                  <p>{src}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-slate-700 mb-1">Lokasi di LKPT</p>
                  <p className="font-mono text-[12px]">{tab}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3.5">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <FieldLabel>Status</FieldLabel>
                  <Select value={d.status} onValueChange={v => mut({ status: v })} disabled={!rw}>
                    <SelectTrigger className="bg-white" aria-label="Status tabel"><SelectValue /></SelectTrigger>
                    <SelectContent>{ST_LKPT_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <FieldLabel>PIC</FieldLabel>
                  <Input value={d.pic} disabled={!rw} onChange={e => mut({ pic: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <FieldLabel>Keterisian (%)</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={5}
                    value={d.terisi}
                    disabled={!rw}
                    onChange={e => mut({ terisi: e.target.value === '' ? '' : Math.max(0, Math.min(100, +e.target.value)) })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <FieldLabel>Link file tabel terisi (Excel/PD Dikti)</FieldLabel>
                <Input type="url" value={d.file_url} disabled={!rw} placeholder="https://…" onChange={e => mut({ file_url: e.target.value.trim() })} />
              </div>
              <div className="space-y-1">
                <FieldLabel>Catatan</FieldLabel>
                <FieldHint>Mis. tanggal tarik data, sumber yang masih menunggu, atau catatan verifikasi.</FieldHint>
                <textarea
                  value={d.catatan}
                  disabled={!rw}
                  onChange={e => mut({ catatan: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16307d]/30 disabled:bg-slate-50"
                />
              </div>
              <div className="space-y-1">
                <FieldLabel>Link bukti pendukung</FieldLabel>
                <LinkEditor links={d.bukti} disabled={!rw} setLinks={l => mut({ bukti: l })} />
              </div>
            </div>
          </div>
          <SaveBar path={`lkpt/${id}`} dirty={dirty} onDirtyChange={setDirty} onSave={doSave} storedAt={stored.diubah_pada} storedBy={stored.diubah_oleh} canEdit={rw} />
        </div>
      )}
    </div>
  )
}
