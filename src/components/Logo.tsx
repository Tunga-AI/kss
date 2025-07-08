import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '', 
  showText = true, 
  textSize = 'xl',
  onClick 
}) => {
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
    '2xl': 'h-20 w-20'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl'
  };

  const handleClick = onClick || (() => {});

  return (
    <div 
      className={`flex items-center space-x-3 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleClick}
    >
      <img 
        src="/logo.png" 
        alt="KSS Logo" 
        className={`${sizeClasses[size]} object-contain`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-secondary-800 ${textSizeClasses[textSize]} leading-tight`}>
            KSS
          </span>
          <span className="text-xs text-secondary-600 font-medium -mt-1">
            Kenya School of Sales
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo; 