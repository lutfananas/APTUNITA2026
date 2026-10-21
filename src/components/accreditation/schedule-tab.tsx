'use client'

/**
 * Tab Jadwal — tabel tahapan (.tw) + linimasa gantt (.gt) gaya asli.
 * Hanya admin dapat mengubah; akun lain melihat dengan SHIELD larangan.
 */
import React, { useMemo, useState } from 'react'
import { useStore } from './store'
import { JADWAL_STATUS } from '@/lib/accreditation'
import { Shield } from './ui-bits'
import { Check, Loader2, Plus, Trash2 } from 'lucide-react'

const DENY_JADWAL = { kind: 'admin', nama: 'jadwal penyusunan' } as const

const BAR: Record<string, string> = {
  Selesai: 'var(--ok)',
  Berjalan: 'var(--warn)',
  Rencana: 'var(--s2)',
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

  // Gantt
  const withDates = rows.filter(j => j.mulai && j.selesai)
  const min = withDates.length ? Math.min(...withDates.map(j => new Date(j.mulai + 'T00:00:00').getTime())) : 0
  const max = withDates.length ? Math.max(...withDates.map(j => new Date(j.selesai + 'T00:00:00').getTime())) : 0
  const span = max - min || 1
  const X = (t: number) => ((t - min) / span) * 100
  const months = useMemo(() => {
    if (!withDates.length) return []
    const out: { label: string; x: number }[] = []
    const d = new Date(min)
    d.setDate(1)
    while (d.getTime() <= max) {
      const x = X(d.getTime())
      if (x >= 0 && x <= 100) out.push({ label: d.toLocaleDateString('id-ID', { month: 'short' }) + (d.getMonth() === 0 ? ' ' + String(d.getFullYear()).slice(2) : ''), x })
      d.setMonth(d.getMonth() + 1)
    }
    return out
  }, [min, max])

  const todayX = Date.now() >= min && Date.now() <= max ? X(Date.now()) : null

  return (
    <section role="tabpanel">
      <article className="formcard">
        <div className="fhead" style={{ ['--kc' as string]: 'var(--accent)' }}>
          <span className="code">Penyusunan akreditasi · {rows.length} tahap</span>
          <h2>Jadwal penyusunan</h2>
          <div className="tags">
            {!rw && <span className="pill lock">Hanya lihat · diisi oleh admin</span>}
          </div>
        </div>

        {/* Tabel tahapan */}
        <div className="tw">
          <table style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 260 }}>Tahap</th>
                <th>Mulai</th>
                <th>Selesai</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(j => (
                <JadwalRow key={j.id} j={j} rw={rw} onDelete={() => delTahap(j.id)} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">Belum ada tahap.{rw ? ' Klik "Tambah tahap".' : ''}</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {!rw && <Shield ctx={DENY_JADWAL} />}
        </div>

        <div className="savebar" style={{ position: 'static' }}>
          {rw ? (
            <button type="button" className="btn pri" onClick={addTahap} disabled={adding}>
              <Plus className="h-4 w-4" /> Tambah tahap
            </button>
          ) : (
            <span className="pill lock">Hanya admin dapat mengubah jadwal</span>
          )}
        </div>
      </article>

      {/* Linimasa */}
      <article className="dcard">
        <h3>Linimasa</h3>
        <p className="hint">Muncul untuk tahap yang sudah memiliki tanggal mulai dan selesai.</p>
        {withDates.length === 0 ? (
          <div className="empty">Belum ada tahap dengan tanggal lengkap.</div>
        ) : (
          <div className="gt">
            <div className="gr months-row" style={{ gridTemplateColumns: 'minmax(150px,260px) 1fr', borderTop: 'none' }}>
              <span />
              <div className="months">
                {months.map((m, i) => (
                  <span key={i} style={{ left: `${m.x}%` }}>
                    {m.label}
                  </span>
                ))}
                {months.map((m, i) => (
                  <i key={`g${i}`} className="grid" style={{ left: `${m.x}%` }} />
                ))}
              </div>
            </div>
            {withDates.map(j => {
              const t1 = new Date(j.mulai + 'T00:00:00').getTime()
              const t2 = new Date(j.selesai + 'T00:00:00').getTime()
              return (
                <div key={j.id} className="gr">
                  <div className="gl">
                    {j.tahap}
                    <em>
                      {j.mulai.slice(8, 10)}/{j.mulai.slice(5, 7)} – {j.selesai.slice(8, 10)}/{j.selesai.slice(5, 7)}/{j.selesai.slice(0, 4)}
                    </em>
                  </div>
                  <div className="tr">
                    <span
                      className="bx"
                      style={{ left: `${X(t1)}%`, width: `${Math.max(1.5, X(t2) - X(t1))}%`, background: BAR[j.status] || 'var(--s2)' }}
                      title={`${j.tahap} · ${j.status}`}
                    />
                  </div>
                </div>
              )
            })}
            {todayX !== null && (
              <div className="gr" style={{ borderTop: 'none' }}>
                <span />
                <div className="tr">
                  <span className="today" style={{ left: `${todayX}%` }} title="Hari ini" />
                </div>
              </div>
            )}
          </div>
        )}
      </article>
    </section>
  )
}

