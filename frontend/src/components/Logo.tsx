import React from 'react';

/**
 * REint AI — Single Unified Brand Logo.
 * Exactly matches the REint AI website branding:
 * Brain / Neural Circuit mark in rich emerald green (#15803d) + REint AI wordmark.
 *
 * Used uniformly across:
 * - Navbar
 * - App loading state
 * - Footer
 * - Browser favicon & tabs
 */

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  showWordmark?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { icon: 20, textMain: 14, textSub: 9,  gap: 8 },
  md: { icon: 28, textMain: 19, textSub: 10, gap: 10 },
  lg: { icon: 48, textMain: 28, textSub: 12, gap: 14 },
};

/**
 * The REint AI logomark SVG:
 * - Left hemisphere: organic brain sulci / convolutions (human/neural intelligence)
 * - Right hemisphere: electronic circuit traces & node terminals (artificial intelligence)
 */
export const LogoMark: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 28,
  className = '',
  color = '#15803d',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    {/* Left hemisphere: Brain convolutions / gyri */}
    <path
      d="M10.8 3.5C7.6 3.5 5 6.1 5 9.3c0 1.2.4 2.3 1.1 3.2C5.2 13.4 4.5 14.7 4.5 16.2c0 2.4 1.8 4.4 4.2 4.7.7.9 1.8 1.6 3.1 1.6"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.8 7.5c-1.8 0-3.3 1.2-3.3 2.8 0 1.5 1.2 2.7 3.3 2.7"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 15.2c-.8.8-.8 2 0 2.8 1 1 2.3.7 3.3-.2"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.8 11.5c-.8 0-1.4.5-1.4 1.2"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
    />

    {/* Right hemisphere: Digital AI circuit traces & terminal nodes */}
    <path
      d="M13.2 4.5h2.8l3 3"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="19" cy="7.5" r="1.3" fill={color} />

    <path
      d="M13.2 9h5.3"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle cx="18.5" cy="9" r="1.3" fill={color} />

    <path
      d="M13.2 13.5h2.8l2.5 2.5h2"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="20.5" cy="16" r="1.3" fill={color} />

    <path
      d="M13.2 18h3.3l1.5 2"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="18" cy="20" r="1.3" fill={color} />

    <path
      d="M13.2 22h3"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle cx="16.2" cy="22" r="1.3" fill={color} />
  </svg>
);

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
}) => {
  const cfg = sizeConfig[size];

  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ gap: cfg.gap, userSelect: 'none' }}
      aria-label="REint AI"
    >
      {/* Brand Icon Mark */}
      <LogoMark size={cfg.icon} color="#15803d" />

      {/* Brand Wordmark */}
      {showWordmark && (
        <div style={{ lineHeight: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <span
              style={{
                fontSize: cfg.textMain,
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: '#15803d',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              }}
            >
              REint AI
            </span>
          </div>
          {size === 'md' && (
            <p
              style={{
                fontSize: cfg.textSub,
                fontWeight: 500,
                color: '#6b7280',
                marginTop: 2,
                letterSpacing: '0.01em',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              UK Wind Intelligence
            </p>
          )}
        </div>
      )}
    </div>
  );
};
