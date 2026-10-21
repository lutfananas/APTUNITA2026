import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'

const Body = z.object({
  username: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/i),
  password: z.string().min(1).max(256),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Format tidak valid' }, { status: 400 })
    }
    const { username, password } = parsed.data
    const user = await db.user.findUnique({ where: { username: username.toLowerCase() } })
    // Pesan error seragam — tidak membocorkan keberadaan akun.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      await db.auditLog.create({
        data: { username: username || '?', action: 'denied', path: 'login', detail: 'Kredensial salah' },
      })
      return NextResponse.json({ ok: false, error: 'Username atau kata sandi salah' }, { status: 401 })
    }
    await createSession(user.username)
    await db.auditLog.create({
      data: { username: user.username, action: 'login', path: 'login', detail: 'Login berhasil' },
    })
    return NextResponse.json({
      ok: true,
      user: { username: user.username, role: user.role, kriteria: user.kriteria, label: user.label },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Kesalahan server' }, { status: 500 })
  }
}
