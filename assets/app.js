(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const cfg=window.PRIME_CONFIG||{};
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const classes={'Portraits':'art-portrait','Automotive':'art-auto','Sports':'art-sports','Couples / weddings':'art-couple','Travel / street':'art-street','Commercial / product':'art-commercial','Personal projects':'art-personal','Other':'art-travel'};
const cats=Object.keys(classes);
const fromManifest=Array.isArray(window.PRIME_MEDIA)?window.PRIME_MEDIA:[];
const allImages=fromManifest.map(x=>({
 title:String(x.title||'Untitled frame'),
 category:cats.includes(x.category)?x.category:'Other',
 session:String(x.session||'New session'),
 src:String(x.src||''),
 placement:String(x.placement||'Portfolio'),
 cover:x.cover===true,
 position:/^\d{1,3}% \d{1,3}%$/.test(x.position)?x.position:'50% 25%',
 sample:!!x.sample
})).filter(p=>p.src);
const portfolioPhotos=allImages.filter(p=>p.placement==='Portfolio'||p.placement==='Homepage & Portfolio');
const photos=portfolioPhotos.length?portfolioPhotos:allImages;
const selectedHero=allImages.filter(p=>p.placement==='Homepage & Portfolio');
const customHero=selectedHero.filter(p=>!p.sample);
const heroPhotos=customHero.length?customHero:selectedHero.length?selectedHero:photos;
let filtered=[],categoryFilter='',sessionFilter='',viewerIndex=0,heroIndex=0;
const toast=message=>{const el=$('#toast');el.textContent=message;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,4500)};
const styleClass=cat=>classes[cat]||'art-personal';
const photoNode=(p,scope)=>{const holder=document.createElement('div');holder.className=`${scope} ${styleClass(p.category)}`;if(p.src){const img=document.createElement('img');img.src=p.src;img.alt=p.title;img.loading=scope==='tile-art'?'lazy':'eager';img.decoding='async';holder.appendChild(img)}return holder};
// Hero carousel, manual controls only.
function updateHero(){const chosen=heroPhotos[heroIndex%heroPhotos.length],hero=$('#hero-art');if(!chosen)return;hero.className=`hero-art ${styleClass(chosen.category)}${chosen.src?' has-photo':''}`;hero.style.backgroundImage=chosen.src?`url(${JSON.stringify(chosen.src)})`:'';hero.style.backgroundPosition=chosen.position;hero.innerHTML=chosen.src?'':'<div class="art-pattern" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';const label=document.createElement('span');label.className='photo-placeholder-label';label.textContent=chosen.session.toUpperCase();hero.appendChild(label);$('#slide-number').textContent=`${String(heroIndex%Math.min(3,heroPhotos.length)+1).padStart(2,'0')} / ${String(Math.min(3,heroPhotos.length)).padStart(2,'0')}`}
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
      title,
      category, session: title, src, sample: false
    });
  }
}

