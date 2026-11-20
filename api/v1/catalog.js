'use strict';

const TYPES = new Set(['ANIME', 'MANHWA', 'FILM']);
const { SOURCES, scrape } = require('../../scrapers/providers');
const { sql } = require('../../lib/db');

function getSources(type) {
  return Object.entries(SOURCES).filter(([, source]) => !type || source.type === type).map(([id]) => id);
}

async function providerCatalog(type, page) {
  const sources = getSources(type);
  const results = await Promise.allSettled(sources.map(source => scrape(source, page)));
  const items = [];
  const errors = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') items.push(...result.value.items);
    else errors.push({ source: sources[i], message: 'Provider unavailable' });
  }
  const seen = new Set();
  const unique = items.filter(item => {
    const key = (item.type + ':' + item.title).toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { items: unique, errors, sources };
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const type = String(req.query.type || '').trim().toUpperCase();
  const page = Math.min(5, Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1));
  const limit = Math.min(40, Math.max(1, Number.parseInt(req.query.limit || '20', 10) || 20));
  if (type && !TYPES.has(type)) return res.status(400).json({ error: 'Unsupported type' });

  // Database remains preferred when configured; scraper catalog is the live fallback.
  if (process.env.DATABASE_URL) {
    try {
      const offset = (page - 1) * limit;
      const rows = type
        ? await sql`SELECT id,type,title,poster,synopsis,genres,status,release_year,updated_at FROM titles WHERE type = ${type} ORDER BY updated_at DESC NULLS LAST LIMIT ${limit} OFFSET ${offset}`
        : await sql`SELECT id,type,title,poster,synopsis,genres,status,release_year,updated_at FROM titles ORDER BY updated_at DESC NULLS LAST LIMIT ${limit} OFFSET ${offset}`;
      return res.status(200).json({ items: rows, type: type || null, page, limit, hasMore: rows.length === limit, mode: 'database' });
    } catch (error) {
      console.error('catalog_database_fallback', error.message);
    }
  }

  try {
    const result = await providerCatalog(type || null, page);
    const items = result.items.slice(0, limit);
    return res.status(200).json({ items, type: type || null, page, limit, hasMore: result.items.length > limit, mode: 'scrapers', sources: result.sources, providerErrors: result.errors });
  } catch (error) {
    return res.status(502).json({ error: 'Catalog providers unavailable', type: type || null, page });
  }
};
