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
3. Run `npx vercel dev`.
4. Configure the environment variables below.
5. Run `npm run check`.

## Environment variables
- `DATABASE_URL`: Neon PostgreSQL connection string.
- `ADMIN_API_KEY`: strong secret used only by trusted catalog sync requests.

Run `database/schema.sql` against Neon before using catalog APIs.

## API
- `GET /api/v1/health`
- `GET /api/v1/catalog?type=ANIME|MANHWA|FILM&page=1&limit=20`
- `GET /api/v1/search?q=...`
- `GET /api/v1/detail?id=...&type=...`
- `POST /api/v1/catalog-upsert` (Bearer ADMIN_API_KEY)
- `POST /api/v1/scraper-sync` (Bearer ADMIN_API_KEY; metadata sync from one configured provider)

## Scraper integration
The supplied scraper collection is connected through server-side metadata adapters:
- AnimeKompi → Anime catalog
- Shinigami → Manhwa directory
- AwaFim → Film catalog

The sync endpoint accepts one source and one page per request. This keeps provider calls bounded and prevents scraper work from slowing down normal visitor requests. The website continues to read the normalized PostgreSQL catalog through `/api/v1/catalog`. See [scrapers/README.md](scrapers/README.md) for the request example.

Only catalog metadata is ingested. Episode/chapter media extraction, downloads, subtitles, and direct-stream resolvers are not exposed by this integration. Additional supplied providers can be added as metadata-only adapters after their source rules and rate limits are reviewed.

## Deployment
Import this repository into Vercel with the repository root as the project root. Add `DATABASE_URL` and `ADMIN_API_KEY` in Vercel Project Settings. Execute `database/schema.sql` once in Neon, then deploy the `main` branch.

## Current limitations
The catalog is populated only after database setup and a successful authenticated scraper sync. This integration has not yet been verified against live provider responses or a deployed Vercel environment. Authentication, cross-device library sync, and full lawful playback integrations remain separate work.
