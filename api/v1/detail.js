const TYPES = new Set(['ANIME', 'MANHWA', 'FILM']);
module.exports = async (req, res) => {
  const id = String(req.query.id || '').trim();
  const type = String(req.query.type || '').trim().toUpperCase();
  if (!id) return res.status(400).json({ error: 'id is required' });
  if (type && !TYPES.has(type)) return res.status(400).json({ error: 'Unsupported type' });
  // Detail providers are registered only after authorization and adapter tests.
  return res.status(404).json({ error: 'Title not found', id, type: type || null });
};
