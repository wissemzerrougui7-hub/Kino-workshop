import test from 'node:test';
import assert from 'node:assert/strict';
import {
  renderKinusaigaPatternSvg,
  sanitizeHexColor,
  sanitizePatternSpec,
  sanitizeSvgPathD,
  svgToDataUrl,
} from './kinusaigaPatternSvg';

test('sanitizeHexColor normalizes 3-digit and 6-digit hex colors and rejects invalid strings', () => {
  assert.equal(sanitizeHexColor('#AbC'), '#aabbcc');
  assert.equal(sanitizeHexColor(' #2D3F27 '), '#2d3f27');
  assert.equal(sanitizeHexColor('red', '#c2692a'), '#c2692a');
  assert.equal(sanitizeHexColor('javascript:alert(1)', '#55734a'), '#55734a');
});

test('sanitizeSvgPathD validates path commands, auto-closes open paths, and blocks markup injection', () => {
  assert.equal(sanitizeSvgPathD('M 10 10 L 90 10 L 90 90'), 'M 10 10 L 90 10 L 90 90 Z');
  assert.equal(sanitizeSvgPathD('M0,0 C10,20 30,40 50,50 Z'), 'M0,0 C10,20 30,40 50,50 Z');
  assert.equal(sanitizeSvgPathD('M10 10 <script>alert(1)</script>'), null);
  assert.equal(sanitizeSvgPathD('not a path'), null);
});

test('sanitizePatternSpec cleans regions and bounds invalid weave values', () => {
  const cleaned = sanitizePatternSpec({
    summaryAr: 'زهرة الخريف',
    backgroundColor: '#FAF9F5',
    regions: [
      {
        label: 'بتلة',
        pathD: 'M100 100 L150 50 L200 100 Z',
        fillHex: '#C2692A',
        weave: 'dots',
      },
      {
        label: 'invalid-path',
        pathD: 'bad',
        fillHex: '#000000',
        weave: 'solid',
      },
      {
        label: 'ساق',
        pathD: 'M190 200 L210 200 L210 380 L190 380',
        fillHex: '#2d3f27',
        weave: 'unknown-weave',
      },
    ],
  });

  assert.equal(cleaned.summaryAr, 'زهرة الخريف');
  assert.equal(cleaned.backgroundColor, '#faf9f5');
  assert.equal(cleaned.regions.length, 2);
  assert.equal(cleaned.regions[0].weave, 'dots');
  assert.equal(cleaned.regions[1].weave, 'solid');
  assert.ok(cleaned.regions[1].pathD.endsWith('Z'));
});

test('renderKinusaigaPatternSvg outputs fabric pattern defs, clear dark cut lines, and valid data URL', () => {
  const svg = renderKinusaigaPatternSvg({
    summaryAr: 'لوحة جبال وشمس',
    backgroundColor: '#faf9f5',
    regions: [
      {
        id: 'r1',
        label: 'الشمس',
        pathD: 'M 200 60 A 50 50 0 1 0 200 160 A 50 50 0 1 0 200 60 Z',
        fillHex: '#d9a014',
        weave: 'gingham',
      },
      {
        id: 'r2',
        label: 'التل',
        pathD: 'M 0 280 Q 200 190 400 280 L 400 400 L 0 400 Z',
        fillHex: '#55734a',
        weave: 'waves',
      },
    ],
  });

  assert.ok(svg.includes('<pattern id="kp-pat-0"'));
  assert.ok(svg.includes('<pattern id="kp-pat-1"'));
  assert.ok(svg.includes('stroke="#241a10" stroke-width="3.2"'));
  const dataUrl = svgToDataUrl(svg);
  assert.ok(dataUrl.startsWith('data:image/svg+xml;charset=utf-8,'));
});
