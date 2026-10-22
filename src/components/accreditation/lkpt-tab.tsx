'use client'

/**
 * Tab Tabel LKPT — accordion gaya asli (.acc): ringkas dengan mini-meter,
 * fbody ask (kolom diminta + ketentuan) + fill, savebar. LKPT kolaboratif:
 * seluruh akun tim dapat mengisi.
 */
import React, { useMemo, useState } from 'react'
import { useStore } from './store'
import { LKPT } from '@/lib/accreditation'
import type { LkptData } from './store'
import { FieldHint, FieldLabel, LinkEditor, SaveBar, StatusPill, ST_LKPT_OPTIONS, cleanLinks } from './ui-bits'

export function LkptTab() {
  const { data } = useStore()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(LKPT[0][0])

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    if (!qq) return LKPT
    return LKPT.filter(([id, tab, jud, , src, kolom]) => `${id} ${tab} ${jud} ${src} ${kolom}`.toLowerCase().includes(qq))
  }, [q])

  const lengkap = LKPT.filter(([id]) => data.lkpt[id]?.status === 'Lengkap').length

  return (
    <section role="tabpanel" style={{ gap: 12 }}>
      <div className="dcard" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Cari tabel (kode, judul, sumber)…"
          aria-label="Cari tabel LKPT"
          style={{ flex: '1 1 220px' }}
        />
        <span className="pill na">
          {lengkap}/{LKPT.length} Lengkap
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(([id, tab, jud, ind, src, kolom, cat]) => (
          <LkptRow key={id} id={id} tab={tab} jud={jud} ind={ind} src={src} kolom={kolom} cat={cat} open={open === id} onToggle={() => setOpen(o => (o === id ? null : id))} />
        ))}
        {filtered.length === 0 && <div className="empty">Tidak ada tabel yang cocok dengan pencarian.</div>}
      </div>
    </section>
  )
}

function LkptRow({ id, tab, jud, ind, src, kolom, cat, open, onToggle }: { id: string; tab: string; jud: string; ind: string; src: string; kolom: string; cat: string; open: boolean; onToggle: () => void }) {
  const { data, save, canWrite } = useStore()
  const stored = data.lkpt[id] || {}
  const rw = canWrite('lkpt', id)
  const [d, setD] = useState<LkptData>({
    status: stored.status || 'Belum mulai',
    terisi: (stored.terisi ?? '') as number | '',
    file_url: stored.file_url || '',
    catatan: stored.catatan || '',
    bukti: cleanLinks(stored.bukti),
  })
  const [dirty, setDirty] = useState(false)
  const mut = (p: Partial<LkptData>) => {
    if (!rw) return
    setD(prev => ({ ...prev, ...p }))
    setDirty(true)
  }

  const doSave = async () =>
    save('lkpt', id, {
      ...d,
      terisi: d.terisi === '' ? '' : Math.max(0, Math.min(100, Number(d.terisi))),
      bukti: cleanLinks(d.bukti),
    })

  const pct = Number(d.terisi ?? 0) || 0

  return (
    <details className="acc" open={open} onToggle={e => { const t = e.currentTarget.open; if (t !== open) onToggle() }}>
      <summary>
        <span className="t">{id} · {tab}</span>
        <span className="n">
          {jud}
          <small>
            Indikator {ind} · {src}
          </small>
        </span>
        <span className="mini" aria-hidden="true">
          <i style={{ width: `${pct}%` }} />
        </span>
        <StatusPill s={d.status} />
      </summary>
      <div className="fbody">
        <div className="ask">
          <div>
            <span className="lbl">Kolom yang diminta</span>
            <p>{kolom}</p>
          </div>
          <div>
            <span className="lbl">Ketentuan</span>
            <p>{cat}</p>
          </div>
          <div className="row2">
            <div>
              <span className="lbl">Sumber</span>
              <p style={{ fontSize: 13 }}>{src}</p>
            </div>
            <div>
              <span className="lbl">Lokasi di LKPT</span>
              <p className="mono" style={{ fontSize: 13 }}>{tab}</p>
            </div>
          </div>
        </div>
        <div className="fill">
          <div className="row2" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <label className="field">
              <FieldLabel>Status</FieldLabel>
              <select value={d.status} onChange={e => mut({ status: e.target.value })} disabled={!rw} aria-label="Status tabel">
                {ST_LKPT_OPTIONS.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <FieldLabel>Keterisian (%)</FieldLabel>
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={d.terisi}
                disabled={!rw}
                onChange={e => mut({ terisi: e.target.value === '' ? '' : Math.max(0, Math.min(100, +e.target.value)) })}
              />
            </label>
          </div>
          <label className="field">
            <FieldLabel>Link file tabel terisi (Excel/PD Dikti)</FieldLabel>
            <input type="url" value={d.file_url} disabled={!rw} placeholder="https://…" onChange={e => mut({ file_url: e.target.value.trim() })} />
          </label>
          <label className="field">
            <FieldLabel>Catatan</FieldLabel>
            <FieldHint>Mis. tanggal tarik data, sumber yang masih menunggu, atau catatan verifikasi.</FieldHint>
            <textarea value={d.catatan} disabled={!rw} onChange={e => mut({ catatan: e.target.value })} rows={2} />
          </label>
          <div className="field">
            <FieldLabel>Link bukti pendukung</FieldLabel>
            <LinkEditor links={d.bukti} disabled={!rw} setLinks={l => mut({ bukti: l })} />
          </div>
        </div>
      </div>
      <SaveBar path={`lkpt/${id}`} dirty={dirty} onDirtyChange={setDirty} onSave={doSave} storedAt={stored.diubah_pada} storedBy={stored.diubah_oleh} canEdit={rw} />
    </details>
  )
}
