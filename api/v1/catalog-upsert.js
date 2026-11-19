const { sql } = require('../../lib/db');
const TYPES = new Set(['ANIME','MANHWA','FILM']);
module.exports = async (req,res) => {
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const expected=process.env.ADMIN_API_KEY;
  if(!expected || req.headers.authorization !== 'Bearer '+expected) return res.status(401).json({error:'Unauthorized'});
  const items=Array.isArray(req.body?.items)?req.body.items:[];
  if(!items.length || items.length>100) return res.status(400).json({error:'items must contain 1–100 records'});
  try {
    let saved=0;
    for(const item of items){
      const id=String(item.id||'').trim(),type=String(item.type||'').toUpperCase(),title=String(item.title||'').trim();
      if(!id||id.length>180||!TYPES.has(type)||!title||title.length>300) continue;
      const genres=Array.isArray(item.genres)?item.genres.map(String).slice(0,20):[];
      await sql`INSERT INTO titles(id,type,title,poster,synopsis,genres,status,release_year,source_id,source_url,updated_at)
        VALUES(${id},${type},${title},${item.poster||null},${item.synopsis||null},${genres},${item.status||null},${Number.isInteger(item.release_year)?item.release_year:null},${item.source_id||null},${item.source_url||null},NOW())
        ON CONFLICT(id) DO UPDATE SET type=EXCLUDED.type,title=EXCLUDED.title,poster=EXCLUDED.poster,synopsis=EXCLUDED.synopsis,genres=EXCLUDED.genres,status=EXCLUDED.status,release_year=EXCLUDED.release_year,source_id=EXCLUDED.source_id,source_url=EXCLUDED.source_url,updated_at=NOW()`;
      saved++;
    }
    return res.status(200).json({ok:true,saved,received:items.length});
  } catch(error){console.error('ingest_error',error.message);return res.status(503).json({error:'Catalog ingestion failed'});}
};
