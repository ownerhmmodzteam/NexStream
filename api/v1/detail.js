'use strict';

const TYPES = new Set(['ANIME','MANHWA','FILM']);
const { SOURCES, scrape } = require('../../scrapers/providers');
const { sql } = require('../../lib/db');

async function fromProvider(id, type) {
  const sourceId = id.split(':', 1)[0];
  if (!Object.prototype.hasOwnProperty.call(SOURCES, sourceId)) return null;
  if (type && SOURCES[sourceId].type !== type) return null;
  // Detail fallback is intentionally bounded to the provider's first metadata page.
  const result = await scrape(sourceId, 1);
  return result.items.find(item => item.id === id) || null;
}

module.exports = async (req,res) => {
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  const id=String(req.query.id||'').trim();
  const type=String(req.query.type||'').trim().toUpperCase();
  if(!id) return res.status(400).json({error:'id is required'});
  if(type&&!TYPES.has(type)) return res.status(400).json({error:'Unsupported type'});

  if(process.env.DATABASE_URL) {
    try {
      const rows=type
        ? await sql`SELECT id,type,title,poster,synopsis,genres,status,release_year,source_id,source_url,updated_at FROM titles WHERE id=${id} AND type=${type} LIMIT 1`
        : await sql`SELECT id,type,title,poster,synopsis,genres,status,release_year,source_id,source_url,updated_at FROM titles WHERE id=${id} LIMIT 1`;
      if(rows.length) return res.status(200).json({item:rows[0],mode:'database'});
    } catch(error) {
      console.error('detail_database_fallback',error.message);
    }
  }

  try {
    const item=await fromProvider(id,type||null);
    if(!item) return res.status(404).json({error:'Title not found in catalog providers'});
    return res.status(200).json({item,mode:'scraper'});
  } catch(error) {
    console.error('detail_provider_error',error.message);
    return res.status(502).json({error:'Detail providers unavailable'});
  }
};
