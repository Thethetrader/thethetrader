const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://tradingpourlesnuls.com';

const STATIC_PAGES = [
  { loc: '/',                 lastmod: '2026-05-14', changefreq: 'weekly',  priority: '1.0' },
  { loc: '/premium',          lastmod: '2026-05-14', changefreq: 'monthly', priority: '0.9' },
  { loc: '/faq',              lastmod: '2026-05-14', changefreq: 'monthly', priority: '0.8' },
  { loc: '/contact',          lastmod: '2026-05-14', changefreq: 'monthly', priority: '0.7' },
  { loc: '/reserver',         lastmod: '2026-05-14', changefreq: 'monthly', priority: '0.7' },
  { loc: '/mentions-legales', lastmod: '2026-05-14', changefreq: 'yearly',  priority: '0.3' },
  { loc: '/confidentialite',  lastmod: '2026-05-14', changefreq: 'yearly',  priority: '0.3' },
  { loc: '/cgv',              lastmod: '2026-05-14', changefreq: 'yearly',  priority: '0.3' },
];

exports.handler = async () => {
  let articles = [];
  try {
    const manifestPath = path.join(__dirname, '../../public/articles-manifest.json');
    articles = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch (e) {
    console.error('Could not read articles-manifest.json:', e.message);
  }

  const urls = [
    ...STATIC_PAGES.map(p => `
  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...articles.map(a => `
  <url>
    <loc>${BASE_URL}/articles/${a.slug}</loc>
    <lastmod>${a.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}
</urlset>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
    body: xml,
  };
};
