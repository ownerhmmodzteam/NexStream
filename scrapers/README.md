# NexStream metadata scraper integration

Catalog and search endpoints prefer the Neon catalog when DATABASE_URL is configured. If the database is absent or unavailable, they query the metadata adapters in scrapers/providers/index.js and return live catalog items directly.

## Current metadata adapters

| Provider key | Category | Source file in the supplied archive |
| --- | --- | --- |
| animekompi | ANIME | anime/animekompi.js |
| shinigami | MANHWA | Manhwa/shinigami.js |
| awafim | FILM | Film/awafim.js |

The current Vercel adapters are metadata-only implementations aligned to these sources. The supplied CLI scraper files have differing export styles and are not directly imported into the serverless runtime. Their episode/chapter image/download/media resolver commands are not used by catalog ingestion.

## Endpoints

- GET /api/v1/catalog?type=ANIME&page=1&limit=20
- GET /api/v1/catalog?type=MANHWA&page=1&limit=20
- GET /api/v1/catalog?type=FILM&page=1&limit=20
- GET /api/v1/search?q=keyword&type=ANIME

Both endpoints prefer database results when DATABASE_URL is set. If the database is not configured or fails, they use the metadata scraper adapters. Scraper requests have timeouts, partial-provider failures are reported without failing the whole response, and catalog results are deduplicated by normalized title/category.

## Database sync (optional)

POST /api/v1/scraper-sync with a Bearer ADMIN_API_KEY and JSON body {"source":"animekompi","page":1}. The sync route requires DATABASE_URL and is intended for catalog caching.

## Vercel environment variables

- DATABASE_URL (optional for live metadata catalog; required for persistent caching)
- ADMIN_API_KEY (required for protected sync/ingestion endpoints)

Review source terms, access rules, and rate limits before enabling providers. Only metadata fields are returned by these catalog endpoints.
