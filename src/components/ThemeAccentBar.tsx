import React from 'react';
import {
  WORKSHOP_THEMES,
  type WorkshopThemeId,
} from '../utils/theme';
import { playSoftClick } from '../utils/soundEffects';

interface ThemeAccentBarProps {
  activeTheme: WorkshopThemeId;
  onSelectTheme: (id: WorkshopThemeId) => void;
  variant?: 'light' | 'dark';
}

const THEME_ORDER: WorkshopThemeId[] = ['forest', 'autumn', 'sakura', 'sun'];

export const ThemeAccentBar: React.FC<ThemeAccentBarProps> = ({
  activeTheme,
  onSelectTheme,
  variant = 'light',
}) => {
  const isDark = variant === 'dark';

  return (
    <div
      role="group"
      aria-label="ثيمات ألوان الورشات"
      className="flex flex-wrap items-center gap-3"
    >
      <span
        className={`text-sm font-semibold whitespace-nowrap ${
          isDark ? 'text-[#a9bf9c]' : 'text-[#2d3f27]/80'
        }`}
      >
        طابع القماش:
      </span>
      <div className="flex flex-wrap items-center gap-2.5">
        {THEME_ORDER.map((id) => {
          const theme = WORKSHOP_THEMES[id];
          const isActive = activeTheme === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                playSoftClick();
                onSelectTheme(id);
              }}
              aria-pressed={isActive}
              className={`group inline-flex items-center gap-2.5 min-h-[44px] px-4 py-2 text-sm font-semibold rounded-[4px] border active:scale-[0.97] transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                isDark
                  ? isActive
                    ? 'bg-[#faf9f5] text-[#2d3f27] border-[#faf9f5] -translate-y-0.5 shadow-sm focus-visible:outline-[#faf9f5]'
                    : 'bg-[#2d3f27]/75 text-[#faf9f5] border-[#a9bf9c]/45 hover:border-[#faf9f5] hover:-translate-y-0.5 focus-visible:outline-[#faf9f5]'
                  : isActive
                  ? 'bg-[#2d3f27] text-[#faf9f5] border-[#2d3f27] -translate-y-0.5 shadow-sm focus-visible:outline-[#2d3f27]'
                  : 'bg-[#faf9f5] text-[#2d3f27] border-[#55734a]/35 hover:border-[#2d3f27] hover:-translate-y-0.5 focus-visible:outline-[#2d3f27]'
              }`}
            >
              <span
                aria-hidden="true"
                className="w-3.5 h-3.5 rounded-[2px] border border-dashed border-[#faf9f5]/80 shrink-0"
                style={{ backgroundColor: theme.accentHex }}
              />
              <span>{theme.labelAr}</span>
              <span
                className={`font-jp text-xs ${
                  isDark
                    ? isActive
                      ? 'text-[#55734a]'
                      : 'text-[#a9bf9c]'
                    : isActive
                    ? 'text-[#a9bf9c]'
                    : 'text-[#55734a]'
                }`}
              >
                {theme.labelJp}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
