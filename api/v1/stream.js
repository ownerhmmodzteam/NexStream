'use strict';
const {SOURCES,scrape}=require('../../scrapers/providers');
const {sql}=require('../../lib/db');
const ALLOWED={animekompi:['animekompi.sbs'],shinigami:['shinigami.mx'],awafim:['theawafim.net']};
function validUrl(value,hosts){try{const u=new URL(value);return u.protocol==='https:'&&hosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h))?u:null}catch{return null}}
function decode(value=''){return String(value).replace(/&amp;/g,'&').replace(/&#038;/g,'&').replace(/&quot;/g,'"').replace(/&#0?39;|&apos;/g,"'").replace(/\\u0026/g,'&').replace(/\\\//g,'/')}
function extractLinks(html,base){
 const found=new Map(),re=/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;
 while((m=re.exec(html))!==null){const href=decode(m[1]),label=decode(m[2].replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim());if(!/(episode|eps?|watch|stream|part|chapter)/i.test(label+' '+href))continue;try{const u=new URL(href,base);if(u.protocol!=='https:'||u.hostname!==new URL(base).hostname)continue;if(!found.has(u.href))found.set(u.href,{title:label||'Episode',url:u.href})}catch{}}
 return [...found.values()].slice(0,100).reverse();
}
function extractMedia(html,base){
 const embeds=new Set(),videos=new Set(),patterns=[/<iframe[^>]+(?:src|data-src)=["']([^"']+)["']/gi,/<video[^>]+(?:src|data-src)=["']([^"']+)["']/gi,/<source[^>]+src=["']([^"']+)["']/gi];
 for(let i=0;i<patterns.length;i++){let m;while((m=patterns[i].exec(html))!==null){try{const u=new URL(decode(m[1]),base);if(u.protocol!=='https:')continue;if(i===0)embeds.add(u.href);else videos.add(u.href)}catch{}}}
 const direct=html.match(/https?:\/\/[^"'\s<>]+\.(?:mp4|m3u8)(?:\?[^"'\s<>]*)?/gi)||[];
 for(const value of direct){try{const u=new URL(decode(value.replace(/\\/g,'')));if(u.protocol==='https:')videos.add(u.href)}catch{}}
 return {embeds:[...embeds].slice(0,8),videos:[...videos].slice(0,8)};
}
async function getItem(id,type){
 if(process.env.DATABASE_URL){try{const rows=type?await sql`SELECT id,type,title,poster,synopsis,source_id,source_url FROM titles WHERE id=${id} AND type=${type} LIMIT 1`:await sql`SELECT id,type,title,poster,synopsis,source_id,source_url FROM titles WHERE id=${id} LIMIT 1`;if(rows.length)return rows[0]}catch(error){console.error('stream_db_fallback',error.message)}}
 const source=id.split(':',1)[0];if(!Object.prototype.hasOwnProperty.call(SOURCES,source)||!ALLOWED[source])return null;
 if(type&&SOURCES[source].type!==type)return null;const result=await scrape(source,1);return result.items.find(item=>item.id===id)||null;
}
async function fetchSource(url,hosts){
 let response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; NexStream/1.0)','Accept':'text/html,application/xhtml+xml'},signal:AbortSignal.timeout(12000),redirect:'manual'});
 if([301,302,303,307,308].includes(response.status)){const location=response.headers.get('location');const next=location?validUrl(new URL(location,url).href,hosts):null;if(!next)throw new Error('Source redirected to an unsupported host');response=await fetch(next.href,{headers:{'User-Agent':'Mozilla/5.0 (compatible; NexStream/1.0)','Accept':'text/html,application/xhtml+xml'},signal:AbortSignal.timeout(12000),redirect:'manual'});}
 if(!response.ok)throw new Error('Source returned HTTP '+response.status);
 const finalUrl=validUrl(response.url||url,hosts);if(!finalUrl)throw new Error('Source redirected to an unsupported host');return {response,finalUrl};
}
module.exports=async(req,res)=>{
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const id=String(req.query.id||'').trim(),episode=String(req.query.episode||'').trim(),type=String(req.query.type||'').trim().toUpperCase();
 if(!id)return res.status(400).json({error:'id is required'});if(type&&!['ANIME','FILM'].includes(type))return res.status(400).json({error:'Unsupported stream type'});
 try{
  const item=await getItem(id,type||null);if(!item)return res.status(404).json({error:'Title not found'});
  const sourceId=String(item.source_id||id.split(':',1)[0]),hosts=ALLOWED[sourceId]||[],base=validUrl(item.source_url,hosts);if(!base)return res.status(422).json({error:'This provider does not expose a supported source page'});
  const target=episode?validUrl(episode,hosts):base;if(!target)return res.status(400).json({error:'Episode URL is not allowed for this provider'});
  const {response,finalUrl}=await fetchSource(target.href,hosts),html=await response.text(),media=extractMedia(html,finalUrl.href);
  return res.status(200).json({id:item.id,title:item.title,type:item.type,source:sourceId,sourceUrl:finalUrl.href,episodes:episode?[]:extractLinks(html,finalUrl.href),embeds:media.embeds,videos:media.videos,video:media.videos[0]||null});
 }catch(error){console.error('stream_provider_error',error.message);return res.status(502).json({error:'Unable to load stream data from this provider'});}
};