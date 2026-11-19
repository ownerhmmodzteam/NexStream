const TYPES = new Set(['ANIME', 'MANHWA', 'FILM']);
// Search contract for authorized metadata providers.
module.exports = (req, res) => {
  const q = String(req.query.q || '').trim();
  const type = String(req.query.type || '').trim().toUpperCase();
  if (q.length < 2) return res.status(400).json({ error: 'Query must contain at least 2 characters' });
  if (type && !TYPES.has(type)) return res.status(400).json({ error: 'Unsupported type' });
  res.status(200).json({ items: [], query: q, type: type || null, page: 1, hasMore: false, message: 'Search adapter not connected yet.' });
};
