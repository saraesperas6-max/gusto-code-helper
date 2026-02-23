import React, { useEffect, useRef, useState } from 'react';
import 'altcha';

interface CaptchaProps {
  onVerified: (verified: boolean) => void;
}

const Captcha: React.FC<CaptchaProps> = ({ onVerified }) => {
  const widgetRef = useRef<HTMLElement>(null);
  const [error, setError] = useState('');

  const challengeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/altcha-challenge`;

  useEffect(() => {
    const el = widgetRef.current;
    if (!el) return;

    const handleVerified = () => {
      setError('');
      onVerified(true);
    };

    const handleError = () => {
      setError('Verification failed. Please try again.');
      onVerified(false);
    };

    el.addEventListener('statechange', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.state === 'verified') {
        handleVerified();
      } else if (detail?.state === 'error') {
        handleError();
      } else if (detail?.state === 'expired') {
        onVerified(false);
      }
    });

    return () => {
      el.removeEventListener('statechange', handleVerified as any);
    };
  }, [onVerified]);

  return (
    <div className="space-y-2">
      <div className="flex justify-center">
        {/* @ts-ignore - ALTCHA web component */}
        <altcha-widget
          ref={widgetRef}
          challengeurl={challengeUrl}
          hidefooter
          style={{ '--altcha-max-width': '100%' } as any}
        />
      </div>
      {error && <p className="text-xs text-center text-destructive">{error}</p>}
    </div>
  );
};

export default Captcha;
