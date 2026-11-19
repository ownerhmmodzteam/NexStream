# NexStream — Full-Stack Web App

NexStream is a responsive, installable web app for discovering Anime, Manhwa, and Film. It uses a Vercel serverless Node.js backend and PostgreSQL catalog storage.

## Stack
- Frontend: HTML, CSS, vanilla JavaScript, PWA service worker
- Backend: Vercel Serverless Functions (Node.js 20+)
- Database: Neon PostgreSQL via `@neondatabase/serverless`
- Hosting: Vercel; deploy from the `main` branch

## Local development
1. Install Node.js 20+.
2. Run `npm install`.
3. Install Vercel CLI and run `npx vercel dev`.
4. Configure environment variables described below.
5. Run `npm run check`.

## Environment variables
- `DATABASE_URL`: Neon PostgreSQL connection string.
- `ADMIN_API_KEY`: long random secret used only by trusted catalog ingestion jobs.

Run `database/schema.sql` against the database before using catalog APIs.

## API
- `GET /api/v1/health`
- `GET /api/v1/catalog?type=ANIME|MANHWA|FILM&page=1&limit=20`
- `GET /api/v1/search?q=...`
- `GET /api/v1/detail?id=...&type=...`
- `POST /api/v1/catalog-upsert` (requires Bearer ADMIN_API_KEY)

## Catalog ingestion
Provider adapters should normalize authorized metadata into the shared schema in `scrapers/README.md`, then submit batches to the protected ingestion endpoint. The uploaded scraper archive contains mixed CLI/module patterns and media extraction routines. Those sources are not blindly executed or exposed as public stream resolvers. Review metadata-only functionality, verify source authorization, and set secrets only in Vercel Environment Variables.

## Deployment
Import this repository into Vercel, keep the project root at the repository root, and deploy. Add `DATABASE_URL` and `ADMIN_API_KEY` in Vercel Project Settings. Execute `database/schema.sql` once in Neon.

## Current limitations
The frontend and API/database contracts are committed, but catalog data is empty until an authorized metadata adapter is implemented and ingested. Guest watchlist is stored locally in the current browser. Authentication, cross-device sync, full detail/player workflows, and production deployment verification remain future work. This is not yet a production streaming release.
