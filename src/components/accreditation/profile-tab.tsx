'use client'

/** Tab Profil PT: identitas perguruan tinggi + daftar prodi + tim penyusun. */
import React, { useState } from 'react'
import { useStore } from './store'
import { IDN } from '@/lib/accreditation'
import type { IdentitasData, ProdiRow, TimData, AnggotaTim } from './store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Users2, Building2, X } from 'lucide-react'
import { FieldHint, FieldLabel, SaveBar } from './ui-bits'

const emptyIdentitas = (): IdentitasData => ({ sk_url: '', prodi: [] })
const emptyTim = (): TimData => ({ anggota: [], sk_tim_url: '' })

export function ProfileTab() {
  const { data, user } = useStore()
  const rw = user?.role === 'admin'
  return (
    <div className="space-y-6">
      <IdentitasCard rw={rw} stored={data.profil.identitas} />
      <TimCard rw={rw} stored={data.profil.tim} />
    </div>
  )
}

function IdentitasCard({ rw, stored }: { rw: boolean; stored?: Partial<IdentitasData> & { diubah_pada?: string; diubah_oleh?: string } }) {
  const { save } = useStore()
  const [d, setD] = useState<IdentitasData>(() => {
    const base = emptyIdentitas()
    for (const [k] of IDN) base[k] = (stored?.[k] as string) || ''
    base.sk_url = stored?.sk_url || ''
    base.prodi = (stored?.prodi || []).map((p: ProdiRow) => ({ ...p }))
    return base
  })
  const [dirty, setDirty] = useState(false)
  const mut = (p: Partial<IdentitasData>) => { setD(prev => ({ ...prev, ...p })); setDirty(true) }

  const setProdi = (list: ProdiRow[]) => mut({ prodi: list })

  const doSave = async () => {
    const body: Record<string, unknown> = { sk_url: d.sk_url.trim(), prodi: d.prodi.filter(p => Object.values(p).some(v => v)) }
    for (const [k] of IDN) body[k] = String(d[k] ?? '').trim()
    return await save('profil', 'identitas', body)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="p-5 lg:p-6 border-b border-slate-100">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Building2 className="h-5 w-5 text-[#16307d]" />Identitas perguruan tinggi</h2>
        <p className="text-xs text-slate-500 mt-1">LED &amp; LKPT · halaman identitas · hanya admin yang dapat mengubah</p>
      </div>
      <div className="p-5 lg:p-6 space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {IDN.map(([k, label]) => (
            <div key={k} className="space-y-1">
              <FieldLabel>{label}</FieldLabel>
              <Input value={String(d[k] ?? '')} disabled={!rw} onChange={e => mut({ [k]: e.target.value } as Partial<IdentitasData>)} />
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <FieldLabel>Link salinan SK pendirian dan SK akreditasi prodi</FieldLabel>
          <Input type="url" value={d.sk_url} disabled={!rw} placeholder="https://…" onChange={e => mut({ sk_url: e.target.value.trim() })} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Daftar program studi, status akreditasi dan peringkat</FieldLabel>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-[12.5px] min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-500">
                  {['Program', 'Program studi', 'Status & peringkat', 'Nomor & tanggal SK', 'Kedaluwarsa', ''].map(t => (
                    <th key={t} className="px-3 py-2 font-medium whitespace-nowrap">{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.prodi.map((p, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {(['jenjang', 'prodi', 'status', 'sk'] as const).map(f => (
                      <td key={f} className="px-2 py-1.5">
                        <Input value={p[f]} disabled={!rw} aria-label={f} className="h-8 text-[12.5px]" onChange={e => { const list = d.prodi.map(x => ({ ...x })); list[i][f] = e.target.value; setProdi(list) }} />
                      </td>
                    ))}
                    <td className="px-2 py-1.5">
                      <Input type="date" value={p.kadaluarsa} disabled={!rw} aria-label="Kedaluwarsa" className="h-8 text-[12.5px]" onChange={e => { const list = d.prodi.map(x => ({ ...x })); list[i].kadaluarsa = e.target.value; setProdi(list) }} />
                    </td>
                    <td className="px-2 py-1.5">
                      {rw && (
                        <Button type="button" variant="ghost" size="icon" aria-label="Hapus baris" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => setProdi(d.prodi.filter((_, ix) => ix !== i))}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {d.prodi.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-slate-400 text-[12.5px]">Belum ada program studi.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {rw && (
            <Button type="button" variant="outline" size="sm" className="gap-1 mt-1" onClick={() => setProdi([...d.prodi, { jenjang: '', prodi: '', status: '', sk: '', kadaluarsa: '' }])}>
              <Plus className="h-3.5 w-3.5" /> Tambah program studi
            </Button>
          )}
        </div>
      </div>
      <SaveBar path="profil/identitas" dirty={dirty} onDirtyChange={setDirty} onSave={doSave} storedAt={stored?.diubah_pada} storedBy={stored?.diubah_oleh} canEdit={rw} />
    </section>
  )
}

function TimCard({ rw, stored }: { rw: boolean; stored?: Partial<TimData> & { diubah_pada?: string; diubah_oleh?: string } }) {
  const { save } = useStore()
  const [d, setD] = useState<TimData>(() => ({
    anggota: (stored?.anggota || []).map((a: AnggotaTim) => ({ ...a })),
    sk_tim_url: stored?.sk_tim_url || '',
  }))
  const [dirty, setDirty] = useState(false)
  const mut = (p: Partial<TimData>) => { setD(prev => ({ ...prev, ...p })); setDirty(true) }

  const doSave = async () => {
    return await save('profil', 'tim', {
      anggota: d.anggota.filter(a => Object.values(a).some(v => v)),
      sk_tim_url: d.sk_tim_url.trim(),
    })
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="p-5 lg:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Users2 className="h-5 w-5 text-[#16307d]" />Tim penyusun LED &amp; LKPT</h2>
          <p className="text-xs text-slate-500 mt-1">Nama, NIDN, jabatan, peran, dan tanggal SK tim</p>
        </div>
        {d.anggota.length > 0 && <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 text-[11.5px]">{d.anggota.length} anggota</Badge>}
      </div>
      <div className="p-5 lg:p-6 space-y-3">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-[12.5px] min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500">
                {['Nama', 'NIDN', 'Jabatan', 'Peran dalam tim', 'Tgl SK', ''].map(t => (
                  <th key={t} className="px-3 py-2 font-medium whitespace-nowrap">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.anggota.map((a, i) => (
                <tr key={i} className="border-t border-slate-100">
                  {(['nama', 'nidn', 'jabatan', 'peran'] as const).map(f => (
                    <td key={f} className="px-2 py-1.5">
                      <Input value={a[f]} disabled={!rw} aria-label={f} className="h-8 text-[12.5px]" onChange={e => { const list = d.anggota.map(x => ({ ...x })); list[i][f] = e.target.value; mut({ anggota: list }) }} />
                    </td>
                  ))}
                  <td className="px-2 py-1.5">
                    <Input type="date" value={a.tanggal} disabled={!rw} aria-label="Tanggal" className="h-8 text-[12.5px]" onChange={e => { const list = d.anggota.map(x => ({ ...x })); list[i].tanggal = e.target.value; mut({ anggota: list }) }} />
                  </td>
                  <td className="px-2 py-1.5">
                    {rw && (
                      <Button type="button" variant="ghost" size="icon" aria-label="Hapus anggota" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => mut({ anggota: d.anggota.filter((_, ix) => ix !== i) })}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {d.anggota.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-slate-400 text-[12.5px]">Belum ada anggota tim.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {rw && (
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => mut({ anggota: [...d.anggota, { nama: '', nidn: '', jabatan: '', peran: '', tanggal: '' }] })}>
              <Plus className="h-3.5 w-3.5" /> Tambah anggota
            </Button>
          )}
          <div className="space-y-1 flex-1 min-w-56 max-w-md">
            <FieldLabel>Link SK tim penyusun</FieldLabel>
            <FieldHint>Dokumen SK formal yang menunjuk tim penyusun LED &amp; LKPT.</FieldHint>
            <Input type="url" value={d.sk_tim_url} disabled={!rw} placeholder="https://…" onChange={e => mut({ sk_tim_url: e.target.value.trim() })} />
          </div>
        </div>
      </div>
      <SaveBar path="profil/tim" dirty={dirty} onDirtyChange={setDirty} onSave={doSave} storedAt={stored?.diubah_pada} storedBy={stored?.diubah_oleh} canEdit={rw} />
    </section>
  )
}
