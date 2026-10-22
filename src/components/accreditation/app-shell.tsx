'use client'

/**
 * Kerangka aplikasi — direplikasi dari desain asli index.html:
 * hero foto kampus + ring simulasi Unggul + tabbar glass + popup larangan.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from './store'
import { LoginView } from './login-view'
import { SummaryTab } from './summary-tab'
import { IndicatorTab } from './indicator-tab'
import { LkptTab } from './lkpt-tab'
import { NaskahTab } from './naskah-tab'
import { ProfileTab } from './profile-tab'
import { ScheduleTab } from './schedule-tab'
import { INS, KR, LKPT, krKode, OWNER, type DenyCtx } from '@/lib/accreditation'

type TabDef = { id: TabId; label: string; badge?: 'led' | 'lkpt' }
const TABS: TabDef[] = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'indikator', label: 'Indikator LED', badge: 'led' },
  { id: 'lkpt', label: 'Tabel LKPT', badge: 'lkpt' },
  { id: 'naskah', label: 'Naskah LED' },
  { id: 'jadwal', label: 'Jadwal' },
  { id: 'profil', label: 'Identitas & tim' },
]

type TabId = 'ringkasan' | 'indikator' | 'lkpt' | 'naskah' | 'jadwal' | 'profil'

/** Bintang deterministic (SSR & client identik). */
function useStars(n = 26) {
  return useMemo(() => {
    const arr: { left: string; top: string; d: string; dl: string }[] = []
    let seed = 42
    for (let i = 0; i < n; i++) {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      const a = seed / 4294967296
      seed = (seed * 1664525 + 1013904223) % 4294967296
      const b = seed / 4294967296
      seed = (seed * 1664525 + 1013904223) % 4294967296
      const c = seed / 4294967296
      arr.push({ left: `${(a * 100).toFixed(1)}%`, top: `${(b * 100).toFixed(1)}%`, d: `${(3 + c * 3).toFixed(1)}s`, dl: `${(c * 4).toFixed(1)}s` })
    }
    return arr
  }, [n])
}

