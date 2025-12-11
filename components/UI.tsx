import React, { useEffect, useState } from 'react';
import { ArrowLeft, House } from 'lucide-react';
import SoundManager from '../utils/SoundManager';

// --- Buttons ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "rounded-xl font-semibold transition-all active:scale-[0.98] py-3 px-4 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-primary text-black hover:bg-yellow-400 active:bg-yellow-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-500 active:bg-gray-700",
    danger: "bg-danger text-white hover:bg-red-500 active:bg-red-700",
    ghost: "bg-transparent text-gray-400 hover:text-white active:bg-white/10",
  };

  const disabledStyles = "opacity-50 cursor-not-allowed active:scale-100";

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${fullWidth ? 'w-full' : ''} 
        ${disabled ? disabledStyles : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Helper Buttons ---

export const HomeButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className = '' }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }} 
    className={`p-2 rounded-full active:bg-white/10 text-gray-400 hover:text-white transition-colors ${className}`}
    aria-label="Home"
  >
    <House size={24} />
  </button>
);

// --- Cards ---

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-black/20 rounded-2xl p-4 backdrop-blur-sm ${onClick ? 'cursor-pointer active:bg-black/30 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

// --- Screen Layout ---

interface ScreenLayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  onHome?: () => void;
  noPadding?: boolean;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({ children, title, onBack, onHome, noPadding = false }) => {
  return (
    <div className={`flex flex-col h-screen ${noPadding ? '' : 'px-5'} pb-6 pt-5`}>
      <div className="flex items-center mb-6 relative min-h-[44px]">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-white/10 text-gray-400 hover:text-white transition-colors absolute left-0">
            <ArrowLeft size={24} />
          </button>
        )}
        
        {title && <h1 className={`text-xl font-bold text-white w-full text-center ${onBack ? 'pl-8' : ''} ${onHome ? 'pr-8' : ''}`}>{title}</h1>}
        
        {onHome && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <HomeButton onClick={onHome} className="-mr-2" />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {children}
      </div>
    </div>
  );
};

// --- Segmented Control ---

export const SegmentedControl: React.FC<{
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (val: any) => void;
}> = ({ options, value, onChange }) => {
  return (
    <div className="bg-black/20 rounded-lg p-1 flex">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            value === opt.value 
              ? 'bg-primary text-black shadow-sm' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

// --- Countdown Overlay ---

export const CountdownOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [count, setCount] = useState(5);

  useEffect(() => {
    // Play 54321 sound using SoundManager (Lowercase)
    SoundManager.playSound('54321.mp3');

    const interval = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Small delay before unmounting to show "1" briefly
          setTimeout(onComplete, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      SoundManager.stopSound('54321.mp3');
    };
  }, [onComplete]);

  if (count < 1) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md">
      <div className="text-[150px] font-bold text-primary animate-pulse leading-none">
        {count}
      </div>
    </div>
  );
};