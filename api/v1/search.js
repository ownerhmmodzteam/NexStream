'use strict';

const TYPES = new Set(['ANIME', 'MANHWA', 'FILM']);
const { SOURCES, scrape } = require('../../scrapers/providers');
const { sql } = require('../../lib/db');

async function providerSearch(q, type) {
  const sources = Object.entries(SOURCES).filter(([, source]) => !type || source.type === type).map(([id]) => id);
  const results = await Promise.allSettled(sources.map(source => scrape(source, 1)));
  const items = [];
  const errors = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') items.push(...result.value.items);
    else errors.push({ source: sources[index], message: 'Provider unavailable' });
  });
  const query = q.toLowerCase();
  const seen = new Set();
  const filtered = items.filter(item => item.title.toLowerCase().includes(query)).filter(item => {
    const key = (item.type + ':' + item.title).toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { items: filtered, sources, errors };
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const q = String(req.query.q || '').trim();
  const type = String(req.query.type || '').trim().toUpperCase();
  if (q.length < 2 || q.length > 100) return res.status(400).json({ error: 'Query must contain 2–100 characters' });
  if (type && !TYPES.has(type)) return res.status(400).json({ error: 'Unsupported type' });

  if (process.env.DATABASE_URL) {
    try {
      const pattern = '%' + q + '%';
      const rows = type
        ? await sql`SELECT id,type,title,poster,synopsis,genres,status,release_year,updated_at FROM titles WHERE type = ${type} AND title ILIKE ${pattern} ORDER BY updated_at DESC NULLS LAST LIMIT 40`
        : await sql`SELECT id,type,title,poster,synopsis,genres,status,release_year,updated_at FROM titles WHERE title ILIKE ${pattern} ORDER BY updated_at DESC NULLS LAST LIMIT 40`;
      return res.status(200).json({ items: rows, query: q, type: type || null, page: 1, hasMore: false, mode: 'database' });
    } catch (error) {
      console.error('search_database_fallback', error.message);
    }
  }

  try {
    const result = await providerSearch(q, type || null);
    return res.status(200).json({ items: result.items.slice(0, 40), query: q, type: type || null, page: 1, hasMore: false, mode: 'scrapers', sources: result.sources, providerErrors: result.errors });
  } catch (error) {
    return res.status(502).json({ error: 'Search providers unavailable', query: q, type: type || null });
  }
};
