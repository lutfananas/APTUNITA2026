import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'

/** Muat seluruh isian dari database (sesuai izin pengguna). */
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Belum masuk' }, { status: 401 })

  const rows = await db.entry.findMany()
  const data: Record<string, Record<string, unknown>> = {}
  for (const r of rows) {
    try {
      ;(data[r.category] ||= {})[r.itemKey] = { ...(JSON.parse(r.data) as object), diubah_pada: r.updatedAt.toISOString(), diubah_oleh: r.updatedBy }
    } catch {
      /* lewati baris rusak */
    }
  }
  return NextResponse.json({ ok: true, data })
}
