import React from 'react';
import { ALL_SWATCHES, type FabricSwatch } from '../utils/kinusaigaCraft';

interface PatternNodeProps {
  patternId: string;
  swatch: FabricSwatch;
}

const SwatchPatternDefinition: React.FC<PatternNodeProps> = ({
  patternId,
  swatch,
}) => {
  const { patternKind, baseColor, inkColor, secondaryColor } = swatch;

  switch (patternKind) {
    case 'dots':
      return (
        <pattern
          id={patternId}
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <rect width="20" height="20" fill={baseColor} />
          <circle cx="5" cy="5" r="2.3" fill={inkColor} fillOpacity="0.88" />
          <circle cx="15" cy="15" r="2.3" fill={inkColor} fillOpacity="0.88" />
          <circle
            cx="15"
            cy="5"
            r="1.15"
            fill={secondaryColor}
            fillOpacity="0.72"
          />
          <circle
            cx="5"
            cy="15"
            r="1.15"
            fill={secondaryColor}
            fillOpacity="0.72"
          />
        </pattern>
      );

    case 'gingham':
      return (
        <pattern
          id={patternId}
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <rect width="24" height="24" fill={baseColor} />
          <rect width="12" height="24" fill={inkColor} fillOpacity="0.28" />
          <rect width="24" height="12" fill={inkColor} fillOpacity="0.28" />
          <line
            x1="0"
            y1="12"
            x2="24"
            y2="12"
            stroke={secondaryColor}
            strokeOpacity="0.45"
            strokeWidth="0.9"
          />
          <line
            x1="12"
            y1="0"
            x2="12"
            y2="24"
            stroke={secondaryColor}
            strokeOpacity="0.45"
            strokeWidth="0.9"
          />
        </pattern>
      );

    case 'stripes':
      return (
        <pattern
          id={patternId}
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <rect width="16" height="16" fill={baseColor} />
          <rect x="0" y="0" width="5" height="16" fill={inkColor} fillOpacity="0.58" />
          <rect
            x="9"
            y="0"
            width="2"
            height="16"
            fill={secondaryColor}
            fillOpacity="0.52"
          />
        </pattern>
      );

    case 'leaf':
      return (
        <pattern
          id={patternId}
          width="28"
          height="28"
          patternUnits="userSpaceOnUse"
        >
          <rect width="28" height="28" fill={baseColor} />
          <path
            d="M 5 14 Q 10 5 18 7 Q 15 16 5 14 Z"
            fill={inkColor}
            fillOpacity="0.72"
          />
          <path
            d="M 6 13.5 Q 11 10 16 8"
            fill="none"
            stroke={secondaryColor}
            strokeOpacity="0.65"
            strokeWidth="0.9"
          />
          <path
            d="M 24 25 Q 18 18 12 22 Q 16 27 24 25 Z"
            fill={secondaryColor}
            fillOpacity="0.55"
          />
        </pattern>
      );

    case 'swirl':
      return (
        <pattern
          id={patternId}
          width="28"
          height="28"
          patternUnits="userSpaceOnUse"
        >
          <rect width="28" height="28" fill={baseColor} />
          <path
            d="M 14 14 m -2 0 a 2 2 0 1 0 4 0 a 4 4 0 1 0 -8 0 a 6 6 0 1 0 12 0 a 8 8 0 1 0 -16 0"
            fill="none"
            stroke={inkColor}
            strokeOpacity="0.72"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle
            cx="4"
            cy="4"
            r="1.3"
            fill={secondaryColor}
            fillOpacity="0.65"
          />
          <circle
            cx="24"
            cy="24"
            r="1.3"
            fill={secondaryColor}
            fillOpacity="0.65"
          />
        </pattern>
      );

    case 'waves':
      return (
        <pattern
          id={patternId}
          width="28"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <rect width="28" height="16" fill={baseColor} />
          <path
            d="M -14 16 A 14 14 0 0 1 14 16 M 0 16 A 14 14 0 0 1 28 16 M 14 16 A 14 14 0 0 1 42 16"
            fill="none"
            stroke={inkColor}
            strokeOpacity="0.72"
            strokeWidth="1.4"
          />
          <path
            d="M -9 16 A 9 9 0 0 1 9 16 M 5 16 A 9 9 0 0 1 23 16 M 19 16 A 9 9 0 0 1 37 16"
            fill="none"
            stroke={secondaryColor}
            strokeOpacity="0.58"
            strokeWidth="1.1"
          />
        </pattern>
      );
  }
};

export const CraftFabricPatternDefs: React.FC = () => (
  <defs>
    {ALL_SWATCHES.map((swatch) => (
      <SwatchPatternDefinition
        key={swatch.id}
        patternId={`craft-swatch-${swatch.id}`}
        swatch={swatch}
      />
    ))}
    {/* Subtle carved basswood board grain for unfilled Kinusaiga regions */}
    <pattern
      id="craft-unfilled-board"
      width="32"
      height="32"
      patternUnits="userSpaceOnUse"
    >
      <rect width="32" height="32" fill="#efe9da" />
      <line
        x1="0"
        y1="8"
        x2="32"
        y2="8"
        stroke="#d8ceb8"
        strokeWidth="0.7"
        strokeOpacity="0.6"
      />
      <line
        x1="0"
        y1="22"
        x2="32"
        y2="22"
        stroke="#d8ceb8"
        strokeWidth="0.6"
        strokeOpacity="0.5"
      />
    </pattern>
  </defs>
);

interface SwatchPreviewSvgProps {
  swatch: FabricSwatch;
  className?: string;
}

export const SwatchPreviewSvg: React.FC<SwatchPreviewSvgProps> = ({
  swatch,
  className = 'w-11 h-11',
}) => {
  const localId = `swatch-btn-${swatch.id}`;
  return (
    <svg
      viewBox="0 0 44 44"
      aria-hidden="true"
      className={`${className} rounded-[3px] border border-[#22301d]/40 shrink-0 block`}
    >
      <defs>
        <SwatchPatternDefinition patternId={localId} swatch={swatch} />
      </defs>
      <rect width="44" height="44" fill={`url(#${localId})`} />
      <rect
        x="2"
        y="2"
        width="40"
        height="40"
        fill="none"
        stroke="#faf9f5"
        strokeOpacity="0.45"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
    </svg>
  );
};
