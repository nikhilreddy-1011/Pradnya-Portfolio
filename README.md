# Pradnya Salunkhe — Portfolio

Two independently deployable apps:

| App | Purpose | Host |
|---|---|---|
| [`apps/web`](apps/web) | Public portfolio website (Next.js) — homepage, work, 3D / 360° / floor-plan viewers | Vercel |
| [`apps/cms`](apps/cms) | Payload CMS admin + REST API (MongoDB Atlas, Vercel Blob media) | Render |

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for settings, environment variables and the deployment order.
Other docs in `docs/` describe the original design and content model (written before the split — paths there refer to the old single-app layout).
