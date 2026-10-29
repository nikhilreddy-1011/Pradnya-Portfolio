# Portfolio-incoming originals

Byte-for-byte copies of the ten interior renders supplied by Pradnya (never edited, resized or re-compressed).

**Original filenames were not preserved** — the images arrived as chat attachments with generated names. The "expected original name" column is the name the brief listed for each image, matched by content/order; it is *unconfirmed*. Rename/replace here if the real files differ.

These PNGs are *not* served by the site. Web versions (JPEG q90, native resolution, no resizing or sharpening) live in `public/projects/<project>/<image>.jpg`; Next.js serves AVIF/WebP from those.

| # | Display name | Expected original name | Archive file | Web file | Pixels | SHA-256 |
|---|---|---|---|---|---|---|
| 1 | The Warm Contemporary Master Bedroom | `bedroom new.png` | `01-warm-contemporary-master-bedroom.png` | `/projects/warm-contemporary-master-bedroom/warm-contemporary-master-bedroom.jpg` | 1886×834 | `0e2982b5f948f643…` |
| 2 | Circular Cove Ceiling & Statement Chandelier | `circle false ceiling 30-9-206.png` | `02-circular-cove-ceiling-chandelier.png` | `/projects/ceiling-lighting-concepts/circular-cove-ceiling-chandelier.jpg` | 1387×1134 | `6a91d7f1debd6519…` |
| 3 | Layered Geometric Ceiling with Cove Lighting | `false ceiling 30-9-2026.png` | `03-layered-geometric-ceiling-cove-lighting.png` | `/projects/ceiling-lighting-concepts/layered-geometric-ceiling-cove-lighting.jpg` | 1443×1090 | `16dfcb3d27a61da1…` |
| 4 | A Playful Pink & Oak Kids' Bedroom | `kids bedroom.png` | `04-playful-pink-oak-kids-bedroom.png` | `/projects/playful-pink-oak-kids-bedroom/playful-pink-oak-kids-bedroom.jpg` | 1357×1159 | `bf09e35b3db3dab1…` |
| 5 | Contemporary Teal Kitchen with Marble Finishes | `kitcehn 26-9-206.png` | `05-contemporary-teal-kitchen-marble-finishes.png` | `/projects/contemporary-teal-kitchen/contemporary-teal-kitchen-marble-finishes.jpg` | 1291×1041 | `7e09789f3e0a4165…` |
| 6 | Living Room with Decorative Swing & Floral Feature Wall | `LIVING ROOM 14-10.png` | `06-living-room-decorative-swing-feature-wall.png` | `/projects/living-room-decorative-swing/living-room-decorative-swing-feature-wall.jpg` | 1388×1133 | `c5f25d6757d19276…` |
| 7 | Contemporary Wardrobe with Open Display Shelving | `open door 1 open shelf.png` | `07-contemporary-wardrobe-open-display-shelving.png` | `/projects/contemporary-wardrobe-open-shelving/contemporary-wardrobe-open-display-shelving.jpg` | 1316×1195 | `7cebe819163b00a5…` |
| 8 | A Refined Study Nook with Illuminated Shelving | `study table 9-10.png` | `08-refined-study-nook-illuminated-shelving.png` | `/projects/refined-study-nook/refined-study-nook-illuminated-shelving.jpg` | 1297×1213 | `2af2c1e3c7055dc7…` |
| 9 | Slatted-Wood TV Wall with Floating Console | `TV UNIT 2ND -7-10(4).png` | `09-slatted-wood-tv-wall-floating-console.png` | `/projects/tv-units-media-walls/slatted-wood-tv-wall-floating-console.jpg` | 1299×1211 | `8b2ad4f1f2750c09…` |
| 10 | Marble Feature TV Wall with Warm-Wood Storage | `TV UNIT 6-10.png` | `10-marble-feature-tv-wall-warm-wood-storage.png` | `/projects/tv-units-media-walls/marble-feature-tv-wall-warm-wood-storage.jpg` | 1690×931 | `bcf5d145f35391ee…` |

