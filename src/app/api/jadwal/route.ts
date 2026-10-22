import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'

const AddBody = z.object({
  tahap: z.string().min(1).max(200),
  mulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')),
  selesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')),
  status: z.enum(['Rencana', 'Berjalan', 'Selesai']),
})

/** Tambah tahap jadwal baru (admin saja). */
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Belum masuk' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ ok: false, error: 'Hanya admin' }, { status: 403 })

  const parsed = AddBody.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Format tidak valid' }, { status: 400 })

  const id = 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  await db.entry.create({
    data: { category: 'jadwal', itemKey: id, data: JSON.stringify(parsed.data), updatedBy: user.username },
  })
  await db.auditLog.create({
    data: { username: user.username, action: 'save', path: `jadwal/${id}`, detail: 'Tambah tahap' },
  })
  return NextResponse.json({ ok: true, id })
}

const DelBody = z.object({ itemKey: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/) })

/** Hapus tahap jadwal (admin saja). */
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Belum masuk' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ ok: false, error: 'Hanya admin' }, { status: 403 })

  const parsed = DelBody.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Format tidak valid' }, { status: 400 })

  await db.entry.deleteMany({ where: { category: 'jadwal', itemKey: parsed.data.itemKey } })
  await db.auditLog.create({
    data: { username: user.username, action: 'delete', path: `jadwal/${parsed.data.itemKey}`, detail: 'Hapus tahap' },
  })
  return NextResponse.json({ ok: true })
}
