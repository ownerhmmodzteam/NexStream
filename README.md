# NexStream — Full-Stack Web App

NexStream is a Vercel-hosted website for catalog discovery across Anime, Manhwa, and Film. This repository contains website assets, serverless API functions, and metadata-only catalog adapters. Android/native application files have been removed to keep this repository focused on the website.

## Stack
- Frontend: HTML, CSS, vanilla JavaScript, installable PWA
- Backend: Vercel Serverless Functions (Node.js 20+)
- Optional catalog database: Neon PostgreSQL
- Hosting: Vercel, deploy from `main`

## Local development
1. Install Node.js 20+.
2. Run `npm install`.
3. Run `npx vercel dev`.
4. Run `npm run check`.

## Environment
- `DATABASE_URL`: optional Neon PostgreSQL connection string. Without it, supported metadata adapters provide live catalog/search/detail fallback.
- `ADMIN_API_KEY`: secret for protected sync and ingestion endpoints.

If using Neon, execute `database/schema.sql` first.

## API
- `GET /api/v1/health`
- `GET /api/v1/catalog?type=ANIME|MANHWA|FILM&page=1&limit=20`
- `GET /api/v1/search?q=...`
- `GET /api/v1/detail?id=...`
- `POST /api/v1/catalog-upsert` (Bearer ADMIN_API_KEY)
- `POST /api/v1/scraper-sync` (Bearer ADMIN_API_KEY)

## Metadata provider fallback
Catalog and search prefer PostgreSQL when configured; otherwise they use supported metadata adapters. When a database request fails, they fall back to live metadata. Provider calls are time-bounded, individual provider failures do not stop successful providers, and records are deduplicated.

Detail lookup uses the database first, then falls back to a matching item from the provider's first metadata page. The current enabled adapters are AnimeKompi (Anime), Shinigami (Manhwa), and AwaFim (Film).

The user-supplied scraper archive contains additional provider code. This project does not activate episode/chapter media resolvers or direct stream/download extraction. Provider terms and permission must be reviewed before enabling further metadata adapters.

## Website-only scope
`public/`, `api/`, `scrapers/`, `database/`, and `lib/` are website components. The Android folder is not part of this website and has been removed.

## Deployment
Import the repository into Vercel, set the project root to repository root, optionally configure environment variables, and deploy `main`. Catalog endpoints can operate in metadata-provider mode without Neon.
