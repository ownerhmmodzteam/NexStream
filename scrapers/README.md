# Provider adapters

This folder is reserved for provider-neutral metadata adapters for Anime, Manhwa, and Film.

Each adapter must expose a documented contract, normalize results to the shared catalog schema, honor source terms and rate limits, and be tested before registration. Use only authorized metadata/catalog sources and media endpoints. Unreviewed imported scraper modules are not loaded by the API.

Suggested contract:
- `search(query, options)`
- `catalog(options)`
- `detail(id)`

Shared normalized fields: `id`, `type`, `title`, `poster`, `synopsis`, `genres`, `status`, `updatedAt`, and `sourceId`.
