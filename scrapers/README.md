# Scraper/provider adapter integration

The web application consumes normalized catalog records from PostgreSQL. Provider adapters belong in this directory and should expose metadata-only operations for sources whose terms permit automated catalog access.

Normalized record:
```json
{"id":"provider:stable-id","type":"ANIME","title":"Example title","poster":"https://...","synopsis":"...","genres":["Action"],"status":"Ongoing","release_year":2026,"source_id":"provider-id","source_url":"https://authorized-source.example/title"}
```

The ingestion API is `POST /api/v1/catalog-upsert` with `Authorization: Bearer $ADMIN_API_KEY` and body `{"items":[...]}`. Batch size is limited to 100. The supplied scraper ZIP contains mixed module styles and media/stream extraction methods; those files are not auto-executed. Review and adapt metadata-only functions individually, honor source terms/rate limits, and never expose private keys or unauthorized media resolvers.
