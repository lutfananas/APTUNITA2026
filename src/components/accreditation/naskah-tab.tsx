'use client'

/**
 * Tab Naskah LED — anggaran halaman (hb) + accordion (.acc) per bagian
 * dengan SHIELD larangan: naskah tiap kriteria hanya diubah akun kriteria tsb.
 */
import React, { useState } from 'react'
import { useStore } from './store'
import { NASKAH, UNCOUNTED, NK_KR, krKode, krColor, KR_HEX } from '@/lib/accreditation'
import type { NaskahData } from './store'
import { FieldHint, FieldLabel, SaveBar, Shield, StatusPill, ST_OPTIONS } from './ui-bits'

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
  const mx = Math.max(20, ...counted.map(c => Math.max(c.h, c.bt || 0))) * 1.1

  return (
    <section role="tabpanel">
      {/* Anggaran halaman */}
      <div className="dcard">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <h2>Anggaran halaman naskah LED</h2>
          <span className={`pill ${over ? 'bad' : 'na'}`}>
            Terpakai {tot} dari maksimum 300 halaman{over ? ' · melebihi batas' : ''}
          </span>
        </div>
        <div className="hb">
          {counted.map(r => {
            const overSec = r.bt && r.h > r.bt
            const krNama = NK_KR[r.id] || ''
            const kr = krNama ? KR_HEX[Math.max(0, krColor(krNama))] : 'var(--accent)'
            return (
              <div key={r.id} className="i" style={{ ['--kc' as string]: kr }}>
                <div>
                  {r.nm}
                  <em>{krNama ? krKode(krNama) + ' · ' : ''}{r.bt ? `batas ${r.bt} hal` : ''}</em>
                </div>
                <div>
                  <div className="meter" style={{ height: 6 }}>
                    <i className="grow" style={{ width: `${Math.min(100, (r.h / mx) * 100)}%`, background: overSec ? 'var(--bad)' : 'var(--accent)' }} />
                    {r.bt ? <b style={{ left: `${Math.min(100, (r.bt / mx) * 100)}%` }} title={`Batas ${r.bt} halaman`} /> : null}
                  </div>
                </div>
                <span className="v" style={overSec ? { color: 'var(--bad)', fontWeight: 600 } : undefined}>
                  {r.h}
                  {r.bt ? `/${r.bt}` : ''}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daftar bagian */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {NASKAH.map(([id, nm, bt, ket]) => (
          <NaskahRow key={id} id={id} nm={nm} bt={bt} ket={ket} open={open === id} onToggle={() => setOpen(o => (o === id ? null : id))} />
        ))}
      </div>
    </section>
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
  const mut = (p: Partial<NaskahData>) => {
    if (!rw) return
    setD(prev => ({ ...prev, ...p }))
    setDirty(true)
  }

  const doSave = async () =>
    save('naskah', id, {
      ...d,
      penulis: d.penulis.trim(),
      halaman: d.halaman === '' ? null : Math.max(0, Number(d.halaman)),
      draf_url: d.draf_url.trim(),
    })

  const denyCtx = { kind: 'naskah', id, nama: nm } as const

  return (
    <details className="acc" open={open} onToggle={e => { const t = e.currentTarget.open; if (t !== open) onToggle() }}>
      <summary>
        <span className="t">{id}</span>
        <span className="n">
          {nm}
          {bt ? <small>Batas {bt} halaman{UNCOUNTED.includes(id) ? ' (di luar batas 300)' : ''}</small> : <small>Tidak dihitung dalam batas halaman</small>}
        </span>
        <span className="mini" aria-hidden="true" style={{ visibility: 'hidden' }}>
          <i />
        </span>
        <StatusPill s={d.status} />
      </summary>
      <div className="fbody">
        <div className="ask">
          <div>
            <span className="lbl">Yang diminta</span>
            <p>{ket}</p>
            {bt && (
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--warn)' }}>
                Bagian ini maksimal <b>{bt} halaman</b>
                {UNCOUNTED.includes(id) ? '' : ' dan dihitung dalam batas 300 halaman'}.
              </p>
            )}
          </div>
        </div>
        <div className="fill">
          <div className="row2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <label className="field">
              <FieldLabel>Status</FieldLabel>
              <select value={d.status} onChange={e => mut({ status: e.target.value })} disabled={!rw} aria-label="Status bagian">
                {ST_OPTIONS.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <FieldLabel>Penulis</FieldLabel>
              <input type="text" value={d.penulis} disabled={!rw} placeholder="mis. Tim K.1" onChange={e => mut({ penulis: e.target.value })} />
            </label>
            <label className="field">
              <FieldLabel>Jumlah halaman</FieldLabel>
              <input type="number" min={0} value={d.halaman} disabled={!rw} onChange={e => mut({ halaman: e.target.value === '' ? '' : Math.max(0, +e.target.value) })} />
            </label>
          </div>
          <label className="field">
            <FieldLabel>Link draf</FieldLabel>
            <FieldHint>Tautan dokumen draf (Google Docs/Word daring) yang bisa dibuka asesor.</FieldHint>
            <input type="url" value={d.draf_url} disabled={!rw} placeholder="https://docs.google.com/…" onChange={e => mut({ draf_url: e.target.value.trim() })} />
          </label>
          <label className="field">
            <FieldLabel>Catatan</FieldLabel>
            <textarea value={d.catatan} disabled={!rw} onChange={e => mut({ catatan: e.target.value })} rows={2} />
          </label>

          {/* PERISAI LARANGAN untuk naskah milik kriteria lain */}
          {!rw && <Shield ctx={denyCtx} />}
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <SaveBar path={`naskah/${id}`} dirty={dirty} onDirtyChange={setDirty} onSave={doSave} storedAt={stored.diubah_pada} storedBy={stored.diubah_oleh} canEdit={rw} />
        {!rw && <Shield ctx={denyCtx} />}
      </div>
    </details>
  )
}
