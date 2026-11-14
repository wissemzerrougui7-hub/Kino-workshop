export type ColorMode = 'light' | 'dark';

export const COLOR_MODE_STORAGE_KEY = 'kino_color_mode';

let cachedColorMode: ColorMode | null = null;
const listeners = new Set<(mode: ColorMode) => void>();

export function parseStoredColorMode(raw: string | null | undefined): ColorMode {
  return raw === 'dark' ? 'dark' : 'light';
}

export function resolveNextColorMode(current: ColorMode): ColorMode {
  return current === 'dark' ? 'light' : 'dark';
}

export function applyColorModeToDocument(mode: ColorMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.colorMode = mode;
  root.classList.toggle('dark', mode === 'dark');
  root.style.colorScheme = mode;
}

export function getColorMode(): ColorMode {
  if (cachedColorMode !== null) {
    return cachedColorMode;
  }
  if (typeof window === 'undefined') {
    return 'light';
  }
  try {
    const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    cachedColorMode = parseStoredColorMode(stored);
    return cachedColorMode;
  } catch {
    return 'light';
  }
}

export function isDarkMode(): boolean {
  return getColorMode() === 'dark';
}

export function setColorMode(mode: ColorMode): void {
  cachedColorMode = mode;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
    } catch {
      // Ignore storage failures (e.g., restricted iframe or private mode)
    }
  }
  applyColorModeToDocument(mode);
  listeners.forEach((listener) => listener(mode));
}

export function toggleColorMode(): ColorMode {
  const next = resolveNextColorMode(getColorMode());
  setColorMode(next);
  return next;
}

export function subscribeColorMode(
  listener: (mode: ColorMode) => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function _resetColorModeCacheForTest(): void {
  cachedColorMode = null;
  listeners.clear();
}
