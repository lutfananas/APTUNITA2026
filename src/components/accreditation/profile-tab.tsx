'use client'

/**
 * Tab Identitas & tim — formcard gaya asli; hanya admin dapat mengubah.
 * Pengguna lain melihat isian dengan SHIELD larangan (popup saat diklik).
 */
import React, { useState } from 'react'
import { useStore } from './store'
import { IDN } from '@/lib/accreditation'
import type { IdentitasData, ProdiRow, TimData, AnggotaTim } from './store'
import { FieldHint, FieldLabel, SaveBar, Shield } from './ui-bits'
import { Plus, X } from 'lucide-react'

const emptyIdentitas = (): IdentitasData => ({ sk_url: '', prodi: [] })
const emptyTim = (): TimData => ({ anggota: [], sk_tim_url: '' })

const DENY_IDN = { kind: 'admin', nama: 'identitas perguruan tinggi dan tim penyusun' } as const

export function ProfileTab() {
  const { data, user } = useStore()
  const rw = user?.role === 'admin'
  return (
    <section role="tabpanel">
      <IdentitasCard rw={rw} stored={data.profil.identitas} />
      <TimCard rw={rw} stored={data.profil.tim} />
    </section>
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
  const mut = (p: Partial<IdentitasData>) => {
    if (!rw) return
    setD(prev => ({ ...prev, ...p }) as IdentitasData)
    setDirty(true)
  }
  const setProdi = (list: ProdiRow[]) => mut({ prodi: list })

  const doSave = async () => {
    const body: Record<string, unknown> = { sk_url: d.sk_url.trim(), prodi: d.prodi.filter(p => Object.values(p).some(v => v)) }
    for (const [k] of IDN) body[k] = String(d[k] ?? '').trim()
    return await save('profil', 'identitas', body)
  }

  return (
    <article className="formcard">
      <div className="fhead" style={{ ['--kc' as string]: 'var(--accent)' }}>
        <span className="code">Profil PT · LED &amp; LKPT · halaman identitas</span>
        <h2>Identitas perguruan tinggi</h2>
        <div className="tags">
          {!rw && <span className="pill lock">Hanya lihat · diisi oleh admin</span>}
        </div>
      </div>
      <div className="fill" style={{ gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {IDN.map(([k, label]) => (
            <label key={k} className="field">
              <FieldLabel>{label}</FieldLabel>
              <input type="text" value={String(d[k] ?? '')} disabled={!rw} onChange={e => mut({ [k]: e.target.value } as Partial<IdentitasData>)} />
            </label>
          ))}
        </div>
        <label className="field">
          <FieldLabel>Link salinan SK pendirian dan SK akreditasi prodi</FieldLabel>
          <input type="url" value={d.sk_url} disabled={!rw} placeholder="https://…" onChange={e => mut({ sk_url: e.target.value.trim() })} />
        </label>
        <div className="field">
          <FieldLabel>Daftar program studi, status akreditasi dan peringkat</FieldLabel>
          <div className="tw" style={{ border: '1px solid var(--line)', borderRadius: 10 }}>
            <table style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  {['Program', 'Program studi', 'Status & peringkat', 'Nomor & tanggal SK', 'Kedaluwarsa', ''].map(t => (
                    <th key={t}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.prodi.map((p, i) => (
                  <tr key={i}>
                    {(['jenjang', 'prodi', 'status', 'sk'] as const).map(f => (
                      <td key={f}>
                        <input
                          type="text"
                          value={p[f]}
                          disabled={!rw}
                          aria-label={f}
                          onChange={e => {
                            const list = d.prodi.map(x => ({ ...x }))
                            list[i][f] = e.target.value
                            setProdi(list)
                          }}
                        />
                      </td>
                    ))}
                    <td>
                      <input
                        type="date"
                        value={p.kadaluarsa}
                        disabled={!rw}
                        aria-label="Kedaluwarsa"
                        onChange={e => {
                          const list = d.prodi.map(x => ({ ...x }))
                          list[i].kadaluarsa = e.target.value
                          setProdi(list)
                        }}
                      />
                    </td>
                    <td>
                      {rw && (
                        <button type="button" className="icon" aria-label="Hapus baris" onClick={() => setProdi(d.prodi.filter((_, ix) => ix !== i))}>
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {d.prodi.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">Belum ada program studi.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {rw && (
            <button type="button" className="btn ghost" onClick={() => setProdi([...d.prodi, { jenjang: '', prodi: '', status: '', sk: '', kadaluarsa: '' }])}>
              <Plus className="h-3.5 w-3.5" /> Tambah program studi
            </button>
          )}
        </div>

        {!rw && <Shield ctx={DENY_IDN} />}
      </div>
      <div style={{ position: 'relative' }}>
        <SaveBar path="profil/identitas" dirty={dirty} onDirtyChange={setDirty} onSave={doSave} storedAt={stored?.diubah_pada} storedBy={stored?.diubah_oleh} canEdit={rw} />
        {!rw && <Shield ctx={DENY_IDN} />}
      </div>
    </article>
  )
}

function TimCard({ rw, stored }: { rw: boolean; stored?: Partial<TimData> & { diubah_pada?: string; diubah_oleh?: string } }) {
  const { save } = useStore()
  const [d, setD] = useState<TimData>(() => ({
    anggota: (stored?.anggota || []).map((a: AnggotaTim) => ({ ...a })),
    sk_tim_url: stored?.sk_tim_url || '',
  }))
  const [dirty, setDirty] = useState(false)
  const mut = (p: Partial<TimData>) => {
    if (!rw) return
    setD(prev => ({ ...prev, ...p }))
    setDirty(true)
  }

  const doSave = async () =>
    save('profil', 'tim', {
      anggota: d.anggota.filter(a => Object.values(a).some(v => v)),
      sk_tim_url: d.sk_tim_url.trim(),
    })

  return (
    <article className="formcard">
      <div className="fhead" style={{ ['--kc' as string]: 'var(--accent)' }}>
        <span className="code">Profil PT · tim penyusun LED &amp; LKPT</span>
        <h2>Tim penyusun</h2>
        <div className="tags">
          <span className="pill na">{d.anggota.length} anggota</span>
          {!rw && <span className="pill lock">Hanya lihat · diisi oleh admin</span>}
        </div>
      </div>
      <div className="fill" style={{ gap: 14 }}>
        <div className="field">
          <FieldLabel>Nama, NIDN, jabatan, peran, dan tanggal SK tim</FieldLabel>
          <div className="tw" style={{ border: '1px solid var(--line)', borderRadius: 10 }}>
            <table style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  {['Nama', 'NIDN', 'Jabatan', 'Peran dalam tim', 'Tgl SK', ''].map(t => (
                    <th key={t}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.anggota.map((a, i) => (
                  <tr key={i}>
                    {(['nama', 'nidn', 'jabatan', 'peran'] as const).map(f => (
                      <td key={f}>
                        <input
                          type="text"
                          value={a[f]}
                          disabled={!rw}
                          aria-label={f}
                          onChange={e => {
                            const list = d.anggota.map(x => ({ ...x }))
                            list[i][f] = e.target.value
                            mut({ anggota: list })
                          }}
                        />
                      </td>
                    ))}
                    <td>
                      <input
                        type="date"
                        value={a.tanggal}
                        disabled={!rw}
                        aria-label="Tanggal"
                        onChange={e => {
                          const list = d.anggota.map(x => ({ ...x }))
                          list[i].tanggal = e.target.value
                          mut({ anggota: list })
                        }}
                      />
                    </td>
                    <td>
                      {rw && (
                        <button type="button" className="icon" aria-label="Hapus anggota" onClick={() => mut({ anggota: d.anggota.filter((_, ix) => ix !== i) })}>
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {d.anggota.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">Belum ada anggota tim.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {rw && (
            <button type="button" className="btn ghost" onClick={() => mut({ anggota: [...d.anggota, { nama: '', nidn: '', jabatan: '', peran: '', tanggal: '' }] })}>
              <Plus className="h-3.5 w-3.5" /> Tambah anggota
            </button>
          )}
        </div>
        <label className="field">
          <FieldLabel>Link SK tim penyusun</FieldLabel>
          <FieldHint>Dokumen SK formal yang menunjuk tim penyusun LED &amp; LKPT.</FieldHint>
          <input type="url" value={d.sk_tim_url} disabled={!rw} placeholder="https://…" onChange={e => mut({ sk_tim_url: e.target.value.trim() })} />
        </label>

        {!rw && <Shield ctx={DENY_IDN} />}
      </div>
      <div style={{ position: 'relative' }}>
        <SaveBar path="profil/tim" dirty={dirty} onDirtyChange={setDirty} onSave={doSave} storedAt={stored?.diubah_pada} storedBy={stored?.diubah_oleh} canEdit={rw} />
        {!rw && <Shield ctx={DENY_IDN} />}
      </div>
    </article>
  )
}
