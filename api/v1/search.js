const { sql } = require('../../lib/db');
const TYPES = new Set(['ANIME', 'MANHWA', 'FILM']);
module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const q = String(req.query.q || '').trim();
  const type = String(req.query.type || '').trim().toUpperCase();
  if (q.length < 2 || q.length > 100) return res.status(400).json({ error: 'Query must contain 2–100 characters' });
  if (type && !TYPES.has(type)) return res.status(400).json({ error: 'Unsupported type' });
  try {
    const pattern = '%' + q + '%';
    const rows = type
      ? await sql`SELECT id,type,title,poster,synopsis,genres,status,release_year,updated_at FROM titles WHERE type = ${type} AND title ILIKE ${pattern} ORDER BY updated_at DESC NULLS LAST LIMIT 40`
      : await sql`SELECT id,type,title,poster,synopsis,genres,status,release_year,updated_at FROM titles WHERE title ILIKE ${pattern} ORDER BY updated_at DESC NULLS LAST LIMIT 40`;
    return res.status(200).json({ items: rows, query: q, type: type || null, page: 1, hasMore: false });
  } catch (error) {
    console.error('search_error', error.message);
    return res.status(503).json({ error: 'Search database unavailable. Configure DATABASE_URL.' });
  }
};
