import React, { useState, useEffect } from 'react';

export interface ProgressBarProps {
  value: number; // percentage (e.g. 0, 35, 100, 200)
  size?: 'default' | 'sm'; // default: 8px, sm: 6px on cards
  className?: string;
  ariaLabel?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  size = 'default',
  className = '',
  ariaLabel,
}) => {
  const numericValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const clampedTarget = Math.min(100, Math.max(0, numericValue));
  const isOverFunded = numericValue >= 100;
  const isZero = numericValue <= 0;

  // Animate from 0 to value on mount with a 700ms ease-out transition
  const [renderedWidth, setRenderedWidth] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setRenderedWidth(clampedTarget);
    });
    return () => cancelAnimationFrame(frame);
  }, [clampedTarget]);

  const heightClass = size === 'sm' ? 'h-[6px]' : 'h-2';
  const dotSizeClass = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(numericValue)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel || `Funding progress: ${Math.round(numericValue)}%`}
      className={`relative w-full rounded-full overflow-hidden select-none ${heightClass} ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Show fill and glow only if > 0% */}
      {!isZero && renderedWidth > 0 && (
        <div
          className="h-full rounded-full relative overflow-hidden"
          style={{
            width: `${renderedWidth}%`,
            maxWidth: '100%',
            background: isOverFunded
              ? 'linear-gradient(90deg, #a78bfa 0%, #f0abfc 50%, #fde68a 100%)'
              : 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 50%, #f0abfc 100%)',
            boxShadow: isOverFunded
              ? '0 0 12px rgba(240, 171, 252, 0.45), 0 0 8px rgba(253, 230, 138, 0.25)'
              : '0 0 12px rgba(167, 139, 250, 0.45)',
            transition: 'width 700ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Subtle shimmer: slow, thin diagonal light sweep moving across the fill every ~3s */}
          <div
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden rounded-full"
          >
            <div className="absolute top-0 bottom-0 w-3/4 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-progress-shimmer" />
          </div>

          {/* Bright rounded "head" glow dot at the leading edge of the fill */}
          <div
            aria-hidden="true"
            className={`absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white pointer-events-none ${dotSizeClass}`}
            style={{
              boxShadow: isOverFunded
                ? '0 0 6px #ffffff, 0 0 10px rgba(253, 230, 138, 0.9)'
                : '0 0 6px #ffffff, 0 0 10px rgba(167, 139, 250, 0.9)',
            }}
          />
        </div>
      )}
    </div>
  );
};
