import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { canWrite, sanitizePayload } from '@/lib/accreditation'

const Body = z.object({
  category: z.enum(['isian', 'lkpt', 'naskah', 'profil', 'jadwal']),
  itemKey: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  data: z.unknown(),
})

/**
 * Simpan satu entri isian ke database.
 * Izin DIVERIFIKASI DI SERVER (tidak percaya klaim klien).
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Belum masuk' }, { status: 401 })

  const parsed = Body.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Format tidak valid' }, { status: 400 })
  const { category, itemKey } = parsed.data

  if (!canWrite(user, category, itemKey)) {
    await db.auditLog.create({
      data: { username: user.username, action: 'denied', path: `${category}/${itemKey}`, detail: 'Tanpa izin tulis' },
    })
    return NextResponse.json({ ok: false, error: 'Anda tidak memiliki izin menulis pada bagian ini' }, { status: 403 })
  }

  const json = sanitizePayload(parsed.data.data)
  if (json === null) return NextResponse.json({ ok: false, error: 'Payload tidak valid atau terlalu besar' }, { status: 400 })

  const row = await db.entry.upsert({
    where: { category_itemKey: { category, itemKey } },
    update: { data: json, updatedBy: user.username },
    create: { category, itemKey, data: json, updatedBy: user.username },
  })
  await db.auditLog.create({
    data: { username: user.username, action: 'save', path: `${category}/${itemKey}`, detail: '' },
  })
  return NextResponse.json({ ok: true, updatedAt: row.updatedAt.toISOString(), updatedBy: row.updatedBy })
}
