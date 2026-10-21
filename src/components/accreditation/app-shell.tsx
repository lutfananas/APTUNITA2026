'use client'

/** Kerangka aplikasi: header, navigasi tab, footer sticky, toast. */
import React, { useState } from 'react'
import { useStore } from './store'
import { LoginView } from './login-view'
import { SummaryTab } from './summary-tab'
import { IndicatorTab } from './indicator-tab'
import { LkptTab } from './lkpt-tab'
import { NaskahTab } from './naskah-tab'
import { ProfileTab } from './profile-tab'
import { ScheduleTab } from './schedule-tab'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClipboardList, LayoutDashboard, Loader2, LogOut, ScrollText, Table2, Users2, CalendarRange, ShieldCheck } from 'lucide-react'

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'indikator', label: 'Indikator LED', icon: ClipboardList },
  { id: 'lkpt', label: 'Tabel LKPT', icon: Table2 },
  { id: 'naskah', label: 'Naskah LED', icon: ScrollText },
  { id: 'profil', label: 'Profil PT', icon: Users2 },
  { id: 'jadwal', label: 'Jadwal', icon: CalendarRange },
] as const

export function AppShell() {
  const { user, loading, logout, toast } = useStore()
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('ringkasan')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-[#16307d]" />
          <p className="text-sm">Memuat lembar kerja…</p>
        </div>
      </div>
    )
  }
  if (!user) return <LoginView />

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 text-white" style={{ background: 'linear-gradient(90deg,#0a1638 0%,#122463 70%,#1d1458 100%)' }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4.5 w-4.5 h-5 w-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-tight truncate">Lembar Kerja Akreditasi APT UNITA 2026</p>
              <p className="text-[10px] text-white/50 leading-tight tracking-wide uppercase">Database terpusat · IAPT 4.1</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-[12px] font-semibold leading-tight">{user.username}</p>
              <p className="text-[10px] text-white/55 leading-tight">{user.role === 'admin' ? 'Admin · semua bagian' : user.label + ' · LKPT'}</p>
            </div>
            {user.role === 'admin' ? (
              <Badge className="bg-amber-400/15 text-amber-300 border border-amber-300/40 text-[10px]">ADMIN</Badge>
            ) : (
              <Badge className="bg-white/10 text-white/80 border border-white/20 text-[10px]">TIM</Badge>
            )}
            <Button variant="ghost" size="sm" onClick={logout} className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5 h-8">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
        {/* Nav tab */}
        <nav className="border-t border-white/10" aria-label="Bagian lembar kerja">
          <div className="mx-auto max-w-7xl px-4 lg:px-6 flex overflow-x-auto no-scrollbar">
            {TABS.map(t => {
              const Icon = t.icon
              const on = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  aria-current={on ? 'page' : undefined}
                  className={`relative flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 text-[12.5px] font-medium transition-colors ${
                    on ? 'text-white' : 'text-white/55 hover:text-white/85'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                  {on && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-amber-300" />}
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      {/* Konten */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 lg:px-6 py-6">
        {tab === 'ringkasan' && <SummaryTab onGo={setTab} />}
        {tab === 'indikator' && <IndicatorTab />}
        {tab === 'lkpt' && <LkptTab />}
        {tab === 'naskah' && <NaskahTab />}
        {tab === 'profil' && <ProfileTab />}
        {tab === 'jadwal' && <ScheduleTab />}
      </main>

      {/* Footer sticky */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-6 py-3.5 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-slate-500">
          <p>
            Pusat Penjaminan Mutu Universitas Tulungagung · IAPT 4.1 (Peraturan BAN-PT No. 35/2025) · Target <b className="text-slate-700">Terakreditasi Unggul</b>
          </p>
          <p>Isian tersimpan aman di database server · Rujukan: Lampiran 1, 2, 3c, 4a, 4b</p>
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-900 text-white text-sm px-5 py-2.5 shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
