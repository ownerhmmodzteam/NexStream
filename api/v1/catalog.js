const { sql } = require('../../lib/db');
const TYPES = new Set(['ANIME', 'MANHWA', 'FILM']);
module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const type = String(req.query.type || '').trim().toUpperCase();
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
  const limit = Math.min(40, Math.max(1, Number.parseInt(req.query.limit || '20', 10) || 20));
  if (type && !TYPES.has(type)) return res.status(400).json({ error: 'Unsupported type' });
  try {
    const offset = (page - 1) * limit;
    const rows = type
      ? await sql`SELECT id,type,title,poster,synopsis,genres,status,release_year,updated_at FROM titles WHERE type = ${type} ORDER BY updated_at DESC NULLS LAST LIMIT ${limit} OFFSET ${offset}`
      : await sql`SELECT id,type,title,poster,synopsis,genres,status,release_year,updated_at FROM titles ORDER BY updated_at DESC NULLS LAST LIMIT ${limit} OFFSET ${offset}`;
    return res.status(200).json({ items: rows, type: type || null, page, limit, hasMore: rows.length === limit });
  } catch (error) {
    console.error('catalog_error', error.message);
    return res.status(503).json({ error: 'Catalog database unavailable. Configure DATABASE_URL and run database/schema.sql.' });
  }
};