export function AppShell() {
  const { user, loading, logout, toast, data, deny, closeDenied, requestKrFocus } = useStore()
  const [tab, setTab] = useState<TabId>('ringkasan')
  const stars = useStars()

  if (loading) {
    return (
      <div className="app-root min-h-screen grid place-items-center">
        <p style={{ color: 'var(--muted)' }}>Memuat lembar kerja…</p>
      </div>
    )
  }
  if (!user) return <LoginView />

  const ledFinal = INS.filter(i => data.isian[i.kode]?.status === 'Final').length
  const lkLengkap = LKPT.filter(([id]) => data.lkpt[id]?.status === 'Lengkap').length
  const bukti = Object.values(data.isian).filter(v => (v.bukti || []).some(b => b.url)).length
  const spAll = INS.filter(i => i.sp_u)
  const spOk = spAll.filter(i => data.isian[i.kode]?.sim_u === 'ya').length
  const simYa = INS.filter(i => data.isian[i.kode]?.sim_u === 'ya').length
  const simTidak = INS.filter(i => data.isian[i.kode]?.sim_u === 'tidak').length
  const simNa = INS.length - simYa - simTidak
  const skor = Math.round((simYa / INS.length) * 100)

  return (
    <div className="app-root">
      <div className="liquid-bg" aria-hidden="true"><i></i><i></i><i></i><i></i></div>

      {/* ================= HERO FOTO KAMPUS ================= */}
      <header className="hero" id="top">
        <div className="aurora" aria-hidden="true"><i className="b1"></i><i className="b2"></i><i className="b3"></i></div>
        <div className="stars" aria-hidden="true">
          {stars.map((st, i) => (
            <i key={i} style={{ left: st.left, top: st.top, ['--d' as string]: st.d, ['--dl' as string]: st.dl }} />
          ))}
        </div>
        <span className="photo-cap">Kampus Merdeka · Universitas Tulungagung</span>
        <div className="wrap hero-in">
          <div className="hero-txt">
            <div className="eyebrow">Pusat Penjaminan Mutu · Universitas Tulungagung</div>
            <h1>
              {'Lembar Kerja Akreditasi Perguruan Tinggi'.split(' ').map((w, i) => (
                <span className="w" key={i} style={{ ['--i' as string]: i }}>
                  {w}
                  {i < 5 ? ' ' : ''}
                </span>
              ))}
            </h1>
            <p className="sub">
              IAPT 4.1 · PerBAN-PT No. 35/2025 · PTS Akademik · target <b>Terakreditasi Unggul</b> · database terpusat
            </p>
            <div className="hero-row">
              <SimRing skor={skor} />
              <div className="hero-stats">
                <div><b>{spOk}/{spAll.length}</b><span>syarat perlu terpenuhi</span></div>
                <div><b>{ledFinal}/{INS.length}</b><span>narasi LED final</span></div>
                <div><b>{bukti}</b><span>link bukti tercatat</span></div>
                <div><b>{lkLengkap}/{LKPT.length}</b><span>tabel LKPT lengkap</span></div>
              </div>
            </div>
            <div className="notice" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>
                Masuk sebagai <b>{user.username}</b> ({user.role === 'admin' ? 'admin · akses penuh' : user.label}) —
                {user.role === 'admin'
                  ? ' dapat mengubah semua bagian.'
                  : ` dapat mengisi kriteria ${krKode(user.kriteria)} ${user.kriteria} (indikator dan naskahnya) serta seluruh tabel LKPT. Bagian lain hanya dapat dilihat.`}
              </span>
              <span style={{ fontSize: 12, opacity: 0.75 }}>
                Simulasi Unggul: {simYa} memenuhi · {simTidak} belum · {simNa} belum dinilai
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ================= TABBAR GLASS ================= */}
      <div className="tabbar sticky">
        <div className="wrap tabwrap">
          <TabNav tab={tab} setTab={setTab} ledFinal={ledFinal} lkLengkap={lkLengkap} />
          <div className="acct">
            <div className="who">
              <b>{user.username}</b>
              <span>{user.role === 'admin' ? 'Admin · semua bagian' : user.label}</span>
            </div>
            <button className="btn" onClick={logout}>Keluar</button>
          </div>
        </div>
      </div>

      {/* ================= KONTEN ================= */}
      <main className="wrap">
        {tab === 'ringkasan' && <SummaryTab onGo={setTab} />}
        {tab === 'indikator' && <IndicatorTab />}
        {tab === 'lkpt' && <LkptTab />}
        {tab === 'naskah' && <NaskahTab />}
        {tab === 'profil' && <ProfileTab />}
        {tab === 'jadwal' && <ScheduleTab />}
      </main>

      <footer className="wrap">
        <p>
          Pusat Penjaminan Mutu Universitas Tulungagung · IAPT 4.1 (Peraturan BAN-PT No. 35/2025) · Target{' '}
          <b>Terakreditasi Unggul</b> · Isian tersimpan aman di database server dan tercatat nama penyimpannya ·
          Rujukan: Lampiran 1, 2, 3c, 4a, 4b
        </p>
      </footer>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      {deny && (
        <DenyDialog
          ctx={deny}
          onClose={closeDenied}
          onGoMyKr={() => {
            closeDenied()
            if (user.kriteria) requestKrFocus(user.kriteria)
            setTab('indikator')
          }}
        />
      )}
    </div>
  )
}

/** Ring simulasi Unggul (SVG, animasi offset seperti asli). */
function SimRing({ skor }: { skor: number }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 200)
    return () => clearTimeout(t)
  }, [])
  const off = 364.4 - (364.4 * skor) / 100
  return (
    <div className="ring" role="img" aria-label={`Simulasi skor Unggul ${skor} persen`}>
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <circle className="trk" cx="70" cy="70" r="58" />
        <circle className={`val${skor >= 80 ? ' pass' : ''}`} cx="70" cy="70" r="58" style={{ strokeDashoffset: on ? off : 364.4 }} />
      </svg>
      <div className="ring-c">
        <b>{skor}%</b>
        <span>skor simulasi Unggul</span>
        <small>ambang 80%</small>
      </div>
    </div>
  )
}

