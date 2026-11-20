'use strict';
const root=document.querySelector('#streamRoot'),title=document.querySelector('#streamTitle'),subtitle=document.querySelector('#streamSubtitle');
const params=new URLSearchParams(location.search),id=params.get('id');
const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
function message(head,body,link){root.replaceChildren();const box=make('section','empty-state');box.append(make('b','',head),make('p','',body));if(link){const a=make('a','btn btn-secondary','Open source ↗');a.href=link;a.target='_blank';a.rel='noopener noreferrer';box.append(a)}root.append(box)}
function renderPicker(items){
 root.replaceChildren();const grid=make('div','stream-pick-grid');
 items.forEach(item=>{const card=make('a','stream-pick');card.href='/stream.html?id='+encodeURIComponent(item.id);const poster=make('div','stream-pick-poster');if(item.poster){const img=make('img');img.src=item.poster;img.alt='';img.loading='lazy';poster.append(img)}else poster.append(make('span','poster-fallback',(item.title||'N')[0]));const info=make('div','stream-pick-info');info.append(make('b','',item.title||'Untitled'),make('small','',item.type||'ANIME'));card.append(poster,info);grid.append(card)});
 root.append(grid);if(!items.length)message('No titles to stream yet','The catalog has no available titles at the moment.');
}
function renderPlayer(data){
 root.replaceChildren();const layout=make('div','watch-layout'),main=make('section','watch-main'),aside=make('aside','watch-sidebar');
 const player=make('div','video-frame');
 if(data.video){const video=make('video');video.controls=true;video.playsInline=true;video.src=data.video;player.append(video)}
 else if(data.embeds?.length){const frame=make('iframe');frame.src=data.embeds[0];frame.title='Video player';frame.allow='autoplay; fullscreen; picture-in-picture; encrypted-media';frame.allowFullscreen=true;frame.referrerPolicy='no-referrer';player.append(frame)}
 else{player.append(make('div','player-empty','Select an episode to load the player'))}
 main.append(player);
 const sourceBar=make('div','watch-source-row');sourceBar.append(make('span','source-note',data.source?'Source: '+data.source:'Source player'));if(data.sourceUrl){const source=make('a','text-link','Source ↗');source.href=data.sourceUrl;source.target='_blank';source.rel='noopener noreferrer';sourceBar.append(source)}main.append(sourceBar);
 aside.append(make('h2','','Episodes'));
 const list=make('div','episode-list');
 (data.episodes||[]).forEach((episode,index)=>{const button=make('button','episode-button',episode.title||'Episode '+(index+1));button.type='button';button.addEventListener('click',()=>loadEpisode(episode.url,button));list.append(button)});
 if(!data.episodes?.length)list.append(make('p','empty-note','No episode list was found for this title.'));
 aside.append(list);layout.append(main,aside);root.append(layout);
 if(data.embeds?.length||data.video)title.textContent=data.title||'Now playing';
}
async function loadEpisode(url,button){
 document.querySelectorAll('.episode-button').forEach(b=>b.classList.remove('active'));button.classList.add('active');
 const frame=document.querySelector('.video-frame');frame.replaceChildren(make('div','player-empty','Loading episode…'));
 try{const response=await fetch('/api/v1/stream?id='+encodeURIComponent(id)+'&episode='+encodeURIComponent(url),{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Episode unavailable');frame.replaceChildren();
  if(data.video){const video=make('video');video.controls=true;video.playsInline=true;video.src=data.video;frame.append(video)}
  else if(data.embeds?.length){const iframe=make('iframe');iframe.src=data.embeds[0];iframe.title='Video player';iframe.allow='autoplay; fullscreen; picture-in-picture; encrypted-media';iframe.allowFullscreen=true;iframe.referrerPolicy='no-referrer';frame.append(iframe)}
  else{frame.append(make('div','player-empty','No embedded player found. Use the source link below.'))}
  const source=document.querySelector('.watch-source-row');if(data.sourceUrl){let a=source.querySelector('a');if(!a){a=make('a','text-link','Source ↗');source.append(a)}a.href=data.sourceUrl}
 }catch(error){frame.replaceChildren(make('div','player-empty',error.message))}
}
async function init(){
 if(!id){title.textContent='Choose something to watch';subtitle.textContent='Browse the anime catalog and open a title to see its episodes.';try{const r=await fetch('/api/v1/catalog?type=ANIME&limit=30',{cache:'no-store'});const d=await r.json();renderPicker(d.items||[])}catch{message('Catalog unavailable','Please return to Discover and try again.')}return}
 try{const r=await fetch('/api/v1/stream?id='+encodeURIComponent(id),{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Stream data unavailable');title.textContent=d.title||'Stream';subtitle.textContent=d.type||'Now playing';renderPlayer(d);if(!d.episodes?.length&&!d.video&&!d.embeds?.length)message('No playable episodes found','This provider did not return episode or player data yet.',d.sourceUrl)}
 catch(error){message('Stream could not be opened',error.message)}
}
init();