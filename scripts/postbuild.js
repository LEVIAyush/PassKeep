// Runs after `expo export --platform web` (see "build" in package.json).
//  1. Vercel drops any folder named "node_modules" from a deployment, but Expo
//     writes vendored assets (icon fonts) to dist/assets/node_modules. Rename it
//     and rewrite every reference so icons don't 404 in production.
//  2. Add the tags Expo doesn't: web manifest, iOS icon, safe-area viewport,
//     dark colour scheme, no-index (this is a private app, not a public page).
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const fail = (msg) => { console.error(`postbuild: ${msg}`); process.exit(1); };
if (!fs.existsSync(path.join(dist, 'index.html'))) fail('dist/index.html not found. Did `expo export` run?');

// 1 ---- move assets/node_modules -> assets/vendor
const from = path.join(dist, 'assets', 'node_modules');
const to = path.join(dist, 'assets', 'vendor');
let moved = false;
if (fs.existsSync(from)) {
  fs.renameSync(from, to);
  moved = true;
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
  let rewritten = 0;
  for (const file of walk(dist).filter((f) => /\.(js|html|css|json)$/.test(f))) {
    const src = fs.readFileSync(file, 'utf8');
    if (!src.includes('assets/node_modules')) continue;
    fs.writeFileSync(file, src.split('assets/node_modules').join('assets/vendor'));
    rewritten++;
  }
  console.log(`postbuild: moved assets/node_modules -> assets/vendor (rewrote ${rewritten} file(s))`);
}
const leftovers = [];
(function scan(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) { if (d.name === 'node_modules') leftovers.push(p); else scan(p); }
  }
})(dist);
if (leftovers.length) fail(`a node_modules folder is still in dist (Vercel would drop it): ${leftovers.join(', ')}`);

// 2 ---- index.html
const htmlPath = path.join(dist, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/<meta name="viewport"[^>]*>/, '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />');
const head = [
  '<meta name="color-scheme" content="dark" />',
  '<meta name="robots" content="noindex, nofollow" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<meta name="apple-mobile-web-app-title" content="PassKeep" />',
  '<link rel="manifest" href="/manifest.json" />',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
  '<style>:root{color-scheme:dark}html,body{background:#090D0B}</style>',
].join('\n    ');
if (!html.includes('rel="manifest"')) html = html.replace('</head>', `    ${head}\n  </head>`);
html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, '<noscript>PassKeep needs JavaScript to encrypt and decrypt your vault. Please enable it and reload.</noscript>');
fs.writeFileSync(htmlPath, html);

// 3 ---- sanity checks: fail the build rather than ship something broken
if (/<script(?![^>]*\ssrc=)[^>]*>/.test(html)) fail('index.html contains an inline <script>, which the Content-Security-Policy in vercel.json would block.');
for (const need of ['manifest.json', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) {
  if (!fs.existsSync(path.join(dist, need))) fail(`missing dist/${need}`);
}
console.log(`postbuild: ok${moved ? '' : ' (no vendored assets to move)'}`);
