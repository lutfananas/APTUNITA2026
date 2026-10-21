'use client'

/**
 * Tab Indikator LED — direplikasi dari desain asli:
 * split (side daftar bergroup kriteria + formcard) dengan warna kriteria,
 * fhead/fbody/ask/fill/savebar, dan SHIELD larangan pada bagian milik akun lain.
 */
import React, { useMemo, useState } from 'react'
import { useStore } from './store'
import { INS, KR, ST, krKode, krColor, KR_HEX } from '@/lib/accreditation'
import type { IsianData } from './store'
import { FieldHint, FieldLabel, LinkEditor, SaveBar, Shield, StatusPill, ST_OPTIONS, KERANGKA_DEFAULT, cleanLinks, isUrl } from './ui-bits'

const krHex = (k: string) => KR_HEX[Math.max(0, krColor(k))] || 'var(--accent)'

export function IndicatorTab() {
  const { data, krFocus, clearKrFocus } = useStore()
  const [q, setQ] = useState('')
  const [fKr, setFKr] = useState<string>('semua')
  const [fSt, setFSt] = useState<string>('semua')
  const [sel, setSel] = useState<string>(INS[0].kode)

  // Permintaan fokus kriteria (dari tombol "Ke butir K.x saya" pada popup larangan)
  React.useEffect(() => {
    if (krFocus) {
      setQ('')
      setFKr(krFocus)
      setFSt('semua')
      const first = INS.find(i => i.kriteria === krFocus)
      if (first) setSel(first.kode)
      clearKrFocus()
    }
  }, [krFocus, clearKrFocus])

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

  // daftar tergroup per kriteria
  const groups = useMemo(() => {
    const g: { kr: string; items: typeof INS }[] = []
    for (const kr of KR.map(x => x[0])) {
      const items = filtered.filter(i => i.kriteria === kr)
      if (items.length) g.push({ kr, items })
    }
    return g
  }, [filtered])

  return (
    <div className="split">
      {/* ==== SIDE: filter + daftar ==== */}
      <aside className="side dcard" style={{ padding: 14 }}>
        <div className="filters">
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Cari kode / nama / PIC…" aria-label="Cari indikator" />
          <select value={fKr} onChange={e => setFKr(e.target.value)} aria-label="Filter kriteria">
            <option value="semua">Semua kriteria</option>
            {KR.map(([nama, kode]) => (
              <option key={nama} value={nama}>
                {kode} {nama}
              </option>
            ))}
          </select>
          <select value={fSt} onChange={e => setFSt(e.target.value)} aria-label="Filter status">
            <option value="semua">Semua status</option>
            {ST_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <p className="count">
          {filtered.length} dari {INS.length} indikator
        </p>
        <ul className="list">
          {groups.map(g => (
            <React.Fragment key={g.kr}>
              <li className="grp" style={{ gridTemplateColumns: '1fr', cursor: 'default', ['--kc' as string]: krHex(g.kr) }}>
                {krKode(g.kr)} {g.kr}
              </li>
              {g.items.map(i => {
                const st = data.isian[i.kode]?.status || 'Belum mulai'
                const sim = data.isian[i.kode]?.sim_u
                const on = i.kode === sel
                return (
                  <li key={i.kode} aria-current={on || undefined} onClick={() => setSel(i.kode)} style={{ ['--kc' as string]: krHex(g.kr) }}>
                    <span className="k">{String(i.kode).padStart(2, '0')}</span>
                    <span>{i.nama}</span>
                    <span className="m">
                      {i.sp_u && <span className="pill sp" title="Syarat perlu Unggul">SP</span>}
                      <span className={`pill ${st === 'Final' ? 'ok' : 'na'}`}>{st === 'Belum mulai' ? '–' : st === 'Final' ? 'Final' : st.slice(0, 4)}</span>
                      {sim === 'ya' && <span className="dot" style={{ background: 'var(--ok)' }} title="Simulasi: memenuhi Unggul" />}
                      {sim === 'tidak' && <span className="dot" style={{ background: 'var(--bad)' }} title="Simulasi: belum memenuhi" />}
                    </span>
                  </li>
                )
              })}
            </React.Fragment>
          ))}
          {groups.length === 0 && (
            <li style={{ gridTemplateColumns: '1fr', cursor: 'default' }}>
              <span style={{ color: 'var(--muted)' }}>Tidak ada indikator yang cocok.</span>
            </li>
          )}
        </ul>
      </aside>

      {/* ==== FORMCARD ==== */}
      <IndicatorDetail key={cur.kode} kode={cur.kode} />
    </div>
  )
}

function IndicatorDetail({ kode }: { kode: string }) {
  const { data, save, canWrite } = useStore()
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
  const mut = (p: Partial<IsianData>) => {
    if (!rw) return
    setD(prev => ({ ...prev, ...p }))
    setDirty(true)
  }

  const completeness = [
    d.status !== 'Belum mulai',
    !!d.pic.trim(),
    !!d.sim_u,
    d.analisis.trim().length >= 80,
    cleanLinks(d.bukti).some(l => isUrl(l.url)),
    isUrl(d.narasi_url),
  ]
  const done = completeness.filter(Boolean).length
  const kc = krHex(i.kriteria)

  const doSave = async () =>
    save('isian', kode, {
      ...d,
      pic: d.pic.trim(),
      sim_u: d.sim_u === 'x-belum' ? '' : d.sim_u,
      bukti: cleanLinks(d.bukti),
    })

  const denyCtx = { kind: 'isian', kode: i.kode, kr: i.kriteria } as const

  return (
    <article className="formcard" style={{ ['--kc' as string]: kc }}>
      {/* FHEAD */}
      <div className="fhead">
        <span className="code">
          Sub-indikator {String(i.kode).padStart(2, '0')} · {krKode(i.kriteria)} {i.kriteria} · Sasaran {i.sasaran}
        </span>
        <h2>{i.nama}</h2>
        <div className="tags">
          {i.sp_u && <span className="pill sp">Syarat perlu Unggul</span>}
          {!rw && <span className="pill lock">Hanya lihat · diisi oleh akun {i.kriteria}</span>}
          <StatusPill s={d.status} />
        </div>
        <div className="prog">
          <div className="meter">
            <i style={{ width: `${(done / 6) * 100}%` }} />
          </div>
          <span>Kelengkapan isian {done}/6</span>
        </div>
      </div>

      {/* FBODY */}
      <div className="fbody">
        {/* ASK */}
        <div className="ask">
          <div>
            <span className="lbl">Yang harus dijawab di narasi</span>
            <ol>
              {i.tanya.map((t, ix) => (
                <li key={ix}>{t}</li>
              ))}
            </ol>
          </div>
          <div className="key">
            <span className="lbl">Agar skor 1 (memenuhi Unggul)</span>
            <ul>
              {i.kunci.map((t, ix) => (
                <li key={ix}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="lbl">Deskriptor Unggul (Lampiran 3c)</span>
            <p>{i.ambang_u}</p>
          </div>
          <details className="more">
            <summary>Aspek penilaian lengkap</summary>
            <p>{i.aspek}</p>
          </details>
          <div className="row2">
            <div>
              <span className="lbl">Sumber data</span>
              <p style={{ fontSize: 13 }}>{i.sumber_data || '—'}</p>
            </div>
            {i.tabel_lkpt && (
              <div>
                <span className="lbl">Tabel LKPT terkait</span>
                <p style={{ fontSize: 13 }}>{i.tabel_lkpt}</p>
              </div>
            )}
          </div>
        </div>

        {/* FILL + SHIELD */}
        <div className="fill">
          <div className="row2">
            <label className="field">
              <FieldLabel>Status narasi LED</FieldLabel>
              <select value={d.status} onChange={e => mut({ status: e.target.value })} disabled={!rw} aria-label="Status">
                {ST.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <FieldLabel>PIC / unit penanggung jawab</FieldLabel>
              <input type="text" value={d.pic} disabled={!rw} placeholder="mis. LPPM, Biro SDM" onChange={e => mut({ pic: e.target.value })} />
            </label>
          </div>
          <label className="field">
            <FieldLabel>Simulasi penilaian Unggul</FieldLabel>
            <FieldHint>Nilai jujur berdasarkan bukti yang sudah ada, bukan rencana. Bandingkan dengan kotak “Agar skor 1”.</FieldHint>
            <select value={d.sim_u || 'x-belum'} onChange={e => mut({ sim_u: e.target.value })} disabled={!rw} aria-label="Simulasi Unggul">
              <option value="x-belum">Belum dinilai</option>
              <option value="ya">Memenuhi deskriptor Unggul (skor 1)</option>
              <option value="tidak">Belum memenuhi (skor 0)</option>
            </select>
          </label>
          <label className="field">
            <FieldLabel>Poin analisis / narasi</FieldLabel>
            <FieldHint>
              Jawab setiap pertanyaan di kolom kiri. Asesor menilai bukti dan analisis, bukan klaim. Tulis dengan angka,
              tahun, dan nama dokumen; tunjukkan siklus evaluasi → tindak lanjut → hasil yang membaik.
            </FieldHint>
            <textarea
              value={d.analisis}
              disabled={!rw}
              placeholder={i.kerangka || KERANGKA_DEFAULT}
              onChange={e => mut({ analisis: e.target.value })}
              rows={9}
            />
            {rw && (
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  const ker = i.kerangka || KERANGKA_DEFAULT
                  mut({ analisis: d.analisis.trim() ? d.analisis.replace(/\s*$/, '') + '\n\n' + ker : ker })
                }}
              >
                Sisipkan kerangka jawaban butir {i.kode}
              </button>
            )}
          </label>
          <div className="field">
            <FieldLabel>Link bukti</FieldLabel>
            <FieldHint>
              Satu dokumen satu baris, beri nama sesuai judul dokumen. Pakai tautan yang bisa dibuka asesor tanpa login.
              Dokumen formal sebaiknya bertanda tangan/SK, bukan draf.
            </FieldHint>
            <LinkEditor links={d.bukti} saran={i.bukti_saran} disabled={!rw} setLinks={l => mut({ bukti: l })} />
          </div>
          <label className="field">
            <FieldLabel>Link draf narasi LED</FieldLabel>
            <FieldHint>Tautan ke draf tulisan lengkap untuk butir ini (Google Docs/Word daring).</FieldHint>
            <input type="url" value={d.narasi_url} disabled={!rw} placeholder="https://docs.google.com/…" onChange={e => mut({ narasi_url: e.target.value.trim() })} />
          </label>
          <label className="field">
            <FieldLabel>Catatan tim / tindak lanjut</FieldLabel>
            <FieldHint>Tulis kekurangan yang masih harus ditutup sebelum unggah: bukti yang belum ada, siapa yang mengerjakan, dan tenggatnya.</FieldHint>
            <textarea
              value={d.catatan}
              disabled={!rw}
              placeholder="mis. Laporan RTM 2024 belum ditandatangani — BAAK — 15 Des"
              onChange={e => mut({ catatan: e.target.value })}
              rows={3}
            />
          </label>

          {/* PERISAI LARANGAN — isian tetap terlihat, klik memunculkan popup */}
          {!rw && <Shield ctx={denyCtx} />}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <SaveBar path={`isian/${kode}`} dirty={dirty} onDirtyChange={setDirty} onSave={doSave} storedAt={stored.diubah_pada} storedBy={stored.diubah_oleh} canEdit={rw} />
        {!rw && <Shield ctx={denyCtx} />}
      </div>
    </article>
  )
}
