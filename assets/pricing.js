(()=>{'use strict';
const select=document.querySelector('#session-category');
const grid=document.querySelector('#package-grid');
const safe=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){
 const session=window.PRIME_SESSIONS.find(item=>item.name===select.value);
 document.querySelector('#session-description').textContent=session.description;
 grid.replaceChildren();
 session.options.forEach(option=>{
  const card=document.createElement('article');card.className='package-card session-package';
  const url='index.html?'+new URLSearchParams({session:session.name,option:option[0]})+'#booking';
  card.innerHTML=`<h2>${safe(option[0])}</h2><strong class="session-price">$${option[1]} <small>USD</small></strong><p>${safe(option[2])}</p><ul>${option[3].map(detail=>`<li>${safe(detail)}</li>`).join('')}</ul><a class="button button-light" href="${safe(url)}">REQUEST THIS SESSION</a>`;
  grid.appendChild(card);
 });
}
window.PRIME_SESSIONS.forEach(session=>select.add(new Option(session.name,session.name)));
const requested=new URLSearchParams(location.search).get('session');if(window.PRIME_SESSIONS.some(s=>s.name===requested))select.value=requested;select.addEventListener('change',render);render();
const menu=document.querySelector('#menu-button'),nav=document.querySelector('#mobile-navigation');
menu.addEventListener('click',()=>{nav.hidden=!nav.hidden;menu.setAttribute('aria-expanded',String(!nav.hidden))});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.hidden=true;menu.setAttribute('aria-expanded','false')}});
matchMedia('(max-width:1150px)').addEventListener('change',e=>{if(!e.matches){nav.hidden=true;menu.setAttribute('aria-expanded','false')}});
document.querySelector('#copyright-year').textContent=new Date().getFullYear();
})();