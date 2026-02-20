import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CaptchaProps {
  onVerified: (verified: boolean) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const Captcha: React.FC<CaptchaProps> = ({ onVerified }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [siteKey, setSiteKey] = useState<string | null>(null);

  // Fetch site key from backend
  useEffect(() => {
    supabase.functions.invoke('verify-turnstile', {
      body: { action: 'get-site-key' },
    }).then(({ data }) => {
      if (data?.siteKey) setSiteKey(data.siteKey);
    });
  }, []);

  const verifyToken = useCallback(async (token: string) => {
    setVerifying(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-turnstile', {
        body: { token },
      });

      if (fnError || !data?.success) {
        setError('Verification failed. Please try again.');
        onVerified(false);
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      } else {
        onVerified(true);
      }
    } catch {
      setError('Verification failed. Please try again.');
      onVerified(false);
    } finally {
      setVerifying(false);
    }
  }, [onVerified]);

  useEffect(() => {
    if (!siteKey) return;

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => verifyToken(token),
        'expired-callback': () => onVerified(false),
        'error-callback': () => {
          setError('CAPTCHA error. Please refresh.');
          onVerified(false);
        },
        theme: 'auto',
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      window.onTurnstileLoad = renderWidget;
      if (!document.querySelector('script[src*="turnstile"]')) {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
        script.async = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, verifyToken, onVerified]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="flex justify-center" />
      {verifying && <p className="text-xs text-center text-muted-foreground">Verifying...</p>}
      {error && <p className="text-xs text-center text-destructive">{error}</p>}
    </div>
  );
};

export default Captcha;
