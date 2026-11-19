CREATE TABLE IF NOT EXISTS titles (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('ANIME','MANHWA','FILM')),
  title TEXT NOT NULL,
  poster TEXT,
  synopsis TEXT,
  genres TEXT[] NOT NULL DEFAULT '{}',
  status TEXT,
  release_year INTEGER,
  source_id TEXT,
  source_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS titles_type_updated_idx ON titles(type, updated_at DESC);
CREATE INDEX IF NOT EXISTS titles_title_search_idx ON titles USING GIN (to_tsvector('simple', title));
CREATE TABLE IF NOT EXISTS user_library (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title_id TEXT NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'watchlist' CHECK (state IN ('watchlist','watching','completed','dropped')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id,title_id)
);