function JadwalRow({ j, rw, onDelete }: { j: { id: string; tahap: string; mulai: string; selesai: string; status: string; diubah_pada?: string; diubah_oleh?: string }; rw: boolean; onDelete: () => void }) {
  const { save } = useStore()
  const [d, setD] = useState({ tahap: j.tahap || '', mulai: j.mulai || '', selesai: j.selesai || '', status: j.status || 'Rencana' })
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const mut = (p: Partial<typeof d>) => {
    if (!rw) return
    setD(prev => ({ ...prev, ...p }))
    setDirty(true)
  }

  const doSave = async () => {
    if (!d.tahap.trim()) return false
    if (d.mulai && d.selesai && d.selesai < d.mulai) return false
    setBusy(true)
    const ok = await save('jadwal', j.id, { tahap: d.tahap.trim(), mulai: d.mulai, selesai: d.selesai, status: d.status })
    setBusy(false)
    if (ok) setDirty(false)
    return ok
  }

  return (
    <tr>
      <td>
        <input type="text" value={d.tahap} disabled={!rw} aria-label="Tahap" placeholder="Nama tahap" onChange={e => mut({ tahap: e.target.value })} />
      </td>
      <td>
        <input type="date" value={d.mulai} disabled={!rw} aria-label="Mulai" onChange={e => mut({ mulai: e.target.value })} />
      </td>
      <td>
        <input type="date" value={d.selesai} disabled={!rw} aria-label="Selesai" onChange={e => mut({ selesai: e.target.value })} />
      </td>
      <td>
        <select value={d.status} disabled={!rw} aria-label="Status tahap" onChange={e => mut({ status: e.target.value })} style={{ minWidth: 110 }}>
          {JADWAL_STATUS.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {rw ? (
            <>
              <button type="button" className="btn pri" style={{ padding: '5px 12px', fontSize: 12.5 }} onClick={doSave} disabled={busy || !dirty} title="Simpan tahap ini">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Simpan
              </button>
              {j.diubah_oleh && (
                <span style={{ fontSize: 11, color: 'var(--muted)' }} title={j.diubah_pada ? new Date(j.diubah_pada).toLocaleString('id-ID') : ''}>
                  oleh {j.diubah_oleh}
                </span>
              )}
            </>
          ) : (
            <span className="pill lock">terkunci</span>
          )}
          {rw && (
            <button
              type="button"
              className="btn danger"
              style={{ padding: '5px 10px', fontSize: 12 }}
              onClick={() => {
                if (!confirm) {
                  setConfirm(true)
                  setTimeout(() => setConfirm(false), 3000)
                  return
                }
                onDelete()
              }}
              aria-label="Hapus tahap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {confirm ? 'Yakin?' : ''}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
