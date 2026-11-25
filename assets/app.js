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
 crop:Array.isArray(x.crop)&&x.crop.length===4?x.crop:null,
 dimensions:x.dimensions,
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
let photoClipId=0;
const photoNode=(p,scope)=>{
 const holder=document.createElement('div');holder.className=`${scope} ${styleClass(p.category)}`;
 if(!p.src)return holder;
 if(p.crop&&p.dimensions){
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox',p.crop.join(' '));
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.setAttribute('role','img');svg.setAttribute('aria-label',p.title);
  svg.classList.add('cropped-photo');
  const image=document.createElementNS(ns,'image');
  image.setAttribute('href',p.src);image.setAttribute('width',p.dimensions[0]);image.setAttribute('height',p.dimensions[1]);
  const clip=document.createElementNS(ns,'clipPath');
  const clipId='photo-crop-'+(++photoClipId);clip.id=clipId;
  const rect=document.createElementNS(ns,'rect');
  ['x','y','width','height'].forEach((key,index)=>rect.setAttribute(key,p.crop[index]));
  clip.appendChild(rect);svg.appendChild(clip);image.setAttribute('clip-path',`url(#${clipId})`);
  svg.appendChild(image);holder.appendChild(svg);
 }else{
  const img=document.createElement('img');img.src=p.src;img.alt=p.title;img.loading=scope==='tile-art'?'lazy':'eager';img.decoding='async';img.style.objectPosition=p.position||'50% 20%';holder.appendChild(img);
 }
 return holder;
};
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
let showAllWork = false;
const featuredSessions = ['Breaking Character', 'Chapter Ten: In Blue', 'Presence', 'Yuletide Family Affair'];
const workToggle = $('#work-toggle');
workToggle.addEventListener('click', () => {
  showAllWork = !showAllWork;
  pageIndex = 0;
  categoryFilter = '';
  sessionFilter = '';
  [...filterSet.children].forEach((button,index) => button.setAttribute('aria-pressed',String(index===0)));
  renderGallery();
});
const sessionSelect = $('#session-filter');
sessionSelect.addEventListener('change', () => {
  if (sessionSelect.value) openAlbum(sessionSelect.value);
  else { sessionFilter = ''; renderGallery(); }
});
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
  const index = grid.children.length;
  tile.className = 'photo-tile ' + (index % 7 === 0 ? 'wide' : index % 7 === 4 ? 'tall' : '');
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
  const image=tile.querySelector('img');
  if(image){
    const [x,y]=String(photo.position||'50% 15%').split(' ');
    const people=['Portraits','Couples / weddings','Personal projects','Sports'].includes(album.category);
    const coverFocus={'Beauty Is a Light':'50% 42%','Chapter Ten: In Blue':'50% 40%','Halimat':'50% 42%'};
    image.style.objectPosition=coverFocus[album.title]||(people?x+' '+Math.max(35,parseFloat(y)||35)+'%':photo.position||'50% 50%');
    // Face-aware framing where the browser supports local face detection.
    if(people&&typeof window.FaceDetector==='function'){
      const focusFaces=async()=>{
        try{
          const faces=await new window.FaceDetector({fastMode:true,maxDetectedFaces:8}).detect(image);
          if(!faces.length||!image.naturalWidth||!image.naturalHeight)return;
          const left=Math.min(...faces.map(f=>f.boundingBox.x)),right=Math.max(...faces.map(f=>f.boundingBox.x+f.boundingBox.width));
          const top=Math.min(...faces.map(f=>f.boundingBox.y)),bottom=Math.max(...faces.map(f=>f.boundingBox.y+f.boundingBox.height));
          const w=image.clientWidth,h=image.clientHeight,iw=image.naturalWidth,ih=image.naturalHeight;
          if(!w||!h)return;
          const scale=Math.max(w/iw,h/ih);
          const pos=(center,view,full)=>full>view?Math.max(0,Math.min(100,(center-view/2)/(full-view)*100)):50;
          image.style.objectPosition=pos((left+right)/2*scale,w,iw*scale)+'% '+pos((top+bottom)/2*scale,h,ih*scale)+'%';
        }catch{}
      };
      if(image.complete&&image.naturalWidth)focusFaces();else image.addEventListener('load',focusFaces,{once:true});
    }
  }
  tile.querySelector('svg')?.setAttribute('preserveAspectRatio','xMidYMin slice');
  const info = document.createElement('span');
  info.className = 'tile-meta';
  info.innerHTML = `<small>${safe(categoryLabels[album.category] || album.category)} / ${count}</small><strong>${safe(album.title)}</strong>`;
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
  const collection = showAllWork ? [...albums.values()] : featuredSessions.map(title => [...albums.values()].find(album => album.title === title)).filter(Boolean);
  const available = collection.filter(album => !categoryFilter || album.category === categoryFilter);
  workToggle.textContent = showAllWork ? 'SHOW SELECTED WORK' : 'VIEW ALL SESSIONS';
  workToggle.setAttribute('aria-expanded',String(showAllWork));
  workToggle.hidden = !!selected;
  const pageCount = Math.ceil(available.length / pageSize);
  sessionSelect.replaceChildren(new Option('All sessions', ''));
  available.forEach(album => sessionSelect.add(new Option(album.title, album.key)));
  sessionSelect.value = sessionFilter;
  filterSet.hidden = !!selected || !showAllWork;
  filterSet.parentElement.hidden = !!selected || !showAllWork;
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
  panel.appendChild(photoNode(aboutPhoto,'about-portrait'));
  panel.classList.add('about-has-photo');
}
// Proposed session menu for the preview. Confirm pricing before production.
const sessionMenu = window.PRIME_SESSIONS;
const inquiryType = $('#inquiry-type');
const inquiryPackage = $('#inquiry-package');

const optionLabel = option => `${option[0]} · $${option[1]}`;
function updateBookingOptions() {
  const session = sessionMenu.find(item => item.name === inquiryType.value);
  inquiryPackage.replaceChildren(new Option(session ? 'Choose your session option' : 'Custom quote', ''));
  inquiryPackage.disabled = !session;
  inquiryPackage.required = Boolean(session);
  if (session) session.options.forEach(option => inquiryPackage.add(new Option(optionLabel(option), optionLabel(option))));
  $('#booking-package-summary').textContent = session ? session.description : 'Share your plans below for a custom quote.';
}
function updateBookingSummary() {
  const session = sessionMenu.find(item => item.name === inquiryType.value);
  const option = session?.options.find(item => optionLabel(item) === inquiryPackage.value);
  $('#booking-package-summary').textContent = option ? `${option[2]} ${option[3].join(' · ')}.` : session?.description || '';
}
sessionMenu.forEach(session => inquiryType.add(new Option(session.name, session.name), inquiryType.options[inquiryType.options.length - 1]));
inquiryType.addEventListener('change', updateBookingOptions);
inquiryPackage.addEventListener('change', updateBookingSummary);
const bookingParams = new URLSearchParams(location.search);
const requestedSession = sessionMenu.find(session => session.name === bookingParams.get('session'));
if (requestedSession) {
  inquiryType.value = requestedSession.name;
  updateBookingOptions();
  const requestedOption = requestedSession.options.find(option => option[0] === bookingParams.get('option'));
  if (requestedOption) { inquiryPackage.value = optionLabel(requestedOption); updateBookingSummary(); }
}
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
  if (event.key === 'Escape' && !mobileNav.hidden && !lightbox.open) {
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
