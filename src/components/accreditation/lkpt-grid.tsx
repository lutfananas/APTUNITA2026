'use client'

/**
 * Grid isian LKPT — kolom PERSIS mengikuti format tabel resmi
 * Panduan Penyusunan LKPT (Lampiran 4b PerBAN-PT 35/2025, IAPT 4.1):
 * - header dua tingkat bergrup (mis. Akademik/Profesi/Vokasi, Pendidikan Tertinggi, Tingkat)
 * - baris tetap (fixed) atau dinamis (dynamic, bisa tambah/hapus)
 * - sel diarsir abu untuk kolom yang tidak dipakai (pola tabel kelulusan resmi)
 * - huruf penanda resmi pada sel (d1 =, e1 =, f1 =, a1 =, a2 =) dan tag jumlah (NA =, NPT =, NDT =, NPS =)
 * - baris penutup Jumlah/Rata-rata/Total
 */
import React from 'react'
import { Plus, X } from 'lucide-react'
import type { LkptCol, LkptGridSpec } from '@/lib/accreditation'
import { FieldLabel } from './ui-bits'

interface Props {
  spec: LkptGridSpec
  cells: Record<string, Record<string, string>>
  rows: Record<string, string>[]
  bidang: string
  disabled: boolean
  onCells: (c: Record<string, Record<string, string>>) => void
  onRows: (r: Record<string, string>[]) => void
  onBidang: (b: string) => void
}

export function LkptGrid({ spec, cells, rows, bidang, disabled, onCells, onRows, onBidang }: Props) {
  const cols = spec.columns

  // Kelompokkan kolom berurutan dengan group sama → header dua tingkat
  const groups: { name: string | null; cols: LkptCol[] }[] = []
  for (const c of cols) {
    const last = groups[groups.length - 1]
    if (last && last.name === (c.group || null)) last.cols.push(c)
    else groups.push({ name: c.group || null, cols: [c] })
  }

  // Petakan huruf penanda resmi per sel "row|col"
  const tagMap = new Map<string, string>()
  for (const t of spec.cellTags || []) tagMap.set(`${t.row}|${t.col}`, t.tag)

  const setCell = (rk: string, ck: string, v: string) =>
    onCells({ ...cells, [rk]: { ...(cells[rk] || {}), [ck]: v } })

  // Mode dynamic: pakai baris tersimpan, atau baris kosong sebanyak minRows
  const min = spec.minRows || 3
  const arr = rows.length ? rows : Array.from({ length: min }, () => ({}) as Record<string, string>)
  const setRow = (i: number, ck: string, v: string) =>
    onRows(arr.map((r, ix) => (ix === i ? { ...r, [ck]: v } : r)))
  const addRow = () => onRows([...arr, {}])
  const delRow = (i: number) => onRows(arr.filter((_, ix) => ix !== i))

  const head = (
    <thead>
      <tr>
        <th rowSpan={2} className="hno">
          No.
        </th>
        {spec.mode === 'fixed' && (
          <th rowSpan={2} className="hfirst">
            {spec.firstCol}
          </th>
        )}
        {groups.map((g, gi) =>
          g.name ? (
            <th key={`g${gi}`} colSpan={g.cols.length} className="hgrp">
              {g.name}
            </th>
          ) : (
            g.cols.map(c => (
              <th key={c.key} rowSpan={2} style={c.w ? { minWidth: c.w } : undefined}>
                {c.label}
              </th>
            ))
          ),
        )}
        {spec.mode === 'dynamic' && <th rowSpan={2} className="hdel" aria-hidden="true" />}
      </tr>
      <tr>
        {groups.map(g =>
          g.name ? (
            g.cols.map(c => (
              <th key={c.key} style={c.w ? { minWidth: c.w } : undefined}>
                {c.label}
              </th>
            ))
          ) : null,
        )}
      </tr>
    </thead>
  )

  const foot = spec.footer ? (
    <tfoot>
      <tr>
        <td colSpan={spec.footer.labelSpan || 2} className="flabel">
          {spec.footer.label}
        </td>
        {cols.map(c => {
          const t = spec.footer?.cells?.[c.key]
          return t !== undefined ? (
            <td key={c.key} className="tagcell">
              {t}
            </td>
          ) : (
            <td key={c.key} />
          )
        })}
        {spec.mode === 'dynamic' && <td aria-hidden="true" />}
      </tr>
    </tfoot>
  ) : null

  const bodyFixed = (
    <tbody>
      {(spec.rows || []).map((rd, i) => (
        <tr key={rd.key}>
          <td className="no">{i + 1}</td>
          <td className="rowlabel">{rd.label}</td>
          {cols.map(c => {
            const off = (rd.disable || []).includes(c.key)
            const tag =
              tagMap.get(`${rd.key}|${c.key}`) || (c.key === (spec.tagCol || 'jumlah') && rd.tag ? rd.tag : '')
            if (off) return <td key={c.key} className="nacell" aria-hidden="true" />
            return (
              <td key={c.key} className={c.num ? 'num' : ''}>
                <input
                  type="text"
                  inputMode={c.num ? 'decimal' : undefined}
                  value={cells[rd.key]?.[c.key] || ''}
                  placeholder={tag || undefined}
                  disabled={disabled}
                  aria-label={`${rd.label} — ${c.label}`}
                  onChange={e => setCell(rd.key, c.key, e.target.value)}
                />
              </td>
            )
          })}
        </tr>
      ))}
    </tbody>
  )

  const bodyDynamic = (
    <tbody>
      {arr.map((r, i) => (
        <tr key={i}>
          <td className="no">{i + 1}</td>
          {cols.map(c => (
            <td key={c.key} className={c.num ? 'num' : ''}>
              <input
                type="text"
                inputMode={c.num ? 'decimal' : undefined}
                value={r[c.key] || ''}
                disabled={disabled}
                aria-label={`Baris ${i + 1} — ${c.label}`}
                onChange={e => setRow(i, c.key, e.target.value)}
              />
            </td>
          ))}
          <td className="del">
            <button
              type="button"
              className="icon"
              aria-label={`Hapus baris ${i + 1}`}
              title="Hapus baris"
              disabled={disabled || arr.length <= 1}
              onClick={() => delRow(i)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  )

  return (
    <div className="lgrid-wrap">
      {spec.picker && (
        <div className="lgrid-tools">
          <label className="field" style={{ flex: '1 1 260px' }}>
            <FieldLabel>{spec.picker.label}</FieldLabel>
            <select value={bidang} disabled={disabled} onChange={e => onBidang(e.target.value)} aria-label={spec.picker.label}>
              <option value="">— pilih bidang —</option>
              {spec.picker.options.map(o => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className="lgrid">
        <table>
          {head}
          {spec.mode === 'fixed' ? bodyFixed : bodyDynamic}
          {foot}
        </table>
      </div>
      {spec.mode === 'dynamic' && (
        <div className="lgrid-tools">
          {!disabled && (
            <button type="button" className="btn ghost" onClick={addRow}>
              <Plus className="h-3.5 w-3.5" /> Tambah baris
            </button>
          )}
        </div>
      )}
      {(spec.cellTags?.length || 0) > 0 && (
        <small className="lgrid-note">
          Huruf pada sel (mis. {spec.cellTags![0].tag}) adalah penanda format resmi — biarkan bila belum diisi, atau lengkapi angkanya di belakang huruf.
        </small>
      )}
    </div>
  )
}
