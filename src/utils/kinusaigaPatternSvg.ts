export type PatternWeaveKind =
  | 'solid'
  | 'dots'
  | 'gingham'
  | 'stripes'
  | 'waves';

export interface KinusaigaPatternRegion {
  id: string;
  label: string;
  pathD: string;
  fillHex: string;
  weave: PatternWeaveKind;
}

export interface KinusaigaPatternSpec {
  summaryAr: string;
  backgroundColor: string;
  regions: KinusaigaPatternRegion[];
}

const VALID_WEAVES = new Set<PatternWeaveKind>([
  'solid',
  'dots',
  'gingham',
  'stripes',
  'waves',
]);

const DEFAULT_FALLBACK_COLOR = '#55734a';

export function sanitizeHexColor(input: unknown, fallback = DEFAULT_FALLBACK_COLOR): string {
  if (typeof input !== 'string') return fallback;
  const trimmed = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

export function sanitizeSvgPathD(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const normalized = input.replace(/[\r\n\t]+/g, ' ').trim();
  if (normalized.length < 6 || normalized.length > 4000) return null;
  // Must start with move command and only contain valid SVG path commands/numbers
  if (!/^[Mm]\s*-?\d/.test(normalized)) return null;
  if (!/^[MmLlHhVvCcSsQqTtAaZz0-9.,\s+-]+$/.test(normalized)) return null;
  return /[Zz]$/.test(normalized) ? normalized : `${normalized} Z`;
}

export function sanitizePatternSpec(raw: unknown): KinusaigaPatternSpec {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const summaryAr =
    typeof obj.summaryAr === 'string' && obj.summaryAr.trim().length > 0
      ? obj.summaryAr.trim().slice(0, 80)
      : 'باترون كينوسايجا مبسّط';

  const backgroundColor = sanitizeHexColor(obj.backgroundColor, '#faf9f5');

  const rawRegions = Array.isArray(obj.regions) ? obj.regions : [];
  const regions: KinusaigaPatternRegion[] = [];

  for (let i = 0; i < rawRegions.length && regions.length < 32; i++) {
    const item = rawRegions[i];
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const pathD = sanitizeSvgPathD(record.pathD);
    if (!pathD) continue;

    const weaveRaw =
      typeof record.weave === 'string' ? (record.weave.trim() as PatternWeaveKind) : 'solid';
    const weave: PatternWeaveKind = VALID_WEAVES.has(weaveRaw) ? weaveRaw : 'solid';

    const label =
      typeof record.label === 'string' && record.label.trim().length > 0
        ? record.label.trim().slice(0, 40)
        : `قطعة ${regions.length + 1}`;

    regions.push({
      id: `region-${regions.length + 1}`,
      label,
      pathD,
      fillHex: sanitizeHexColor(record.fillHex, DEFAULT_FALLBACK_COLOR),
      weave,
    });
  }

  return {
    summaryAr,
    backgroundColor,
    regions,
  };
}

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildRegionWeaveDefs(regions: KinusaigaPatternRegion[]): string {
  return regions
    .map((region, index) => {
      const pid = `kp-pat-${index}`;
      const base = region.fillHex;
      switch (region.weave) {
        case 'dots':
          return `
    <pattern id="${pid}" width="14" height="14" patternUnits="userSpaceOnUse">
      <rect width="14" height="14" fill="${base}"/>
      <circle cx="3.5" cy="3.5" r="1.35" fill="#faf9f5" fill-opacity="0.26"/>
      <circle cx="10.5" cy="10.5" r="1.35" fill="#221911" fill-opacity="0.12"/>
    </pattern>`;
        case 'gingham':
          return `
    <pattern id="${pid}" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="${base}"/>
      <rect width="8" height="16" fill="#faf9f5" fill-opacity="0.14"/>
      <rect width="16" height="8" fill="#221911" fill-opacity="0.09"/>
    </pattern>`;
        case 'stripes':
          return `
    <pattern id="${pid}" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <rect width="12" height="12" fill="${base}"/>
      <line x1="0" y1="0" x2="0" y2="12" stroke="#faf9f5" stroke-opacity="0.22" stroke-width="2.6"/>
      <line x1="6" y1="0" x2="6" y2="12" stroke="#221911" stroke-opacity="0.1" stroke-width="1"/>
    </pattern>`;
        case 'waves':
          return `
    <pattern id="${pid}" width="24" height="12" patternUnits="userSpaceOnUse">
      <rect width="24" height="12" fill="${base}"/>
      <path d="M0 12 Q6 4 12 12 T24 12" fill="none" stroke="#faf9f5" stroke-opacity="0.24" stroke-width="1.2"/>
    </pattern>`;
        case 'solid':
        default:
          return `
    <pattern id="${pid}" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="${base}"/>
      <path d="M0 0h4v4H0V0zm4 4h4v4H4V4z" fill="#faf9f5" fill-opacity="0.06"/>
    </pattern>`;
      }
    })
    .join('');
}

export function renderKinusaigaPatternSvg(spec: KinusaigaPatternSpec): string {
  const safe = sanitizePatternSpec(spec);
  const defs = buildRegionWeaveDefs(safe.regions);

  const regionPaths = safe.regions
    .map((region, index) => {
      const pid = `kp-pat-${index}`;
      return `
  <g data-region-label="${escapeXmlAttr(region.label)}">
    <path d="${escapeXmlAttr(region.pathD)}" fill="url(#${pid})" stroke="#241a10" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="${escapeXmlAttr(region.pathD)}" fill="none" stroke="#faf9f5" stroke-opacity="0.22" stroke-width="0.9" stroke-linejoin="round"/>
  </g>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${escapeXmlAttr(safe.summaryAr)}">
  <defs>${defs}
    <pattern id="kp-base-linen" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="${safe.backgroundColor}"/>
      <path d="M0 0h4v4H0V0zm4 4h4v4H4V4z" fill="#2d3f27" fill-opacity="0.035"/>
    </pattern>
  </defs>
  <rect width="400" height="400" fill="url(#kp-base-linen)"/>${regionPaths}
  <rect x="3" y="3" width="394" height="394" fill="none" stroke="#241a10" stroke-width="4" stroke-linejoin="round"/>
</svg>`;
}

export function svgToDataUrl(svgMarkup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
}
