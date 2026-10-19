// Match the Spotify widget's surface, corner radius, system font, and accent.
// Both daily jobs use this renderer so their badges stay visually consistent.
export function renderBadge(label, count, title) {
  const value = count.toLocaleString('en-US');
  const width = Math.ceil(label.length * 7 + value.length * 8 + 40);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="34" role="img" aria-label="${label}: ${value}">
  <title>${title}</title>
  <rect width="${width}" height="34" rx="5" fill="#161B22"/>
  <g font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif">
    <text x="12" y="22" fill="#FFFFFF" font-size="13" font-weight="500">${label}</text>
    <text x="${width - 12}" y="22" text-anchor="end" fill="#B19AEF" font-size="14" font-weight="600" style="font-variant-numeric:tabular-nums">${value}</text>
  </g>
</svg>
`;
}
