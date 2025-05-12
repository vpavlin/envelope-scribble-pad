
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
}

const Logo = ({ size = 'md', withText = true }: LogoProps) => {
  const sizes = {
    sm: { icon: 20, text: 16 },
    md: { icon: 24, text: 18 },
    lg: { icon: 32, text: 24 },
  };

  const currentSize = sizes[size];
  
  return (
    <div className="flex items-center">
      <div className="relative">
        {/* Stylized envelope with hidden content */}
        <svg 
          width={currentSize.icon} 
          height={currentSize.icon} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Envelope base */}
          <path 
            d="M22 6L12 13L2 6"
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M2 6L12 13L22 6" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <rect 
            x="2" 
            y="6" 
            width="20" 
            height="12" 
            rx="2" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Lock symbol on envelope */}
          <circle 
            cx="12" 
            cy="12" 
            r="3" 
            fill="currentColor" 
            opacity="0.6"
          />
          {/* Hidden layer symbol */}
          <path 
            d="M8 12L16 12" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            opacity="0.6"
          />
        </svg>
      </div>
      {withText && (
        <span className="ml-2 font-bold text-lg" style={{ fontSize: `${currentSize.text}px` }}>
          Lope
        </span>
      )}
    </div>
  );
};

export default Logo;
