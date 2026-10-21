'use client'

/** Halaman masuk — desain asli: foto kampus blur + kartu liquid glass + tombol emas. */
import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useStore } from './store'

export function LoginView() {
  const { login } = useStore()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    const r = await login(u.trim().toLowerCase(), p)
    if (!r.ok) {
      setErr(r.error || 'Gagal masuk')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
    setBusy(false)
  }

  return (
    <div className={`app-root login${shake ? ' shake' : ''}`} role="dialog" aria-modal="true" aria-labelledby="lg-title">
      <form className="lg-card" onSubmit={submit}>
        <div className="eyebrow">Pusat Penjaminan Mutu · Universitas Tulungagung</div>
        <h2 id="lg-title">Masuk ke Lembar Kerja Akreditasi</h2>
        <p className="hint">
          Gunakan akun yang diberikan Pusat Penjaminan Mutu. Setiap akun hanya dapat mengubah kriteria yang menjadi
          tanggung jawabnya — bagian lain tetap dapat dilihat.
        </p>
        <label className="field">
          <span>Nama pengguna</span>
          <input
            type="text"
            autoComplete="username"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="mis. ppmk1"
            value={u}
            onChange={e => setU(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Kata sandi</span>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={p}
            onChange={e => setP(e.target.value)}
            required
          />
        </label>
        <div className="lg-err" role="alert">
          {err}
        </div>
        <button className="btn pri lg-btn" type="submit" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Masuk
        </button>
        <div className="lg-hint">
          Akun tim (kata sandi awal: <b>unita2026</b>): <b>ppmunita</b> admin · <b>ppmk1</b> K.1 Budaya Mutu ·{' '}
          <b>ppmk21</b> K.2 Relevansi Pendidikan · <b>ppmk22</b> K.2 Relevansi Penelitian · <b>ppmk23</b> K.2 Relevansi
          PkM · <b>ppmk3</b> K.3 Akuntabilitas · <b>ppmk4</b> K.4 Diferensiasi Misi
        </div>
      </form>
    </div>
  )
}
