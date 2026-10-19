import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const username = 'microck';
const earliest = '2015-01-10';
const assets = new URL('../assets/', import.meta.url);

async function getJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    // Pace requests and respect rate limits without retrying forever.
    await sleep(1_000);
    const response = await fetch(url, {
      headers: { 'user-agent': 'OpenAI File Downloader, XaiImageApiFetch/1.0' },
      signal: AbortSignal.timeout(30_000),
    });
    if (response.status === 429 && attempt < 2) {
      await response.body.cancel();
      const retryAfter = Number(response.headers.get('retry-after'));
      const delay = Math.max(30, Number.isFinite(retryAfter) ? retryAfter : 30);
      assert(delay <= 60, `${url}: rate limited for ${delay}s; rerun later`);
      console.warn(`npm rate limit; retrying in ${delay}s`);
      await sleep(delay * 1_000);
      continue;
    }
    assert(response.ok, `${url}: HTTP ${response.status}`);
    return response.json();
  }
}

// Paginate so publishing more packages never silently truncates the total.
const names = new Set();
let offset = 0;
let packageCount;
do {
  const page = await getJson(`https://registry.npmjs.org/-/v1/search?text=maintainer:${username}&size=250&from=${offset}`);
  assert(Number.isSafeInteger(page.total) && page.total > 0, 'npm returned no package total');
  packageCount ??= page.total;
  assert.equal(page.total, packageCount, 'Package list changed during pagination; rerun');
  assert(page.objects.length > 0, 'npm returned an empty search page');
  for (const { package: pkg } of page.objects) names.add(pkg.name);
  offset += page.objects.length;
} while (offset < packageCount);
assert.equal(names.size, packageCount, 'npm search returned duplicate or missing packages');

const latest = await getJson('https://api.npmjs.org/downloads/point/last-day');
assert(/^\d{4}-\d{2}-\d{2}$/.test(latest.end), 'npm returned an invalid cutoff date');
const through = latest.end;
const packages = [];

// Sequential requests keep load low. A failed package must never become a zero.
for (const name of [...names].sort()) {
  const encoded = encodeURIComponent(name);
  const metadata = await getJson(`https://registry.npmjs.org/${encoded}`);
  const created = metadata.time?.created?.slice(0, 10);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(created), `${name}: missing creation date`);
  const start = created > earliest ? created : earliest;
  let downloads = 0;
  let from = start;
  while (from <= through) {
    const yearEnd = `${from.slice(0, 4)}-12-31`;
    const end = yearEnd < through ? yearEnd : through;
    const counts = await getJson(`https://api.npmjs.org/downloads/point/${from}:${end}/${encoded}`);
    assert.equal(counts.package, name, `${name}: wrong package returned`);
    assert.equal(counts.start, from, `${name}: incomplete start date`);
    assert.equal(counts.end, end, `${name}: incomplete end date`);
    assert(Number.isSafeInteger(counts.downloads) && counts.downloads >= 0, `${name}: invalid download count`);
    downloads += counts.downloads;
    from = `${Number(from.slice(0, 4)) + 1}-01-01`;
  }
  packages.push({ name, start, downloads });
  console.log(`${name}: ${downloads.toLocaleString('en-US')}`);
}

const total = packages.reduce((sum, pkg) => sum + pkg.downloads, 0);
assert(Number.isSafeInteger(total), 'Total exceeds the safe integer range');
const label = `npm downloads: ${total.toLocaleString('en-US')}`;
const width = label.length * 7 + 24;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="24" role="img" aria-label="${label}">
  <title>${label} across ${packages.length} packages, through ${through}</title>
  <rect width="${width}" height="24" fill="#000"/>
  <text x="12" y="16" fill="#fff" font-family="DejaVu Sans Mono,monospace" font-size="11">${label}</text>
</svg>
`;

// Publish only after every package and time range has succeeded.
await mkdir(assets, { recursive: true });
await writeFile(new URL('npm-downloads.json', assets), `${JSON.stringify({ username, through, total, packages }, null, 2)}\n`);
await writeFile(new URL('npm-downloads.svg', assets), svg);
console.log(`${label} (${packages.length} packages, through ${through})`);
