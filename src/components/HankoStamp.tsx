import React from 'react';

interface HankoStampProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const HankoStamp: React.FC<HankoStampProps> = ({
  text = 'キノ',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-9 h-9 text-[11px] border-[1.5px]',
    md: 'w-12 h-12 text-sm border-2',
    lg: 'w-14 h-14 text-base border-2',
  }[size];

  return (
    <span
      aria-label="ختم كينو الياباني"
      className={`inline-flex items-center justify-center select-none font-jp font-bold tracking-tight text-[#b8322a] dark:text-[#ff928a] border-[#b8322a] dark:border-[#e66c64] rounded-[3px] bg-[#b8322a]/[0.04] dark:bg-[#b8322a]/15 rotate-[-4deg] shadow-[inset_0_0_0_1px_rgba(184,50,42,0.22)] ${sizeClasses} ${className}`}
      style={{ writingMode: 'vertical-rl' }}
    >
      {text}
    </span>
  );
};
