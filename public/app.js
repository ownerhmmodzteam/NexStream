'use strict';
const API='/api/v1';
const $=s=>document.querySelector(s);
const catalog=$('#catalog'),title=$('#sectionTitle'),desc=$('#sectionDesc'),count=$('#resultCount'),toast=$('#toast');
let activeType='',searchTimer=0,requestController=null;
$('#year').textContent=new Date().getFullYear();
const labels={
 home:['Find something worth your time.','A fresh place to start.'],
 anime:['Anime worth following.','Series and stories to get into.'],
 manhwa:['One more chapter.','Illustrated stories, collected in one place.'],
 film:['Pick a film for tonight.','A good story deserves your full attention.'],
 library:['Your saved titles.','Everything you decided to keep.']
};
function notify(message){toast.textContent=message;toast.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove('show'),2300)}
function setActive(route){document.querySelectorAll('[data-route]').forEach(el=>{const active=el.dataset.route===route;el.classList.toggle('active',active);el.classList.toggle('selected',active)})}
function route(type){
 const routeName=labels[type]?type:'home';
 activeType=routeName==='anime'?'ANIME':routeName==='manhwa'?'MANHWA':routeName==='film'?'FILM':'';
 setActive(routeName);title.textContent=labels[routeName][0];desc.textContent=labels[routeName][1];
 if(routeName==='library'){loadLibrary();return}
 loadCatalog();
}
function makeCard(item){
 const card=document.createElement('article');card.className='media-card';card.tabIndex=0;card.setAttribute('role','link');card.setAttribute('aria-label','Open '+(item.title||'title'));
 const poster=document.createElement('div');poster.className='poster';
 if(item.poster){const img=document.createElement('img');img.loading='lazy';img.alt='';img.src=item.poster;img.onerror=()=>img.remove();poster.append(img)}
 else{const fallback=document.createElement('span');fallback.className='poster-fallback';fallback.textContent=(item.title||'N').slice(0,1).toUpperCase();poster.append(fallback)}
 const tag=document.createElement('span');tag.className='type-tag';tag.textContent=item.type||'TITLE';poster.append(tag);
 const info=document.createElement('div');info.className='media-info';
 const h=document.createElement('h3');h.textContent=item.title||'Untitled';
 const p=document.createElement('p');p.textContent=item.status||item.release_year||item.year||'Explore title';
 info.append(h,p);card.append(poster,info);
 const open=()=>{if(item.id)location.href='/detail.html?id='+encodeURIComponent(item.id)};
 card.addEventListener('click',open);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
 return card;
}
function renderItems(items){
 catalog.replaceChildren();
 if(!items.length){const empty=document.createElement('div');empty.className='empty-state';const h=document.createElement('b');h.textContent='Nothing here yet';const p=document.createElement('p');p.textContent='Try another category or come back later.';empty.append(h,p);catalog.append(empty);return}
 items.forEach(item=>catalog.append(makeCard(item)));
}
function setFeatured(item){
 if(!item)return;
 const art=$('#featuredArt');const img=document.createElement('img');img.className='featured-image';img.alt='';img.src=item.poster||'';img.onerror=()=>img.remove();
 const old=art.querySelector('.featured-image');if(old)old.remove();if(item.poster)art.prepend(img);
 $('#featuredTitle').textContent=item.title||'Featured title';$('#featuredType').textContent=item.type||'NEXSTREAM PICK';
 art.onclick=()=>{if(item.id)location.href='/detail.html?id='+encodeURIComponent(item.id)};art.classList.add('is-clickable');
}
async function loadCatalog(){
 if(requestController)requestController.abort();requestController=new AbortController();
 catalog.innerHTML='<div class="loading-card"><span class="loader"></span><p>Loading titles…</p></div>';
 try{
  const q=new URLSearchParams({page:'1',limit:'30'});if(activeType)q.set('type',activeType);
  const response=await fetch(API+'/catalog?'+q,{signal:requestController.signal,cache:'no-store'});
  if(!response.ok)throw new Error('Catalog unavailable');
  const data=await response.json();const items=data.items||[];renderItems(items);if(!activeType)setFeatured(items[0]);
  count.textContent=items.length+' titles';
 }catch(error){if(error.name==='AbortError')return;catalog.innerHTML='<div class="empty-state"><b>Catalog is unavailable</b><p>We could not load titles right now. Please try again.</p><button class="btn btn-secondary" id="retryBtn">Retry</button></div>';count.textContent='Offline';$('#retryBtn')?.addEventListener('click',loadCatalog)}
}
async function doSearch(query){
 if(query.trim().length<2){route('home');return}
 if(requestController)requestController.abort();requestController=new AbortController();
 catalog.innerHTML='<div class="loading-card"><span class="loader"></span><p>Searching…</p></div>';
 try{const response=await fetch(API+'/search?q='+encodeURIComponent(query.trim()),{signal:requestController.signal,cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Search failed');renderItems(data.items||[]);title.textContent='Search results';desc.textContent='Matches for “'+query.trim()+'”';count.textContent=(data.items||[]).length+' results'}
 catch(error){if(error.name!=='AbortError')notify('Search is temporarily unavailable')}
}
function loadLibrary(){let saved=[];try{saved=JSON.parse(localStorage.getItem('nexstream:saved')||'[]')}catch{}renderItems(saved);count.textContent=saved.length+' saved'}
document.addEventListener('click',event=>{const button=event.target.closest('[data-route]');if(button)route(button.dataset.route)});
$('#searchInput').addEventListener('input',event=>{clearTimeout(searchTimer);const query=event.target.value;searchTimer=setTimeout(()=>query.trim()?doSearch(query):route('home'),260)});
$('#libraryBtn').addEventListener('click',()=>route('library'));
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();$('#searchInput').focus()}if(event.key==='Escape')$('#searchInput').blur()});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
route('home');