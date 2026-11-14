import React, { useMemo } from 'react';
import { useReducedMotion } from 'motion/react';
import { generatePetalSpecs, type WorkshopThemeId } from '../utils/theme';

interface SakuraPetalsProps {
  activeTheme: WorkshopThemeId;
  count?: number;
}

export const SakuraPetals: React.FC<SakuraPetalsProps> = ({
  activeTheme,
  count = 10,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const petals = useMemo(() => generatePetalSpecs(count), [count]);

  const petalColor =
    activeTheme === 'autumn'
      ? '#c2692a'
      : activeTheme === 'sun'
      ? '#d9a014'
      : activeTheme === 'forest'
      ? '#55734a'
      : '#d4607f';

  if (prefersReducedMotion) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
      >
        {petals.slice(0, 3).map((petal, idx) => (
          <svg
            key={petal.id}
            viewBox="0 0 24 24"
            width={petal.sizePx}
            height={petal.sizePx}
            className="absolute opacity-25"
            style={{
              top: `${16 + idx * 28}%`,
              left: `${8 + idx * 38}%`,
              transform: `rotate(${idx * 42}deg)`,
            }}
          >
            <path
              d="M12 2C15 6 19 10 17 16C16 19 13 21 12 22C11 21 8 19 7 16C5 10 9 6 12 2Z"
              fill={petalColor}
            />
          </svg>
        ))}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
    >
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="kino-petal-animate absolute top-0"
          style={
            {
              left: `${petal.leftPercent}%`,
              animationDuration: `${petal.durationSec}s`,
              animationDelay: `${petal.delaySec}s`,
              opacity: petal.opacity,
              '--drift-x': `${petal.driftPx}px`,
              '--spin-deg': `${petal.spinDeg}deg`,
            } as React.CSSProperties
          }
        >
          <svg
            viewBox="0 0 24 24"
            width={petal.sizePx}
            height={petal.sizePx}
            className="block"
          >
            <path
              d="M12 2C15.2 6.2 19 10.4 17 16.2C15.9 19.1 13.5 20.6 12 22C10.5 20.6 8.1 19.1 7 16.2C5 10.4 8.8 6.2 12 2Z"
              fill={petalColor}
              fillOpacity="0.72"
            />
            <path
              d="M12 5C12.8 9 12.8 14 12 19"
              stroke="#faf9f5"
              strokeOpacity="0.45"
              strokeWidth="0.9"
              fill="none"
            />
          </svg>
        </div>
      ))}
    </div>
  );
};
