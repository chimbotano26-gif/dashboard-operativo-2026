import React from 'react';

interface SerenazgoLogoProps {
  className?: string;
  size?: number;
  watermark?: boolean;
}

export const SerenazgoLogo: React.FC<SerenazgoLogoProps> = ({
  className = 'w-12 h-12',
  watermark = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className} ${
        watermark ? 'pointer-events-none select-none' : ''
      }`}
    >
      <img
        src="/logo.png"
        alt="Logo Serenazgo Nuevo Chimbote"
        className="w-full h-full object-contain aspect-square select-none drop-shadow-md"
        loading="eager"
      />
    </div>
  );
};
