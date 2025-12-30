import { readFileSync, writeFileSync, copyFileSync } from 'fs';

const swPath = 'public/sw.js';
const distSwPath = 'dist/sw.js';
const sw = readFileSync(swPath, 'utf8');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const updated = sw.replace(
    /const CACHE_NAME = 'musubi-[^']+'/,
    `const CACHE_NAME = 'musubi-${timestamp}'`
);

writeFileSync(swPath, updated);
writeFileSync(distSwPath, updated);
console.log(`SW cache version updated to: musubi-${timestamp}`);