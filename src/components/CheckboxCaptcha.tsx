import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface CheckboxCaptchaProps {
  onVerified: (verified: boolean) => void;
}

const CheckboxCaptcha: React.FC<CheckboxCaptchaProps> = ({ onVerified }) => {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified'>('idle');

  const handleClick = () => {
    if (status !== 'idle') return;
    setStatus('verifying');
    // Simulate a brief verification delay
    const delay = 800 + Math.random() * 700;
    setTimeout(() => {
      setStatus('verified');
      onVerified(true);
    }, delay);
  };

  return (
    <div
      className="w-full rounded border bg-[#f9f9f9] dark:bg-muted/40 dark:border-border shadow-sm flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 select-none"
      style={{ maxWidth: '100%' }}
    >
      {/* Left: checkbox + label */}
      <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={handleClick}>
        <div
          className={`w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
            status === 'verified'
              ? 'border-[#4A90D9] bg-[#4A90D9]'
              : 'border-[#c1c1c1] dark:border-muted-foreground/40 bg-white dark:bg-background hover:border-[#4A90D9]'
          }`}
        >
          {status === 'verifying' && (
            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#4A90D9] animate-spin" />
          )}
          {status === 'verified' && (
            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" strokeWidth={3} />
          )}
        </div>
        <span className="text-xs sm:text-sm text-foreground font-medium">I'm not a robot</span>
      </div>

      {/* Right: branding */}
      <div className="flex flex-col items-center gap-0">
        <svg width="24" height="24" viewBox="0 0 24 24" className="sm:w-7 sm:h-7">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="none" />
          <path d="M19.5 8.5l-3-1.5-2 3.5 3 1.5z" fill="#4A90D9" opacity="0.8" />
          <path d="M14.5 10.5l-3-1.5-2 3.5 3 1.5z" fill="#357ABD" />
          <path d="M9.5 12.5l-3-1.5-2 3.5 3 1.5z" fill="#5BA0E0" opacity="0.7" />
          <path d="M12 4l2 4-4 2 2 4-4 2" fill="none" stroke="#4A90D9" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="text-[7px] sm:text-[8px] text-muted-foreground/60 leading-none">CAPTCHA</span>
      </div>
    </div>
  );
};

export default CheckboxCaptcha;
