import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const username = 'Microck';
const assetsDirectory = new URL('../assets/', import.meta.url);
const metadataFilename = /checksum|sha256|sha512|\.sig$|\.asc$|\.sbom\.|\.intoto\./i;

// gh owns authentication and pagination, both locally and in GitHub Actions.
function getPages(path) {
  const json = execFileSync('gh', [
    'api', path, '--paginate', '--slurp',
    '-H', 'User-Agent: OpenAI File Downloader, XaiImageApiFetch/1.0',
  ], { encoding: 'utf8', maxBuffer: 40 * 1024 * 1024 });
  return JSON.parse(json).flat();
}

function renderBadge(label, title) {
  const width = label.length * 7 + 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="24" role="img" aria-label="${label}">
  <title>${title}</title>
  <rect width="${width}" height="24" fill="#000"/>
  <text x="12" y="16" fill="#fff" font-family="DejaVu Sans Mono,monospace" font-size="11">${label}</text>
</svg>
`;
}

const publicRepositories = getPages(`users/${username}/repos?per_page=100&type=owner`)
  .filter(repository => !repository.private && !repository.fork);
assert(publicRepositories.length > 0, 'GitHub returned no public repositories');
const stars = publicRepositories.reduce((sum, repository) => sum + repository.stargazers_count, 0);
assert(Number.isSafeInteger(stars) && stars >= 0, 'GitHub returned an invalid star total');
const disabledRepositories = publicRepositories
  .filter(repository => repository.disabled)
  .map(repository => repository.name)
  .sort();
const repositories = [];

// Fetch sequentially to keep API load bounded as the account grows.
for (const repository of publicRepositories.filter(repository => !repository.disabled)) {
  const releases = getPages(`repos/${username}/${repository.name}/releases?per_page=100`);
  const assets = releases.filter(release => !release.draft).flatMap(release => release.assets);
  if (assets.length === 0) continue;
  let downloads = 0;
  let excludedDownloads = 0;
  for (const asset of assets) {
    assert(Number.isSafeInteger(asset.download_count) && asset.download_count >= 0,
      `${repository.name}/${asset.name}: invalid download count`);
    if (metadataFilename.test(asset.name)) excludedDownloads += asset.download_count;
    else downloads += asset.download_count;
  }
  repositories.push({ name: repository.name, downloads, excludedDownloads });
  console.log(`${repository.name}: ${downloads.toLocaleString('en-US')}`);
}
repositories.sort((left, right) => left.name.localeCompare(right.name, 'en'));
const total = repositories.reduce((sum, repository) => sum + repository.downloads, 0);
assert(Number.isSafeInteger(total), 'Total exceeds the safe integer range');
const checkedOn = new Date().toISOString().slice(0, 10);
const label = `GitHub release downloads: ${total.toLocaleString('en-US')}`;
const svg = renderBadge(label, `${label} across ${repositories.length} repositories, checked ${checkedOn}`);
const starsLabel = `GitHub stars: ${stars.toLocaleString('en-US')}`;

// Preserve the published badge unless every eligible repository was counted.
await mkdir(assetsDirectory, { recursive: true });
await writeFile(new URL('github-downloads.json', assetsDirectory), `${JSON.stringify({
  username, checkedOn, total, stars, disabledRepositories, repositories,
}, null, 2)}\n`);
await writeFile(new URL('github-downloads.svg', assetsDirectory), svg);
await writeFile(new URL('github-stars.svg', assetsDirectory), renderBadge(starsLabel,
  `${starsLabel} across ${publicRepositories.length} public non-fork repositories, checked ${checkedOn}`));
console.log(`${label} (${repositories.length} repositories)`);
console.log(starsLabel);
