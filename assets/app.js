(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const cfg=window.PRIME_CONFIG||{};
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const classes={'Portraits':'art-portrait','Automotive':'art-auto','Sports':'art-sports','Couples / weddings':'art-couple','Travel / street':'art-street','Commercial / product':'art-commercial','Personal projects':'art-personal','Graduation':'art-portrait','Senior photos':'art-portrait','Family':'art-couple','Christmas':'art-portrait','School events':'art-personal','Weddings':'art-couple','Nature':'art-travel','Street':'art-street','Videography':'art-personal','Other':'art-travel'};
const cats=Object.keys(classes);
const fromManifest=Array.isArray(window.PRIME_MEDIA)?window.PRIME_MEDIA:[];
const allImages=fromManifest.map(x=>({
 title:String(x.title||'Untitled frame'),
 category:cats.includes(x.category)?x.category:'Other',
 session:String(x.session||'New session'),
 src:String(x.src||''),
 placement:String(x.placement||'Portfolio'),
 sample:!!x.sample,
 placeholder:!x.src
})).filter(p=>p.src);
const portfolioPhotos=allImages.filter(p=>p.placement==='Portfolio'||p.placement==='Homepage & Portfolio');
const photos=portfolioPhotos.length?portfolioPhotos:allImages;
const selectedHero=allImages.filter(p=>p.placement==='Homepage & Portfolio');
const customHero=selectedHero.filter(p=>!p.sample);
const heroPhotos=customHero.length?customHero:selectedHero.length?selectedHero:photos;
let filtered=[],categoryFilter='All',sessionFilter='',viewerIndex=0,heroIndex=0;
const toast=message=>{const el=$('#toast');el.textContent=message;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,4500)};
const styleClass=cat=>classes[cat]||'art-personal';
const photoNode=(p,scope)=>{const holder=document.createElement('div');holder.className=`${scope} ${styleClass(p.category)}`;if(p.src){const img=document.createElement('img');img.src=p.src;img.alt=`${p.title}, ${p.category}`;img.loading=scope==='tile-art'?'lazy':'eager';img.decoding='async';holder.appendChild(img)}if(p.sample){const label=document.createElement('span');label.className='sample-chip';label.textContent='SAMPLE IMAGE';holder.appendChild(label)}return holder};
// Hero carousel, manual controls only.
function updateHero(){const chosen=heroPhotos[heroIndex%heroPhotos.length],hero=$('#hero-art');if(!chosen)return;hero.className=`hero-art ${styleClass(chosen.category)}${chosen.src?' has-photo':''}`;hero.style.backgroundImage=chosen.src?`url(${JSON.stringify(chosen.src)})`:'';hero.innerHTML=chosen.src?'':'<div class="art-pattern" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';const label=document.createElement('span');label.className='photo-placeholder-label';label.textContent=chosen.sample?'SAMPLE PHOTOGRAPH / REPLACE WITH YOUR WORK':chosen.title.toUpperCase();hero.appendChild(label);$('#slide-number').textContent=`${String(heroIndex%Math.min(3,heroPhotos.length)+1).padStart(2,'0')} / ${String(Math.min(3,heroPhotos.length)).padStart(2,'0')}`}
const shiftHero=d=>{if(heroPhotos.length<2)return;heroIndex=(heroIndex+d+Math.min(3,heroPhotos.length))%Math.min(3,heroPhotos.length);updateHero()};$('#hero-prev').addEventListener('click',()=>shiftHero(-1));$('#hero-next').addEventListener('click',()=>shiftHero(1));updateHero();
// Keep existing portfolio entries in their sessions and append CMS album uploads.
const albums = new Map();
function getAlbum(category, title) {
  const key = JSON.stringify([category, title]);
  if (!albums.has(key)) albums.set(key, { key, category, title, photos: [] });
  return albums.get(key);
}
photos.forEach(photo => getAlbum(photo.category, photo.session).photos.push(photo));
for (const entry of window.PRIME_ALBUMS || []) {
  const title = typeof entry?.title === 'string' ? entry.title.trim() : '';
  if (!title || !Array.isArray(entry.photos)) continue;
  const category = cats.includes(entry.category) ? entry.category : 'Other';
  for (const src of entry.photos) {
    if (typeof src !== 'string' || !src.trim()) continue;
    const album = getAlbum(category, title);
    if (album.photos.some(photo => photo.src === src)) continue;
    album.photos.push({
      title: `${title} · Frame ${album.photos.length + 1}`,
      category, session: title, src, sample: false
    });
  }
}

