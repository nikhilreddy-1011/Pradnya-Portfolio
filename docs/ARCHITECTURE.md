# SPACE / FORM — Architecture & Design Plan

Portfolio platform for **Pradnya Salunkhe** — interior design (certification in progress), Pune.
Source of truth for facts: her CV (Sept 2026). Nothing in this document or the codebase invents clients, awards, dates, measurements or experience.

---

## 1. Final creative direction

**"An architectural magazine you can walk into."**

The site reads like a printed interiors monograph — generous margins, a single serif voice, quiet tracked captions — and then, at the moments where it earns it, opens into drawings and space: a floor plan you can pan, a model you can orbit, a walkthrough you can play.

The narrative spine is the design sequence itself:

```
PLAN  →  FORM  →  MATERIAL  →  SPACE  →  EXPERIENCE
```

It appears as a running index line on the homepage and structures every case study.

| Decision | Choice | Why |
|---|---|---|
| Display type | **Instrument Serif** (400 + italic) | Contemporary, slightly condensed editorial serif. Reads "architecture journal", not "wedding invitation" (Cormorant's risk). Only one weight is needed, so the font payload is tiny. |
| UI / body type | **Manrope** (variable 400–700) | Geometric-humanist, excellent in small tracked uppercase captions (metadata, nav, buttons) and comfortable for body copy. |
| Palette | Ivory `#F5F1E8`, Soft White `#FAFAF7`, Charcoal `#1D1D1B`, Taupe `#A79A88`, Terracotta `#A65F45` (accent, used sparingly) | Warm, material, recedes behind renders. Terracotta is also a real Café Lumière material, so the accent has a reason to exist. Charcoal sections are used for "into the space" moments (3D, walkthrough) so renders glow. |
| Image treatment | Full-bleed or large asymmetric frames, no rounded corners, no drop shadows, thin 1px hairlines | Architectural drawings and printed monographs, not app cards. |
| Motion | Slow (600–1000 ms), eased, mostly opacity + small translate + gentle image scale | Calm. Everything turns off under `prefers-reduced-motion`. |
| Technology | Appears only in the case study (plan, 3D, walkthrough) and never on top of a render | "Make the design work the hero." |

## 2. Why this direction fits Pradnya

- She is early in design practice but late in professional maturity (8+ years in credit management). An **editorial, restrained** site signals that maturity without overstating design experience — the confidence comes from composition, not claims.
- Her work is **plan-first** (AutoCAD layouts, space planning, circulation). A case study that leads with the plan and *then* builds space shows how she thinks, which is what employers and studios look for in a junior designer.
- Her CV states she is **seeking an internship**. The site therefore speaks to two readers at once: studios/recruiters (skills, process, CV download, availability) and future clients (spaces, materials, "Have a space in mind?").
- The banking years are presented as a **strength** (client handling, detail, budget and timeline discipline — all CV-stated), not hidden.

## 3. Sitemap

```
/                       Home
/work                   Project archive (filterable, index + visual views)
/work/[slug]            Case study (e.g. /work/cafe-lumiere)
/about                  About, transferable strengths, skills, journey, education, site visits
/contact                Inquiry form + direct contact
/lab                    Viewer preview (noindex) — demonstrates floor-plan + 3D + build sequence
                        with generic demonstration geometry until real project assets are uploaded
/admin                  Payload CMS (authenticated)
/api/contact            Inquiry endpoint (validated, rate-limited, honeypot, optional Turnstile)
/api/preview            Draft preview (requires admin session)
/api/cloudinary/sign    Signed upload params for large video uploads (requires admin session)
/sitemap.xml /robots.txt /og (default share image)
```

Process is a homepage section (`/#process`) rather than its own page — it's short and belongs in the narrative. The nav item jumps there.

## 4. Homepage wireframe

```
┌──────────────────────────────────────────────────────────────┐
│ PRADNYA SALUNKHE                    WORK  PROCESS  ABOUT  CONTACT │  ← transparent over hero, becomes
│                                                              │    ivory + hairline on scroll
│                [ FULL-BLEED INTERIOR RENDER ]                │
│                                                              │
│  INTERIOR DESIGN                               ┌────┐        │
│  Spaces shaped                                 │ ▢  │ portrait│
│  around the way                                └────┘        │
│  we live.                                   PRADNYA SALUNKHE │
│                                             INTERIOR DESIGNER│
│  EXPLORE WORK ↓                             Pune · Cert. in progress
└──────────────────────────────────────────────────────────────┘
  PLAN — FORM — MATERIAL — SPACE — EXPERIENCE   (index line)
  One-paragraph positioning + "Open to internship opportunities"

  SELECTED SPACES                                              ─ varied compositions ─
  01 ┌──────────────────────── full-bleed render ───────────────┐
     CAFÉ LUMIÈRE   French-inspired commercial café · 1,350 sq.ft.  VIEW PROJECT →
  02 ┌── large render (7 cols) ──┐   metadata column (4 cols)
  03 metadata (4 cols)   ┌── tall render (6 cols) ──┐

  [STEP INSIDE — charcoal band]   only when a featured project has a 3D model

  THE DESIGN PROCESS  (01 Understand … 07 Present — horizontal rail on desktop, stacked on mobile)

  A DIFFERENT PERSPECTIVE ON SPACE  (portrait + transition story + link to About)

  ON-SITE LEARNING  2 residential site visits · execution · material application · sequencing

  HAVE A SPACE IN MIND?  email · phone · inquiry CTA
  Footer
```

## 5. Project detail (case study) wireframe

```
01 · COMMERCIAL INTERIOR · PORTFOLIO PROJECT / COURSEWORK
CAFÉ LUMIÈRE                                   (display serif, 56–76px)
Area 1,350 sq.ft. │ Type Commercial café │ Tools AutoCAD │ Status Coursework
[ HERO RENDER / VIDEO — full-bleed ]
─ sticky chapter index (desktop, 3+ chapters): Concept · Brief · Planning · Plan · 360° · 3D · Walkthrough · Materials · Gallery
THE CONCEPT           short editorial statement (serif) + paragraph
THE BRIEF / PROGRAMME list of spaces from the CV (window seating, sofa corners…)
SPACE PLANNING        text + image
FLOOR PLAN            interactive plan: pan / zoom / pinch / rooms / furnished toggle / fullscreen
                      room panel: "Living Room — View in 3D →"
360° SPACE            "Step inside the kitchen" — equirectangular panorama, one per room (room switcher if several)
3D MODEL              poster → "Load interactive model (x MB)" → build sequence → orbit, hotspots
WALKTHROUGH           poster → HLS adaptive video, captions
MATERIALS             swatches (texture image or indicative tone) + application + room
VISUALIZATION         large renders, alternating layouts
GALLERY               masonry-free editorial grid + accessible lightbox (<dialog>)
DESIGN DETAILS        numbered notes
NEXT PROJECT →        full-width teaser
```
Every section is rendered only if the CMS has data for it — no empty chapters, no invented content.

## 6. Floor plan → 3D experience

**Floor plan (2D)** — `FloorPlanViewer`
- Plan image (SVG/PNG/WebP exported from AutoCAD) + optional *furnished* variant.
- Rooms are polygons in percentage coordinates, edited in the CMS (`x,y x,y …`). Names, optional dimension text (only if supplied), optional link to a 3D camera view.
- Interaction: wheel/pinch zoom around pointer, drag pan, +/−/reset, fullscreen, keyboard (arrow pan, +/− zoom), room list mirrored as buttons for screen readers.
- "View in 3D →" dispatches a `focus-room` event; the 3D viewer loads (if needed), scrolls into view and flies the camera to that room's preset.

**3D viewer** — `ModelViewer` (React Three Fiber + drei), code-split and client-only
- Shows the poster first. Loads only on intent ("Load interactive model · 8.2 MB"). Download progress is **real bytes** via a streamed `fetch` (no fake percentages).
- GLB/glTF with Draco + Meshopt decoders self-hosted in `/public/decoders`. KTX2 textures supported via the optimisation pipeline.
- Orbit (drag / one-finger), zoom (wheel / pinch), pan (right-drag / two-finger), damped and clamped so the camera can't clip into walls or flip under the floor; Reset, Fullscreen, Furniture toggle, Layers.
- Hotspots (numbered, from CMS) open a small information panel (Lighting / Sofa / Material…).
- Lighting is procedural (Lightformers) — no external HDR download.
- The canvas uses a warm light-grey ground (#EBE6DD): models read like a physical architectural model, and the floor-level plan reads as a line drawing. Tuned against headless renders of the demonstration model.

**Signature build sequence** — plan → walls rise → floor → furniture → materials → lighting
- Driven by **node-naming conventions** in the exported GLB, so it works with any real SketchUp model:
  `wall*`, `floor*`, `furn*`, `light*` (+ everything else = "detail"). Before materials appear, meshes render in a warm clay material; then the original materials fade in; then light fixtures glow.
- Plays once when the model first appears, can be replayed; reduced-motion and low-power devices get the final state instantly.
- If the GLB doesn't follow the convention, the viewer simply shows the model (graceful degradation).

**Asset pipeline (designer → web)**
```
SketchUp (.skp) ──export──▶ glTF/GLB (SketchUp glTF exporter / via Blender)
      ▼
gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp --texture-size 2048
      ▼   (target: < 15 MB desktop model; optional "lite" variant < 5 MB for mobile)
Upload in /admin → 3D Assets (+ poster render, hotspots, room camera presets)
```
Raw .skp files are never loaded in the browser.

**Fallbacks** — no WebGL / WebGL context lost / model 404 / low-power (`saveData`, ≤2 GB `deviceMemory`, reduced motion + small screen): poster render + "Interactive 3D is unavailable on this device. View the project renders instead." + walkthrough link if present. Never a blank canvas.

**360° space** — `Panorama360Viewer` (+ `PanoramaCanvas`, R3F; `panorama/controller.ts`, `panorama/sources.ts`)
- Kept strictly separate from the cover: `coverImage` is an ordinary render (validated — the admin rejects Media of kind *panorama* or any image used as one of the project's 360° views); the panorama appears only in the 360° chapter.
- CMS: *Projects → Plans, 360°, 3D & Video → 360° views* = field **`panorama360[]`** (separate from `coverImage`) — { room label, `image` (master, 8192×4096 recommended, 2:1 validated), `imageStandard` (optional 4096×2048, 2:1 validated), starting direction, starting tilt }. The adapter turns these into `sources[]` (`kind: 'equirect'`, smallest first); `kind` leaves room for a tiled / multi-resolution format later without changing callers.
- Source choice (`planPanoramaLoad`): the largest file within min(GPU `MAX_TEXTURE_SIZE`, 8192 desktop / 4096 phones & low-memory devices); if nothing fits, the smallest is downscaled during decode (`createImageBitmap`). The original file is uploaded to the GPU — never a thumbnail or optimiser copy.
- Camera: `PerspectiveCamera` fixed at the sphere centre `[0,0,0]`; only direction (yaw/pitch via `lookAt`, no roll) and `fov` change. Mapping: inside of a 128×64 UV sphere (`scale(-1,1,1)`), sRGB, tone mapping off, `RepeatWrapping` across the seam, trilinear mipmaps + anisotropy ≤ 8. Verified pixel-exact (≤ 1 px) against an independent reference projection in 11 states: default, cursor-follow left/up, zoom steps, both zoom limits, fullscreen, phone portrait/landscape, 8K.
- FOV: default 62° vertical capped at 92° horizontal (70° vertical on portrait screens); zoom-out ≤ 75° vertical / 100° horizontal; zoom-in stops where one panorama texel would cover 2 screen px (≥ 1.3×, ≤ 20° vertical) — ~1.3× for the current 1774 px file, ~3.1× for an 8K master.
- Interaction: cursor-follow ±9° / ±4°, eased (desktop, off under reduced motion); drag overrides it and hands back without a jump; ≤ 60°/s release with fast decay (≈ 2° settle); wheel zoom only after clicking (or ctrl/⌘/trackpad pinch/fullscreen); pinch; +/−; animated reset; fullscreen (API + CSS fallback); keyboard.
- Performance: loads within 600 px of the viewport; streamed with real progress; render-on-demand; paused off-screen; DPR ≤ 2 desktop / 1.5 phones / 1 low-power; resources disposed and WebGL context released on unmount; files cached per session.
- **Source limitation (current kitchen file, 1774 × 887):** measured with a correct projection, its straight worktop edge bows ~2–2.5 % of its length (a true panorama: ~0.1 %) and the camera sits very close to the cabinetry. These are properties of the image, not the viewer; a true 8K spherical render from SketchUp removes both.

## 7. Admin / CMS architecture

**Payload CMS 3** runs *inside* the same Next.js app at `/admin`.

| Dashboard group | Collection / Global | Notes |
|---|---|---|
| Projects | `projects` | Drafts + versions + autosave, preview, publish/unpublish, delete. Slug auto from title. Ordering + featured flag. SEO group. |
| Taxonomy | `categories` | Residential / Commercial / … — archive filters are generated from this. |
| Media library | `media` | Images (JPEG/PNG/WebP/AVIF/SVG), required alt text, caption, focal point, project link. |
| Floor plans | `floor-plans` | Plan image, furnished variant, rooms (polygon, label, dimensions, 3D link). |
| 3D assets | `models` | GLB/glTF upload (extension + size validated), poster, file size, hotspots, camera presets, build-sequence toggle, optional lite variant. |
| Videos | `videos` | Cloudinary public ID (uploaded with chunked, resumable widget) **or** a short MP4 from `documents`; poster; captions (.vtt); duration. |
| Materials | `materials` | Reusable material library (name, texture/swatch image, indicative tone, description). Projects reference them with a per-project application/room. |
| Documents | `documents` | PDFs (CV, portfolio), captions (.vtt), short MP4 clips. |
| Inquiries | `inquiries` | Contact-form submissions (read/update only by admins). |
| Users | `users` | Admin accounts (auth, lockout after failed attempts). |
| Profile | global `profile` | Name, role line, photo, bio, contact, education, experience, skills, strengths, achievements, languages, site visits, social links (empty until supplied), CV file. |
| Settings | global `site-settings` | Hero image/copy, process steps, inquiry project types, SEO defaults, OG image, analytics toggle. |

Publishing triggers on-demand revalidation (`revalidatePath`) so the public site updates within seconds without a redeploy.

## 8. Database / content schema (MongoDB Atlas via Payload `@payloadcms/db-mongodb`)

Documents only; every upload field is a reference (ObjectId) to a Media/Document/Model record, whose file lives in storage (Vercel Blob / R2 / Cloudinary) — no binary data in MongoDB.

```
Project
  id, title, slug*, number, order, featured, _status(draft|published)
  category → Category            typology (e.g. "French-inspired commercial café")
  credibility: portfolio-coursework | portfolio | coursework | concept | site-study | professional
  location?, year?, area?        (optional — never invented)
  summary, concept, brief, programme[] {item}, spacePlanning
  tools[] (AutoCAD | SketchUp | V-Ray | …)
  materials[] {material → Material, application?, room?}
  palette[] {name, hex}
  coverImage → Media, gallery[] {image → Media, caption?, room?, layout: full|half|tall}
  floorPlans[] → FloorPlan, models[] → Model3D, videos[] → Video
  beforeAfter[] {before → Media, after → Media, caption}   (for future real projects only)
  designDetails[] {title, text}
  seo {title, description, image → Media, noindex}
  createdAt, updatedAt

Category      id, title, slug, order
Material      id, name, texture → Media?, tone (hex)?, description?
Media         id, url, filename, mimeType, filesize, width, height, focalX, focalY, alt*, caption, project → Project
Document      id, url, mimeType, filesize, title, kind (cv|portfolio|captions|video|other)
FloorPlan     id, title, project → Project, image → Media*, furnishedImage → Media?, scaleNote?,
              rooms[] {name, key, points "x,y x,y…", dimensions?, description?, view3d?}
Model3D       id, url (upload), filesize, title, project → Project, poster → Media, lite → Model3D?,
              buildSequence (bool), hotspots[] {label, title, text, position "x,y,z"},
              views[] {key, label, position "x,y,z", target "x,y,z"}
Video         id, title, project → Project, provider (cloudinary|file), cloudinaryPublicId?,
              file → Document?, poster → Media*, captions → Document?, duration?, aspect
Inquiry       id, name, email, phone?, projectType?, message, source, userAgent, createdAt, status
Profile(g)    name, role, statusLine, availability, location, email, phone, photo → Media,
              about{headline, intro, body}, transferable[], education[], experience[],
              skillGroups[] {title, items[]}, strengths[], achievements[], languages[],
              siteVisits{count, title, text, points[]}, socialLinks[], cv → Document
SiteSettings(g) hero{eyebrow, headline, image, mobileImage}, processSteps[], projectTypes[],
              seo{title, description, ogImage}, analytics{enabled}
```
Future-ready without schema rewrites: testimonials, services, journal, bookings and multi-language slot in as new collections; `credibility = professional` + `beforeAfter` already cover real client work; `seo.noindex` + unlisted drafts cover private pages.

## 9. Recommended tech stack (and where I changed the brief)

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 16** (App Router, RSC), TypeScript, React 19 | Static-first pages with on-demand revalidation, image optimisation, metadata API, route handlers. |
| Styling | **Tailwind CSS 4** + CSS custom-property tokens | Tokens live in one file (`tokens.css`) and are exposed to Tailwind via `@theme`. |
| CMS | **Payload 3** (changed from Sanity/Supabase) | Admin UI, auth, drafts, versions, access control and uploads generated from typed config, living in the same repo and deploy. Supabase would require hand-building the entire admin; Sanity adds a separate hosted studio, query language and plan limits. Payload = one codebase, one deploy, a database you own. |
| Database | **MongoDB Atlas** (`@payloadcms/db-mongodb`) | Document store for content + media metadata; Atlas backups / point-in-time restore. |
| Images / plans / GLB / PDF | Payload uploads → **Vercel Blob** (default) or **Cloudflare R2** via S3 adapter, **client-side direct uploads** | Large files go browser → storage directly, never through the 4.5 MB serverless body limit. R2 recommended once 3D/renders grow (zero egress fees). |
| Image delivery | `next/image` (AVIF/WebP, responsive `srcset`, lazy) | No second image CDN needed. |
| Video | **Cloudinary** — chunked/resumable Upload Widget, HLS with `sp_auto` adaptive ladder, `f_auto,q_auto` MP4 fallback, poster frames | Adaptive streaming without running a transcoder. |
| 3D | three.js + **React Three Fiber 9** + drei 10 | Declarative scene, `useGLTF` with Draco/Meshopt, OrbitControls, Html hotspots. |
| Animation | **CSS + IntersectionObserver** (no GSAP / Framer Motion) (changed) | Everything requested is achievable without a 40–60 KB motion library; the 3D build sequence uses R3F's own frame loop. |
| Auth | Payload auth (HTTP-only cookies, lockout, CSRF protections) | |
| Spam | Honeypot + time-trap + per-IP rate limit, optional **Cloudflare Turnstile** | No CAPTCHA friction by default. |
| Email | Optional Resend (plain `fetch`) notification; inquiries always stored in the CMS | Works even without an email provider. |
| Analytics | **Plausible / Umami** (cookieless) via a tiny `track()` helper, off unless configured | Privacy-first, no consent banner needed. |
| Hosting | **Vercel** (Node runtime) | Payload officially supports it; zero-config previews. |

## 10. Media architecture

```
 Admin browser ──(signed/direct PUT)──▶ Blob / R2   (images, plans, GLB, PDFs)
       │                                   │
       └──metadata──▶ Payload (MongoDB) ◀─┘ url, size, mime, dims, alt, focal point
 Admin browser ──(chunked, resumable)──▶ Cloudinary (video)  ──publicId──▶ Payload
 Public page ── next/image ──▶ AVIF/WebP responsive variants (lazy, sized)
 Public page ── hls.js (dynamic import) / native HLS ──▶ Cloudinary sp_auto .m3u8
 Public page ── fetch (streamed, real progress) ──▶ GLB ──▶ R3F
```
Rules: alt text required; SVG only ever rendered through `<img>` (scripts can't execute) and served from the storage origin; uploads restricted by MIME/extension and size (images 25 MB, GLB 100 MB, documents 25 MB); video size handled by Cloudinary chunking.

## 11. Performance architecture

- Server components by default; client JS only for header, reveal observer, filters, contact form, plan viewer, lightbox, video, 3D.
- `three` / R3F / drei / hls.js are **dynamic imports** — zero bytes on first load. 3D loads only on user intent.
- Hero image `priority` + `fetchPriority="high"`, everything else lazy with explicit `sizes`.
- Fonts: `next/font` self-hosted, `display: swap`, only Instrument Serif 400/italic + Manrope variable; preloaded.
- Static generation + on-demand revalidation; `generateStaticParams` for case studies.
- Video: `preload="none"`, poster only until play; adaptive bitrate.
- 3D: meshopt/Draco, ≤2K textures (KTX2/WebP), `dpr={[1, 1.75]}`, frameloop `demand` after build sequence, shadows baked or contact-only, lite model for mobile.
- Budgets: home JS < 120 KB gz, LCP < 2.5 s on 4G, CLS < 0.05.

## 12. Mobile strategy

Designed, not shrunk: hero headline sits over a mobile-specific crop (`hero.mobileImage`), identity block collapses to a compact row under the headline; nav becomes a full-height drawer; project compositions become single-column with generous vertical rhythm; plan viewer supports pinch/pan and fullscreen; 3D uses the lite model when available, one-finger orbit, two-finger pan/zoom, and a poster fallback on low-power devices; videos poster-first, full width, native controls.

## 13. SEO strategy

Per-page `generateMetadata` (title template, description, canonical, Open Graph, Twitter), CMS SEO overrides per project, dynamic OG images, `sitemap.xml` from published projects, `robots.txt` (disallow `/admin`, `/api`, `/lab`), JSON-LD: `Person` (jobTitle, address locality, knowsAbout = CV skills), `WebSite`, and `CreativeWork` per case study (`creativeWorkStatus`, `genre`, `keywords`). No ratings, no reviews, no fake organisations.

## 14. Accessibility strategy

Semantic landmarks + skip link; one `h1` per page; visible `:focus-visible` rings in terracotta; colour contrast ≥ 4.5:1 for text (taupe is only used for large text/lines); all images require alt text in the CMS; lightbox uses native `<dialog>` (focus trap, Esc); 3D and plan viewers have keyboard controls, labelled buttons and a text alternative (room list / hotspot list); videos support captions; all motion disabled under `prefers-reduced-motion`; forms have labels, inline errors announced via `aria-live`.

## 15. Security strategy

Secrets only in server env (`PAYLOAD_SECRET`, `DATABASE_URL`, storage tokens, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`); nothing prefixed `NEXT_PUBLIC_` except public IDs. Admin: Payload auth, `maxLoginAttempts` + lockout, no public registration (users can only be created by an admin), role field for future editors. Access control: public read only for `published` projects and public media; inquiries admin-only. Upload validation (MIME + extension + size) server-side; Cloudinary uploads signed server-side after verifying the admin session. Contact endpoint: validation, length limits, rate limiting, honeypot, optional Turnstile. Security headers (CSP-lite, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame-ancestors). Backups: Atlas backups / PITR + storage versioning.

## 16. Development roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 | Design system, homepage, archive, case-study template, about, contact, CMS schema, media architecture, plan viewer + 3D viewer prototypes, seed from CV | **This delivery** |
| 2 | Real assets: portrait, renders, AutoCAD plan exports, SketchUp → GLB, walkthroughs. Visual QA against real imagery; tune palette from renders | Needs Pradnya's files |
| 3 | Visual room-polygon editor in admin, per-room camera preset capture from the 3D viewer, lite-model auto-selection | |
| 4 | Journal, services, downloadable portfolio PDF, WhatsApp CTA, before/after on first professional project | Optional |

## 17. Risks & solutions

| Risk | Mitigation |
|---|---|
| No real imagery yet → site looks unfinished | Architectural placeholder system that keeps layout intact; launch checklist requires cover image + portrait before going public. |
| Heavy SketchUp exports (100+ MB, 8K textures) | gltf-transform pipeline + upload size limit + lite model + poster fallback. |
| WebGL crashes on low-end phones | Capability check, context-loss handler, poster/video fallback, intent-only loading. |
| Overstating experience | Credibility field on every project, "certification in progress" wording in profile, copy reviewed against CV. |
| Vercel 4.5 MB body limit | Client-side direct uploads to Blob/R2; chunked Cloudinary uploads for video. |
| Content editor friction (polygon coordinates) | Documented workflow now; visual editor in Phase 3. |
| CMS/DB outage | Static pages keep serving last good render; contact form falls back to mailto. |
| Spam | Honeypot + time-trap + rate limit + optional Turnstile. |

## 18. Build & verification status (this delivery)

Done in the build sandbox (npm registry was blocked there, so `npm install` / `next build` could not run):

- **All 82 TypeScript files parse cleanly** (TypeScript compiler, syntax pass).
- **Tailwind 4.3.3** compiles `globals.css` + every class used, with no errors.
- **Real pages rendered and screenshotted** (home, work, case study, about, contact, 404, lab) at 390 / 834 / 1440 px by transpiling the actual components into static HTML: no horizontal overflow, typography and layouts as designed.
- **Interactive islands tested in Chromium with the real React 19.2.6**: floor plan (zoom, pan, pinch path, room click, keyboard, "View in 3D" hand-off), 3D stage state machine (intent-loading, streamed GLB download, pending room view, controls, hotspots), archive filters + URL state, gallery lightbox (open / arrows / Esc), contact validation, mobile menu — 23/23 checks pass.
- **3D build sequence verified with three.js r185** on the generated demonstration GLB: plan line drawing → walls rise → floor → furniture → materials → light, rendered headlessly and tuned.

Still to run on a machine with npm access (first thing after `npm install`):

1. `npm run build` — full Next.js + Payload type-check/build.
2. `npm run generate:importmap` and `npm run generate:types`.
3. Open `/lab` and click *Explore in 3D* to see the real R3F viewer (the sandbox tested it with a stand-in canvas).
4. Create the admin user, `npm run seed`, upload the portrait and renders.

## Image delivery notes (interior concept renders)

- `next.config.ts` → `images.qualities: [75, 80, 82, 90]`. Next 16 serves **only** the listed qualities (default 75); without this the `quality={82}`/`{90}` props on `Picture` and the lightbox were silently coerced to 75.
- `RENDER_SIZES` (`components/project/gallery-constants.ts`) is shared by the hero and the stacked renders so the browser downloads one file for both.
- Source renders are 1.1–1.9k px wide and are never upscaled by the optimiser; they are crisp at 1× desktop and 2× phone, but are not 4K assets.
- Status values `design-study`, `portfolio-concept`, `concept-render` were added (string enums: no change needed on MongoDB; the legacy Postgres schema would need a migration — Postgres is retained only for an explicit `postgres://` URL).
