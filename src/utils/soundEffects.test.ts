import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPentatonicNoteFreq,
  isSoundEnabled,
  playFabricTuckTap,
  playSoftClick,
  playSurpriseChime,
  playWoodTap,
  setSoundEnabled,
  subscribeSoundSetting,
  toggleSoundEnabled,
} from './soundEffects';

test('sound setting defaults to enabled, toggles cleanly, and notifies subscribers', () => {
  setSoundEnabled(true);
  assert.equal(isSoundEnabled(), true);

  const observed: boolean[] = [];
  const unsub = subscribeSoundSetting((next) => observed.push(next));

  const afterMute = toggleSoundEnabled();
  assert.equal(afterMute, false);
  assert.equal(isSoundEnabled(), false);

  const afterUnmute = toggleSoundEnabled();
  assert.equal(afterUnmute, true);
  assert.equal(isSoundEnabled(), true);
  assert.deepEqual(observed, [false, true]);

  unsub();
});

test('getPentatonicNoteFreq wraps negative and large indices across 5 notes', () => {
  assert.equal(getPentatonicNoteFreq(0), getPentatonicNoteFreq(5));
  assert.equal(getPentatonicNoteFreq(-1), getPentatonicNoteFreq(4));
  assert.ok(getPentatonicNoteFreq(2) > getPentatonicNoteFreq(0));
});

test('synthesized sound triggers fail safely in headless Node without AudioContext', () => {
  setSoundEnabled(true);
  assert.doesNotThrow(() => {
    playSoftClick();
    playWoodTap();
    playFabricTuckTap(3);
    playSurpriseChime();
  });
});
