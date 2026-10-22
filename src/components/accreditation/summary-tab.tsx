'use client'

/**
 * Tab Ringkasan — replika desain asli:
 * tiles statistik + matriks kriteria × sasaran + kartu hologram SP + hbars + jadwal berikutnya.
 */
import React, { useMemo } from 'react'
import { useStore } from './store'
import { INS, KR, LKPT, krKode, krColor, KR_HEX } from '@/lib/accreditation'

const SASARAN = ['Masukan', 'Proses', 'Luaran', 'Dampak']
const krHex = (k: string) => KR_HEX[Math.max(0, krColor(k))] || 'var(--accent)'

export function SummaryTab({ onGo }: { onGo: (t: 'indikator' | 'lkpt' | 'naskah' | 'jadwal') => void }) {
  const { data } = useStore()

  const s = useMemo(() => {
    const simYa = INS.filter(i => data.isian[i.kode]?.sim_u === 'ya')
    const simTidak = INS.filter(i => data.isian[i.kode]?.sim_u === 'tidak')
    const simNa = INS.length - simYa.length - simTidak.length
    const skor = Math.round((simYa.length / INS.length) * 100)
    const final = INS.filter(i => data.isian[i.kode]?.status === 'Final')
    const bukti = INS.filter(i => (data.isian[i.kode]?.bukti || []).some(b => b.url))
    const lkLengkap = LKPT.filter(([id]) => data.lkpt[id]?.status === 'Lengkap')
    const lkTerisi = LKPT.map(([id]) => Number(data.lkpt[id]?.terisi ?? 0) || 0)
    const lkAvg = lkTerisi.length ? Math.round(lkTerisi.reduce((a, b) => a + b, 0) / LKPT.length) : 0
    const sp = INS.filter(i => i.sp_u)
    const spOk = sp.filter(i => data.isian[i.kode]?.sim_u === 'ya').length
    // stack per kriteria (final)
    const finalPerKr = KR.map(([nama]) => INS.filter(i => i.kriteria === nama && data.isian[i.kode]?.status === 'Final').length)
    // matrix kriteria × sasaran
    const mx = KR.map(([nama]) =>
      SASARAN.map(sa => {
        const items = INS.filter(i => i.kriteria === nama && i.sasaran === sa)
        const fin = items.filter(i => data.isian[i.kode]?.status === 'Final').length
        return { n: items.length, fin, pct: items.length ? Math.round((fin / items.length) * 100) : -1 }
      }),
    )
    // status narasi per kriteria
    const stKr = KR.map(([nama]) => {
      const items = INS.filter(i => i.kriteria === nama)
      const f = items.filter(i => data.isian[i.kode]?.status === 'Final').length
      const r = items.filter(i => data.isian[i.kode]?.status === 'Review').length
      const d = items.filter(i => data.isian[i.kode]?.status === 'Draf').length
      return { nama, total: items.length, f, r, d, b: items.length - f - r - d }
    })
    // jadwal berikutnya
    const jAll = Object.values(data.jadwal)
    const nextJ = jAll
      .filter(j => j.mulai && j.status !== 'Selesai')
      .sort((a, b) => a.mulai.localeCompare(b.mulai))[0]
    return { simYa, simTidak, simNa, skor, final: final.length, bukti: bukti.length, lkLengkap: lkLengkap.length, lkAvg, sp, spOk, finalPerKr, mx, stKr, nextJ }
  }, [data])

  const tileIcon = (d: string) => (
    <span className="ic" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d={d} />
      </svg>
    </span>
  )

  return (
    <section role="tabpanel">
      {/* ===== TILES ===== */}
      <div className="tiles">
        <div className="dcard tile" style={{ ['--tc' as string]: 'var(--gold)' }}>
          <div className="top">
            <div className="lbl">Simulasi skor Unggul · ambang 80%</div>
            {tileIcon('M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z')}
          </div>
          <div className="big">{s.skor}%</div>
          <div className="meter">
            <i className="grow" style={{ width: `${s.skor}%` }} />
            <b title="Ambang 80%" />
          </div>
          <div className="foot">
            {s.simYa.length} memenuhi · {s.simTidak.length} belum · {s.simNa} belum dinilai
          </div>
        </div>

        <div className="dcard tile" style={{ ['--tc' as string]: 'var(--k2)' }}>
          <div className="top">
            <div className="lbl">Narasi LED final</div>
            {tileIcon('M6 3h9l4 4v14H6z M9 12h7 M9 16h7 M9 8h3')}
          </div>
          <div className="big">
            {s.final}
            <small>/ {INS.length}</small>
          </div>
          <div className="stack">
            {s.finalPerKr.map((n, ix) => (
              <i key={ix} style={{ flex: Math.max(n, 0.001), background: KR_HEX[ix] }} title={`${KR[ix][1]}: ${n} final`} />
            ))}
          </div>
          <div className="foot">terbagi dari {KR.length} kriteria — klik tab Indikator LED untuk mengisi</div>
        </div>

        <div className="dcard tile" style={{ ['--tc' as string]: 'var(--k3)' }}>
          <div className="top">
            <div className="lbl">Butir dengan link bukti</div>
            {tileIcon('M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1')}
          </div>
          <div className="big">
            {s.bukti}
            <small>/ {INS.length}</small>
          </div>
          <div className="meter">
            <i className="grow" style={{ width: `${Math.round((s.bukti / INS.length) * 100)}%` }} />
          </div>
          <div className="foot">dokumen pendukung yang tercatat di database</div>
        </div>

        <div className="dcard tile" style={{ ['--tc' as string]: 'var(--k4)' }}>
          <div className="top">
            <div className="lbl">Tabel LKPT lengkap</div>
            {tileIcon('M3 4h18v16H3z M3 10h18 M9 4v16')}
          </div>
          <div className="big">
            {s.lkLengkap}
            <small>/ {LKPT.length}</small>
          </div>
          <div className="meter">
            <i className="grow" style={{ width: `${Math.round((s.lkLengkap / LKPT.length) * 100)}%` }} />
          </div>
          <div className="foot">rata-rata keterisian {s.lkAvg}% — kolaboratif seluruh tim</div>
        </div>
      </div>

      {/* ===== MATRIX + SP ===== */}
      <div className="g2">
        <div className="dcard">
          <h2>Peta kesiapan kriteria × sasaran mutu</h2>
          <p className="hint">Persentase sub-indikator yang narasinya berstatus final.</p>
          <div className="mx">
            <span className="h" />
            {SASARAN.map(sa => (
              <span key={sa} className="h">
                {sa}
              </span>
            ))}
            {s.mx.map((row, ix) => (
              <React.Fragment key={ix}>
                <div className="r" style={{ ['--kc' as string]: KR_HEX[ix] }}>
                  {KR[ix][0]}
                  <em>{KR[ix][1]}</em>
                </div>
                {row.map((c, jx) => (
                  <div
                    key={jx}
                    className={`c${c.pct < 0 ? ' none' : ''}`}
                    style={c.pct >= 0 ? { background: `color-mix(in srgb, ${KR_HEX[ix]} ${8 + c.pct * 0.72}%, var(--panel))` } : undefined}
                    title={c.pct >= 0 ? `${c.fin}/${c.n} final` : 'Tidak ada butir'}
                  >
                    <span className="p num">{c.pct < 0 ? '—' : `${c.pct}%`}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 11 }}>{c.pct < 0 ? '' : `${c.fin}/${c.n}`}</span>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="dcard">
          <h2>Syarat perlu Unggul</h2>
          <p className="hint">
            Butir-butir ini wajib terpenuhi semua. Satu saja gagal, status Unggul gugur berapa pun skor totalnya. Status
            diambil dari isian simulasi di tab Indikator LED.
          </p>
          <div className="spg">
            {s.sp.map((i, n) => {
              const v = data.isian[i.kode]?.sim_u
              return (
                <button
                  key={i.kode}
                  className="spc"
                  data-v={v === 'ya' ? 'ya' : v === 'tidak' ? 'tidak' : undefined}
                  style={{ ['--n' as string]: n }}
                  onClick={() => onGo('indikator')}
                  title={`Buka sub-indikator ${String(i.kode).padStart(2, '0')}`}
                >
                  <span className="sheen" aria-hidden="true" />
                  <span className="top">
                    <span className="code">{String(i.kode).padStart(2, '0')}</span>
                    <span className="k">
                      {krKode(i.kriteria)} {i.kriteria}
                    </span>
                  </span>
                  <span className="n">{i.nama}</span>
                  <span className="st">
                    <span className={`pill ${v === 'ya' ? 'ok' : v === 'tidak' ? 'bad' : ''}`}>{v === 'ya' ? 'Memenuhi' : v === 'tidak' ? 'Belum' : 'Belum dinilai'}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="legend">
            <span>
              <span className="sq" style={{ background: 'var(--ok)' }} /> memenuhi ({s.spOk}/{s.sp.length})
            </span>
            <span>
              <span className="sq" style={{ background: 'var(--bad)' }} /> belum
            </span>
          </div>
        </div>
      </div>

      {/* ===== HBARS ===== */}
      <div className="g2">
        <div className="dcard">
          <h2>Status narasi per kriteria</h2>
          <div className="hb">
            {s.stKr.map((k, ix) => (
              <div key={k.nama} className="i" style={{ ['--kc' as string]: KR_HEX[ix] }}>
                <div>
                  {krKode(k.nama)} {k.nama}
                  <em>
                    {k.f} final · {k.r} review · {k.d} draf
                  </em>
                </div>
                <div>
                  <div className="stack">
                    <i style={{ flex: Math.max(k.f, 0.001), background: 'var(--s3)' }} title={`Final ${k.f}`} />
                    <i style={{ flex: Math.max(k.r, 0.001), background: 'var(--s2)' }} title={`Review ${k.r}`} />
                    <i style={{ flex: Math.max(k.d, 0.001), background: 'var(--s1)' }} title={`Draf ${k.d}`} />
                    <i style={{ flex: Math.max(k.b, 0.001), background: 'var(--s0)' }} title={`Belum mulai ${k.b}`} />
                  </div>
                </div>
                <span className="v">
                  {k.f}/{k.total}
                </span>
              </div>
            ))}
          </div>
          <div className="legend">
            <span>
              <span className="sq" style={{ background: 'var(--s3)' }} /> Final
            </span>
            <span>
              <span className="sq" style={{ background: 'var(--s2)' }} /> Review
            </span>
            <span>
              <span className="sq" style={{ background: 'var(--s1)' }} /> Draf
            </span>
            <span>
              <span className="sq" style={{ background: 'var(--s0)' }} /> Belum mulai
            </span>
          </div>
        </div>
      </div>

      {/* ===== JADWAL BERIKUTNYA ===== */}
      <div className="dcard">
        <h2>Tahap jadwal berikutnya</h2>
        {s.nextJ ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <b>{s.nextJ.tahap}</b>
            <span className="mono" style={{ color: 'var(--muted)', fontSize: 12 }}>
              {s.nextJ.mulai} → {s.nextJ.selesai}
            </span>
            <span className={`pill ${s.nextJ.status === 'Berjalan' ? 'ok' : 'na'}`}>{s.nextJ.status}</span>
            <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => onGo('jadwal')}>
              Lihat jadwal lengkap
            </button>
          </div>
        ) : (
          <p className="hint">Belum ada tahap berjalan — lihat tab Jadwal.</p>
        )}
      </div>
    </section>
  )
}