/** Nav tab dengan indikator tinta bergerak (tab-ink). */
function TabNav({ tab, setTab, ledFinal, lkLengkap }: { tab: TabId; setTab: (t: TabId) => void; ledFinal: number; lkLengkap: number }) {
  const navRef = useRef<HTMLElement | null>(null)
  const inkRef = useRef<HTMLSpanElement | null>(null)

  const moveInk = React.useCallback(() => {
    const nav = navRef.current
    const ink = inkRef.current
    if (!nav || !ink) return
    const el = nav.querySelector<HTMLElement>(`.tab[aria-selected="true"]`)
    if (!el) return
    ink.style.left = `${el.offsetLeft}px`
    ink.style.width = `${el.offsetWidth}px`
  }, [])

  useEffect(() => {
    moveInk()
    window.addEventListener('resize', moveInk)
    return () => window.removeEventListener('resize', moveInk)
  }, [tab, moveInk])

  return (
    <nav className="tabs" role="tablist" aria-label="Bagian lembar kerja" ref={navRef}>
      <span className="tab-ink" ref={inkRef} aria-hidden="true" />
      {TABS.map(t => {
        const on = tab === t.id
        const badge = t.badge === 'led' ? `${ledFinal}/${INS.length}` : t.badge === 'lkpt' ? `${lkLengkap}/${LKPT.length}` : null
        return (
          <button key={t.id} className="tab" role="tab" aria-selected={on} onClick={() => setTab(t.id)}>
            {t.label}
            {badge && <i className="badge">{badge}</i>}
          </button>
        )
      })}
    </nav>
  )
}

/**
 * POPUP LARANGAN — muncul ketika akun mencoba mengubah bagian yang bukan miliknya.
 * Pesan mengikuti konteks: sub-indikator, naskah, atau area admin.
 */
export function DenyDialog({ ctx, onClose, onGoMyKr }: { ctx: DenyCtx; onClose: () => void; onGoMyKr: () => void }) {
  const { user } = useStore()
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  let owner = 'ppmunita'
  let what = 'bagian ini'
  if (ctx.kind === 'isian') {
    owner = OWNER[ctx.kr] || 'ppmunita'
    what = `sub-indikator ${ctx.kode} (${krKode(ctx.kr)} ${ctx.kr})`
  } else if (ctx.kind === 'naskah') {
    what = `bagian naskah "${ctx.nama}"`
  } else if (ctx.kind === 'admin') {
    what = ctx.nama || 'bagian ini'
  }

  const isAdmin = user?.role === 'admin'
  const sub = isAdmin
    ? 'Isian ini milik tim kriteria — gunakan akun pemiliknya untuk mengubah.'
    : `Akun ${user?.username} hanya dapat mengisi ${user?.label}${(user?.label || '').startsWith('K.') ? ' (indikator dan naskahnya)' : ''} serta seluruh tabel LKPT. Isian bagian lain tetap dapat Anda lihat.`

  return (
    <div
      className="deny"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="dn-t"
      aria-describedby="dn-m"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="dn-card">
        <div className="dn-ic" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
            <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
            <path d="M12 14.5v2.5" />
          </svg>
        </div>
        <h2 id="dn-t">Akses ditolak</h2>
        <p id="dn-m">
          Akun <b>{user?.username}</b> tidak berhak mengubah {what}. Bagian ini diisi oleh akun <b>{owner}</b>.
        </p>
        <p className="dn-sub">{sub}</p>
        <div className="dn-act">
          {!isAdmin && user?.kriteria && (
            <button className="btn" type="button" onClick={onGoMyKr}>
              Ke butir {krKode(user.kriteria)} saya
            </button>
          )}
          <button className="btn pri" type="button" onClick={onClose} autoFocus>
            Mengerti
          </button>
        </div>
      </div>
    </div>
  )
}