const filterSet = $('#category-filters');
const sessionSelect = $('#session-filter');
const albumTitle = $('#album-title');
const frames = count => `${count} ${count === 1 ? 'frame' : 'frames'}`;
const categoryAlbums = () => [...albums.values()].filter(album =>
  categoryFilter === 'All' || album.category === categoryFilter
);
const categoryLabels = {
  'Commercial / product': 'Commercial',
  'Couples / weddings': 'Couples',
  'Travel / street': 'Travel',
  'Personal projects': 'Personal'
};
for (const category of ['All', ...cats]) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = categoryLabels[category] || category;
  button.setAttribute('aria-pressed', String(category === 'All'));
  button.addEventListener('click', () => {
    categoryFilter = category;
    sessionFilter = '';
    for (const control of filterSet.children) {
      control.setAttribute('aria-pressed', String(control === button));
    }
    renderGallery();
  });
  filterSet.appendChild(button);
}

function openAlbum(key) {
  sessionFilter = key;
  renderGallery();
  albumTitle.focus();
}
sessionSelect.addEventListener('change', () => {
  if (sessionSelect.value) openAlbum(sessionSelect.value);
  else {
    sessionFilter = '';
    renderGallery();
  }
});
$('#album-back').addEventListener('click', () => {
  const previousAlbum = sessionFilter;
  sessionFilter = '';
  renderGallery();
  const cover = [...$('#gallery-grid').children].find(tile => tile.dataset.album === previousAlbum);
  (cover || sessionSelect).focus();
});

function galleryTile(photo, index, title, subtitle, label, onClick) {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'photo-tile ' + (index % 7 === 0 ? 'wide' : index % 7 === 4 ? 'tall' : '');
  tile.setAttribute('aria-label', label);
  tile.appendChild(photoNode(photo, 'tile-art'));
  const info = document.createElement('span');
  info.className = 'tile-meta';
  info.innerHTML = `<span><small>${safe(subtitle.toUpperCase())}</small><strong>${safe(title)}</strong></span><span class="tile-open" aria-hidden="true">↗</span>`;
  tile.appendChild(info);
  tile.addEventListener('click', onClick);
  return tile;
}

