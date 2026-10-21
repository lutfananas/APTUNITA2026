'use client'

import { StoreProvider, useStore } from '@/components/accreditation/store'
import { AppShell } from '@/components/accreditation/app-shell'

function Root() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  )
}

// AppShell memakai useStore sehingga harus di dalam provider;
// komponen ini tetap client-side karena seluruh aplikasi bersifat interaktif.
export default function Home() {
  return <Root />
}
