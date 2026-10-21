'use client'

/**
 * Tab Indikator LED: 65 kartu sub-indikator + panel isian lengkap.
 * Form: status, PIC, simulasi Unggul, analisis/narasi, link bukti (+chip saran),
 * link draf narasi, catatan tim. Kelengkapan isian dihitung 6 butir.
 */
import React, { useMemo, useState } from 'react'
import { useStore } from './store'
import { INS, KR, ST } from '@/lib/accreditation'
import type { IsianData } from './store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ChevronDown, Lightbulb, Target, BookOpen, Database, FileSpreadsheet, ListChecks, Sparkles } from 'lucide-react'
import { FieldHint, FieldLabel, LinkEditor, SaveBar, StatusPill, ST_OPTIONS, KERANGKA_DEFAULT, cleanLinks, isUrl } from './ui-bits'

const krKode = (k: string) => (KR.find(x => x[0] === k) || [])[1] || ''
const krColor = (k: string) => KR.findIndex(x => x[0] === k)

export function IndicatorTab() {
  const { data, user } = useStore()
  const [q, setQ] = useState('')
  const [fKr, setFKr] = useState<string>('semua')
  const [fSt, setFSt] = useState<string>('semua')
  const [sel, setSel] = useState<string>(INS[0].kode)
  const [open, setOpen] = useState(false) // kartu terakhir diklik → buka detail di mobile

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return INS.filter(i => {
      if (fKr !== 'semua' && i.kriteria !== fKr) return false
      const st = data.isian[i.kode]?.status || 'Belum mulai'
      if (fSt !== 'semua' && st !== fSt) return false
      if (qq) {
        const hay = `${i.kode} ${i.nama} ${i.kriteria} ${data.isian[i.kode]?.pic || ''}`.toLowerCase()
        if (!hay.includes(qq)) return false
      }
      return true
    })
  }, [q, fKr, fSt, data.isian])

  const cur = INS.find(x => x.kode === sel) || INS[0]
  const shown = open || filtered.length === 0 || !filtered.some(x => x.kode === sel)

  return (
    <div className="grid lg:grid-cols-[380px_minmax(0,1fr)] gap-5 items-start">
      {/* ==== Kolom kiri: filter + kartu SP ==== */}
      <div className="space-y-3 lg:sticky lg:top-28">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari kode, nama, atau PIC…" aria-label="Cari indikator" className="pl-9 bg-white" />
        </div>
        <div className="flex gap-2">
          <Select value={fKr} onValueChange={setFKr}>
            <SelectTrigger className="bg-white text-[12.5px] flex-1" aria-label="Filter kriteria">
              <SelectValue placeholder="Kriteria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua kriteria</SelectItem>
              {KR.map(([nama, kode]) => (
                <SelectItem key={nama} value={nama}>
                  {kode} {nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fSt} onValueChange={setFSt}>
            <SelectTrigger className="bg-white text-[12.5px] flex-1" aria-label="Filter status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua status</SelectItem>
              {ST_OPTIONS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-[11px] text-slate-400 px-1">{filtered.length} dari {INS.length} indikator</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2.5 max-h-[62vh] overflow-y-auto pr-1 pb-2">
          {filtered.map(i => {
            const st = data.isian[i.kode]?.status || 'Belum mulai'
            const sim = data.isian[i.kode]?.sim_u
            const on = i.kode === sel
            const idx = krColor(i.kriteria)
            const dot = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#7c3aed'][Math.max(0, Math.min(5, idx))]
            return (
              <button
                key={i.kode}
                onClick={() => { setSel(i.kode); setOpen(true) }}
                className={`text-left rounded-xl p-3 border transition group relative overflow-hidden ${on ? 'border-[#16307d] bg-[#16307d] text-white shadow-md' : 'border-slate-200 bg-white hover:border-[#16307d]/40'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`font-mono font-bold text-xl leading-none ${on ? 'text-amber-300' : ''}`} style={on ? {} : { color: dot }}>
                    {String(i.kode).padStart(2, '0')}
                  </span>
                  {i.sp_u && <Badge className={`text-[9px] px-1.5 py-0 ${on ? 'bg-amber-400/20 text-amber-300 border-amber-300/40' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>SP</Badge>}
                </div>
                <p className={`mt-1.5 text-[12px] leading-snug line-clamp-2 font-medium ${on ? 'text-white' : 'text-slate-700'}`}>{i.nama}</p>
                <div className={`mt-2 flex items-center justify-between gap-1`}>
                  <span className={`text-[10px] truncate ${on ? 'text-white/60' : 'text-slate-400'}`}>{krKode(i.kriteria)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${on ? 'bg-white/10 border-white/20 text-white/85' : stToneCls(st)}`}>{st}</span>
                </div>
                {sim && (
                  <span title={sim === 'ya' ? 'Simulasi: memenuhi Unggul' : 'Simulasi: belum memenuhi'} className={`absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full ${sim === 'ya' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ==== Kolom kanan: detail + form ==== */}
      <div>
        <IndicatorDetail key={cur.kode} kode={cur.kode} expanded={shown} onToggle={() => setOpen(o => !o)} />
      </div>
    </div>
  )
}

function stToneCls(s: string) {
  switch (s) {
    case 'Final':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Review':
    case 'Draf':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    default:
      return 'bg-slate-50 text-slate-500 border-slate-200'
  }
}

function IndicatorDetail({ kode, expanded, onToggle }: { kode: string; expanded: boolean; onToggle: () => void }) {
  const { data, save, canWrite, user } = useStore()
  const i = INS.find(x => x.kode === kode)!
  const stored = data.isian[kode] || {}
  const rw = canWrite('isian', kode)
  const [d, setD] = useState<IsianData>({
    status: stored.status || 'Belum mulai',
    pic: stored.pic || '',
    sim_u: stored.sim_u || '',
    analisis: stored.analisis || '',
    narasi_url: stored.narasi_url || '',
    catatan: stored.catatan || '',
    bukti: cleanLinks(stored.bukti),
  })
  const [dirty, setDirty] = useState(false)
  const mut = (p: Partial<IsianData>) => { setD(prev => ({ ...prev, ...p })); setDirty(true) }

  const completeness = [
    d.status !== 'Belum mulai',
    !!d.pic.trim(),
    !!d.sim_u,
    d.analisis.trim().length >= 80,
    cleanLinks(d.bukti).some(l => isUrl(l.url)),
    isUrl(d.narasi_url),
  ]
  const done = completeness.filter(Boolean).length

  const doSave = async () => {
    const ok = await save('isian', kode, {
      ...d,
      pic: d.pic.trim(),
      sim_u: d.sim_u === 'x-belum' ? '' : d.sim_u,
      bukti: cleanLinks(d.bukti),
    })
    return ok
  }

  const krIdx = krColor(i.kriteria)
  const barColor = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#7c3aed'][Math.max(0, Math.min(5, krIdx))]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="p-5 lg:p-6 border-b border-slate-100">
        <button onClick={onToggle} className="lg:hidden w-full flex items-center justify-between text-left" aria-expanded={expanded}>
          <span className="text-xs font-medium text-slate-500">Detail & isian</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition ${expanded ? 'rotate-180' : ''}`} />
        </button>
        <div className="mt-2 lg:mt-0">
          <p className="text-[11px] tracking-wide text-slate-400 uppercase font-medium">
            {krKode(i.kriteria)} {i.kriteria} · Sasaran {i.sasaran} · Sub-indikator {i.kode}
          </p>
          <h2 className="text-xl font-bold text-slate-900 mt-1 leading-snug">{i.nama}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {i.sp_u && <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10.5px]"><Sparkles className="h-3 w-3 mr-1 inline" />Syarat perlu Unggul</Badge>}
            {!rw && <Badge variant="outline" className="text-[10.5px] bg-slate-50 text-slate-500 border-slate-200">Hanya lihat · diisi oleh {user?.role === 'admin' ? 'tim kriteria' : 'akun kriteria ' + i.kriteria}</Badge>}
            <StatusPill s={d.status} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 max-w-xs rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(done / 6) * 100}%`, background: barColor }} />
            </div>
            <span className="text-[11px] text-slate-500 whitespace-nowrap">Kelengkapan isian {done}/6</span>
          </div>
        </div>
      </div>

      {/* Body dua kolom */}
      <div className={`p-5 lg:p-6 grid gap-6 lg:grid-cols-2 ${expanded ? '' : 'hidden lg:grid'}`}>
        {/* Kiri: panduan */}
        <div className="space-y-4 rounded-xl bg-slate-50/80 border border-slate-100 p-4">
          <div>
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 mb-1.5"><ListChecks className="h-3.5 w-3.5 text-[#16307d]" />Yang harus dijawab di narasi</p>
            <ol className="list-decimal pl-5 space-y-1 text-[13px] leading-relaxed text-slate-600">
              {i.tanya.map((t, ix) => <li key={ix}>{t}</li>)}
            </ol>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 mb-1.5"><Target className="h-3.5 w-3.5 text-emerald-600" />Agar skor 1 (memenuhi Unggul)</p>
            <ul className="list-disc pl-5 space-y-1 text-[13px] leading-relaxed text-slate-600">
              {i.kunci.map((t, ix) => <li key={ix}>{t}</li>)}
            </ul>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 mb-1.5"><Lightbulb className="h-3.5 w-3.5 text-amber-500" />Deskriptor Unggul (Lampiran 3c)</p>
            <p className="text-[13px] leading-relaxed text-slate-600">{i.ambang_u}</p>
          </div>
          <details className="group">
            <summary className="cursor-pointer text-[12px] font-semibold text-[#16307d] select-none">Aspek penilaian lengkap</summary>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{i.aspek}</p>
          </details>
          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <div>
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 mb-1"><Database className="h-3.5 w-3.5 text-slate-400" />Sumber data</p>
              <p className="text-[12.5px] leading-relaxed text-slate-600">{i.sumber_data || '—'}</p>
            </div>
            {i.tabel_lkpt && (
              <div>
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 mb-1"><FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />Tabel LKPT terkait</p>
                <p className="text-[12.5px] text-slate-600">{i.tabel_lkpt}</p>
              </div>
            )}
          </div>
        </div>

        {/* Kanan: form isian */}
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <FieldLabel>Status narasi LED</FieldLabel>
              <Select value={d.status} onValueChange={v => mut({ status: v })} disabled={!rw}>
                <SelectTrigger aria-label="Status" className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>{ST.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <FieldLabel>PIC / unit penanggung jawab</FieldLabel>
              <Input value={d.pic} disabled={!rw} placeholder="mis. LPPM, Biro SDM" onChange={e => mut({ pic: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <FieldLabel>Simulasi penilaian Unggul</FieldLabel>
            <FieldHint>Nilai jujur berdasarkan bukti yang sudah ada, bukan rencana. Bandingkan dengan kotak &quot;Agar skor 1&quot;.</FieldHint>
            <Select value={d.sim_u || 'x-belum'} onValueChange={v => mut({ sim_u: v })} disabled={!rw}>
              <SelectTrigger aria-label="Simulasi Unggul" className="bg-white max-w-xs"><SelectValue placeholder="Belum dinilai" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="x-belum">Belum dinilai</SelectItem>
                <SelectItem value="ya">Memenuhi deskriptor Unggul (skor 1)</SelectItem>
                <SelectItem value="tidak">Belum memenuhi (skor 0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <FieldLabel>Poin analisis / narasi</FieldLabel>
            <FieldHint>
              Jawab setiap pertanyaan di kolom kiri. Asesor menilai bukti dan analisis, bukan klaim. Tulis dengan angka,
              tahun, dan nama dokumen; tunjukkan siklus evaluasi → tindak lanjut → hasil yang membaik. Hindari kalimat
              umum seperti &quot;sudah berjalan baik&quot;.
            </FieldHint>
            <textarea
              value={d.analisis}
              disabled={!rw}
              placeholder={i.kerangka || KERANGKA_DEFAULT}
              onChange={e => mut({ analisis: e.target.value })}
              rows={9}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#16307d]/30 disabled:bg-slate-50 disabled:text-slate-400"
            />
            {rw && (
              <Button type="button" variant="outline" size="sm" className="mt-1 gap-1.5" onClick={() => {
                const ker = i.kerangka || KERANGKA_DEFAULT
                mut({ analisis: d.analisis.trim() ? d.analisis.replace(/\s*$/, '') + '\n\n' + ker : ker })
              }}>
                <BookOpen className="h-3.5 w-3.5" /> Sisipkan kerangka jawaban butir {i.kode}
              </Button>
            )}
          </div>
          <div className="space-y-1">
            <FieldLabel>Link bukti</FieldLabel>
            <FieldHint>
              Satu dokumen satu baris, beri nama sesuai judul dokumen. Pakai tautan yang bisa dibuka asesor tanpa login
              (Google Drive &quot;siapa saja yang memiliki link&quot; atau laman resmi UNITA). Dokumen formal sebaiknya
              bertanda tangan/SK, bukan draf.
            </FieldHint>
            <LinkEditor links={d.bukti} saran={i.bukti_saran} disabled={!rw} setLinks={l => mut({ bukti: l })} />
          </div>
          <div className="space-y-1">
            <FieldLabel>Link draf narasi LED</FieldLabel>
            <FieldHint>Tautan ke draf tulisan lengkap untuk butir ini (Google Docs/Word daring). Narasi akhir ditulis per sub-indikator di Bab II sesuai kode kriterianya.</FieldHint>
            <Input type="url" value={d.narasi_url} disabled={!rw} placeholder="https://docs.google.com/…" onChange={e => mut({ narasi_url: e.target.value.trim() })} />
          </div>
          <div className="space-y-1">
            <FieldLabel>Catatan tim / tindak lanjut</FieldLabel>
            <FieldHint>Tulis kekurangan yang masih harus ditutup sebelum unggah: bukti yang belum ada, data yang belum cocok dengan PD Dikti, siapa yang mengerjakan, dan tenggatnya.</FieldHint>
            <textarea
              value={d.catatan}
              disabled={!rw}
              placeholder="mis. Laporan RTM 2024 belum ditandatangani — BAAK — 15 Des"
              onChange={e => mut({ catatan: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#16307d]/30 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
        </div>
      </div>

      <SaveBar
        path={`isian/${kode}`}
        dirty={dirty}
        onDirtyChange={setDirty}
        onSave={doSave}
        storedAt={stored.diubah_pada}
        storedBy={stored.diubah_oleh}
        canEdit={rw}
      />
    </div>
  )
}
