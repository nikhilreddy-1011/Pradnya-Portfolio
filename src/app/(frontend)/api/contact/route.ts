import { NextResponse } from 'next/server'

import { cmsEnabled, saveInquiry } from '@/lib/content'

export const runtime = 'nodejs'

/* Basic per-instance rate limit: 5 submissions / 10 minutes / IP. */
const hits = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > 5
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  })
  const json = (await res.json().catch(() => ({}))) as { success?: boolean }
  return Boolean(json.success)
}

async function notify(d: { name: string; email: string; phone: string; projectType: string; message: string }) {
  const key = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_NOTIFY_TO
  const from = process.env.CONTACT_FROM
  if (!key || !to || !from) return false
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: d.email,
      subject: `New inquiry — ${d.projectType || 'Portfolio'} — ${d.name}`,
      html: `<p><strong>${escape(d.name)}</strong> &lt;${escape(d.email)}&gt;${d.phone ? ` · ${escape(d.phone)}` : ''}</p>
             <p>${escape(d.projectType || 'Not specified')}</p>
             <p style="white-space:pre-wrap">${escape(d.message)}</p>`,
    }),
  })
  return res.ok
}

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  if (limited(ip)) return NextResponse.json({ error: 'Too many messages — please try again a little later.' }, { status: 429 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Bots: honeypot filled or form submitted inhumanly fast → pretend success, store nothing.
  if (str(body.company, 200) || Number(body.elapsed) < 2500) return NextResponse.json({ ok: true })

  const data = {
    name: str(body.name, 120),
    email: str(body.email, 200),
    phone: str(body.phone, 40),
    projectType: str(body.projectType, 80),
    message: str(body.message, 4000),
  }
  if (!data.name || !EMAIL.test(data.email) || data.message.length < 10) {
    return NextResponse.json({ error: 'Please check the form and try again.' }, { status: 422 })
  }
  if (!(await verifyTurnstile(str(body['cf-turnstile-response'], 2048), ip))) {
    return NextResponse.json({ error: 'Verification failed — please try again.' }, { status: 400 })
  }

  let stored = false
  let emailed = false
  try {
    stored = await saveInquiry({ ...data, page: str(body.page, 200), userAgent: str(req.headers.get('user-agent'), 300) })
  } catch (e) {
    console.error('[contact] could not store inquiry', e)
  }
  try {
    emailed = await notify(data)
  } catch (e) {
    console.error('[contact] could not send notification', e)
  }

  if (!stored && !emailed) {
    return NextResponse.json(
      { error: cmsEnabled ? 'The message could not be delivered.' : 'The form is not connected yet.' },
      { status: 503 },
    )
  }
  return NextResponse.json({ ok: true })
}
