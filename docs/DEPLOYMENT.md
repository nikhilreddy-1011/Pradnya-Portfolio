# Deployment — Vercel (website) + Render (CMS) + MongoDB Atlas + Vercel Blob

```
Visitor ─▶ Vercel  apps/web   https://portfolio-phi.vercel.app
              │  server-side HTTPS (published content is public; drafts / inquiries use a service API key)
              ▼
           Render  apps/cms   https://pradnya-portfolio-cms.onrender.com   (Payload admin + REST API)
              ├──▶ MongoDB Atlas   (documents + media metadata)
              └──▶ Vercel Blob     (uploaded files — public read URLs, used directly by the website)
```

Two independent apps, each with its own `package.json` and lockfile. Node **22 LTS** for both (`.nvmrc`; Node 20 is end-of-life).

## 1. Render — `apps/cms`

| Setting | Value |
|---|---|
| Root Directory | `apps/cms` |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Node | `NODE_VERSION=22` (environment variable) |

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Atlas connection string (secret) |
| `PAYLOAD_SECRET` | **Rotate it** — `openssl rand -hex 32` (secret) |
| `BLOB_READ_WRITE_TOKEN` | Blob store `pradnya-portfolio-media` token (secret). Lives on Render only. |
| `WEB_URL` | `https://portfolio-phi.vercel.app` (no trailing slash) |
| `PREVIEW_SECRET` | `openssl rand -hex 32` — same value on Vercel (secret) |
| `REVALIDATE_SECRET` | `openssl rand -hex 32` — same value on Vercel (secret) |
| `NODE_VERSION` | `22` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | only if you use Cloudinary video |
| `CMS_PUBLIC_URL` | only for a custom domain (Render provides `RENDER_EXTERNAL_URL` itself) |

Delete the old `NEXT_PUBLIC_SITE_URL` from Render — the CMS no longer reads it (it is `WEB_URL` now).
The service **refuses to start in production without media storage**, so uploads can never land on Render's temporary disk.

## 2. Vercel — `apps/web`

Project → Settings → General: **Root Directory `apps/web`**, Framework Next.js, Node 22.x.

| Variable | Public? | Value |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | public | `https://portfolio-phi.vercel.app` (the website's own URL) |
| `CMS_URL` | server | `https://pradnya-portfolio-cms.onrender.com` |
| `CMS_API_KEY` | **secret** | API key of the `service` user (step 3 below) |
| `PREVIEW_SECRET` | **secret** | same as Render |
| `REVALIDATE_SECRET` | **secret** | same as Render |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | public | if Cloudinary video is used |
| `RESEND_API_KEY`, `CONTACT_NOTIFY_TO`, `CONTACT_FROM` | secret | optional e-mail notification |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | public / secret | optional spam shield |

The website does **not** need `BLOB_READ_WRITE_TOKEN` — remove it from the Vercel project (least privilege); media is read from public Blob URLs.

## 3. First-time order of operations

1. **Rotate `PAYLOAD_SECRET` on Render** (the old token was exposed). Rotation invalidates every login token and every API key.
2. Deploy `apps/cms`. Open `/admin` and sign in (your Atlas user is unchanged). If the database is empty you will see the "create first user" form instead.
3. **Create the website's service account:** Users → Create New → email `web-service@…`, any long password, **Role: Service**, tick **Enable API Key**, *Generate new API key*, Save. Copy the key into Vercel as `CMS_API_KEY`. This account can only read drafts and submit contact inquiries.
4. Deploy `apps/web` (build calls the CMS; if the CMS is asleep/down the site builds with its built-in CV content and refreshes on the next publish).
5. Populate the CMS if empty: from `apps/cms`, `npm run seed` with `DATABASE_URL` pointing at Atlas. It refuses to run if projects already exist (set `SEED_FORCE=1` to overwrite deliberately) and never touches media. Upload images / GLBs / panoramas in `/admin` — they go to Vercel Blob.
6. **Retire the two removed projects in production** (3BHK Residence, Residential Interior): from `apps/cms`, with `DATABASE_URL` (Atlas), `PAYLOAD_SECRET`, `WEB_URL`, `REVALIDATE_SECRET` in `.env`, run `npm run unpublish:retired`. It unpublishes both through Payload (nothing deleted, media untouched), fixes the About sentence that named them, and triggers the website refresh. Safe to re-run.
7. Run the smoke test (below).

## 4. Smoke tests

```bash
cd apps/cms
CMS_URL=https://pradnya-portfolio-cms.onrender.com \
CMS_API_KEY=<service key> ADMIN_EMAIL=<you> ADMIN_PASSWORD=<pw> npm run test:smoke
```
Checks anonymous = published only, no anonymous writes/inquiry reads, service key limits, admin login/logout, logged-out tokens rejected, CORS, health.

Manual: (1) `/admin` shows the login form and, after sign-in, the dashboard; (2) upload an image in Media Library, open the file URL (`…public.blob.vercel-storage.com/media/…`); (3) upload a `.glb` in 3D Models and open it in a project; (4) publish a project → the website updates within seconds; (5) Projects → *Preview* on a draft; (6) send the contact form → Inquiries.

## 5. How the pieces are secured

* **Drafts** are never public: Payload access control returns published documents to anonymous requests. The website reads drafts only server-side with `CMS_API_KEY`, only in Draft Mode.
* **Preview hand-off:** `/api/preview` (web) → `/api/preview-auth` (CMS, checks the admin's own cookie) → back with a 60-second HMAC over *(slug, expiry)*. No session or secret appears in a URL.
* **Contact form** (`/api/contact` on the website) keeps honeypot, minimum-time check, rate limit, optional Turnstile, optional Resend. Inquiries are stored via the service key; anonymous visitors cannot create inquiries in the CMS directly.
* **Cloudinary signing** (`/api/cloudinary/sign`) lives on the CMS and requires a signed-in admin/editor (service accounts are refused).
* **Cookies:** admin session cookie is `HttpOnly`, `Secure`, `SameSite=Lax`, on the CMS origin only. CORS allows only `WEB_URL`.
* **Revalidation:** the CMS calls `POST WEB_URL/api/revalidate` with `Authorization: Bearer REVALIDATE_SECRET` on publish/unpublish/delete.
* **MongoDB Atlas:** keep Network Access restricted to Render's outbound IPs (Render dashboard → service → *Connect → Outbound*), not `0.0.0.0/0`.

## 6. Local development

```bash
cd apps/cms && cp .env.example .env && npm install && npm run dev   # http://localhost:3001/admin
cd apps/web && cp .env.example .env.local && npm install && npm run dev   # http://localhost:3000
```
For local-only uploads without Blob, set `ALLOW_LOCAL_UPLOADS=1` in the CMS `.env` (never on Render).