None of these are 360° panoramas. They must never be placed in a project's `panorama360` field (the CMS validators enforce a 2:1 ratio there).


## Added later: Café Lumière render + wardrobe 3D model

| Item | Archive file | Served file | Notes | SHA-256 |
|---|---|---|---|---|
| Café Lumière — Elevated Interior & Seating Overview | `11-cafe-lumiere-elevated-interior-seating-overview.png` (3840×2160, RGBA, byte-for-byte) | `/projects/cafe-lumiere/cafe-lumiere-elevated-interior-seating-overview.jpg` (3840×2160, JPEG q90) | The PNG has transparent regions (window glass and the outside corners of the cut-away). The web JPEG is flattened onto the site's paper colour `#fafaf7`; the PNG keeps the alpha. The staged path named in the brief (`public/images/portfolio-incoming/…`) did not exist; this came from the chat attachment. | `498943f3b4aa608a…` |
| Photo-Matched Oak & Ivory Wardrobe (3D) | `wardrobe-photo-matched-oak-ivory.glb` (1,148,660 bytes) | `/models/contemporary-wardrobe-open-shelving/wardrobe-photo-matched-oak-ivory.glb` | Extracted unchanged from the supplied `wardrobe_viewer_standalone.html` (the file embedded it as Base64); the staged path named in the brief did not exist. glTF 2.0, 690 triangles, one PNG facade texture (KHR_materials_unlit). The front faces −Z. | `526774d26e5e784c…` |
| Wardrobe 3D poster | — | `/projects/contemporary-wardrobe-open-shelving/wardrobe-3d-poster.jpg` | A still captured from the site's own viewer showing this GLB from the front (1600×1000). Shown before the model is loaded and as the no-WebGL fallback. | — |


## Added later: Café Lumière interactive 3D model

Source: the supplied `Cafe_Lumiere_Interactive_3D_Viewer.html` (8.9 MB). It was a stand-alone page: three.js 0.160 from a CDN (import map), `OrbitControls`, `GLTFLoader`, `RoomEnvironment`, and the whole model embedded as a Base64 string (`MODEL_B64`). Its controls: orbit (left-drag), zoom (wheel/pinch), pan (right-drag/two fingers), Start/Stop auto-rotate, Show/Hide ceiling (node `Ceiling_Removable_Main_Slab`, hidden by default), Front view, Reset. Only the GLB was taken; the page itself is not used or embedded (no iframe, no CDN).

| Item | Archive file | Served file | Notes | SHA-256 |
|---|---|---|---|---|
| Café Lumière 3D model (full) | `cafe-lumiere-interactive-model.glb` (6,669,240 bytes) | `/models/cafe-lumiere/cafe-lumiere-interactive-model.glb` | Extracted unchanged from the HTML. glTF 2.0 (trimesh), 1,880 meshes / 1,881 nodes, 303,550 triangles, 37 materials, 9 PNG textures. Y-up metres; ~15.2 × 5.8 × 10.0 m. Scene note says it is a reconstruction from one concept render; hidden dimensions and unseen areas are inferred. | `0aef17fbc2da148b…` |
| Café Lumière 3D model (lite) | — (regenerate with `scripts/make-cafe-lite.mjs`) | `/models/cafe-lumiere/cafe-lumiere-interactive-model-lite.glb` (1,214,000 bytes) | The same scene merged by material (1,880 draw calls → 37), meshopt-compressed, textures as WebP q88. `Ceiling_Removable_Main_Slab` kept separate. Used on phones / low-power devices. | `f1db2713e74a45d1…` |
| Café 3D poster | — | `/projects/cafe-lumiere/cafe-lumiere-3d-poster.jpg` (1600×900) | A still captured from the site's own viewer (full model, front-left aerial view). Shown before the model loads and as the no-WebGL fallback. | — |
