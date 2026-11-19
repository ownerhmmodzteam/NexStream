# NexStream

Native Android entertainment app with Anime, Manhwa, and Film sections.

## Stack
- Android: Kotlin, Jetpack Compose, MVVM, Room, Retrofit, Media3
- Backend: Vercel Serverless Functions (Node.js)
- Repository: monorepo

## API
- `GET /api/v1/health`
- `GET /api/v1/catalog?type=ANIME|MANHWA|FILM&page=1&limit=20`
- `GET /api/v1/search?q=...&type=ANIME|MANHWA|FILM`

Catalog adapters are intentionally provider-neutral. Connect only sources and media that are authorized for use. Provider modules must be reviewed and tested before integration.


## Status
Bootstrap repository. Android UI, persistence, API, and provider adapters are being implemented in separate modules. This is not a release build.
