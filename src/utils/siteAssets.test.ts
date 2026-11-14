import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GALLERY_SEEDED_KEY,
  SITE_ASSET_SLOTS,
  getDefaultSiteAssetsMap,
  mergeSiteAssets,
  sanitizeGalleryItemPayload,
  sanitizeSiteAssetPayload,
} from './siteAssets.ts';

test('getDefaultSiteAssetsMap provides defaults for all 8 editable site image slots (including starter reviews)', () => {
  const defaults = getDefaultSiteAssetsMap();
  assert.equal(Object.keys(defaults).length, 8);
  for (const slot of SITE_ASSET_SLOTS) {
    assert.equal(defaults[slot.key].isCustom, false);
    assert.ok(defaults[slot.key].src.length > 0);
  }
  assert.ok(defaults['review-starter-1'].src.includes('/assets/'));
  assert.ok(defaults['review-starter-2'].src.includes('/assets/'));
  assert.ok(defaults['review-starter-3'].src.includes('/assets/'));
});

test('mergeSiteAssets overrides customized image slots and detects gallery-seeded marker', () => {
  const merged = mergeSiteAssets([
    {
      key: 'hero-girl',
      label: 'صورة القوس',
      src: 'https://example.com/new-hero.jpg',
      alt: 'صورة جديدة',
    },
    {
      key: GALLERY_SEEDED_KEY,
      label: 'marker',
      src: 'seeded',
      alt: 'seeded',
    },
  ]);

  assert.equal(merged.gallerySeeded, true);
  assert.equal(merged.assets['hero-girl'].isCustom, true);
  assert.equal(merged.assets['hero-girl'].src, 'https://example.com/new-hero.jpg');
  assert.equal(merged.assets.logo.isCustom, false);
});

test('sanitizeSiteAssetPayload and sanitizeGalleryItemPayload enforce Firestore blueprint bounds', () => {
  const cleanAsset = sanitizeSiteAssetPayload({
    key: 'logo',
    src: '   /custom/logo.png   ',
    alt: 'شعار مخصص',
  });
  assert.equal(cleanAsset.key, 'logo');
  assert.equal(cleanAsset.src, '/custom/logo.png');

  const cleanGallery = sanitizeGalleryItemPayload(
    {
      id: 'bad id with spaces!',
      src: 'https://example.com/art.jpg',
      title: 'لوحة جديدة',
      category: 'كواليس الورشة',
      rotationDeg: 45,
      stringDropPx: 200,
      orderIndex: 999,
    },
    2
  );
  assert.match(cleanGallery.id, /^[a-zA-Z0-9_-]+$/);
  assert.equal(cleanGallery.category, 'كواليس الورشة');
  assert.equal(cleanGallery.rotationDeg, 12);
  assert.equal(cleanGallery.stringDropPx, 80);
  assert.equal(cleanGallery.orderIndex, 500);
});