const filterSet = $('#category-filters');
const albumTitle = $('#album-title');
const grid = $('#gallery-grid');
const pageSize = 6;
let pageIndex = 0;
const categoryLabels = {
  'Commercial / product': 'Commercial',
  'Couples / weddings': 'Families & Couples',
  'Travel / street': 'Travel',
  'Personal projects': 'Creative & Editorial'
};
const albumCategories = cats.filter(category => [...albums.values()].some(album => album.category === category));
for (const category of ['', ...albumCategories]) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = categoryLabels[category] || category || 'Selected Work';
  button.setAttribute('aria-pressed', String(!category));
  button.addEventListener('click', () => {
    categoryFilter = category;
    pageIndex = 0;
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
  albumTitle.focus({ preventScroll: true });
  $('#album-heading').scrollIntoView({ block: 'start' });
}
$('#album-back').addEventListener('click', () => {
  const previousAlbum = sessionFilter;
  sessionFilter = '';
  renderGallery();
  const cover = [...grid.children].find(tile => tile.dataset.album === previousAlbum);
  (cover || filterSet.querySelector('[aria-pressed="true"]')).focus();
});

function galleryTile(photo, label, onClick) {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'photo-tile';
  tile.setAttribute('aria-label', label);
  tile.appendChild(photoNode(photo, 'tile-art'));
  tile.addEventListener('click', onClick);
  return tile;
}

function albumCover(album) {
  const photo = album.photos.find(photo => photo.cover) ||
    album.photos.find(photo => !photo.sample) || album.photos[0];
  const count = `${album.photos.length} ${album.photos.length === 1 ? 'photo' : 'photos'}`;
  const tile = galleryTile(photo, `Open ${album.title}, ${count}`, () => openAlbum(album.key));
  tile.dataset.album = album.key;
  tile.querySelector('img').style.objectPosition = photo.position || '50% 25%';
  const info = document.createElement('span');
  info.className = 'tile-meta';
  info.innerHTML = `<strong>${safe(album.title)}</strong><small>${count}</small>`;
  tile.appendChild(info);
  return tile;
}

function changePage(direction) {
  pageIndex += direction;
  renderGallery();
  grid.querySelector('button')?.focus({ preventScroll: true });
  grid.scrollIntoView({ block: 'start' });
}
$('#gallery-prev').addEventListener('click', () => changePage(-1));
$('#gallery-next').addEventListener('click', () => changePage(1));

function renderGallery() {
  const selected = albums.get(sessionFilter);
  const available = [...albums.values()].filter(album => !categoryFilter || album.category === categoryFilter);
  const pageCount = Math.ceil(available.length / pageSize);
  filterSet.hidden = !!selected;
  filterSet.parentElement.hidden = !!selected;
  $('#album-heading').hidden = !selected;
  albumTitle.textContent = selected?.title || '';
  grid.classList.toggle('session-photos', !!selected);
  grid.replaceChildren();
  filtered = selected?.photos || [];
  if (selected) {
    filtered.forEach((photo, index) => grid.appendChild(galleryTile(
      photo, `Open photo ${index + 1} of ${filtered.length}`, () => openViewer(index)
    )));
  } else {
    available.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
      .forEach(album => grid.appendChild(albumCover(album)));
  }
  $('#gallery-pages').hidden = !!selected || pageCount < 2;
  $('#gallery-prev').disabled = pageIndex === 0;
  $('#gallery-next').disabled = pageIndex + 1 >= pageCount;
  $('#gallery-page').textContent = `${pageIndex + 1} / ${pageCount}`;
  const count = selected ? filtered.length : available.length;
  const item = selected ? 'photo' : 'session';
  $('#gallery-count').textContent = `${count} ${item}${count === 1 ? '' : 's'}`;
}
renderGallery();
const lightbox = $('#lightbox');
function updateViewer() {
  const photo = filtered[viewerIndex];
  if (!photo) return;
  $('#lightbox-index').textContent = `${viewerIndex + 1} / ${filtered.length}`;
  $('#lightbox-session').textContent = photo.session;
  $('#lightbox-image').replaceChildren(photoNode(photo, 'tile-art'));
  const download = $('#lightbox-download');
  download.hidden = photo.sample;
  download.href = photo.src;
  download.download = photo.src.split('/').pop().split('?')[0];
}
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
  const image = document.createElement('img');
  image.className = 'about-portrait';
  image.src = aboutPhoto.src;
  image.alt = aboutPhoto.title;
  image.loading = 'lazy';
  panel.appendChild(image);
  panel.classList.add('about-has-photo');
}
// Services and three quote-based packages.
const services = [
  ['Portraits', 'Individual sessions with direction on posing, styling, and light.'],
  ['Creative & Editorial', 'Concept-led shoots for fashion, artists, and creative collaborations.'],
  ['Families & Groups', 'Portraits for families, friends, and the occasions that bring them together.'],
  ['Event Photography', 'Coverage focused on the people, atmosphere, and details of your event.'],
  ['Sports & Athlete Portraits', 'Athlete portraits and action photography on the court or field.'],
  ['Videography', 'Short-form video and visual storytelling for creative projects.']
];
const inquiryType = $('#inquiry-type');
services.forEach(([title, description], index) => {
  inquiryType.add(new Option(title, title), inquiryType.options[inquiryType.options.length - 1]);
  const row = document.createElement('div');
  row.className = 'service-row';
  row.innerHTML = `<span class="service-num">${String(index + 1).padStart(2, '0')}</span><span class="service-name">${safe(title)}</span><span class="service-description">${safe(description)}</span><button class="service-arrow" type="button" aria-label="Inquire about ${safe(title)}">↗</button>`;
  row.querySelector('button').addEventListener('click', () => {
    inquiryType.value = title;
    location.hash = 'booking';
  });
  $('#service-list').appendChild(row);
});
const packages=[['The Essential','A focused session for individual portraits.'],['The Story','More time for family portraits, outfit changes, or a creative concept.'],['The Commission','Custom photography or video coverage for events, artists, and creative teams.']];packages.forEach(([name,description],i)=>{const el=document.createElement('article');el.className='package-card';el.innerHTML=`<span class="package-index">COLLECTION / 0${i+1}</span><h4>${safe(name)}</h4><p>${safe(description)} All packages include editing.</p><button type="button" data-package="${safe(name)}">REQUEST A CUSTOM QUOTE <span aria-hidden="true">↗</span></button>`;el.querySelector('button').addEventListener('click',()=>{$('#inquiry-package').value=name;location.hash='booking';if(!$('#inquiry-form').hidden)toast(`${name} selected.`)});$('#package-grid').appendChild(el)});
// Three original editorial stories. Not client-specific, no invented commissions.
const stories=[
{tag:'CREATIVE NOTES / 01',title:'Why I chase the in-between frame',intro:'Not every photograph needs to announce itself. Some of the best ones ask you to look twice.',art:'art-portrait',body:["There's a kind of photograph I keep coming back to: the moment before the expected moment. The look before a smile, the stillness before the movement, the tiny pause between one expression and the next.","In those spaces, an image can feel less performed. There is a different honesty to them. I want to leave room for those moments even when a shoot has a plan and a clear creative direction.","The Prime Grid is about making pictures with intention without squeezing the life out of them. Good timing and an open mind can belong in the same frame."]},
{tag:'FIELD NOTES / 02',title:'A little more than light and shadow',intro:'Thinking about contrast, mood, and the decisions that make an image feel cinematic.',art:'art-street',body:["Cinematic photography isn't just about making everything dark. It's about making deliberate choices: where the eye lands, what the light reveals, and what stays just outside the frame.","Sometimes that means strong contrast and hard edges. Sometimes it means a soft scene that allows one detail to carry the picture. The mood should serve the subject, not become the subject.","When I edit, I want the finished image to keep its character. Light, tone, and composition should work together to say something specific."]},
{tag:'FROM THE STUDIO / 03',title:'The Prime Mag begins here',intro:'A living space for photographs, thoughts, lessons, and whatever catches my eye.',art:'art-auto',body:["This is the first page of The Prime Mag: a home for the thinking that happens around the photographs, not only inside them.","Expect notes about portraits, editorial shoots, creative decisions, and the work of building a visual identity. Some entries will be practical. Others will just be ideas worth keeping.","The portfolio will show the finished frames. The magazine will make room for everything behind them."]}
];
const magazinePhotos=allImages.filter(p=>p.placement==='Magazine').sort((a,b)=>Number(a.sample)-Number(b.sample));
const articleModal=$('#article-modal');stories.forEach((s,i)=>{const btn=document.createElement('button');btn.type='button';btn.className='mag-card';btn.innerHTML=`<div class="mag-art ${s.art}"></div><small>${safe(s.tag)}</small><h3>${safe(s.title)}</h3><p>${safe(s.intro)}</p>`;const covers=magazinePhotos.length?magazinePhotos:heroPhotos;const cover=covers[i%covers.length];if(cover){const a=btn.querySelector('.mag-art');a.style.backgroundImage=`url(${JSON.stringify(cover.src)})`;a.style.backgroundSize='cover';a.style.backgroundPosition='center';a.classList.add('mag-has-photo')}btn.addEventListener('click',()=>{const body=$('#article-body');body.innerHTML=`<p class="eyebrow">The Prime Mag / ${safe(s.tag)}</p><h2>${safe(s.title)}</h2>${s.body.map(t=>`<p>${safe(t)}</p>`).join('')}<p class="eyebrow">THE PRIME GRID · AN ONGOING VISUAL JOURNAL</p>`;articleModal.showModal();document.body.classList.add('modal-open')});$('#magazine-grid').appendChild(btn)});$('#article-close').addEventListener('click',()=>articleModal.close());articleModal.addEventListener('close',()=>document.body.classList.remove('modal-open'));articleModal.addEventListener('click',e=>{if(e.target===articleModal)articleModal.close()});
const email = cfg.contactEmail || '';
const form = $('#inquiry-form');
if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  const contact = $('#contact-display');
  contact.textContent = email;
  contact.href = `mailto:${email}`;
  $('#contact-container').hidden = false;
  form.hidden = false;
  const dateField = $('#inquiry-date');
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateField.min = localDate;
  const requestText = () => [...new FormData(form)]
    .map(([key, value]) => `${key}: ${String(value).trim() || 'Not specified'}`).join('\n');
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const subject = encodeURIComponent(`Session request: ${inquiryType.value}`);
    location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${encodeURIComponent(requestText())}`;
    $('#inquiry-status').textContent = `Send the draft from your email app to request your session. If it didn’t open, copy your request and email it to ${email}.`;
    $('#copy-inquiry').hidden = false;
  });
  $('#copy-inquiry').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(requestText());
      $('#inquiry-status').textContent = `Request copied. Paste it into an email to ${email}.`;
    } catch (_error) {
      $('#inquiry-status').textContent = `Copy isn’t available in this browser. Email your session details to ${email}.`;
    }
  });
}
if(cfg.phone){$('#phone-container').hidden=false;$('#phone-display').textContent=cfg.phone}
['instagram','facebook','tiktok','youtube','pinterest'].forEach(k=>{const a=$(`#social-${k}`);const url=cfg[k];if(a&&url){try{const u=new URL(url);if(u.protocol==='https:'){a.href=url;a.hidden=false}}catch(e){a.hidden=true}}else if(a)a.hidden=true});
function httpsUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:') return url.href;
  } catch (_error) {}
}
const clientGallery = httpsUrl(cfg.clientGalleryUrl);
if (clientGallery) {
  const link = $('#client-link');
  link.href = clientGallery;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  $('#clients').hidden = false;
  $$('a[href="#clients"]').forEach(item => item.hidden = false);
}
const calendar = httpsUrl(cfg.calendarUrl);
if (calendar) {
  const panel = $('#calendar-container');
  const iframe = document.createElement('iframe');
  iframe.src = calendar;
  iframe.title = 'Booking calendar';
  iframe.loading = 'lazy';
  panel.classList.add('with-iframe');
  panel.appendChild(iframe);
  panel.hidden = false;
}
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
if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.10});$$('.section-head,.service-row,.package-card,.mag-card').forEach(x=>{x.classList.add('reveal');io.observe(x)})}
})();
