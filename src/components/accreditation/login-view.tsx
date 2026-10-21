'use client'

/** Halaman masuk — sesi diverifikasi server, password bcrypt di database. */
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, ShieldCheck } from 'lucide-react'
import { useStore } from './store'

export function LoginView() {
  const { login } = useStore()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    const r = await login(u.trim().toLowerCase(), p)
    if (!r.ok) setErr(r.error || 'Gagal masuk')
    setBusy(false)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Panel kiri: identitas institusi */}
      <div
        className="relative lg:w-[46%] flex flex-col justify-between p-8 lg:p-12 text-white overflow-hidden"
        style={{
          background: 'linear-gradient(150deg,#0a1638 0%,#122463 55%,#1d1458 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'url(/kampus-unita.jpg)', backgroundSize: 'cover', backgroundPosition: '72% 42%' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,rgba(10,22,56,.92) 0%,rgba(18,36,99,.82) 60%,rgba(29,20,88,.88) 100%)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
            <ShieldCheck className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">Universitas Tulungagung</p>
            <p className="text-[11px] text-white/60 tracking-[.14em] uppercase">Pusat Penjaminan Mutu</p>
          </div>
        </div>
        <div className="relative z-10 mt-12 lg:mt-0">
          <p className="text-[11px] tracking-[.2em] uppercase text-amber-300/90 font-medium mb-3">IAPT 4.1 · BAN-PT No. 35/2025</p>
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
            Lembar Kerja
            <br />
            Akreditasi APT UNITA 2026
          </h1>
          <p className="text-sm text-white/75 leading-relaxed max-w-md">
            Persiapan Laporan Evaluasi Diri (LED) dan Laporan Kinerja Perguruan Tinggi (LKPT) menuju
            <b className="text-white"> Terakreditasi Unggul</b>. Seluruh isian kini tersimpan aman di database terpusat —
            dibagikan realtime ke seluruh tim, tidak lagi di browser masing-masing.
          </p>
          <div className="flex flex-wrap gap-6 mt-8 text-sm">
            <div>
              <p className="text-2xl font-bold text-amber-300">65</p>
              <p className="text-white/60 text-xs">sub-indikator LED</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-300">24</p>
              <p className="text-white/60 text-xs">tabel LKPT</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-300">14</p>
              <p className="text-white/60 text-xs">bagian naskah</p>
            </div>
          </div>
        </div>
        <p className="relative z-10 text-[11px] text-white/40 mt-12 lg:mt-0">© 2026 PPM UNITA · Data tersimpan terenkripsi di server</p>
      </div>

      {/* Panel kanan: form login */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="h-12 w-12 rounded-xl bg-[#16307d] flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Masuk</h2>
            <p className="text-sm text-slate-500 mt-1">Gunakan akun tim penyusun yang diberikan PPM.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="mis. ppmk1"
                value={u}
                onChange={e => setU(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Kata sandi</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={p}
                onChange={e => setP(e.target.value)}
                required
              />
            </div>
            {err && (
              <p role="alert" className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {err}
              </p>
            )}
            <Button type="submit" disabled={busy} className="w-full bg-[#16307d] hover:bg-[#0f2464] text-white h-11">
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Masuk
            </Button>
          </form>
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 leading-relaxed">
            <p className="font-semibold text-slate-700 mb-1">Akun tim (kata sandi awal: <code className="bg-slate-100 px-1 rounded">unita2026</code>)</p>
            <p>
              <b>ppmunita</b> admin · <b>ppmk1</b> Budaya Mutu · <b>ppmk21</b> Relevansi Pendidikan · <b>ppmk22</b> Relevansi Penelitian ·{' '}
              <b>ppmk23</b> Relevansi PkM · <b>ppmk3</b> Akuntabilitas · <b>ppmk4</b> Diferensiasi Misi
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
