'use strict';

const { sql } = require('../../lib/db');
const { SOURCES, scrape } = require('../../scrapers/providers');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.ADMIN_API_KEY;
  if (!key || req.headers.authorization !== 'Bearer ' + key) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  }

  const source = String(req.body?.source || '').toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(SOURCES, source)) {
    return res.status(400).json({ error: 'Choose one source: ' + Object.keys(SOURCES).join(', ') });
  }

  try {
    const result = await scrape(source, req.body?.page || 1);
    let saved = 0;
    for (const item of result.items) {
      if (!item.id || !item.title || !['ANIME', 'MANHWA', 'FILM'].includes(item.type)) continue;
      await sql`INSERT INTO titles
        (id,type,title,poster,synopsis,genres,status,release_year,source_id,source_url,updated_at)
        VALUES
        (${item.id},${item.type},${item.title},${item.poster},${item.synopsis},${item.genres},${item.status},${item.release_year},${item.source_id},${item.source_url},NOW())
        ON CONFLICT(id) DO UPDATE SET
          type=EXCLUDED.type,title=EXCLUDED.title,poster=EXCLUDED.poster,
          synopsis=EXCLUDED.synopsis,genres=EXCLUDED.genres,status=EXCLUDED.status,
          release_year=EXCLUDED.release_year,source_id=EXCLUDED.source_id,
          source_url=EXCLUDED.source_url,updated_at=NOW()`;
      saved++;
    }
    return res.status(200).json({
      ok: true, source: result.source, type: result.type,
      page: result.page, received: result.items.length, saved
    });
  } catch (error) {
    console.error('scraper_sync_error', source, error.message);
    return res.status(502).json({ error: 'Scraper provider failed', source });
  }
};
