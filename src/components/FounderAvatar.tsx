import React, { useMemo } from 'react';
import { generateAvatar, getInitials } from '../lib/avatar';

export interface FounderAvatarData {
  id?: string;
  name: string;
  avatar?: string;
}

interface FounderAvatarProps {
  founder: FounderAvatarData;
  size?: number; // Size in pixels (e.g. 64, 24)
  className?: string;
  borderWidth?: number;
  borderColor?: string;
}

export const FounderAvatar: React.FC<FounderAvatarProps> = ({
  founder,
  size = 64,
  className = '',
  borderWidth,
  borderColor,
}) => {
  const generatedDataUrl = useMemo(() => {
    if (founder.avatar) return null;
    // Combine name and id for deterministic yet distinct avatar
    const seed = `${founder.name || 'Founder'}-${founder.id || 'seed'}`;
    const initials = getInitials(founder.name);
    return generateAvatar(seed, initials);
  }, [founder.id, founder.name, founder.avatar]);

  const src = founder.avatar || generatedDataUrl || '';
  const sizePx = `${size}px`;

  const borderStyle: React.CSSProperties = {};
  if (borderWidth) {
    borderStyle.borderWidth = `${borderWidth}px`;
    if (borderColor) {
      borderStyle.borderColor = borderColor;
    }
  }

  return (
    <div
      style={{
        width: sizePx,
        height: sizePx,
        ...borderStyle,
      }}
      className={`rounded-full overflow-hidden shrink-0 select-none bg-[#16151f] flex items-center justify-center ${className}`}
    >
      <img
        src={src}
        alt={founder.name || 'Founder'}
        className="w-full h-full object-cover rounded-full"
        loading="lazy"
      />
    </div>
  );
};
