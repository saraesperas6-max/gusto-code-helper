import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GoogleReCaptchaProps {
  onVerified: (verified: boolean, token?: string) => void;
}

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
  }
}

const RECAPTCHA_SCRIPT_ID = 'recaptcha-script';

const GoogleReCaptcha: React.FC<GoogleReCaptchaProps> = ({ onVerified }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch site key from edge function
  useEffect(() => {
    let cancelled = false;
    const fetchSiteKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
          body: { action: 'get-site-key' },
        });
        if (cancelled) return;
        if (error || !data?.siteKey) {
          setError('Failed to load CAPTCHA configuration.');
          setLoading(false);
          return;
        }
        setSiteKey(data.siteKey);
      } catch {
        if (!cancelled) {
          setError('Failed to load CAPTCHA.');
          setLoading(false);
        }
      }
    };
    fetchSiteKey();
    return () => { cancelled = true; };
  }, []);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !siteKey || !window.grecaptcha?.render) return;
    // Don't render if already rendered
    if (widgetIdRef.current !== null) return;
    widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
      sitekey: siteKey,
      callback: async (token: string) => {
        try {
          const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
            body: { token },
          });
          if (error || !data?.success) {
            onVerified(false);
            setError('Verification failed. Please try again.');
            if (widgetIdRef.current !== null) window.grecaptcha.reset(widgetIdRef.current);
          } else {
            onVerified(true, token);
            setError('');
          }
        } catch {
          onVerified(false);
          setError('Verification error.');
        }
      },
      'expired-callback': () => {
        onVerified(false);
      },
      'error-callback': () => {
        onVerified(false);
        setError('CAPTCHA error. Please try again.');
      },
    });
    setLoading(false);
  }, [siteKey, onVerified]);

  // Load reCAPTCHA script & render widget
  useEffect(() => {
    if (!siteKey) return;

    const tryRender = () => {
      if (window.grecaptcha?.render) {
        renderWidget();
      }
    };

    // If script already loaded
    if (document.getElementById(RECAPTCHA_SCRIPT_ID)) {
      if (window.grecaptcha?.render) {
        renderWidget();
      } else {
        // Script is loading, wait for it
        const prev = window.onRecaptchaLoad;
        window.onRecaptchaLoad = () => {
          prev?.();
          tryRender();
        };
      }
      return;
    }

    // Load script
    window.onRecaptchaLoad = tryRender;
    const script = document.createElement('script');
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup widget on unmount
      if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
        try { window.grecaptcha.reset(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [siteKey, renderWidget]);

  // Reset verified state on mount
  useEffect(() => {
    onVerified(false);
  }, []);

  if (error && !siteKey) {
    return <p className="text-xs text-center text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-center">
        {loading && <p className="text-xs text-muted-foreground">Loading verification...</p>}
        <div ref={containerRef} />
      </div>
      {error && <p className="text-xs text-center text-destructive">{error}</p>}
    </div>
  );
};

export default React.memo(GoogleReCaptcha);
