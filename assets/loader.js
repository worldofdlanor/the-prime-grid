/* Load hosted photo data while keeping the offline preview available. */
(async function startPrimeGrid() {
  async function readList(path, fallback) {
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) return data;
      }
    } catch (_error) { /* The file:// preview uses bundled photos. */ }
    return fallback;
  }

  [window.PRIME_MEDIA, window.PRIME_ALBUMS] = await Promise.all([
    readList('data/portfolio.json', window.PRIME_MEDIA),
    readList('data/albums.json', [])
  ]);
  const script = document.createElement('script');
  script.src = 'assets/app.js?v=20261125b';
  document.body.appendChild(script);
})();
