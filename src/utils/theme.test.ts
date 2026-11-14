import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSHOP_THEMES,
  HEADER_NAV_LINKS,
  HERO_CONTENT,
  HERO_HILL_LAYERS,
  INTRO_CONTENT,
  INTRO_ASSETS,
  INTRO_VIDEO_URL,
  CURRENT_WORKSHOP,
  KINO_GIRL_ARCH_SRC,
  KINO_INSTAGRAM,
  formatSeatsLeft,
  getWorkshopTheme,
  getThemeCssVars,
  generatePetalSpecs,
  normalizePublicAssetPath,
  resolveAssetUrl,
} from './theme';
import { parseVideoSource } from './video';
import {
  FLOWER_REGIONS,
  THEME_FABRIC_SWATCHES,
  generateRandomFlowerFill,
} from './kinusaigaCraft';
import {
  ARTWORK_TILE_OPTIONS,
  formatRegistrationSuccessMessage,
  toggleWorkshopSlotSelection,
  validateRegistrationForm,
} from './registration';
import {
  GALLERY_WALL_ITEMS,
  REVIEWS_WALL_CONTENT,
  STARTER_APPROVED_REVIEWS,
  getReviewNoteVisuals,
  validatePublicReviewForm,
} from './galleryAndReviews';

test('upcoming workshop is a single config object with two slots and sample data', () => {
  assert.equal(CURRENT_WORKSHOP.title, 'ورشة الخريف');
  assert.equal(CURRENT_WORKSHOP.themeKey, 'autumn');
  assert.equal(CURRENT_WORKSHOP.seatsLeft, 12);
  assert.equal(formatSeatsLeft(CURRENT_WORKSHOP.seatsLeft), 'باقيين 12 بلايص');
  assert.equal(CURRENT_WORKSHOP.slots.length, 2);
  assert.equal(CURRENT_WORKSHOP.slots[0].weekday, 'السبت');
  assert.equal(CURRENT_WORKSHOP.slots[0].dayNumber, '21');
  assert.equal(CURRENT_WORKSHOP.slots[1].weekday, 'الجمعة');
  assert.equal(CURRENT_WORKSHOP.slots[1].dayNumber, '27');
});

test('intro copy, 3 steps, and video config match user specification', () => {
  assert.equal(INTRO_CONTENT.title, 'وشنو هي الكينوسايجا؟');
  assert.equal(
    INTRO_CONTENT.body,
    'فن ياباني يخليك تصنعي لوحة فنية بقطع قماش صغيرة! بلا خياطة، بلا إبرة، وبلا ما تعرفي ترسمي.'
  );
  assert.deepEqual([...INTRO_CONTENT.steps], [
    'تخيري لون ونوع الرسمة',
    'نوفرولك المستلزمات وتقصّي القماش وتحطّيه في الشقوق',
    'نأطّرو اللوحة وتخرجي بتحفة من إبداعك',
  ]);
  assert.equal(INTRO_CONTENT.videoCaption, 'شوفي كيفاش تتصنع لوحة كينوسايجا');
  assert.ok(INTRO_VIDEO_URL.length > 0);
});

