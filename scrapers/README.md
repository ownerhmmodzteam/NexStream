# NexStream metadata scraper integration

The website reads its catalog from PostgreSQL. Metadata adapters run server-side and send normalized records to the catalog database; browser clients never contact scraper providers directly.

## Integrated metadata providers

| Source | Category | Catalog method |
| --- | --- | --- |
| AnimeKompi | Anime | Anime catalog API |
| Shinigami | Manhwa | Manga directory API |
| AwaFim | Film | Movie listing page |

These adapters are based on the supplied scraper collection. They only collect catalog metadata (title, poster, synopsis, genres, status, year, and source page). They do not call episode, chapter-image, download, subtitle, or media-stream resolvers.

## Sync one provider

Send a POST request to `/api/v1/scraper-sync`:

```bash
curl -X POST "https://YOUR-DOMAIN/api/v1/scraper-sync" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source":"animekompi","page":1}'
```

Supported source values: `animekompi`, `shinigami`, `awafim`. Pages are limited to 1–5 and each run is limited to one provider/page to keep serverless execution bounded. Repeat with another source/page to populate more catalog entries.

## Environment

Set `DATABASE_URL` and a strong `ADMIN_API_KEY` in Vercel. Execute `database/schema.sql` against the Neon database first. Never put either secret in frontend code.

## Add another supplied scraper

Add a metadata-only adapter to `providers/index.js`, normalize its output to the shared record shape, and register its category. Review the source's terms, access rules, and rate limits before enabling it. Do not expose scraper internals or provider credentials to the browser.
