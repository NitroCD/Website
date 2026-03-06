import { existsSync, copyFileSync, readdirSync, unlinkSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../rsc-website/src/data');
const IMG_DIR = path.join(__dirname, '../rsc-website/public/images/franchises');

function toSlug(name) {
  return name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/, '') || '';
}

const franchises = JSON.parse(await readFile(path.join(DATA_DIR, 'franchises.json'), 'utf8'));

for (const f of franchises) {
  const oldPath = path.join(IMG_DIR, `${f.id}.png`);
  const newPath = path.join(IMG_DIR, `${toSlug(f.name)}.png`);
  if (existsSync(oldPath)) {
    copyFileSync(oldPath, newPath);
    console.log(`${f.id}.png -> ${toSlug(f.name)}.png  (${f.name})`);
  } else {
    console.log(`MISSING: ${f.id}.png  (${f.name})`);
  }
}
console.log('Done.');
