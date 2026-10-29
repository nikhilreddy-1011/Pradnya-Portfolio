# Applying the Café Lumière 3D update (Windows)

This update adds the interactive Café Lumière 3D model to the existing `cafe-lumiere` project. It keeps the wardrobe viewer, the café render and everything else as they were.

**Before you start:** this update builds on the previous one (Café render + wardrobe 3D, `cafe-wardrobe-update.zip`). Apply that first if you have not — this zip contains the café-3D changes only and edits files that the earlier zip changed (`cv.ts`, `ModelCanvas.tsx`, `ModelStage.tsx`, `Models.ts`, …).

## 1. Back up (30 seconds)
Copy your project folder, e.g. `D:\Pradnya Portfolio\pradnya-portfolio` → `D:\Pradnya Portfolio\pradnya-portfolio-backup`. If you use Git: `git status` should be clean, then commit afterwards.

## 2. Stop the dev server
In the terminal that is running `npm run dev`, press `Ctrl + C`.

## 3. Unzip over the project
1. Right-click `cafe-3d-model-update.zip` → **Extract All…**
2. Choose `D:\Pradnya Portfolio\pradnya-portfolio` as the destination (the zip's folders — `src`, `public`, `docs`, `assets`, `scripts` — merge into your project).
3. When Windows asks, choose **Replace the files in the destination**.

Nothing needs deleting. New files: `public\models\cafe-lumiere\*.glb` (two models), `public\projects\cafe-lumiere\cafe-lumiere-3d-poster.jpg`, `scripts\make-cafe-lite.mjs`, `assets\originals\portfolio-incoming\cafe-lumiere-interactive-model.glb`, this guide.

## 4. Run it
```
cd "D:\Pradnya Portfolio\pradnya-portfolio"
npm install
npm run dev
```
`npm install` is only needed if you have not run it since the earlier updates; no new packages were added by this update.

Open http://localhost:3000/work/cafe-lumiere and scroll to **Interactive 3D model**, then press **Explore in 3D**.

## 5. Check
- The café model loads (about 6.7 MB on a computer, 1.2 MB on a phone) and shows the café with its seating, counter and feature wall.
- Drag to rotate, scroll to zoom, right-drag to pan; **Auto-rotate**, **Ceiling**, **Front view**, **Reset** and the arrow/zoom buttons work.
- The wardrobe page (`/work/contemporary-wardrobe-open-display-shelving`) still has its own 3D viewer.

For a production check run `npm run build` then `npm start`.

## If something looks wrong
- **Section missing / old page**: stop the server, delete the `.next` folder, run `npm run dev` again.
- **Model says "could not be loaded"**: confirm both `.glb` files exist in `public\models\cafe-lumiere\` (about 6.7 MB and 1.2 MB). Windows sometimes blocks extraction of large files — extract again with **Extract All**.
- **Blank 3D area**: your browser has WebGL turned off or is blocking hardware acceleration (Chrome → Settings → System → "Use graphics acceleration"). The page then shows a message and the normal render instead.
- To undo everything, restore the backup folder from step 1.

## CMS note (when you move content into the admin)
In **Library → 3D Assets** create the café model with *Kind = Room*, upload the full `.glb`, set the poster, add the lite `.glb` as **Lite**, set the camera (position −5.4, 9.7, 14 · target 0, 2.05, 0) and a room view "Front view" (position 0, 8.2, 17.8 · target 0, 2.2, 0), then attach it to the Café Lumière project. Until the site is switched to the CMS (`DATABASE_URL`), the content comes from `src/content/cv.ts`, which this update already edits.
