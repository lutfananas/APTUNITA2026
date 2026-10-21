'use client'

/** Tab Jadwal: tabel tahapan penyusunan + linimasa. Hanya admin dapat mengubah. */
import React, { useMemo, useState } from 'react'
import { useStore } from './store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarRange, Plus, Trash2 } from 'lucide-react'
import { SaveBar, statusTone } from './ui-bits'
import { JADWAL_STATUS } from '@/lib/accreditation'

const TONE_BG: Record<string, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  secondary: 'bg-slate-400',
  destructive: 'bg-rose-500',
  default: 'bg-[#16307d]',
}

export function ScheduleTab() {
  const { data, user, save, showToast, reload } = useStore()
  const rw = user?.role === 'admin'
  const [adding, setAdding] = useState(false)

  const rows = useMemo(
    () => Object.entries(data.jadwal).map(([id, j]) => ({ id, ...j })).sort((a, b) => (a.mulai || '9').localeCompare(b.mulai || '9')),
    [data.jadwal],
  )

  const addTahap = async () => {
    setAdding(true)
    try {
      const r = await fetch('/api/jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tahap: 'Tahap baru', mulai: '', selesai: '', status: 'Rencana' }),
      })
      const j = await r.json()
      if (j.ok) {
        showToast('Tahap ditambahkan — ubah lalu simpan')
        await reload()
      } else showToast(j.error || 'Gagal menambah')
    } finally {
      setAdding(false)
    }
  }

  const delTahap = async (id: string) => {
    const r = await fetch('/api/jadwal', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemKey: id }),
    })
    const j = await r.json()
    if (j.ok) {
      showToast('Tahap dihapus')
      await reload()
    } else showToast(j.error || 'Gagal menghapus')
  }

  // Linimasa
  const withDates = rows.filter(j => j.mulai && j.selesai)
  const min = withDates.length ? Math.min(...withDates.map(j => new Date(j.mulai + 'T00:00:00').getTime())) : 0
  const max = withDates.length ? Math.max(...withDates.map(j => new Date(j.selesai + 'T00:00:00').getTime())) : 0
  const span = max - min || 1
  const X = (t: number) => ((t - min) / span) * 100

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-slate-900"><CalendarRange className="h-5 w-5 text-[#16307d]" />Jadwal penyusunan</h2>
            <p className="text-xs text-slate-500 mt-1">Tahapan persiapan akreditasi — {rows.length} tahap {rw ? '' : '· hanya admin yang dapat mengubah'}</p>
          </div>
          {rw && (
            <Button size="sm" onClick={addTahap} disabled={adding} className="bg-[#16307d] hover:bg-[#0f2464] text-white gap-1">
              <Plus className="h-3.5 w-3.5" /> Tambah tahap
            </Button>
          )}
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500">
                <th className="px-4 py-2.5 font-medium min-w-64">Tahap</th>
                <th className="px-3 py-2.5 font-medium">Mulai</th>
                <th className="px-3 py-2.5 font-medium">Selesai</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(j => (
                <JadwalRow key={j.id} j={j} rw={rw} onDelete={() => delTahap(j.id)} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Belum ada tahap.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Linimasa */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900 mb-1">Linimasa</h3>
        <p className="text-xs text-slate-500 mb-4">Muncul untuk tahap yang sudah memiliki tanggal mulai dan selesai.</p>
        {withDates.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Belum ada tahap dengan tanggal lengkap.</p>
        ) : (
          <div className="space-y-2">
            {withDates.map(j => {
              const t1 = new Date(j.mulai + 'T00:00:00').getTime()
              const t2 = new Date(j.selesai + 'T00:00:00').getTime()
              const tone = statusTone(j.status)
              return (
                <div key={j.id} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[260px_minmax(0,1fr)_120px] items-center gap-x-3 gap-y-0.5">
                  <span className="text-[12px] text-slate-700 truncate" title={j.tahap}>{j.tahap}</span>
                  <span className="relative h-4 rounded-full bg-slate-100 overflow-hidden block">
                    <span
                      className={`absolute inset-y-0 rounded-full opacity-85 ${TONE_BG[tone]}`}
                      style={{ left: `${X(t1)}%`, width: `${Math.max(1.5, X(t2) - X(t1))}%` }}
                    />
                  </span>
                  <span className="text-[10.5px] text-slate-400 tabular-nums text-right whitespace-nowrap">
                    {j.mulai.slice(8, 10)}/{j.mulai.slice(5, 7)} – {j.selesai.slice(8, 10)}/{j.selesai.slice(5, 7)}/{j.selesai.slice(0, 4)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function JadwalRow({ j, rw, onDelete }: { j: { id: string; tahap: string; mulai: string; selesai: string; status: string; diubah_pada?: string; diubah_oleh?: string }; rw: boolean; onDelete: () => void }) {
  const { save } = useStore()
  const [d, setD] = useState({ tahap: j.tahap || '', mulai: j.mulai || '', selesai: j.selesai || '', status: j.status || 'Rencana' })
  const [dirty, setDirty] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const mut = (p: Partial<typeof d>) => { setD(prev => ({ ...prev, ...p })); setDirty(true) }

  const doSave = async () => {
    if (!d.tahap.trim()) return false
    if (d.mulai && d.selesai && d.selesai < d.mulai) return false
    return await save('jadwal', j.id, { tahap: d.tahap.trim(), mulai: d.mulai, selesai: d.selesai, status: d.status })
  }

  return (
    <tr className="border-t border-slate-100 align-middle">
      <td className="px-4 py-2">
        <Input value={d.tahap} disabled={!rw} aria-label="Tahap" placeholder="Nama tahap" className="h-8 text-[12.5px]" onChange={e => mut({ tahap: e.target.value })} />
      </td>
      <td className="px-3 py-2">
        <Input type="date" value={d.mulai} disabled={!rw} aria-label="Mulai" className="h-8 text-[12.5px]" onChange={e => mut({ mulai: e.target.value })} />
      </td>
      <td className="px-3 py-2">
        <Input type="date" value={d.selesai} disabled={!rw} aria-label="Selesai" className="h-8 text-[12.5px]" onChange={e => mut({ selesai: e.target.value })} />
      </td>
      <td className="px-3 py-2">
        <Select value={d.status} onValueChange={v => mut({ status: v })} disabled={!rw}>
          <SelectTrigger className="h-8 text-[12.5px] bg-white w-32" aria-label="Status tahap"><SelectValue /></SelectTrigger>
          <SelectContent>{JADWAL_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <SaveBar path={`jadwal/${j.id}`} dirty={dirty} onDirtyChange={setDirty} onSave={doSave} storedAt={j.diubah_pada} storedBy={j.diubah_oleh} canEdit={rw} compact />
          {rw && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`gap-1 shrink-0 ${confirm ? 'text-rose-600 font-semibold' : 'text-slate-400 hover:text-rose-600'}`}
              onClick={() => {
                if (!confirm) { setConfirm(true); setTimeout(() => setConfirm(false), 3000); return }
                onDelete()
              }}
              aria-label="Hapus tahap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {confirm ? 'Yakin?' : ''}
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}
