import { writeFile } from 'node:fs/promises';

// Match the Spotify widget's surface, corner radius, system font, and accent.
// Both daily jobs use this renderer so their badges stay visually consistent.
export function renderBadge(label, count, title, theme) {
  const colors = {
    dark: { surface: '#161B22', text: '#FFFFFF', accent: '#B19AEF' },
    light: { surface: '#F6F8FA', text: '#000000', accent: '#7253A5' },
  }[theme];
  const value = count.toLocaleString('en-US');
  const width = Math.ceil(label.length * 7 + value.length * 8 + 40);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="34" role="img" aria-label="${label}: ${value}">
  <title>${title}</title>
  <rect width="${width}" height="34" rx="5" fill="${colors.surface}"/>
  <g font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif">
    <text x="12" y="22" fill="${colors.text}" font-size="13" font-weight="500">${label}</text>
    <text x="${width - 12}" y="22" text-anchor="end" fill="${colors.accent}" font-size="14" font-weight="600" style="font-variant-numeric:tabular-nums">${value}</text>
  </g>
</svg>
`;
}

export async function writeBadges(directory, name, label, count, title) {
  for (const theme of ['dark', 'light']) {
    const filename = theme === 'dark' ? `${name}.svg` : `${name}-light.svg`;
    await writeFile(new URL(filename, directory), renderBadge(label, count, title, theme));
  }
}
