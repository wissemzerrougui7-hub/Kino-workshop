import type { WorkshopThemeId } from './theme';

export type SwatchPatternKind =
  | 'dots'
  | 'gingham'
  | 'stripes'
  | 'leaf'
  | 'swirl'
  | 'waves';

export interface FabricSwatch {
  id: string;
  themeId: WorkshopThemeId;
  patternKind: SwatchPatternKind;
  labelAr: string;
  baseColor: string;
  inkColor: string;
  secondaryColor: string;
}

export interface FlowerRegion {
  id: string;
  group: 'background' | 'corner' | 'stem' | 'leaf' | 'petal' | 'center';
  labelAr: string;
  pathD: string;
  cx: number;
  cy: number;
}

function buildPetalPath(
  cx: number,
  cy: number,
  angleDeg: number,
  innerR: number,
  outerR: number,
  halfSpreadDeg: number
): string {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const a0 = rad(angleDeg - halfSpreadDeg);
  const a1 = rad(angleDeg + halfSpreadDeg);
  const mid = rad(angleDeg);

  const xStart = cx + innerR * Math.cos(a0);
  const yStart = cy + innerR * Math.sin(a0);
  const xEnd = cx + innerR * Math.cos(a1);
  const yEnd = cy + innerR * Math.sin(a1);

  const ctrlR = innerR + (outerR - innerR) * 0.72;
  const tipR = outerR;
  const spreadCtrl = rad(halfSpreadDeg * 1.15);

  const c1x = cx + ctrlR * Math.cos(mid - spreadCtrl);
  const c1y = cy + ctrlR * Math.sin(mid - spreadCtrl);
  const tipX = cx + tipR * Math.cos(mid);
  const tipY = cy + tipR * Math.sin(mid);
  const c2x = cx + ctrlR * Math.cos(mid + spreadCtrl);
  const c2y = cy + ctrlR * Math.sin(mid + spreadCtrl);

  const f = (n: number) => n.toFixed(1);
  return `M ${f(xStart)} ${f(yStart)} Q ${f(c1x)} ${f(c1y)} ${f(tipX)} ${f(tipY)} Q ${f(c2x)} ${f(c2y)} ${f(xEnd)} ${f(yEnd)} A ${innerR} ${innerR} 0 0 0 ${f(xStart)} ${f(yStart)} Z`;
}

function buildFlowerRegions(): FlowerRegion[] {
  const regions: FlowerRegion[] = [
    {
      id: 'bg',
      group: 'background',
      labelAr: 'الخلفية',
      pathD: 'M 0 0 H 400 V 400 H 0 Z',
      cx: 200,
      cy: 200,
    },
    {
      id: 'corner-tl',
      group: 'corner',
      labelAr: 'الركن العلوي الأيسر',
      pathD: 'M 0 0 L 104 0 Q 72 72 0 104 Z',
      cx: 34,
      cy: 34,
    },
    {
      id: 'corner-tr',
      group: 'corner',
      labelAr: 'الركن العلوي الأيمن',
      pathD: 'M 400 0 L 296 0 Q 328 72 400 104 Z',
      cx: 366,
      cy: 34,
    },
    {
      id: 'corner-bl',
      group: 'corner',
      labelAr: 'الركن السفلي الأيسر',
      pathD: 'M 0 400 L 104 400 Q 72 328 0 296 Z',
      cx: 34,
      cy: 366,
    },
    {
      id: 'corner-br',
      group: 'corner',
      labelAr: 'الركن السفلي الأيمن',
      pathD: 'M 400 400 L 296 400 Q 328 328 400 296 Z',
      cx: 366,
      cy: 366,
    },
    {
      id: 'stem',
      group: 'stem',
      labelAr: 'الساق',
      pathD:
        'M 192 184 Q 186 285 191 400 L 209 400 Q 204 285 208 184 Z',
      cx: 199,
      cy: 295,
    },
    {
      id: 'leaf-left',
      group: 'leaf',
      labelAr: 'الورقة اليسرى',
      pathD:
        'M 190 318 C 142 316 100 286 94 252 C 128 250 170 274 190 306 Z',
      cx: 142,
      cy: 285,
    },
    {
      id: 'leaf-right',
      group: 'leaf',
      labelAr: 'الورقة اليمنى',
      pathD:
        'M 208 296 C 258 294 300 264 306 230 C 272 228 230 252 208 284 Z',
      cx: 258,
      cy: 263,
    },
  ];

  // 10 petals evenly distributed around center (200, 148)
  const centerX = 200;
  const centerY = 148;
  for (let i = 0; i < 10; i++) {
    const angleDeg = -90 + i * 36;
    const rad = (angleDeg * Math.PI) / 180;
    regions.push({
      id: `petal-${i}`,
      group: 'petal',
      labelAr: `البتلة ${i + 1}`,
      pathD: buildPetalPath(centerX, centerY, angleDeg, 36, 118, 15.5),
      cx: Math.round(centerX + 78 * Math.cos(rad)),
      cy: Math.round(centerY + 78 * Math.sin(rad)),
    });
  }

  regions.push({
    id: 'center',
    group: 'center',
    labelAr: 'قلب الزهرة',
    pathD:
      'M 200 112 A 36 36 0 1 0 200 184 A 36 36 0 1 0 200 112 Z',
    cx: centerX,
    cy: centerY,
  });

  return regions;
}

