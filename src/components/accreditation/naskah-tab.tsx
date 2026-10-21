'use client'

/** Tab Naskah LED: anggaran halaman (maks 300) + 14 bagian naskah dengan form. */
import React, { useState } from 'react'
import { useStore } from './store'
import { NASKAH, UNCOUNTED } from '@/lib/accreditation'
import type { NaskahData } from './store'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, ChevronDown, ScrollText } from 'lucide-react'
import { FieldLabel, SaveBar, StatusPill, ST_OPTIONS } from './ui-bits'

export function NaskahTab() {
  const { data } = useStore()
  const [open, setOpen] = useState<string | null>(NASKAH[0][0])

  const rows = NASKAH.map(([id, nm, bt]) => {
    const h = Number(data.naskah[id]?.halaman ?? 0) || 0
    return { id, nm, bt, h }
  })
  const counted = rows.filter(r => !UNCOUNTED.includes(r.id))
  const tot = counted.reduce((a, b) => a + b.h, 0)
  const over = tot > 300

  return (
    <div className="space-y-5">
      {/* Anggaran halaman */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <ScrollText className="h-4.5 w-4.5 h-5 w-5 text-[#16307d]" /> Anggaran halaman naskah LED
          </h2>
          <Badge variant="outline" className={`text-[11.5px] ${over ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-white text-slate-600 border-slate-200'}`}>
            {over && <AlertTriangle className="h-3 w-3 mr-1 inline" />}
            Terpakai {tot} dari maksimum 300 halaman{over ? ' · melebihi batas' : ''}
          </Badge>
        </div>
        <div className="space-y-2.5">
          {counted.map(r => {
            const mx = Math.max(20, ...counted.map(c => Math.max(c.h, c.bt || 0))) * 1.1
            const overSec = r.bt && r.h > r.bt
            return (
              <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[200px_minmax(0,1fr)_70px] items-center gap-x-3 gap-y-1">
                <span className="text-[12.5px] text-slate-700 truncate">{r.nm}</span>
                <span className="relative h-2.5 rounded-full bg-slate-100 overflow-hidden block">
                  <span className={`absolute inset-y-0 left-0 rounded-full ${overSec ? 'bg-rose-500' : 'bg-[#16307d]'}`} style={{ width: `${Math.min(100, (r.h / mx) * 100)}%` }} />
                  {r.bt && <span className="absolute inset-y-[-2px] w-0.5 bg-slate-500" style={{ left: `${Math.min(100, (r.bt / mx) * 100)}%` }} title={`Batas ${r.bt} halaman`} />}
                </span>
                <span className={`text-[11.5px] tabular-nums text-right ${overSec ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                  {r.h}{r.bt ? ` / ${r.bt}` : ''}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Daftar bagian */}
      <div className="space-y-2.5">
        {NASKAH.map(([id, nm, bt, ket]) => (
          <NaskahRow key={id} id={id} nm={nm} bt={bt} ket={ket} open={open === id} onToggle={() => setOpen(o => (o === id ? null : id))} />
        ))}
      </div>
    </div>
  )
}

function NaskahRow({ id, nm, bt, ket, open, onToggle }: { id: string; nm: string; bt: number | null; ket: string; open: boolean; onToggle: () => void }) {
  const { data, save, canWrite } = useStore()
  const stored = data.naskah[id] || {}
  const rw = canWrite('naskah', id)
  const [d, setD] = useState<NaskahData>({
    status: stored.status || 'Belum mulai',
    penulis: stored.penulis || '',
    halaman: (stored.halaman ?? '') as number | '',
    draf_url: stored.draf_url || '',
    catatan: stored.catatan || '',
  })
  const [dirty, setDirty] = useState(false)
  const mut = (p: Partial<NaskahData>) => { setD(prev => ({ ...prev, ...p })); setDirty(true) }

  const doSave = async () => {
    return await save('naskah', id, {
      ...d,
      penulis: d.penulis.trim(),
      halaman: d.halaman === '' ? null : Math.max(0, Number(d.halaman)),
      draf_url: d.draf_url.trim(),
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50/80 transition">
        <span className="font-mono text-[12px] font-bold text-[#16307d] bg-[#16307d]/5 border border-[#16307d]/15 rounded-md px-2 py-1 shrink-0">{id}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13.5px] font-semibold text-slate-800 truncate">{nm}</span>
          {bt && <span className="block text-[11px] text-slate-400">Batas {bt} halaman</span>}
        </span>
        <StatusPill s={d.status} />
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-slate-100">
          <div className="p-4 lg:p-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-4">
              <p className="text-[12px] font-semibold text-slate-700 mb-1">Yang diminta</p>
              <p className="text-[13px] leading-relaxed text-slate-600">{ket}</p>
              {bt && <p className="text-[11.5px] text-amber-700 mt-2">Bagian ini maksimal <b>{bt} halaman</b>{UNCOUNTED.includes(id) ? '' : ' dan dihitung dalam batas 300 halaman'}.</p>}
              {UNCOUNTED.includes(id) && <p className="text-[11.5px] text-slate-400 mt-2">Tidak dihitung dalam batas halaman.</p>}
            </div>
            <div className="space-y-3.5">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <FieldLabel>Status</FieldLabel>
                  <Select value={d.status} onValueChange={v => mut({ status: v })} disabled={!rw}>
                    <SelectTrigger className="bg-white" aria-label="Status bagian"><SelectValue /></SelectTrigger>
                    <SelectContent>{ST_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <FieldLabel>Penulis</FieldLabel>
                  <Input value={d.penulis} disabled={!rw} placeholder="mis. Tim K.1" onChange={e => mut({ penulis: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <FieldLabel>Jumlah halaman</FieldLabel>
                  <Input type="number" min={0} value={d.halaman} disabled={!rw} onChange={e => mut({ halaman: e.target.value === '' ? '' : Math.max(0, +e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1">
                <FieldLabel>Link draf</FieldLabel>
                <Input type="url" value={d.draf_url} disabled={!rw} placeholder="https://docs.google.com/…" onChange={e => mut({ draf_url: e.target.value.trim() })} />
              </div>
              <div className="space-y-1">
                <FieldLabel>Catatan</FieldLabel>
                <textarea
                  value={d.catatan}
                  disabled={!rw}
                  onChange={e => mut({ catatan: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16307d]/30 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>
          <SaveBar path={`naskah/${id}`} dirty={dirty} onDirtyChange={setDirty} onSave={doSave} storedAt={stored.diubah_pada} storedBy={stored.diubah_oleh} canEdit={rw} />
        </div>
      )}
    </div>
  )
}
