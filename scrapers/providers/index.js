'use strict';

// Metadata-only adapters based on the supplied scraper collection.
// Media/episode resolvers are intentionally not called from catalog ingestion.
const SOURCES = {
  animekompi: { type: 'ANIME', label: 'AnimeKompi' },
  shinigami: { type: 'MANHWA', label: 'Shinigami' },
  awafim: { type: 'FILM', label: 'AwaFim' }
};

const UA = 'Mozilla/5.0 (compatible; NexStreamCatalog/1.0)';

async function request(url, headers = {}) {
  const response = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json,text/html;q=0.9,*/*;q=0.8', ...headers },
    signal: AbortSignal.timeout(10000),
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}`);
  return response;
}

function safeUrl(value, base) {
  if (!value || typeof value !== 'string') return null;
  try {
    const url = new URL(value, base);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch { return null; }
}

function decodeHtml(value = '') {
  return String(value).replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function cleanText(value = '') {
  return decodeHtml(String(value).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function slugFromUrl(value) {
  try { return new URL(value).pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() || ''; }
  catch { return String(value || '').split('/').filter(Boolean).pop() || ''; }
}

function unwrapList(payload, keys = ['results', 'items', 'data', 'mangas', 'anime']) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      const nested = unwrapList(value, keys);
      if (nested.length) return nested;
    }
  }
  return [];
}

function normalize(item, type, source, baseUrl) {
  const title = String(item.title || item.name || item.animeTitle || '').trim();
  if (!title) return null;
  const rawUrl = item.url || item.source_url || item.link || item.permalink ||
    (item.slug ? `${baseUrl}/${String(item.slug).replace(/^\/+/, '')}` : '');
  const sourceUrl = safeUrl(rawUrl, baseUrl);
  const slug = String(item.slug || item.manga_id || item.id || slugFromUrl(sourceUrl) || title)
    .toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 140);
  const poster = safeUrl(item.poster || item.cover || item.cover_image_url || item.cover_portrait_url ||
    item.thumbnail || item.image || item.coverImage, baseUrl);
  const rawGenres = item.genres || item.genre || item.tags || [];
  const genres = (Array.isArray(rawGenres) ? rawGenres : String(rawGenres).split(/[,|]/))
    .map(value => typeof value === 'object' ? value.name : value)
    .filter(Boolean).map(value => String(value).trim()).filter(Boolean).slice(0, 20);
  const year = Number(item.release_year || item.year || item.releaseYear);
  return {
    id: `${source}:${slug || BufferlessHash(title)}`,
    type,
    title: title.slice(0, 300),
    poster,
    synopsis: String(item.synopsis || item.description || item.summary || '').slice(0, 5000) || null,
    genres,
    status: String(item.status || '').slice(0, 60) || null,
    release_year: Number.isInteger(year) && year >= 1900 && year <= 2100 ? year : null,
    source_id: source,
    source_url: sourceUrl
  };
}

function BufferlessHash(text) {
  let hash = 2166136261;
  for (const char of String(text)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(16);
}

async function animekompi(page) {
  const base = 'https://v10.animekompi.sbs';
  const url = new URL('/api/anime', base);
  url.search = new URLSearchParams({ page: String(page), limit: '24', order: 'update' });
  const payload = await (await request(url.toString())).json();
  return unwrapList(payload, ['data']).map(item => normalize({
    ...item,
    poster: item.cover,
    source_url: item.slug ? `${base}/anime/${item.slug}/` : item.url
  }, 'ANIME', 'animekompi', base)).filter(Boolean);
}

async function shinigami(page) {
  const base = 'https://s1.shinigami.mx';
  const api = 'https://api.shinigami.io/v1/manga/list';
  const url = new URL(api);
  url.search = new URLSearchParams({
    sort: 'latest', sort_order: 'desc', offset: String((page - 1) * 24), limit: '24'
  });
  const payload = await (await request(url.toString(), {
    Accept: 'application/json', Origin: base, Referer: base + '/'
  })).json();
  return unwrapList(payload, ['data', 'mangas', 'items']).map(item => normalize({
    ...item,
    slug: item.manga_id || item.id,
    source_url: item.manga_id ? `${base}/series/${item.manga_id}` : item.url,
    poster: item.cover_image_url || item.cover_portrait_url,
    synopsis: item.description,
    release_year: item.release_year
  }, 'MANHWA', 'shinigami', base)).filter(Boolean);
}

function parseAwafimCards(html, base) {
  const items = [];
  const cardPattern = /<li class="post-item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = cardPattern.exec(html)) !== null) {
    const block = match[1];
    const heading = block.match(/<h2 class="post-title">\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const thumb = block.match(/<a[^>]*class="post-thumb"[^>]*aria-label="([^"]*)"[^>]*href="([^"]+)"/i);
    const href = heading ? heading[1] : thumb ? thumb[2] : '';
    const title = heading ? cleanText(heading[2]) : thumb ? cleanText(thumb[1]) : '';
    const image = block.match(/<img[^>]*\b(?:src|data-src)="([^"]+)"/i);
    if (!title || !href) continue;
    items.push({
      title, slug: slugFromUrl(href), url: safeUrl(href, base),
      poster: image ? safeUrl(decodeHtml(image[1]), base) : null
    });
  }
  return items;
}

async function awafim(page) {
  const base = 'https://theawafim.net';
  const path = page > 1 ? `/category/movies/page/${page}/` : '/category/movies/';
  const response = await request(new URL(path, base).toString(), { Accept: 'text/html,*/*;q=0.8' });
  const html = await response.text();
  return parseAwafimCards(html, base).map(item =>
    normalize(item, 'FILM', 'awafim', base)
  ).filter(Boolean);
}

const adapters = { animekompi, shinigami, awafim };

async function scrape(source, page = 1) {
  const key = String(source || '').toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(adapters, key)) {
    throw new Error('Unknown source. Supported sources: ' + Object.keys(adapters).join(', '));
  }
  const safePage = Math.min(5, Math.max(1, Number.parseInt(page, 10) || 1));
  const items = await adapters[key](safePage);
  return { source: key, type: SOURCES[key].type, page: safePage, items };
}

module.exports = { SOURCES, scrape };
