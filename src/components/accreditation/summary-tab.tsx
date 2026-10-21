'use client'

/** Tab Ringkasan: hero foto kampus + progres keseluruhan + rincian per kriteria. */
import React, { useMemo } from 'react'
import { useStore } from './store'
import { INS, KR, LKPT, NASKAH, UNCOUNTED } from '@/lib/accreditation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarRange, ClipboardList, ScrollText, Table2, TrendingUp } from 'lucide-react'

export function SummaryTab({ onGo }: { onGo: (t: 'indikator' | 'lkpt' | 'naskah' | 'jadwal') => void }) {
  const { data, user } = useStore()

  const stats = useMemo(() => {
    // LED: indikator dianggap "tergarap" bila status ≠ Belum mulai, "final" bila Final
    const perKr = KR.map(([nama]) => {
      const items = INS.filter(i => i.kriteria === nama)
      const garap = items.filter(i => (data.isian[i.kode]?.status || 'Belum mulai') !== 'Belum mulai').length
      const final = items.filter(i => data.isian[i.kode]?.status === 'Final').length
      return { nama, total: items.length, garap, final }
    })
    const ledGarap = perKr.reduce((a, b) => a + b.garap, 0)
    const ledFinal = perKr.reduce((a, b) => a + b.final, 0)
    // LKPT
    const lkTotal = LKPT.length
    const lkLengkap = LKPT.filter(([id]) => data.lkpt[id]?.status === 'Lengkap').length
    const lkTerisi = LKPT.map(([id]) => Number(data.lkpt[id]?.terisi ?? 0) || 0)
    const lkAvg = lkTerisi.length ? Math.round(lkTerisi.reduce((a, b) => a + b, 0) / lkTotal) : 0
    // Naskah halaman
    let hal = 0
    for (const [id] of NASKAH) if (!UNCOUNTED.includes(id)) hal += Number(data.naskah[id]?.halaman ?? 0) || 0
    // Jadwal
    const jAll = Object.values(data.jadwal)
    const jSelesai = jAll.filter(j => j.status === 'Selesai').length
    const jBerjalan = jAll.filter(j => j.status === 'Berjalan')
    // Simulasi Unggul
    const simYa = INS.filter(i => data.isian[i.kode]?.sim_u === 'ya').length
    const simTidak = INS.filter(i => data.isian[i.kode]?.sim_u === 'tidak').length
    return { perKr, ledGarap, ledFinal, lkTotal, lkLengkap, lkAvg, hal, jAll, jSelesai, jBerjalan, simYa, simTidak }
  }, [data])

  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0)
  const ledPct = pct(stats.ledGarap, INS.length)
  const nextJ = [...stats.jAll].filter(j => j.mulai && j.status !== 'Selesai').sort((a, b) => a.mulai.localeCompare(b.mulai))[0]

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl text-white" style={{ background: '#0a1638' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'url(/kampus-unita.jpg)', backgroundSize: 'cover', backgroundPosition: '72% 42%' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(6,14,40,.97) 0%,rgba(8,20,58,.92) 38%,rgba(10,26,72,.55) 68%,rgba(10,26,72,.15) 100%)' }} />
        <div className="relative z-10 p-6 lg:p-10 flex flex-col lg:flex-row items-start lg:items-center gap-8">
          {/* Ring progres */}
          <div className="relative h-36 w-36 shrink-0 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#fbbf24 ${ledPct * 3.6}deg,rgba(255,255,255,.12) 0deg)` }} role="img" aria-label={`Progres LED ${ledPct} persen`}>
            <div className="h-[116px] w-[116px] rounded-full flex flex-col items-center justify-center" style={{ background: '#0a1638' }}>
              <b className="text-3xl font-bold text-amber-300">{ledPct}%</b>
              <span className="text-[10px] uppercase tracking-widest text-white/60">LED tergarap</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] tracking-[.2em] uppercase text-amber-300/90 font-medium mb-2">IAPT 4.1 · PTS Akademik · {user?.role === 'admin' ? 'Akses penuh admin' : 'Peran ' + (user?.label || '')}</p>
            <h1 className="text-2xl lg:text-3xl font-bold leading-snug mb-2">Lembar Kerja Akreditasi APT UNITA 2026</h1>
            <p className="text-sm text-white/70 max-w-xl leading-relaxed">
              65 sub-indikator LED · 24 tabel LKPT · 14 bagian naskah · 18 tahap jadwal. Semua isian tim kini tersimpan
              di <b className="text-white">database terpusat yang aman</b> — setiap perubahan terekam nama penyimpannya.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className="bg-emerald-400/15 text-emerald-300 border border-emerald-300/30">Simulasi Unggul: {stats.simYa} memenuhi</Badge>
              {stats.simTidak > 0 && <Badge className="bg-rose-400/15 text-rose-300 border border-rose-300/30">{stats.simTidak} belum memenuhi</Badge>}
              {nextJ && <Badge className="bg-white/10 text-white/85 border border-white/20">Tahap berikutnya: {nextJ.tahap.slice(0, 44)}{nextJ.tahap.length > 44 ? '…' : ''}</Badge>}
            </div>
          </div>
        </div>
      </section>

      {/* Statistik cepat */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => onGo('indikator')} className="text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-[#16307d]/40 hover:shadow-sm transition group">
          <div className="flex items-center justify-between">
            <ClipboardList className="h-5 w-5 text-[#16307d]" />
            <span className="text-[11px] text-slate-400 group-hover:text-[#16307d]">buka →</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {stats.ledGarap}
            <span className="text-sm font-medium text-slate-400"> / {INS.length}</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Sub-indikator LED digarap · {stats.ledFinal} Final</p>
        </button>
        <button onClick={() => onGo('lkpt')} className="text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-[#16307d]/40 hover:shadow-sm transition group">
          <div className="flex items-center justify-between">
            <Table2 className="h-5 w-5 text-[#16307d]" />
            <span className="text-[11px] text-slate-400 group-hover:text-[#16307d]">buka →</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {stats.lkLengkap}
            <span className="text-sm font-medium text-slate-400"> / {stats.lkTotal}</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Tabel LKPT Lengkap · rata-rata terisi {stats.lkAvg}%</p>
        </button>
        <button onClick={() => onGo('naskah')} className="text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-[#16307d]/40 hover:shadow-sm transition group">
          <div className="flex items-center justify-between">
            <ScrollText className="h-5 w-5 text-[#16307d]" />
            <span className="text-[11px] text-slate-400 group-hover:text-[#16307d]">buka →</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {stats.hal}
            <span className="text-sm font-medium text-slate-400"> / 300</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Halaman naskah LED terpakai</p>
        </button>
        <button onClick={() => onGo('jadwal')} className="text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-[#16307d]/40 hover:shadow-sm transition group">
          <div className="flex items-center justify-between">
            <CalendarRange className="h-5 w-5 text-[#16307d]" />
            <span className="text-[11px] text-slate-400 group-hover:text-[#16307d]">buka →</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {stats.jSelesai}
            <span className="text-sm font-medium text-slate-400"> / {stats.jAll.length}</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Tahap jadwal selesai · {stats.jBerjalan.length} berjalan</p>
        </button>
      </section>

      {/* Per kriteria */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4.5 w-4.5 h-5 w-5 text-[#16307d]" />
          <h2 className="font-semibold text-slate-900">Progres per kriteria (K.1 – K.4)</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          {stats.perKr.map(k => {
            const p = pct(k.garap, k.total)
            return (
              <div key={k.nama}>
                <div className="flex items-center justify-between text-[13px] mb-1.5">
                  <span className="font-medium text-slate-700">{k.nama}</span>
                  <span className="text-slate-500">
                    {k.garap}/{k.total} digarap · <b className="text-emerald-700">{k.final} final</b>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#16307d]" style={{ width: `${p}%` }} />
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onGo('indikator')} className="bg-[#16307d] hover:bg-[#0f2464] text-white gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> Isi indikator LED
          </Button>
          <Button size="sm" variant="outline" onClick={() => onGo('lkpt')} className="gap-1.5">
            <Table2 className="h-3.5 w-3.5" /> Isi tabel LKPT
          </Button>
        </div>
      </section>
    </div>
  )
}
