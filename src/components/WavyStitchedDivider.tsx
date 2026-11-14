import React, { useId } from 'react';

export type DividerVariant = 'wave-a' | 'wave-b' | 'wave-c';

interface WavyStitchedDividerProps {
  topColor: string;
  bottomColor: string;
  stitchColor?: string;
  variant?: DividerVariant;
  useAccentStitch?: boolean;
  topClassName?: string;
  bottomClassName?: string;
  className?: string;
}

interface WaveSpec {
  startY: number;
  c1: [number, number, number, number, number, number];
  c2: [number, number, number, number, number, number];
}

const WAVE_SPECS: Record<DividerVariant, WaveSpec> = {
  'wave-a': {
    startY: 38,
    c1: [220, 74, 420, 10, 680, 44],
    c2: [940, 78, 1180, 18, 1440, 42],
  },
  'wave-b': {
    startY: 48,
    c1: [260, 12, 520, 78, 780, 34],
    c2: [1020, 0, 1240, 66, 1440, 36],
  },
  'wave-c': {
    startY: 30,
    c1: [190, 62, 480, 72, 720, 38],
    c2: [980, 2, 1210, 68, 1440, 32],
  },
};

function buildWavePaths(spec: WaveSpec) {
  const [x1, y1, x2, y2, x3, y3] = spec.c1;
  const [x4, y4, x5, y5, x6, y6] = spec.c2;

  const seamPath = `M0,${spec.startY} C${x1},${y1} ${x2},${y2} ${x3},${y3} C${x4},${y4} ${x5},${y5} ${x6},${y6}`;
  const fillPath = `${seamPath} L1440,96 L0,96 Z`;
  const stitchPath = `M0,${spec.startY + 7} C${x1},${y1 + 7} ${x2},${y2 + 7} ${x3},${y3 + 7} C${x4},${y4 + 7} ${x5},${y5 + 7} ${x6},${y6 + 7}`;

  const nx = (x: number) => (x / 1440).toFixed(5);
  const ny = (y: number) => (y / 96).toFixed(5);
  const normalizedFillPath = `M0,${ny(spec.startY)} C${nx(x1)},${ny(y1)} ${nx(x2)},${ny(y2)} ${nx(x3)},${ny(y3)} C${nx(x4)},${ny(y4)} ${nx(x5)},${ny(y5)} ${nx(x6)},${ny(y6)} L1,1 L0,1 Z`;

  return { seamPath, fillPath, stitchPath, normalizedFillPath };
}

export const WavyStitchedDivider: React.FC<WavyStitchedDividerProps> = ({
  topColor,
  bottomColor,
  stitchColor = '#55734a',
  variant = 'wave-a',
  useAccentStitch = false,
  topClassName = '',
  bottomClassName = '',
  className = '',
}) => {
  const rawId = useId();
  const clipId = `kino-wave-clip-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const paths = buildWavePaths(WAVE_SPECS[variant]);
  const resolvedStitch = useAccentStitch ? 'var(--kino-accent)' : stitchColor;

  return (
    <div
      aria-hidden="true"
      className={`relative w-full overflow-hidden leading-none select-none ${topClassName} ${className}`}
      style={{ backgroundColor: topColor }}
    >
      {bottomClassName ? (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 ${bottomClassName}`}
          style={{
            backgroundColor: bottomColor,
            clipPath: `url(#${clipId})`,
          }}
        />
      ) : null}

      <svg
        viewBox="0 0 1440 96"
        preserveAspectRatio="none"
        className="relative block w-full h-12 sm:h-16 md:h-20"
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={paths.normalizedFillPath} />
          </clipPath>
        </defs>

        {/* Bottom tucked fabric piece (solid fallback when bottomClassName is empty) */}
        {!bottomClassName ? <path d={paths.fillPath} fill={bottomColor} /> : null}

        {/* Carved wooden Kinusaiga groove shadow */}
        <path
          d={paths.seamPath}
          fill="none"
          stroke="#2d3f27"
          strokeOpacity="0.28"
          strokeWidth="4.5"
        />

        {/* Warm recessed wood edge highlight */}
        <path
          d={paths.seamPath}
          fill="none"
          stroke="#9c7a54"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />

        {/* Stitched dashed thread seam along tucked fabric */}
        <path
          d={paths.stitchPath}
          fill="none"
          stroke={resolvedStitch}
          strokeOpacity="0.88"
          strokeWidth="2"
          strokeDasharray="10 8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
