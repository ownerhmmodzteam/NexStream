const TYPES = new Set(['ANIME', 'MANHWA', 'FILM']);
// Provider-neutral catalog adapter contract. Wire only verified, authorized catalog sources.
module.exports = (req, res) => {
  const type = String(req.query.type || '').trim().toUpperCase();
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
  const limit = Math.min(40, Math.max(1, Number.parseInt(req.query.limit || '20', 10) || 20));
  if (type && !TYPES.has(type)) return res.status(400).json({ error: 'Unsupported type' });
  res.status(200).json({ items: [], type: type || null, page, limit, hasMore: false, message: 'Catalog adapter not connected yet.' });
};
