const SOUND_STORAGE_KEY = 'kino_sound_enabled';

const PENTATONIC_FREQS = [523.25, 587.33, 659.25, 783.99, 880.0] as const;

type SoundListener = (enabled: boolean) => void;

const listeners = new Set<SoundListener>();
let sharedAudioCtx: AudioContext | null = null;
let cachedEnabled: boolean | null = null;

function readInitialSoundSetting(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(SOUND_STORAGE_KEY);
    if (raw === 'false') return false;
    return true;
  } catch {
    return true;
  }
}

export function isSoundEnabled(): boolean {
  if (cachedEnabled === null) {
    cachedEnabled = readInitialSoundSetting();
  }
  return cachedEnabled;
}

export function setSoundEnabled(next: boolean): boolean {
  cachedEnabled = Boolean(next);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(SOUND_STORAGE_KEY, String(cachedEnabled));
    } catch {
      // Ignore storage quota / private-mode restrictions
    }
  }
  for (const listener of listeners) {
    listener(cachedEnabled);
  }
  return cachedEnabled;
}

export function toggleSoundEnabled(): boolean {
  const next = !isSoundEnabled();
  setSoundEnabled(next);
  if (next) {
    playSoftClick();
  }
  return next;
}

export function subscribeSoundSetting(listener: SoundListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;

  try {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new Ctor();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function getAudioContext(): AudioContext | null {
  return getSharedAudioContext();
}

function scheduleTone(
  ctx: AudioContext,
  opts: {
    startOffsetSec?: number;
    durationSec: number;
    startFreq: number;
    endFreq: number;
    peakGain: number;
    type?: OscillatorType;
  }
): void {
  const now = ctx.currentTime + (opts.startOffsetSec ?? 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(
    Math.max(40, opts.endFreq),
    now + opts.durationSec
  );

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(opts.peakGain, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + opts.durationSec + 0.01);
}

function scheduleClothNoise(
  ctx: AudioContext,
  opts: { durationSec: number; centerFreq: number; peakGain: number }
): void {
  const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * opts.durationSec));
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = opts.centerFreq;
  filter.Q.value = 1.6;

  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(opts.peakGain, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.durationSec);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start(now);
  source.stop(now + opts.durationSec + 0.005);
}

export function getPentatonicNoteFreq(index: number): number {
  const normalized =
    ((Math.trunc(index) % PENTATONIC_FREQS.length) + PENTATONIC_FREQS.length) %
    PENTATONIC_FREQS.length;
  return PENTATONIC_FREQS[normalized];
}

/** Crisp, gentle UI click for swatches, theme chips, and controls */
export function playSoftClick(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    scheduleTone(ctx, {
      durationSec: 0.035,
      startFreq: 520,
      endFreq: 240,
      peakGain: 0.055,
      type: 'sine',
    });
  } catch {
    // Fail silently if audio graph cannot start
  }
}

/** Warm wooden block tap for frames, tickets, and LightBox transitions */
export function playWoodTap(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    scheduleTone(ctx, {
      durationSec: 0.065,
      startFreq: 220,
      endFreq: 118,
      peakGain: 0.11,
      type: 'triangle',
    });
    scheduleClothNoise(ctx, {
      durationSec: 0.014,
      centerFreq: 1400,
      peakGain: 0.035,
    });
  } catch {
    // Fail silently
  }
}

/** Tactile fabric-tuck sound combining soft cloth brush + gentle pentatonic wood note */
export function playFabricTuckTap(regionIndex = 0): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const noteFreq = getPentatonicNoteFreq(regionIndex);
  try {
    scheduleClothNoise(ctx, {
      durationSec: 0.028,
      centerFreq: 2300,
      peakGain: 0.04,
    });
    scheduleTone(ctx, {
      durationSec: 0.095,
      startFreq: noteFreq,
      endFreq: noteFreq * 0.96,
      peakGain: 0.075,
      type: 'sine',
    });
  } catch {
    // Fail silently
  }
}

/** Light ascending Japanese Yo-scale chime for "فاجئيني" and form completion */
export function playSurpriseChime(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const notes = [587.33, 659.25, 783.99, 880.0] as const;
    notes.forEach((freq, i) => {
      scheduleTone(ctx, {
        startOffsetSec: i * 0.06,
        durationSec: 0.16,
        startFreq: freq,
        endFreq: freq * 0.992,
        peakGain: 0.055,
        type: 'triangle',
      });
    });
  } catch {
    // Fail silently
  }
}
