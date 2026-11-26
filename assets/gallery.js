(()=>{'use strict';
const $=id=>document.getElementById(id);
const grid=$('photo-wall-grid'),status=$('wall-status'),viewer=$('wall-viewer'),large=$('wall-large');
const menu=$('menu-button'),nav=$('mobile-navigation');
menu.addEventListener('click',()=>{const open=nav.hidden;nav.hidden=!open;menu.setAttribute('aria-expanded',String(open));});
nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.hidden=true;menu.setAttribute('aria-expanded','false');}});
$('copyright-year').textContent=new Date().getFullYear();
let photos=[],ordered=[],current=0,opener=null;
const shuffle=arr=>{const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
const allowed=p=>p&&typeof p.src==='string'&&p.src.trim()&& !p.sample&&!p.crop&&(p.placement==='Portfolio'||p.placement==='Homepage & Portfolio');
const safePath=s=>{try{const u=new URL(s,location.href);return u.origin===location.origin&&u.pathname.startsWith('/images/')?u.href:null;}catch{return null;}};
const load=async path=>{const r=await fetch(path,{cache:'no-cache'});if(!r.ok)throw Error('Gallery data unavailable');return r.json();};
function showPhoto(i){current=(i+ordered.length)%ordered.length;const p=ordered[current];large.src=p.src;large.alt=p.session;$('wall-caption').textContent=p.session;$('wall-index').textContent=(current+1)+' / '+ordered.length;}
function openPhoto(i,button){opener=button;showPhoto(i);viewer.showModal();document.body.classList.add('modal-open');}
function render(){ordered=shuffle(photos);const frag=document.createDocumentFragment();ordered.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='wall-frame';b.setAttribute('aria-label','Enlarge photograph from '+p.session);const img=document.createElement('img');img.alt=p.session;img.loading=i<12?'eager':'lazy';img.decoding='async';if(p.dimensions?.length===2&&p.dimensions.every(n=>Number.isFinite(n)&&n>0)){img.width=p.dimensions[0];img.height=p.dimensions[1];}img.src=p.src;img.addEventListener('error',()=>{b.hidden=true;},{once:true});b.append(img);b.addEventListener('click',()=>openPhoto(i,b));frag.append(b);});grid.replaceChildren(frag);status.textContent=ordered.length+' photographs / the complete portfolio';}
$('wall-shuffle').addEventListener('click',render);
$('wall-close').addEventListener('click',()=>viewer.close());
$('wall-prev').addEventListener('click',()=>showPhoto(current-1));
$('wall-next').addEventListener('click',()=>showPhoto(current+1));
viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close();});
viewer.addEventListener('close',()=>{document.body.classList.remove('modal-open');large.removeAttribute('src');opener?.focus();});
document.addEventListener('keydown',e=>{if(viewer.open){if(e.key==='ArrowLeft'){e.preventDefault();showPhoto(current-1);}if(e.key==='ArrowRight'){e.preventDefault();showPhoto(current+1);}}else if(e.key==='Escape'&&!nav.hidden){nav.hidden=true;menu.setAttribute('aria-expanded','false');menu.focus();}});
(async()=>{try{const manifest=await load('data/portfolio.json');let albums=[];try{albums=await load('data/albums.json');}catch{}const all=manifest.filter(allowed);for(const album of albums){if(typeof album?.title!=='string'||!Array.isArray(album.photos))continue;for(const src of album.photos){if(typeof src==='string')all.push({src,session:album.title,placement:'Portfolio'});}}const seen=new Set();for(const p of all){const src=safePath(p.src);if(!src||seen.has(src))continue;seen.add(src);photos.push({...p,src,session:String(p.session||'The Prime Grid')});}if(!photos.length){status.textContent='No photographs available.';return;}render();}catch(e){status.textContent='The gallery could not load. Please refresh to try again.';}})();
})();
