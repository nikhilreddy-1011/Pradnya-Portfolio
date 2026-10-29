# SketchUp → web 3D pipeline

Browsers can't open `.skp` files. Every model goes through: **export → optimise → upload**.

## 1. Prepare in SketchUp

- Purge unused components/materials (*Window → Model Info → Statistics → Purge Unused*).
- Hide or delete what visitors shouldn't see (site context, people, hidden construction geometry).
- **Name top-level groups** so the site's *plan → space* build sequence can animate them:

| Group / tag name starts with | Meaning | Build stage |
|---|---|---|
| `wall` | walls, partitions | Walls rise |
| `floor` | floor finishes, slabs | Floor |
| `furn` or `furniture` | loose + fixed furniture | Furniture (also the "Furniture" toggle) |
| `light` or `lamp` | light fixtures | Glow during "Light" |
| `ceil` | ceilings | Hidden by default (cut-away view), "Ceiling" toggle |

Anything else appears with the walls. A model without these names still works — the build sequence just has fewer stages.

## 2. Export

Use a glTF/GLB exporter if your SketchUp version or an Extension Warehouse extension provides one.
Otherwise: export `.dae` or `.fbx` → open in Blender (free) → *File → Export → glTF 2.0 (.glb)*.
Units: metres. Y-up (default for glTF).

## 3. Optimise (required)

```bash
npx gltf-transform optimize model.glb model-web.glb \
  --compress meshopt --texture-compress webp --texture-size 2048
```

Targets: **< 15 MB** desktop model. For phones, optionally make a lite version:

```bash
npx gltf-transform optimize model.glb model-lite.glb \
  --compress meshopt --texture-compress webp --texture-size 1024 --simplify-ratio 0.5
```

Check the result at <https://gltf-viewer.donmccurdy.com> before uploading.

## 4. Upload

**3D Assets → Create new**: upload `model-web.glb`, a **poster** render (shown before loading and as the fallback), link the lite version if you made one.

- **Room views** — camera presets: key (e.g. `kitchen`), label, camera position and look-at point in metres (`x, y, z`). The key matches the floor-plan room key.
- **Hotspots** — numbered points: tag (LIGHTING / SOFA / MATERIAL…), title, text, position `x, y, z`.

Tip for coordinates: in SketchUp, hover the point and read the position from the Measurements box; convert to metres. SketchUp's Z-up becomes glTF's Y-up, so `(x, y, z)` in SketchUp → `(x, z, −y)` on the site.

## How the site loads 3D

- Nothing 3D is downloaded until the visitor presses **Explore in 3D** (file size shown on the button).
- Download progress is real bytes; Draco/Meshopt/KTX2 decoders are self-hosted.
- Low-power devices, reduced-motion users and phones get the lite model / no build animation.
- No WebGL, a failed download, or a lost GPU context → the poster stays with a link to the renders. Never a blank box.

`/lab` shows the whole flow with a generated demonstration model (`npm run demo:glb`).

## 360° panoramas (V-Ray / Enscape / Twinmotion / D5)

For the *360° space* chapter (see `CONTENT-GUIDE.md` → 360° views). Render it from the **original SketchUp scene** — the viewer can only show the geometry the image contains; an image painted or generated to *look* like a panorama keeps its bent lines no matter how it is displayed.

**Camera**
- Type: *Spherical* / *360° panorama* (V-Ray: Camera type → Spherical, FOV 360°; Enscape: *Render Panorama → Mono*; Twinmotion: *Panorama* → *Equirectangular*; D5: *Panorama*).
- **Level** — zero tilt, zero roll. Any tilt makes vertical edges lean as visitors look around.
- Height: standing eye level, **1.5–1.6 m**.
- Position: where a person would stand to take in the room — for a kitchen, roughly **2.5–3 m back from the main worktop run** (e.g. near the opposite wall or the doorway), not in the middle of the L. Too close and the cabinetry wraps half-way round the viewer, so any normal field of view feels cramped.

**Output**
- Exactly **2:1**. **Master: 8192 × 4096 px.** Minimum 4096 × 2048. Also export a **4096 × 2048** copy for phones.
- JPEG, quality 90–95, sRGB. No sharpening, no vignetting, no lens distortion, no text/watermark.
- Keep the exposure and white balance the same as the still renders so the 360° view matches the rest of the case study.

**Check before uploading:** open it in any 360° viewer and look along the worktops and cabinet tops — they must stay perfectly straight as you turn.

## Cover render (separate from the panorama)

The project cover is an ordinary single-view render, not a crop of the panorama:
- Normal (rectilinear) camera, **24–35 mm** equivalent, two-point perspective (camera level, vertical lines vertical).
- Landscape, **at least 2400 px wide** (3000–3840 px ideal); optionally a portrait crop for phones.
- One strong viewpoint of the kitchen (e.g. the L-corner with hood and cooktop).


## Lite versions for heavy models

Models with many small meshes (a furnished café can have ~1,900) are slow on phones because every mesh is a draw call. `scripts/make-cafe-lite.mjs` shows the recipe with glTF-Transform: anonymise nodes (except the cut-away ceiling), `flatten` + `join` (merge by material), `weld`, `dedup`, `prune`, WebP textures and meshopt compression. For Café Lumière this took the model from 1,880 meshes / 6.7 MB to 37 meshes / 1.2 MB with the same look. Upload it as the model's **Lite** asset; the viewer chooses it for small screens, Save-Data, slow connections and low-memory/low-core devices.