test('parseVideoSource supports both YouTube links and local mp4 file paths', () => {
  const fileParsed = parseVideoSource('/assets/aistudio/video.mp4');
  assert.deepEqual(fileParsed, {
    kind: 'file',
    src: '/assets/aistudio/video.mp4',
  });

  const ytWatch = parseVideoSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(ytWatch.kind, 'youtube');
  if (ytWatch.kind === 'youtube') {
    assert.equal(ytWatch.videoId, 'dQw4w9WgXcQ');
    assert.ok(ytWatch.embedUrl.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ'));
  }

  const ytShort = parseVideoSource('https://youtu.be/abc123XYZ');
  assert.equal(ytShort.kind, 'youtube');
  if (ytShort.kind === 'youtube') {
    assert.equal(ytShort.videoId, 'abc123XYZ');
  }
});

test('hero copy matches required Darija strings without removed subtitle', () => {
  assert.equal(HERO_CONTENT.jpKicker, 'キノサイガ');
  assert.equal(HERO_CONTENT.h1, 'ورشات الكينوسايجا');
  assert.equal('subtitle' in HERO_CONTENT, false);
  assert.equal(HERO_CONTENT.primaryCta, 'شوفي الورشة الجاية');
  assert.equal(HERO_CONTENT.secondaryCta, 'جرّبي الفن دوكا');
});

test('hero has 4 wavy hill layers with distinct fabric patterns and increasing scroll speeds', () => {
  assert.equal(HERO_HILL_LAYERS.length, 4);
  const patterns = new Set(HERO_HILL_LAYERS.map((h) => h.patternId));
  assert.deepEqual(patterns, new Set(['dots', 'gingham', 'circles', 'stripes']));
  for (let i = 1; i < HERO_HILL_LAYERS.length; i++) {
    assert.ok(
      HERO_HILL_LAYERS[i].scrollParallaxPx > HERO_HILL_LAYERS[i - 1].scrollParallaxPx
    );
  }
});

test('workshop themes match requested palette accents across all 4 theme keys', () => {
  assert.equal(WORKSHOP_THEMES.forest.accentHex, '#55734a');
  assert.equal(WORKSHOP_THEMES.autumn.accentHex, '#c2692a');
  assert.equal(WORKSHOP_THEMES.sakura.accentHex, '#d4607f');
  assert.equal(WORKSHOP_THEMES.sun.accentHex, '#d9a014');
});

test('getThemeCssVars resolves accent variables cleanly', () => {
  const autumnVars = getThemeCssVars('autumn');
  assert.equal(autumnVars['--kino-accent'], '#c2692a');
  const sakuraTheme = getWorkshopTheme('sakura');
  assert.equal(sakuraTheme.labelJp, '桜');
});

test('header navigation stays compact (3 to 5 single-line links), includes سجلي معانا, and excludes removed gallery wall', () => {
  assert.ok(HEADER_NAV_LINKS.length >= 3 && HEADER_NAV_LINKS.length <= 5);
  for (const link of HEADER_NAV_LINKS) {
    assert.ok(link.href.startsWith('#'));
    assert.ok(link.label.trim().length > 0);
    assert.notEqual(link.id, 'gallery');
    assert.notEqual(link.label, 'جدار المعرض');
  }
  const reserveLink = HEADER_NAV_LINKS.find((l) => l.id === 'reserve');
  assert.ok(reserveLink);
  assert.equal(reserveLink.href, '#reserve');
  assert.equal(reserveLink.label, 'سجلي معانا');
  assert.equal(REVIEWS_WALL_CONTENT.indexLabel, '٠٤');
  assert.equal(REVIEWS_WALL_CONTENT.title, 'وشنو قالو البنات؟');
  assert.equal(
    REVIEWS_WALL_CONTENT.lead,
    'كلمات من قلب الورشة و ذكريات البنات اللي جاو وخلّاو بصمتهم، مدبّسين على لوحتنا.'
  );
  assert.equal(KINO_INSTAGRAM.handle, '@kino__workshop');
  assert.equal(
    KINO_INSTAGRAM.url,
    'https://www.instagram.com/kino__workshop?srtk=OTJhNHhwOTI1c2Ez'
  );
});

test('gallery wall items include attached photos with varied aspect ratios and rotations', () => {
  assert.ok(GALLERY_WALL_ITEMS.length >= 4);
  const aspects = new Set(GALLERY_WALL_ITEMS.map((item) => item.aspectClass));
  assert.ok(aspects.size >= 3);
  for (const item of GALLERY_WALL_ITEMS) {
    assert.ok(item.src.length > 0);
    assert.notEqual(item.rotationDeg, 0);
    assert.ok(item.stringDropPx >= 20);
  }
});

test('review note visuals assign coloured pins and slight rotations, and review form validates inputs', () => {
  const colors = new Set<string>();
  for (let i = 0; i < 5; i++) {
    const visual = getReviewNoteVisuals(i);
    colors.add(visual.pinColor);
    assert.notEqual(visual.rotationDeg, 0);
  }
  assert.equal(colors.size, 5);
  assert.ok(STARTER_APPROVED_REVIEWS.every((r) => r.approved));

  const bad = validatePublicReviewForm({ name: 'أ', text: '' });
  assert.ok(bad.name);
  assert.ok(bad.text);

  const ok = validatePublicReviewForm({
    name: 'أمينة',
    text: 'ورشة هايلة بزاف واستمتعت بكل دقيقة.',
  });
  assert.deepEqual(ok, {});
});

test('generatePetalSpecs creates bounded deterministic petals', () => {
  const first = generatePetalSpecs(10);
  const second = generatePetalSpecs(10);
  assert.equal(first.length, 10);
  assert.deepEqual(first, second);
  assert.equal(generatePetalSpecs(100).length, 24);
  for (const petal of first) {
    assert.ok(petal.leftPercent >= 0 && petal.leftPercent <= 100);
    assert.ok(petal.durationSec >= 10);
  }
});

test('interactive Kinusaiga flower panel defines 19 distinct regions', () => {
  assert.equal(FLOWER_REGIONS.length, 19);
  const ids = new Set(FLOWER_REGIONS.map((r) => r.id));
  assert.equal(ids.size, 19);
  assert.equal(FLOWER_REGIONS.filter((r) => r.group === 'background').length, 1);
  assert.equal(FLOWER_REGIONS.filter((r) => r.group === 'corner').length, 4);
  assert.equal(FLOWER_REGIONS.filter((r) => r.group === 'stem').length, 1);
  assert.equal(FLOWER_REGIONS.filter((r) => r.group === 'leaf').length, 2);
  assert.equal(FLOWER_REGIONS.filter((r) => r.group === 'petal').length, 10);
  assert.equal(FLOWER_REGIONS.filter((r) => r.group === 'center').length, 1);
});

test('each workshop theme provides 6 distinct fabric swatches covering required patterns', () => {
  const themes = ['forest', 'autumn', 'sakura', 'sun'] as const;
  for (const themeId of themes) {
    const swatches = THEME_FABRIC_SWATCHES[themeId];
    assert.equal(swatches.length, 6);
    const kinds = new Set(swatches.map((s) => s.patternKind));
    assert.ok(kinds.has('dots'));
    assert.ok(kinds.has('gingham'));
    assert.ok(kinds.has('stripes'));
    assert.ok(kinds.has('leaf'));
    assert.ok(kinds.has('swirl'));
    assert.ok(kinds.has('waves'));
    assert.equal(new Set(swatches.map((s) => s.id)).size, 6);
  }
});

test('generateRandomFlowerFill fills all 19 regions with swatches from the selected theme', () => {
  const sakuraSwatchIds = new Set(
    THEME_FABRIC_SWATCHES.sakura.map((s) => s.id)
  );
  const fills = generateRandomFlowerFill('sakura', () => 0.42);
  assert.equal(Object.keys(fills).length, 19);
  for (const region of FLOWER_REGIONS) {
    assert.ok(sakuraSwatchIds.has(fills[region.id]));
  }
});

test('registration artwork options include the 3 required tile choices', () => {
  assert.deepEqual(
    ARTWORK_TILE_OPTIONS.map((t) => t.title),
    ['نرسم لوحتي بيدي', 'نبعث صورة', 'فاجئوني']
  );
});

test('toggleWorkshopSlotSelection allows picking one or both slots cleanly', () => {
  const one = toggleWorkshopSlotSelection([], 'slot-sat-21');
  assert.deepEqual(one, ['slot-sat-21']);
  const both = toggleWorkshopSlotSelection(one, 'slot-fri-27');
  assert.deepEqual(both, ['slot-sat-21', 'slot-fri-27']);
  const backToOne = toggleWorkshopSlotSelection(both, 'slot-sat-21');
  assert.deepEqual(backToOne, ['slot-fri-27']);
});

test('validateRegistrationForm validates all fields, image upload requirement, and success formatting', () => {
  const emptyErrors = validateRegistrationForm({
    firstName: '',
    lastName: ' ',
    phone: '123',
    instagram: 'bad user name',
    gmail: 'not-an-email',
    selectedSlotIds: [],
    artworkChoice: 'upload-image',
    artworkFileName: null,
  });

  assert.ok(emptyErrors.firstName);
  assert.ok(emptyErrors.lastName);
  assert.ok(emptyErrors.phone);
  assert.ok(emptyErrors.instagram);
  assert.ok(emptyErrors.gmail);
  assert.ok(emptyErrors.selectedSlotIds);
  assert.ok(emptyErrors.artworkFile);

  const validErrors = validateRegistrationForm({
    firstName: 'سارة',
    lastName: 'بن علي',
    phone: '0550 12 34 56',
    instagram: '@sara.kino',
    gmail: 'sara@gmail.com',
    selectedSlotIds: ['slot-sat-21', 'slot-fri-27'],
    artworkChoice: 'upload-image',
    artworkFileName: 'flower-sketch.png',
  });

  assert.deepEqual(validErrors, {});
  assert.equal(
    formatRegistrationSuccessMessage(' سارة '),
    'شكراً سارة! وصلنا طلبك. نتواصلو معاك مني نأكدو الموعد'
  );
});

import { ADMIN_EMAILS, isAdminEmail } from './adminConfig';
import {
  computeSlotCounts,
  generateRegistrationsCsv,
  sanitizeGoogleMapsUrl,
  sanitizeWorkshopPayload,
  type RegistrationRecord,
} from './adminHelpers';

test('isAdminEmail matches listed team emails case-insensitively', () => {
  assert.ok(ADMIN_EMAILS.length >= 1);
  assert.equal(isAdminEmail(ADMIN_EMAILS[0].toUpperCase()), true);
  assert.equal(isAdminEmail('unknown@example.com'), false);
  assert.equal(isAdminEmail(null), false);
});

test('computeSlotCounts tallies registrations per slot including dual-slot picks', () => {
  const sampleRegs: RegistrationRecord[] = [
    {
      id: '1',
      firstName: 'سارة',
      lastName: 'بن علي',
      phone: '0550123456',
      instagram: '@sara',
      gmail: 'sara@gmail.com',
      workshopTitle: 'ورشة الخريف',
      selectedSlotIds: ['slot-sat-21'],
      selectedSlotLabels: ['السبت 21 نوفمبر'],
      artworkChoice: 'hand-draw',
      uploadedImageUrl: '',
      createdAtText: 'اليوم',
      createdAtMs: 1,
    },
    {
      id: '2',
      firstName: 'مريم',
      lastName: 'قاسمي',
      phone: '0661123456',
      instagram: '@meriem',
      gmail: 'meriem@gmail.com',
      workshopTitle: 'ورشة الخريف',
      selectedSlotIds: ['slot-sat-21', 'slot-fri-27'],
      selectedSlotLabels: ['السبت 21 نوفمبر', 'الجمعة 27 نوفمبر'],
      artworkChoice: 'surprise-me',
      artworkNote: 'زهرة الساكورا',
      uploadedImageUrl: '',
      createdAtText: 'اليوم',
      createdAtMs: 2,
    },
  ];
  const counts = computeSlotCounts(sampleRegs, CURRENT_WORKSHOP.slots);
  assert.equal(counts[0].count, 2);
  assert.equal(counts[1].count, 1);

  const csv = generateRegistrationsCsv(sampleRegs);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('سارة'));
  assert.ok(csv.includes('مريم'));
});

