# Content guide — for Pradnya

Everything on the site is edited at **yoursite.com/admin**. You never need to touch code.

## Before launch — the essentials

1. **Profile → Identity → Profile photo.** Upload your approved portrait (at least 1600 px tall). Then click the image and set the *focal point* on your face, so every crop (home, about, contact) stays centred.
2. **Site Settings → Homepage → Hero image.** Your strongest interior render, landscape, 2400 px+ wide. Optionally a portrait crop for phones.
3. **Each project → Overview → Cover image.** One ordinary, single-view hero render per project — **never a 360° panorama** (the admin refuses panoramas here).
4. **Profile → Identity → Downloadable CV** (PDF) — a "Download CV" button appears on About.

Until these are uploaded the site shows neat, labelled placeholders — never fake photos.

## Adding a project

**Projects → Create new**

| Tab | What to fill |
|---|---|
| Overview | Title, Category, **Status** (be accurate — e.g. *Portfolio Project / Coursework*), project type, area / year / location *only if known*, short description, tools, cover image |
| Story | One-line concept, concept, brief, programme (list of spaces), space planning, design details |
| Plans, 360°, 3D & Video | Link floor plans, add 360° views (one per room), and link 3D assets and videos you've created in the Library |
| Materials | Pick materials from the library and add where they're used |
| Gallery | Renders. *Full width* images appear in "Visualisation"; *Half/Tall* form the gallery |
| SEO | Optional custom title/description/share image. "Unlisted" hides the project from lists and search but keeps its link working |

**Save draft** → **Preview** (opens the page as visitors will see it) → **Publish**. Unpublish any time.

Tick **Featured** to show a project under *Selected spaces* on the homepage. **Order** controls the 01 / 02 / 03 numbering.

## Interior concept renders (projects 05–12)

Ten ordinary single-view renders are organised into eight projects (two of them hold two images each). They are editorial groupings of **concept work** — never claims of built or commissioned projects — so no client, area, year, location, budget or software is stated.

| Field | How it is used |
|---|---|
| Cover image | A normal render (never a panorama — the CMS blocks panoramas here). The hero adapts to the render's proportions: standard landscape keeps the 16:9 crop; ultra-wide and near-square renders are shown whole. Set the **focal point** so card crops keep the subject. |
| Gallery items (Layout = *Full*) | One per render. **Room / space** = the professional title, **Caption** = the short description. Single-render projects show the render in the hero (click opens the lightbox); multi-render projects show each render with its own title and description. |
| 360° views | Left empty for these projects — the 360° section only appears when a genuine 2:1 equirectangular panorama is attached. |
| Status | *Concept Render*, *Design Study* or *Portfolio Concept* (added to the Status list). |

Originals are kept untouched in `assets/originals/portfolio-incoming/` (see its `MANIFEST.md`); web versions are in `public/projects/<project>/`. Until the CMS is connected the site reads these from `src/content/cv.ts`. When publishing through the CMS: upload each web file in **Media** (alt text from `cv.ts`), then attach it as the project's *Cover image* and as a *Gallery* item (Layout: Full) — never as a 360° view.

## Floor plans

1. Export the plan from AutoCAD as **SVG** (best — stays sharp when zoomed) or a large PNG/WebP (3000 px+).
2. **Floor Plans → Create new** → upload it. Optionally upload a furnished version.
3. Add **rooms**. Each room is an outline in percentages of the image, starting from the top-left corner:
   `12,20 48,20 48,60 12,60` = a rectangle from 12 % across/20 % down to 48 % across/60 % down.
   Tip: open the image in any viewer that shows pixel coordinates, then divide by the image width/height × 100.
4. Only enter **dimensions** that are on your drawing.
5. **Key** links the room to a 3D view (e.g. `living-room`) so visitors can jump from plan to model.

## 360° views

A 360° view lets visitors stand inside a room and look around. It is separate from the cover: the cover is an ordinary render, the panorama only appears in the *360° space* section.

1. Render a **true 360° panorama** from the SketchUp scene with a spherical camera (V-Ray, Enscape, Twinmotion or D5) — an *equirectangular* image, exactly **2:1**. See `3D-PIPELINE.md` for the settings.
   - **Master:** 8192 × 4096 px (4096 × 2048 minimum).
   - **4K version (optional but recommended):** the same render at 4096 × 2048, for phones.
2. **Media Library → Create new** → upload each file, write the alt text (what's in the room), set *Kind* to **Panorama**.
3. Open the project → **Plans, 360°, 3D & Video → 360° views → Add** → room name (e.g. *Kitchen*), choose the **master** and, if you made one, the **4K version**.
4. **Starting direction** — where the view first looks: take the horizontal position of the part you want to face, divide by the image width, × 360. (0 = left edge, 180 = centre.) **Starting tilt** — usually 0; a few degrees negative (−3 to −6) looks slightly down at worktops.
5. Save → Preview → Publish. Several rooms? Add one row each — visitors get a room switcher.

The site picks the right file per device (8K on capable desktops, 4K on phones) and refuses images that aren't 2:1. Zoom-in depth grows automatically with the resolution you upload: a 4K–8K master allows close-ups of handles and tiles; a small image only allows a little zoom, because the detail isn't in the file.

**Living-space 360° (TV Units & Media Walls):** `public/panoramas/tv-units-media-walls-panorama.jpg` (original kept in `assets/originals/`). The file as supplied is **2576 × 1288**, so it is soft when zoomed — it is not a 4K/8K render. To upgrade, upload a true 4096 × 2048 (standard) and 8192 × 4096 (master) panorama of the same room in the project's *360° views* row; no code changes. *Intro line* (optional) is the sentence under the section title; *Starting direction / tilt* set the first view (this one: 181° / −9°, framing the TV wall and console).

## 3D models

See `3D-PIPELINE.md`. In short: SketchUp → export glTF/GLB → optimise → **3D Assets → Create new** → upload the `.glb`, a poster render, optional room views and hotspots.

## Walkthrough videos

**Videos → Create new** → *Cloudinary* → **Upload video to Cloudinary** (large files upload in chunks and resume if the connection drops) → add a poster image → optional captions (.vtt) → link the video to the project.

## Materials

**Materials** is your reusable library. Upload a real photo/scan of each material when you can; the "indicative tone" colour is only a stand-in and is labelled as such on the site.

## Inquiries

Messages from the contact form arrive in **Inquiries** (and by email if configured). Mark them *Replied* or *Archived* to keep the inbox tidy.
