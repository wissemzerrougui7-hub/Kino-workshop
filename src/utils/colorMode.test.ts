import test from 'node:test';
import assert from 'node:assert/strict';
import {
  _resetColorModeCacheForTest,
  getColorMode,
  isDarkMode,
  parseStoredColorMode,
  resolveNextColorMode,
  setColorMode,
  subscribeColorMode,
  toggleColorMode,
} from './colorMode';

test('parseStoredColorMode defaults safely to light', () => {
  assert.equal(parseStoredColorMode(null), 'light');
  assert.equal(parseStoredColorMode(undefined), 'light');
  assert.equal(parseStoredColorMode(''), 'light');
  assert.equal(parseStoredColorMode('auto'), 'light');
  assert.equal(parseStoredColorMode('dark'), 'dark');
});

test('resolveNextColorMode flips between light and dark', () => {
  assert.equal(resolveNextColorMode('light'), 'dark');
  assert.equal(resolveNextColorMode('dark'), 'light');
});

test('getColorMode defaults to light and toggleColorMode flips cleanly in Node', () => {
  _resetColorModeCacheForTest();
  assert.equal(getColorMode(), 'light');
  assert.equal(isDarkMode(), false);

  const afterFirstToggle = toggleColorMode();
  assert.equal(afterFirstToggle, 'dark');
  assert.equal(getColorMode(), 'dark');
  assert.equal(isDarkMode(), true);

  const afterSecondToggle = toggleColorMode();
  assert.equal(afterSecondToggle, 'light');
  assert.equal(isDarkMode(), false);
});

test('subscribeColorMode notifies listeners on setColorMode and stops after unsubscribe', () => {
  _resetColorModeCacheForTest();
  const observed: string[] = [];
  const unsubscribe = subscribeColorMode((mode) => {
    observed.push(mode);
  });

  setColorMode('dark');
  setColorMode('light');
  unsubscribe();
  setColorMode('dark');

  assert.deepEqual(observed, ['dark', 'light']);
});
