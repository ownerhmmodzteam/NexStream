const { sql } = require('../../lib/db');
const TYPES = new Set(['ANIME','MANHWA','FILM']);
module.exports = async (req,res) => {
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  const id=String(req.query.id||'').trim(); const type=String(req.query.type||'').trim().toUpperCase();
  if(!id) return res.status(400).json({error:'id is required'});
  if(type&&!TYPES.has(type)) return res.status(400).json({error:'Unsupported type'});
  try {
    const rows=type?await sql`SELECT id,type,title,poster,synopsis,genres,status,release_year,source_id,source_url,updated_at FROM titles WHERE id=${id} AND type=${type} LIMIT 1`:await sql`SELECT id,type,title,poster,synopsis,genres,status,release_year,source_id,source_url,updated_at FROM titles WHERE id=${id} LIMIT 1`;
    if(!rows.length) return res.status(404).json({error:'Title not found'});
    return res.status(200).json({item:rows[0]});
  } catch(error){console.error('detail_error',error.message);return res.status(503).json({error:'Detail database unavailable'});}
};