function renderGallery() {
  const available = categoryAlbums();
  const selected = albums.get(sessionFilter);
  sessionSelect.replaceChildren(new Option('All sessions', ''));
  for (const album of available) {
    sessionSelect.add(new Option(`${album.title} (${album.category})`, album.key));
  }
  sessionSelect.value = sessionFilter;
  $('#album-heading').hidden = !selected;
  albumTitle.textContent = selected?.title || '';
  const grid = $('#gallery-grid');
  grid.replaceChildren();
  filtered = selected?.photos || [];
  if (selected) {
    filtered.forEach((photo, index) => grid.appendChild(galleryTile(
      photo, index, photo.title, photo.category,
      `Open ${photo.title}, photo ${index + 1} of ${filtered.length}`,
      () => openViewer(index)
    )));
  } else {
    available.forEach((album, index) => {
      const count = frames(album.photos.length);
      const cover = album.photos.find(photo => !photo.sample) || album.photos[0];
      const tile = galleryTile(cover, index, album.title, `${album.category} / ${count}`,
        `Open ${album.title}, ${album.category}, ${count}`, () => openAlbum(album.key));
      tile.dataset.album = album.key;
      grid.appendChild(tile);
    });
    if (!available.length) {
      grid.innerHTML = '<p class="empty-gallery">No albums in this category yet.</p>';
    }
  }
  const count = selected ? frames(filtered.length) : `${available.length} ${available.length === 1 ? 'album' : 'albums'}`;
  const containsSamples = selected ? filtered.some(photo => photo.sample) :
    available.some(album => album.photos.some(photo => photo.sample));
  $('#gallery-count').textContent = `Showing ${count}${containsSamples ? ' / Sample photos included' : ''}`.toUpperCase();
}
renderGallery();
const lightbox=$('#lightbox');function updateViewer(){const p=filtered[viewerIndex];if(!p)return;$('#lightbox-index').textContent=`${String(viewerIndex+1).padStart(2,'0')} / ${String(filtered.length).padStart(2,'0')}`;$('#lightbox-category').textContent=p.category.toUpperCase();$('#lightbox-title').textContent=p.title;$('#lightbox-session').textContent=p.session;$('#lightbox-image').replaceChildren();$('#lightbox-image').appendChild(photoNode(p,'tile-art'));const dl=$('#lightbox-download');dl.hidden=!p.src||p.sample;if(p.src){dl.href=p.src;dl.download=p.src.split('/').pop().split('?')[0]||'the-prime-grid.jpg'}else{const l=document.createElement('span');l.textContent='PHOTO PLACEHOLDER / ADD YOUR IMAGE LATER';l.style.cssText='position:absolute;background:#111a;padding:20px;letter-spacing:.16em;font-size:11px;text-align:center';$('#lightbox-image').appendChild(l)}}
function openViewer(i){viewerIndex=i;updateViewer();$('#lightbox-prev').disabled=filtered.length<2;$('#lightbox-next').disabled=filtered.length<2;lightbox.showModal();document.body.classList.add('modal-open')}
function closeViewer(){lightbox.close();document.body.classList.remove('modal-open')}
const moveViewer=d=>{if(filtered.length<2)return;viewerIndex=(viewerIndex+d+filtered.length)%filtered.length;updateViewer()};$('#lightbox-prev').addEventListener('click',()=>moveViewer(-1));$('#lightbox-next').addEventListener('click',()=>moveViewer(1));$('#lightbox-close').addEventListener('click',closeViewer);lightbox.addEventListener('close',()=>document.body.classList.remove('modal-open'));lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeViewer()});
$('#lightbox-image').addEventListener('click',e=>{if(e.target.tagName==='IMG')e.target.classList.toggle('zoomed')});
window.addEventListener('keydown',e=>{if(!lightbox.open)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();moveViewer(e.key==='ArrowLeft'?-1:1)}});
// Photograph for the About page. New uploads take priority over sample imagery.
const aboutChoices=allImages.filter(p=>p.placement==='About');
const aboutPhoto=aboutChoices.filter(p=>!p.sample).at(-1)||aboutChoices.at(-1);
if(aboutPhoto){
  const panel=$('.about-photo');
  panel.style.backgroundImage=`linear-gradient(to bottom,transparent 30%,rgba(0,0,0,.45) 100%),url(${JSON.stringify(aboutPhoto.src)})`;
  panel.classList.add('about-has-photo');
  const tag=panel.querySelector('.photo-tag');
  if(tag)tag.textContent=aboutPhoto.sample?'SAMPLE PHOTO / YOUR PORTRAIT GOES HERE':'BEHIND THE LENS';
}
// Services and three quote-based packages.
const services=[['Portraits','Individual, graduation and creative portrait sessions.'],['Couples & Families','Genuine connection and the people closest to you.'],['Automotive','The lines, details and attitude of every build.'],['Sports','The anticipation, intensity and motion of competition.'],['Commercial & Product','Concept-driven visuals for products and brands.'],['Photo Editing','Careful finishing to strengthen your visual story.']];
services.forEach(([title,desc],i)=>{const el=document.createElement('div');el.className='service-row';el.innerHTML=`<span class="service-num">${String(i+1).padStart(2,'0')}</span><span class="service-name">${safe(title)}</span><span class="service-description">${safe(desc)}</span><button class="service-arrow" type="button" aria-label="Inquire about ${safe(title)}">↗</button>`;el.querySelector('button').addEventListener('click',()=>{const choices={'Portraits':'Portraits','Couples & Families':'Couples / families','Automotive':'Automotive','Sports':'Sports','Commercial & Product':'Commercial / product','Photo Editing':'Photo editing'};$('#inquiry-type').value=choices[title];location.hash='booking'});$('#service-list').appendChild(el)});
const packages=[['The Essential','A focused, shorter session for portraits, individual subjects, and uncomplicated ideas.'],['The Story','More time, more variety, and room for a layered visual narrative. Ideal for couples, cars and creative sessions.'],['The Commission','Custom scope for brands, products, sports assignments and larger productions.']];packages.forEach(([name,description],i)=>{const el=document.createElement('article');el.className='package-card';el.innerHTML=`<span class="package-index">COLLECTION / 0${i+1}</span><h4>${safe(name)}</h4><p>${safe(description)} All packages include editing.</p><button type="button" data-package="${safe(name)}">REQUEST A CUSTOM QUOTE <span aria-hidden="true">↗</span></button>`;el.querySelector('button').addEventListener('click',()=>{$('#inquiry-package').value=name;location.hash='booking';toast(`${name} selected. Tell me about your project below.`)});$('#package-grid').appendChild(el)});
// Three original editorial stories. Not client-specific, no invented commissions.
const stories=[
{tag:'CREATIVE NOTES / 01',title:'Why I chase the in-between frame',intro:'Not every photograph needs to announce itself. Some of the best ones ask you to look twice.',art:'art-portrait',body:["There's a kind of photograph I keep coming back to: the moment before the expected moment. The look before a smile, the stillness before the movement, the tiny pause between one expression and the next.","In those spaces, an image can feel less performed. There is a different honesty to them. I want to leave room for those moments even when a shoot has a plan and a clear creative direction.","The Prime Grid is about making pictures with intention without squeezing the life out of them. Good timing and an open mind can belong in the same frame."]},
{tag:'FIELD NOTES / 02',title:'A little more than light and shadow',intro:'Thinking about contrast, mood, and the decisions that make an image feel cinematic.',art:'art-street',body:["Cinematic photography isn't just about making everything dark. It's about making deliberate choices: where the eye lands, what the light reveals, and what stays just outside the frame.","Sometimes that means strong contrast and hard edges. Sometimes it means a soft scene that allows one detail to carry the picture. The mood should serve the subject, not become the subject.","When I edit, I want the finished image to keep its character. Light, tone, and composition should work together to say something specific."]},
{tag:'FROM THE STUDIO / 03',title:'The Prime Mag begins here',intro:'A living space for photographs, thoughts, lessons, and whatever catches my eye.',art:'art-auto',body:["This is the first page of The Prime Mag: a home for the thinking that happens around the photographs, not only inside them.","Expect notes about portraits, cars, sports, street scenes, creative decisions, and the work of building a visual identity. Some entries will be practical. Others will just be ideas worth keeping.","The portfolio will show the finished frames. The magazine will make room for everything behind them."]}
];
const magazinePhotos=allImages.filter(p=>p.placement==='Magazine').sort((a,b)=>Number(a.sample)-Number(b.sample));
const articleModal=$('#article-modal');stories.forEach((s,i)=>{const btn=document.createElement('button');btn.type='button';btn.className='mag-card';btn.innerHTML=`<div class="mag-art ${s.art}"></div><small>${safe(s.tag)}</small><h3>${safe(s.title)}</h3><p>${safe(s.intro)}</p>`;const cover=magazinePhotos[i%magazinePhotos.length];if(cover){const a=btn.querySelector('.mag-art');a.style.backgroundImage=`url(${JSON.stringify(cover.src)})`;a.style.backgroundSize='cover';a.style.backgroundPosition='center';a.classList.add('mag-has-photo');if(cover.sample)a.classList.add('mag-sample')}btn.addEventListener('click',()=>{const body=$('#article-body');body.innerHTML=`<p class="eyebrow">THE PRIME MAG / ${safe(s.tag)}</p><h2>${safe(s.title)}</h2>${s.body.map(t=>`<p>${safe(t)}</p>`).join('')}<p class="eyebrow">THE PRIME GRID · AN ONGOING VISUAL JOURNAL</p>`;articleModal.showModal();document.body.classList.add('modal-open')});$('#magazine-grid').appendChild(btn)});$('#article-close').addEventListener('click',()=>articleModal.close());articleModal.addEventListener('close',()=>document.body.classList.remove('modal-open'));articleModal.addEventListener('click',e=>{if(e.target===articleModal)articleModal.close()});
// Contact settings are deliberately blank pending user confirmation.
if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.contactEmail||'')){$('#contact-display').textContent=cfg.contactEmail;$('#inquiry-status').textContent='The form opens a draft in your mail app; it does not send automatically.'}
if(cfg.phone){$('#phone-container').hidden=false;$('#phone-display').textContent=cfg.phone}
['instagram','facebook','tiktok','youtube','pinterest'].forEach(k=>{const a=$(`#social-${k}`);const url=cfg[k];if(a&&url){try{const u=new URL(url);if(u.protocol==='https:'){a.href=url;a.hidden=false}}catch(e){a.hidden=true}}else if(a)a.hidden=true});
if(cfg.clientGalleryUrl){try{const url=new URL(cfg.clientGalleryUrl);if(url.protocol==='https:'){const a=$('#client-link');a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';$('#client-status').textContent='SECURE GALLERY PLATFORM / OPEN IN A NEW TAB'}}catch(e){}}
if(!cfg.clientGalleryUrl){$('#client-link').addEventListener('click',e=>{e.preventDefault();toast('Private galleries are not connected yet. No password or client photos are stored here.')})}
if(cfg.calendarUrl){try{const url=new URL(cfg.calendarUrl);if(url.protocol==='https:'){const panel=$('#calendar-container');panel.classList.add('with-iframe');panel.replaceChildren();const iframe=document.createElement('iframe');iframe.src=url.href;iframe.title='Live booking calendar from scheduling provider';iframe.loading='lazy';panel.appendChild(iframe);const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='OPEN BOOKING CALENDAR IN NEW TAB ↗';link.style.cssText='padding:15px;color:white;font-size:11px;letter-spacing:.1em';panel.appendChild(link)}}catch(e){}}
const form=$('#inquiry-form');form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const fd=new FormData(form);const message=`THE PRIME GRID — PHOTOGRAPHY INQUIRY\n\n${[...fd.entries()].map(([key,val])=>`${key.toUpperCase()}: ${val}`).join('\n')}\n\nI understand this request is not a confirmed booking.`;const email=cfg.contactEmail||'';if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){location.href=`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('The Prime Grid · New photography inquiry')}&body=${encodeURIComponent(message)}`;$('#inquiry-status').textContent='An email draft was opened. Please send it from your mail app to deliver the inquiry.'}else{try{await navigator.clipboard.writeText(message);$('#inquiry-status').textContent='Your inquiry was copied to the clipboard. It has NOT been sent. Save it until contact is connected.';toast('Inquiry copied. No booking request has been sent.')}catch(err){const blob=new Blob([message],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='the-prime-grid-inquiry.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);$('#inquiry-status').textContent='A text file was downloaded. Your inquiry has NOT been sent.'}}});
// Responsive navigation, scroll indicator, reduced-motion-safe reveal.
const menuButton = $('#menu-button');
const mobileNav = $('#mobile-navigation');
function setMenu(open) {
  mobileNav.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
}
menuButton.addEventListener('click', () => setMenu(mobileNav.hidden));
$$('#mobile-navigation a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileNav.hidden && !lightbox.open && !articleModal.open) {
    setMenu(false);
    menuButton.focus();
  }
});
matchMedia('(max-width: 1150px)').addEventListener('change', event => {
  if (!event.matches) setMenu(false);
});
$('#copyright-year').textContent=new Date().getFullYear();
const updateScroll=()=>{let max=document.documentElement.scrollHeight-innerHeight;$('#scroll-progress').style.width=(max>0?window.scrollY/max*100:0)+'%'};window.addEventListener('scroll',updateScroll,{passive:true});updateScroll();
if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.10});$$('.section-head,.service-row,.package-card,.mag-card,.intro-strip,.review-placeholder').forEach(x=>{x.classList.add('reveal');io.observe(x)})}
})();