export const FLOWER_REGIONS: FlowerRegion[] = buildFlowerRegions();

export const THEME_FABRIC_SWATCHES: Record<WorkshopThemeId, FabricSwatch[]> = {
  forest: [
    {
      id: 'forest-dots',
      themeId: 'forest',
      patternKind: 'dots',
      labelAr: 'نقاط',
      baseColor: '#3a4f32',
      inkColor: '#faf9f5',
      secondaryColor: '#a9bf9c',
    },
    {
      id: 'forest-gingham',
      themeId: 'forest',
      patternKind: 'gingham',
      labelAr: 'كارو',
      baseColor: '#a9bf9c',
      inkColor: '#2d3f27',
      secondaryColor: '#faf9f5',
    },
    {
      id: 'forest-stripes',
      themeId: 'forest',
      patternKind: 'stripes',
      labelAr: 'خطوط',
      baseColor: '#55734a',
      inkColor: '#faf9f5',
      secondaryColor: '#2d3f27',
    },
    {
      id: 'forest-leaf',
      themeId: 'forest',
      patternKind: 'leaf',
      labelAr: 'أوراق',
      baseColor: '#2d3f27',
      inkColor: '#a9bf9c',
      secondaryColor: '#55734a',
    },
    {
      id: 'forest-swirl',
      themeId: 'forest',
      patternKind: 'swirl',
      labelAr: 'دوامة',
      baseColor: '#faf9f5',
      inkColor: '#55734a',
      secondaryColor: '#a9bf9c',
    },
    {
      id: 'forest-waves',
      themeId: 'forest',
      patternKind: 'waves',
      labelAr: 'أمواج',
      baseColor: '#8fa982',
      inkColor: '#2d3f27',
      secondaryColor: '#faf9f5',
    },
  ],
  autumn: [
    {
      id: 'autumn-dots',
      themeId: 'autumn',
      patternKind: 'dots',
      labelAr: 'نقاط',
      baseColor: '#c2692a',
      inkColor: '#faf9f5',
      secondaryColor: '#f5e1d2',
    },
    {
      id: 'autumn-gingham',
      themeId: 'autumn',
      patternKind: 'gingham',
      labelAr: 'كارو',
      baseColor: '#faf9f5',
      inkColor: '#c2692a',
      secondaryColor: '#6b4e31',
    },
    {
      id: 'autumn-stripes',
      themeId: 'autumn',
      patternKind: 'stripes',
      labelAr: 'خطوط',
      baseColor: '#d99028',
      inkColor: '#4a3520',
      secondaryColor: '#faf9f5',
    },
    {
      id: 'autumn-leaf',
      themeId: 'autumn',
      patternKind: 'leaf',
      labelAr: 'أوراق',
      baseColor: '#55734a',
      inkColor: '#f5e1d2',
      secondaryColor: '#c2692a',
    },
    {
      id: 'autumn-swirl',
      themeId: 'autumn',
      patternKind: 'swirl',
      labelAr: 'دوامة',
      baseColor: '#7a3e26',
      inkColor: '#f5e1d2',
      secondaryColor: '#d99028',
    },
    {
      id: 'autumn-waves',
      themeId: 'autumn',
      patternKind: 'waves',
      labelAr: 'أمواج',
      baseColor: '#e7c9a9',
      inkColor: '#7a3e26',
      secondaryColor: '#c2692a',
    },
  ],
  sakura: [
    {
      id: 'sakura-dots',
      themeId: 'sakura',
      patternKind: 'dots',
      labelAr: 'نقاط',
      baseColor: '#d4607f',
      inkColor: '#faf9f5',
      secondaryColor: '#f6dce4',
    },
    {
      id: 'sakura-gingham',
      themeId: 'sakura',
      patternKind: 'gingham',
      labelAr: 'كارو',
      baseColor: '#f6dce4',
      inkColor: '#d4607f',
      secondaryColor: '#faf9f5',
    },
    {
      id: 'sakura-stripes',
      themeId: 'sakura',
      patternKind: 'stripes',
      labelAr: 'خطوط',
      baseColor: '#8f3b56',
      inkColor: '#f6dce4',
      secondaryColor: '#faf9f5',
    },
    {
      id: 'sakura-leaf',
      themeId: 'sakura',
      patternKind: 'leaf',
      labelAr: 'أوراق',
      baseColor: '#a9bf9c',
      inkColor: '#2d3f27',
      secondaryColor: '#faf9f5',
    },
    {
      id: 'sakura-swirl',
      themeId: 'sakura',
      patternKind: 'swirl',
      labelAr: 'دوامة',
      baseColor: '#faf9f5',
      inkColor: '#d4607f',
      secondaryColor: '#8f3b56',
    },
    {
      id: 'sakura-waves',
      themeId: 'sakura',
      patternKind: 'waves',
      labelAr: 'أمواج',
      baseColor: '#e89cb1',
      inkColor: '#faf9f5',
      secondaryColor: '#55734a',
    },
  ],
  sun: [
    {
      id: 'sun-dots',
      themeId: 'sun',
      patternKind: 'dots',
      labelAr: 'نقاط',
      baseColor: '#d9a014',
      inkColor: '#2d3f27',
      secondaryColor: '#faf9f5',
    },
    {
      id: 'sun-gingham',
      themeId: 'sun',
      patternKind: 'gingham',
      labelAr: 'كارو',
      baseColor: '#faf9f5',
      inkColor: '#d9a014',
      secondaryColor: '#55734a',
    },
    {
      id: 'sun-stripes',
      themeId: 'sun',
      patternKind: 'stripes',
      labelAr: 'خطوط',
      baseColor: '#c2692a',
      inkColor: '#f8ecd0',
      secondaryColor: '#faf9f5',
    },
    {
      id: 'sun-leaf',
      themeId: 'sun',
      patternKind: 'leaf',
      labelAr: 'أوراق',
      baseColor: '#55734a',
      inkColor: '#f8ecd0',
      secondaryColor: '#2d3f27',
    },
    {
      id: 'sun-swirl',
      themeId: 'sun',
      patternKind: 'swirl',
      labelAr: 'دوامة',
      baseColor: '#f8ecd0',
      inkColor: '#b57c08',
      secondaryColor: '#2d3f27',
    },
    {
      id: 'sun-waves',
      themeId: 'sun',
      patternKind: 'waves',
      labelAr: 'أمواج',
      baseColor: '#3a4f32',
      inkColor: '#d9a014',
      secondaryColor: '#faf9f5',
    },
  ],
};

