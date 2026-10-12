import React from 'react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | number;
  variant?: 'full' | 'mark';
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
}) => {
  // Determine pixel height and width based on size and variant
  let heightPx: number;
  if (typeof size === 'number') {
    heightPx = size;
  } else {
    switch (size) {
      case 'sm':
        heightPx = variant === 'mark' ? 18 : 16;
        break;
      case 'lg':
        heightPx = variant === 'mark' ? 36 : 32;
        break;
      case 'md':
      default:
        heightPx = variant === 'mark' ? 24 : 22;
        break;
    }
  }

  const widthPx = variant === 'mark' ? heightPx : Math.round((heightPx * 84) / 18);

  if (variant === 'mark') {
    return (
      <svg
        role="img"
        aria-label="BACKR"
        viewBox="0 0 18 18"
        width={widthPx}
        height={heightPx}
        className={`inline-block select-none backr-logo-container ${className}`}
        style={{ height: `${heightPx}px`, width: `${widthPx}px` }}
      >
        <title>BACKR</title>
        {/* Bold geometric letter B */}
        <text
          x="1"
          y="15"
          fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="17"
          fill="currentColor"
        >
          B
        </text>
        {/* Small solid pink dot at top-right of B */}
        <circle
          cx="14.5"
          cy="3.5"
          r="1.2"
          fill="#f9a8d4"
          className="backr-pink-dot"
        />
      </svg>
    );
  }

  return (
    <svg
      role="img"
      aria-label="BACKR"
      viewBox="0 0 84 18"
      width={widthPx}
      height={heightPx}
      className={`inline-block select-none backr-logo-container ${className}`}
      style={{ height: `${heightPx}px`, width: `${widthPx}px` }}
    >
      <title>BACKR</title>
      {/* 
        BACKR wordmark in all caps, bold geometric sans-serif (Plus Jakarta Sans 800),
        wide letter-spacing ~0.35em. Uses precise horizontal placement for pixel-perfect
        uniformity across all rendering contexts.
      */}
      <text
        fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="16"
        fill="currentColor"
      >
        <tspan x="0" y="15">B</tspan>
        <tspan x="16" y="15">A</tspan>
        <tspan x="33" y="15">C</tspan>
        <tspan x="49" y="15">K</tspan>
        <tspan x="66" y="15">R</tspan>
      </text>
      {/* Small solid pink dot (#f9a8d4) at the top-right just above and after final R */}
      <circle
        cx="78.8"
        cy="3.5"
        r="1.15"
        fill="#f9a8d4"
        className="backr-pink-dot"
      />
    </svg>
  );
};
