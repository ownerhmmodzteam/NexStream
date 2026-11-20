'use strict';
const root=document.querySelector('#detail');
const id=new URLSearchParams(location.search).get('id');
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
async function load(){
 if(!id){root.textContent='Missing title id';return}
 try{
  const response=await fetch('/api/v1/detail?id='+encodeURIComponent(id),{cache:'no-store'});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to load title');
  const item=data.item;root.replaceChildren();
  const section=el('section','detail-layout');
  const poster=el('div','detail-poster');
  if(item.poster){const img=el('img');img.src=item.poster;img.alt='';img.onerror=()=>img.remove();poster.append(img)}else poster.append(el('span','poster-fallback',(item.title||'N')[0]));
  const copy=el('div','detail-copy');copy.append(el('span','eyebrow',item.type||'TITLE'),el('h1','',item.title||'Untitled'));
  const meta=[item.status,item.release_year,item.genres?.slice?.(0,3).join(' · ')].filter(Boolean).join('  /  ');
  if(meta)copy.append(el('p','detail-meta',meta));
  copy.append(el('p','detail-synopsis',item.synopsis||'Synopsis is not available yet.'));
  const actions=el('div','detail-actions');
  if(item.type==='ANIME'||item.type==='FILM'){const watch=el('a','btn btn-primary','Watch now  ↗');watch.href='/stream.html?id='+encodeURIComponent(item.id);actions.append(watch)}
  if(item.type==='MANHWA'&&item.source_url){const read=el('a','btn btn-primary','Read chapters  ↗');read.href=item.source_url;read.target='_blank';read.rel='noopener noreferrer';actions.append(read)}
  const save=el('button','btn btn-secondary','＋ Save to library');save.type='button';save.addEventListener('click',()=>{let list=[];try{list=JSON.parse(localStorage.getItem('nexstream:saved')||'[]')}catch{}if(!list.some(x=>x.id===item.id)){list.push(item);localStorage.setItem('nexstream:saved',JSON.stringify(list))}save.textContent='✓ Saved';});actions.append(save);copy.append(actions);
  section.append(poster,copy);root.append(section);
 }catch(error){root.replaceChildren(el('div','empty-state',error.message))}
}
load();