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
// Proposed session menu for the preview. Confirm pricing before production.
const sessionMenu = [
  {name:'Graduation', description:'Cap-and-gown portraits, campus memories, and a celebration of everything you worked for.', options:[
    ['Cap & Gown',150,'A quick celebration of your achievement.',['30 minutes','8 edited photos','1 outfit, plus cap and gown','1 location · 1 graduate']],
    ['Campus Session',250,'Room for both graduation portraits and a personal look.',['60 minutes','15 edited photos','2 outfits','1 campus or location · 1 graduate']],
    ['Graduation Story',375,'A fuller collection with room for family or friends to join.',['90 minutes','25 edited photos','3 outfits','2 nearby locations · up to 4 people']]]},
  {name:'Senior Photos', description:'Senior-year portraits that feel like you, from your favorite outfit to the sport or hobby you love.', options:[
    ['Senior Mini',175,'A simple set for announcements and keepsakes.',['30 minutes','10 edited photos','1 outfit','1 location · 1 senior']],
    ['Senior Portrait Session',300,'A mix of classic portraits and personality.',['60 minutes','20 edited photos','2 outfits','1 location · 1 senior']],
    ['Senior Story',450,'More variety with a hobby, uniform, or personal setting.',['120 minutes','35 edited photos','3 outfits','2 nearby locations · 1 senior']]]},
  {name:'Portraits', description:'Personal portraits with guidance on posing and expression, in a studio or a location that suits your style.', options:[
    ['Portrait Mini',125,'A fresh set of portraits without a long session.',['20 minutes','5 edited photos','1 outfit','1 setting · 1 person']],
    ['Portrait Session',225,'Time to settle in and explore a second look.',['60 minutes','15 edited photos','2 outfits','1 setting · 1 person']],
    ['Extended Portrait Session',350,'A wider range of looks and expressions.',['90 minutes','25 edited photos','3 outfits','2 nearby settings · 1 person']]]},
  {name:'Family', description:'Relaxed family photographs with a mix of everyone together, smaller groups, and candid moments.', options:[
    ['Family Mini',175,'A quick family update with the people closest to you.',['25 minutes','8 edited photos','1 outfit per person','1 location · up to 5 people']],
    ['Family Session',300,'Time for group portraits and individual combinations.',['60 minutes','20 edited photos','1 outfit per person','1 location · up to 6 people']],
    ['Extended Family',450,'Bring the generations together for a fuller collection.',['90 minutes','30 edited photos','1 outfit per person','1 location · up to 12 people']]]},
  {name:'Christmas & Holiday', description:'Seasonal portraits for holiday cards and family keepsakes. Setting and seasonal availability are agreed when booking.', options:[
    ['Holiday Mini',125,'A short, festive session for your yearly card.',['15 minutes','5 edited photos','1 outfit per person','1 setting · up to 4 people']],
    ['Holiday Family Session',225,'More time for family groups and little moments.',['30 minutes','12 edited photos','1 outfit per person','1 setting · up to 6 people']],
    ['Holiday Story',350,'A relaxed holiday collection with time for another look.',['60 minutes','20 edited photos','2 outfits per person','1 setting · up to 8 people']]]},
  {name:'Couples & Engagement', description:'Photographs of the two of you, with natural direction and room for your connection to show.', options:[
    ['Couples Mini',175,'A few favorite moments together.',['30 minutes','10 edited photos','1 outfit each','1 location · 2 people']],
    ['Couples Session',300,'A relaxed session for an anniversary or engagement.',['60 minutes','20 edited photos','2 outfits each','1 location · 2 people']],
    ['Engagement Story',450,'A longer session with two settings that mean something to you.',['90 minutes','30 edited photos','2 outfits each','2 nearby locations · 2 people']]]},
  {name:'Birthday & Milestone', description:'Celebrate a birthday or personal milestone with portraits built around your style and occasion.', options:[
    ['Birthday Mini',150,'A simple portrait celebration.',['25 minutes','8 edited photos','1 outfit','1 setting · 1 person']],
    ['Birthday Session',275,'Time for two looks and a personal theme.',['60 minutes','18 edited photos','2 outfits','1 setting · 1 person']],
    ['Milestone Story',400,'A fuller celebration with room for a few guests.',['90 minutes','30 edited photos','3 outfits','1 setting · up to 4 people']]]},
  {name:'Headshots & Branding', description:'Professional portraits for your profile, business, and the work you put into the world.', options:[
    ['Headshot Refresh',100,'A clean, confident profile update.',['20 minutes','3 edited photos','1 outfit','1 setting · 1 person']],
    ['Headshot Session',200,'A choice of looks for different professional uses.',['45 minutes','8 edited photos','2 outfits','1 setting · 1 person']],
    ['Personal Branding',375,'Portraits and working details that tell your business story.',['90 minutes','25 edited photos','3 outfits','1 business or studio setting · 1 person']]]},
  {name:'Creative & Editorial', description:'Concept-led portraits for fashion, artists, and creative ideas, with the visual direction agreed before your session.', options:[
    ['Creative Portrait',200,'One focused concept and a strong set of portraits.',['45 minutes','8 edited photos','1 styled look','1 setting · 1 person']],
    ['Editorial Session',350,'Explore a concept across two looks.',['90 minutes','18 edited photos','2 styled looks','1 setting · up to 2 people']],
    ['Creative Collection',550,'More time to develop a varied visual story.',['120 minutes','30 edited photos','3 styled looks','2 nearby settings · up to 3 people']]]},
  {name:'Sports & Athlete Portraits', description:'Portraits that show the person behind the uniform, from individual athletes to teammates.', options:[
    ['Athlete Mini',150,'A focused set in your uniform or training kit.',['30 minutes','8 edited photos','1 uniform or outfit','1 location · 1 athlete']],
    ['Athlete Session',275,'Portraits and posed action with more variety.',['60 minutes','18 edited photos','2 uniforms or outfits','1 location · 1 athlete']],
    ['Teammates Session',425,'Individual portraits and group combinations.',['90 minutes','30 edited photos','1 uniform each','1 location · up to 6 athletes']]]},
  {name:'Event Photography', description:'Coverage of the people, atmosphere, and details at your celebration or gathering.', options:[
    ['Short Event',300,'Coverage for a small gathering or a focused part of your event.',['2 hours of coverage','40 edited photos','Candid moments and group portraits','1 venue']],
    ['Half-Day Event',550,'More of the celebration, from arrivals to the main moments.',['4 hours of coverage','80 edited photos','Candid moments, details, and group portraits','1 venue']],
    ['Extended Event',800,'A longer record of your event as it unfolds.',['6 hours of coverage','120 edited photos','Candid moments, details, and group portraits','1 venue']]]},
  {name:'Videography', description:'Short-form video for personal projects, creative work, and events. Music, locations, and the brief are agreed before filming.', options:[
    ['Social Reel',250,'One short vertical edit for your social pages.',['Up to 1 hour filming','1 edited vertical video, 15–30 seconds','1 revision round','1 location']],
    ['Creative Film',450,'A short visual story with room for a fuller idea.',['Up to 2 hours filming','1 edited video, 45–60 seconds','1 revision round','1 location']],
    ['Event Highlights',750,'A condensed film of the moments and atmosphere.',['Up to 4 hours filming','1 edited highlight video, 60–90 seconds','2 revision rounds','1 venue']]]}
];
const inquiryType = $('#inquiry-type');
const inquiryPackage = $('#inquiry-package');
const categorySelect = $('#session-category');
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
function renderSessionOptions() {
  const session = sessionMenu.find(item => item.name === categorySelect.value);
  $('#session-description').textContent = session.description;
  $('#package-grid').replaceChildren();
  session.options.forEach(option => {
    const card = document.createElement('article');
    card.className = 'package-card session-package';
    card.innerHTML = `<h4>${safe(option[0])}</h4><strong class="session-price">$${option[1]} <small>USD</small></strong><p>${safe(option[2])}</p><ul>${option[3].map(detail => `<li>${safe(detail)}</li>`).join('')}</ul><button type="button" aria-label="Request ${safe(session.name)}: ${safe(option[0])}">REQUEST THIS SESSION</button>`;
    card.querySelector('button').addEventListener('click', () => {
      inquiryType.value = session.name;
      updateBookingOptions();
      inquiryPackage.value = optionLabel(option);
      updateBookingSummary();
      location.hash = 'booking';
      $('#inquiry-name').focus({preventScroll:true});
    });
    $('#package-grid').appendChild(card);
  });
}
sessionMenu.forEach(session => {
  categorySelect.add(new Option(session.name, session.name));
  inquiryType.add(new Option(session.name, session.name), inquiryType.options[inquiryType.options.length - 1]);
});
categorySelect.addEventListener('change', renderSessionOptions);
inquiryType.addEventListener('change', updateBookingOptions);
inquiryPackage.addEventListener('change', updateBookingSummary);
renderSessionOptions();
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
