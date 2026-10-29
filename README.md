# SPACE / FORM — Pradnya Salunkhe, Interior Design

Portfolio platform: an editorial public site + a CMS at `/admin` + interactive floor-plan and 3D viewers.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Payload CMS 3 (MongoDB Atlas via `@payloadcms/db-mongodb`) · React Three Fiber · Vercel Blob or Cloudflare R2 · Cloudinary (video)

- Architecture, decisions, wireframes, schema, risks → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- How Pradnya edits content → [`docs/CONTENT-GUIDE.md`](docs/CONTENT-GUIDE.md)
- SketchUp → web 3D workflow → [`docs/3D-PIPELINE.md`](docs/3D-PIPELINE.md)

---

## 1. Run it locally

Requirements: Node.js 20.9+ (22 LTS recommended) and, for the CMS, a MongoDB Atlas database.

```bash
npm install            # also copies the Draco/Basis 3D decoders into public/decoders
cp .env.example .env   # then fill it in (see below)
npm run dev            # http://localhost:3000   ·   admin: http://localhost:3000/admin
```

### Two ways to run

| Mode | What you need | What you get |
|---|---|---|
| **CV preview** | nothing — leave `DATABASE_URL` empty | Public site renders straight from `src/content/cv.ts`. Great for reviewing design. `/admin` needs a database. |
| **Full CMS** | `DATABASE_URL` + `PAYLOAD_SECRET` | Everything editable in `/admin`. |

### Full CMS setup (first time)

1. Create a MongoDB Atlas cluster (the free M0 tier is fine for development) → *Database Access*: add a user → *Network Access*: allow your IP (and later Render's) → *Connect → Drivers*: copy the `mongodb+srv://…` string.
2. In `.env`: `DATABASE_URL=mongodb+srv://…/pradnya`, `PAYLOAD_SECRET=$(openssl rand -hex 32)`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
3. `npm run dev`, open `/admin`, create the first admin account.
4. `npm run seed` — loads the CV content (profile, projects, material library, settings). Media (portrait, renders, 360° panoramas) is uploaded in `/admin`; MongoDB stores only references + metadata, the files go to storage.
5. `npm run generate:types` and `npm run generate:importmap` (re-run after changing CMS collections).

## 2. Deploy (Vercel)

1. Push to GitHub → import in Vercel.
2. Set `DATABASE_URL` to the MongoDB Atlas connection string (allow the host's outbound IPs in Atlas *Network Access*).
3. Add **Vercel Blob** storage → sets `BLOB_READ_WRITE_TOKEN` (or configure R2 — see `.env.example`).
4. Set `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL` (your domain), optionally Cloudinary / Resend / Turnstile / analytics keys.
5. No SQL migrations: MongoDB is schemaless, Payload creates collections and indexes itself. Data changes that need reshaping use `npm run migrate:create` / `npm run migrate` (Payload's MongoDB migrations).

Publishing in `/admin` revalidates the site automatically — no redeploy needed for content.

## 3. Project structure

```
src/
  app/(frontend)/        public site (home, work, work/[slug], about, contact, lab, api/*, sitemap, robots, og)
  app/(payload)/         Payload admin + REST API (generated files)
  cms/                   CMS schema — collections, globals, access control, hooks
  components/
    home/ project/ about/ contact/ layout/ ui/
    viewers/             FloorPlanViewer · Panorama360Viewer (+ PanoramaCanvas, R3F) · ModelStage (+ ModelCanvas, R3F) · WalkthroughPlayer
    admin/               Cloudinary uploader + admin branding
  content/cv.ts          CV-derived source content (seed + no-database preview)
  content/demo.ts        generated demonstration data for /lab
  lib/                   content adapter, types, SEO, media helpers, analytics
  styles/tokens.css      design tokens (type scale, spacing, colour, motion)
  styles/globals.css     base + component classes
scripts/                 decoder copy, demo GLB generator
assets/originals/         untouched source files (e.g. the kitchen 360° panorama PNG) — upload these to the CMS; not served by the site
public/demo/             demonstration GLB, plan and poster (for /lab only)
```

## 4. Commands

| Command | Does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run seed` | Load CV content into the CMS (safe to re-run) |
| `npm run generate:types` | Regenerate `src/payload-types.ts` |
| `npm run generate:importmap` | Regenerate the admin component import map |
| `npm run demo:glb` | Rebuild the /lab demonstration model |
| `npx gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp` | Optimise a SketchUp export |
| `npm run typecheck` | TypeScript check |

## 5. Truthfulness rules (keep these)

- Every project carries a status: Portfolio Project / Coursework / Concept / Site Study / Professional Project.
- No invented clients, testimonials, awards, dimensions, years or experience. Empty fields are simply hidden.
- The portrait must be Pradnya's real, approved photograph — never generated.
- `/lab` uses generic demonstration geometry and is labelled as such; it's excluded from search and navigation.
