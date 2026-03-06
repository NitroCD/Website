/**
 * RSC Image Fetcher (run once to download all logos locally)
 * Run: node scripts/fetch-images.mjs
 * Logos are saved as {franchise-name-slug}.png (e.g. dwarf-haven.png)
 */
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.join(__dirname, '../rsc-website/public/images/franchises');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (existsSync(dest)) { resolve(); return; }
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => writeFile(dest, Buffer.concat(chunks)).then(resolve));
    }).on('error', reject);
  });
}

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  await mkdir(IMG_DIR, { recursive: true });

  const franchises = await fetchJSON('https://api.rscna.com/api/v1/franchises/?league=1&limit=100');
  console.log(`Downloading ${franchises.length} franchise logos...`);

  for (const f of franchises) {
    if (!f.logo) continue;
    const slug = f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/, '');
    const filename = `${slug}.png`;
    const dest = path.join(IMG_DIR, filename);
    try {
      await download(f.logo, dest);
      console.log(`  ✓ ${f.name} -> ${filename}`);
    } catch (e) {
      console.error(`  ✗ ${f.name}: ${e.message}`);
    }
  }

  console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
