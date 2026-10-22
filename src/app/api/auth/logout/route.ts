import { NextResponse } from 'next/server'
import { destroySession, getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST() {
  const user = await getSessionUser()
  if (user) {
    await db.auditLog.create({
      data: { username: user.username, action: 'logout', path: 'logout', detail: 'Keluar' },
    }).catch(() => {})
  }
  await destroySession()
  return NextResponse.json({ ok: true })
}
