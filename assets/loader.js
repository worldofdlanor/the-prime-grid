/* Loads live photo data on hosted websites, or bundled samples offline. */
(async function startPrimeGrid(){
 try {
  const response=await fetch('data/portfolio.json',{cache:'no-store'});
  if(response.ok){const updated=await response.json();if(Array.isArray(updated))window.PRIME_MEDIA=updated;}
 } catch (_error) { /* file:// preview uses assets/media.js. */ }
 const script=document.createElement('script');script.src='assets/app.js';document.body.appendChild(script);
})();