test('sanitizeWorkshopPayload clamps seatsLeft as integer and validates themeKey', () => {
  const clean = sanitizeWorkshopPayload({
    ...CURRENT_WORKSHOP,
    seatsLeft: 14.7,
    themeKey: 'sakura',
    locationName: '  استوديو كينو — عنابة  ',
    locationMapsUrl: 'https://maps.app.goo.gl/example123',
  });
  assert.equal(clean.seatsLeft, 15);
  assert.equal(clean.themeKey, 'sakura');
  assert.equal(clean.locationName, 'استوديو كينو — عنابة');
  assert.equal(clean.locationMapsUrl, 'https://maps.app.goo.gl/example123');
});

test('sanitizeGoogleMapsUrl allows http(s) URLs and rejects unsafe schemes', () => {
  assert.equal(
    sanitizeGoogleMapsUrl('  https://maps.google.com/?q=Annaba  '),
    'https://maps.google.com/?q=Annaba'
  );
  assert.equal(sanitizeGoogleMapsUrl('javascript:alert(1)'), '');
  assert.equal(sanitizeGoogleMapsUrl('not a url'), '');
  assert.equal(sanitizeGoogleMapsUrl(''), '');
});

test('normalizePublicAssetPath and resolveAssetUrl normalize legacy paths and preserve data/external URLs', () => {
  assert.equal(
    normalizePublicAssetPath('/src/assets/images/kino_girl_arch_1794586132755.jpg'),
    '/assets/images/kino_girl_arch_1794586132755.jpg'
  );
  assert.equal(
    normalizePublicAssetPath('data:image/jpeg;base64,abc123'),
    'data:image/jpeg;base64,abc123'
  );
  assert.equal(
    resolveAssetUrl('/src/assets/images/kino_girl_arch_1794586132755.jpg'),
    '/assets/images/kino_girl_arch_1794586132755.jpg'
  );
  assert.equal(
    resolveAssetUrl('https://example.com/custom.jpg'),
    'https://example.com/custom.jpg'
  );
  assert.equal(
    resolveAssetUrl('data:image/jpeg;base64,xyz'),
    'data:image/jpeg;base64,xyz'
  );
  assert.ok(KINO_GIRL_ARCH_SRC.startsWith('/assets/images/'));
  assert.ok(CURRENT_WORKSHOP.imageSrc.startsWith('/assets/images/'));
  assert.ok(INTRO_ASSETS.lighthouseSrc.startsWith('/assets/images/'));
  assert.ok(INTRO_ASSETS.japanCircleSrc.startsWith('/assets/images/'));
  assert.ok(INTRO_ASSETS.videoPosterSrc.startsWith('/assets/images/'));
});
