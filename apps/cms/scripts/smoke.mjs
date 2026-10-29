/**
 * API smoke + access-control tests for a running CMS (local or Render).
 *
 *   CMS_URL=https://pradnya-portfolio-cms.onrender.com \
 *   CMS_API_KEY=<service key>            # optional: enables the service-account checks
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=…       # optional: enables the admin checks
 *   node scripts/smoke.mjs
 *
 * Test inquiries it creates are prefixed "[smoke]" and deleted again when admin credentials are given.
 * Credentials are read from the environment and never printed.
 */
const BASE = (process.env.CMS_URL || 'http://localhost:3001').replace(/\/$/, '')
const KEY = process.env.CMS_API_KEY
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env

let failed = 0
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok })
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
}
const call = async (path, { method = 'GET', body, headers = {} } = {}) => {
  const res = await fetch(BASE + path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = undefined }
  return { status: res.status, json, res }
}
const svc = KEY ? { Authorization: `users API-Key ${KEY}` } : null
const denied = (s) => s === 401 || s === 403

// ── liveness
const health = await call('/api/health')
check('health endpoint is up and reports the MongoDB adapter', health.status === 200 && health.json?.database === 'mongoose', `status ${health.status}`)

// ── public (anonymous) access
const projects = await call('/api/projects?depth=0&limit=100')
check('anonymous can list projects', projects.status === 200, `${projects.json?.totalDocs ?? '?'} docs`)
check('anonymous sees ONLY published projects', (projects.json?.docs ?? []).every((d) => d._status === 'published'))
const draftTry = await call('/api/projects?draft=true&depth=0&limit=100')
check('anonymous ?draft=true does not expose drafts', (draftTry.json?.docs ?? []).every((d) => d._status === 'published'))
check('anonymous can read the profile global', (await call('/api/globals/profile?depth=0')).status === 200)
check('anonymous can read site settings', (await call('/api/globals/site-settings?depth=0')).status === 200)
check('anonymous CANNOT read inquiries', denied((await call('/api/inquiries')).status))
check('anonymous CANNOT read users', denied((await call('/api/users')).status))
const anonInquiry = await call('/api/inquiries', { method: 'POST', body: { name: '[smoke] anon', email: 'a@example.test', message: 'should be rejected' } })
check('anonymous CANNOT create inquiries', denied(anonInquiry.status), `status ${anonInquiry.status}`)
check('anonymous CANNOT create projects', denied((await call('/api/projects', { method: 'POST', body: { title: 'x' } })).status))
check('anonymous CANNOT upload media', denied((await call('/api/media', { method: 'POST', body: {} })).status))
check('preview-auth refuses an invalid slug', (await call('/api/preview-auth?slug=../x')).status === 400)
const unauthPreview = await fetch(`${BASE}/api/preview-auth?slug=smoke`, { redirect: 'manual' })
check('preview-auth sends signed-out visitors to the admin login', unauthPreview.status === 302 && /\/admin\/login/.test(unauthPreview.headers.get('location') || ''))
const cors = await fetch(`${BASE}/api/projects`, { headers: { Origin: 'https://evil.example' } })
check('CORS does not echo an unknown origin', cors.headers.get('access-control-allow-origin') !== 'https://evil.example')

// ── website service account (least privilege)
if (svc) {
  const bad = await call('/api/inquiries', { method: 'POST', headers: { Authorization: 'users API-Key 00000000-0000-0000-0000-000000000000' }, body: { name: '[smoke] bad key', email: 'a@example.test', message: 'should be rejected' } })
  check('a wrong API key is rejected', denied(bad.status), `status ${bad.status}`)
  const created = await call('/api/inquiries', { method: 'POST', headers: svc, body: { name: '[smoke] service', email: 'smoke@example.test', message: 'Contact-form smoke test message', status: 'new' } })
  check('service key CAN create an inquiry', created.status === 201, `status ${created.status}`)
  check('service key CANNOT read inquiries', denied((await call('/api/inquiries', { headers: svc })).status))
  check('service key CANNOT create projects', denied((await call('/api/projects', { method: 'POST', headers: svc, body: { title: 'x' } })).status))
  check('service key CANNOT list users', denied((await call('/api/users', { headers: svc })).status))
  check('service key CANNOT change globals', denied((await call('/api/globals/profile', { method: 'POST', headers: svc, body: { name: 'x' } })).status))
  const drafts = await call('/api/projects?draft=true&depth=0&limit=100', { headers: svc })
  check('service key can read projects incl. drafts (preview)', drafts.status === 200)
} else {
  console.log('SKIP  service-account checks (CMS_API_KEY not set)')
}

// ── admin
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  const login = await call('/api/users/login', { method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
  const admin = login.json?.token ? { Authorization: `JWT ${login.json.token}` } : null
  check('admin can log in', login.status === 200 && Boolean(admin))
  if (admin) {
    const inquiries = await call('/api/inquiries?limit=100&depth=0', { headers: admin })
    check('admin can read inquiries', inquiries.status === 200)
    for (const d of (inquiries.json?.docs ?? []).filter((x) => String(x.name).startsWith('[smoke]'))) {
      await call(`/api/inquiries/${d.id}`, { method: 'DELETE', headers: admin })
    }
    const out = await call('/api/users/logout', { method: 'POST', headers: admin })
    check('admin can log out', out.status === 200)
    const reuse = await call('/api/users/me', { headers: admin })
    check('a logged-out token cannot be reused', !reuse.json?.user, `status ${reuse.status}`)
  }
} else {
  console.log('SKIP  admin checks (ADMIN_EMAIL / ADMIN_PASSWORD not set)')
}

console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
