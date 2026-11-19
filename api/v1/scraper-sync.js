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
    const items = result.items.filter(item =>
      item.id && item.title && ['ANIME', 'MANHWA', 'FILM'].includes(item.type)
    );
    if (!items.length) {
      return res.status(200).json({
        ok: true, source, type: result.type, page: result.page, received: 0, saved: 0
      });
    }

    // One parameterized database statement avoids a per-item round trip.
    await sql`INSERT INTO titles
      (id,type,title,poster,synopsis,genres,status,release_year,source_id,source_url,updated_at)
      SELECT x.id,x.type,x.title,x.poster,x.synopsis,x.genres,x.status,x.release_year,x.source_id,x.source_url,NOW()
      FROM jsonb_to_recordset(${JSON.stringify(items)}::jsonb) AS x(
        id text,type text,title text,poster text,synopsis text,genres text[],
        status text,release_year integer,source_id text,source_url text
      )
      ON CONFLICT(id) DO UPDATE SET
        type=EXCLUDED.type,title=EXCLUDED.title,poster=EXCLUDED.poster,
        synopsis=EXCLUDED.synopsis,genres=EXCLUDED.genres,status=EXCLUDED.status,
        release_year=EXCLUDED.release_year,source_id=EXCLUDED.source_id,
        source_url=EXCLUDED.source_url,updated_at=NOW()`;

    return res.status(200).json({
      ok: true, source: result.source, type: result.type,
      page: result.page, received: result.items.length, saved: items.length
    });
  } catch (error) {
    console.error('scraper_sync_error', source, error.message);
    return res.status(502).json({ error: 'Scraper provider failed', source });
  }
};
