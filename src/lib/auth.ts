/**
 * Autentikasi sesi berbasis cookie httpOnly bertanda tangan HMAC-SHA256.
 * - Tidak ada kredensial di sisi klien.
 * - Secret sesi dibuat sekali dan disimpan di .session-secret (root proyek).
 * - Semua verifikasi izin dilakukan server-side.
 */
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const COOKIE = 'aptunita_session'
const TTL_MS = 1000 * 60 * 60 * 12 // 12 jam
import fs from 'fs'
import path from 'path'

function getSecret(): string {
  const file = path.join(process.cwd(), '.session-secret')
  try {
    const existing = fs.readFileSync(file, 'utf8').trim()
    if (existing) return existing
  } catch {
    /* belum ada */
  }
  const secret = crypto.randomBytes(32).toString('hex')
  fs.writeFileSync(file, secret, { mode: 0o600 })
  return secret
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

export interface SessionUser {
  id: string
  username: string
  role: string
  kriteria: string
  label: string
}

function makeToken(username: string): string {
  const payload = Buffer.from(JSON.stringify({ u: username, exp: Date.now() + TTL_MS })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function verifyToken(token: string | undefined): string | null {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expect = sign(payload)
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null
  } catch {
    return null
  }
  try {
    const { u, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof exp !== 'number' || Date.now() > exp) return null
    return u
  } catch {
    return null
  }
}

/** Ambil user sesi saat ini dari cookie (verifikasi DB setiap kali). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies()
  const username = verifyToken(jar.get(COOKIE)?.value)
  if (!username) return null
  const user = await db.user.findUnique({ where: { username } })
  if (!user) return null
  return { id: user.id, username: user.username, role: user.role, kriteria: user.kriteria, label: user.label }
}

/** Set cookie sesi setelah login berhasil. */
export async function createSession(username: string) {
  const jar = await cookies()
  jar.set(COOKIE, makeToken(username), {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // preview berjalan di belakang proxy https — cookie tetap aman via sameSite
    maxAge: TTL_MS / 1000,
    path: '/',
  })
}

/** Hapus cookie sesi. */
export async function destroySession() {
  const jar = await cookies()
  jar.set(COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' })
}