export const ALL_SWATCHES: FabricSwatch[] = Object.values(
  THEME_FABRIC_SWATCHES
).flat();

/**
 * Generates a cohesive random fill across all 19 flower regions
 * using the active theme's 6 fabric swatches.
 */
export function generateRandomFlowerFill(
  themeId: WorkshopThemeId,
  rng: () => number = Math.random
): Record<string, string> {
  const swatches = THEME_FABRIC_SWATCHES[themeId];
  const pick = (pool: FabricSwatch[]) =>
    pool[Math.floor(rng() * pool.length) % pool.length].id;

  const petalPool = [swatches[0], swatches[1], swatches[4], swatches[5]];
  const leafPool = [swatches[3], swatches[2]];
  const cornerPool = [swatches[1], swatches[2], swatches[5]];
  const cornerChoice = pick(cornerPool);
  const bgChoice = pick([swatches[4], swatches[1]]);

  const fills: Record<string, string> = {};
  for (const region of FLOWER_REGIONS) {
    if (region.group === 'background') {
      fills[region.id] = bgChoice;
    } else if (region.group === 'corner') {
      fills[region.id] = cornerChoice;
    } else if (region.group === 'leaf' || region.group === 'stem') {
      fills[region.id] = pick(leafPool);
    } else if (region.group === 'center') {
      fills[region.id] = swatches[0].id;
    } else {
      fills[region.id] = pick(petalPool);
    }
  }
  return fills;
}
