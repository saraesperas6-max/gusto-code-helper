import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/context/ThemeContext';

interface GoogleReCaptchaProps {
  onVerified: (verified: boolean) => void;
}

const GoogleReCaptcha: React.FC<GoogleReCaptchaProps> = ({ onVerified }) => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { theme } = useTheme();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteKey, setSiteKey] = useState('');

  useEffect(() => {
    // Fetch the site key from the edge function secrets
    const fetchSiteKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
          body: { action: 'get-site-key' },
        });
        if (data?.siteKey) {
          setSiteKey(data.siteKey);
        }
      } catch {
        // Fallback: site key should be set via env
      }
    };
    fetchSiteKey();
  }, []);

  const handleChange = useCallback(async (token: string | null) => {
    if (!token) {
      onVerified(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token },
      });

      if (fnError) throw fnError;

      if (data?.success) {
        onVerified(true);
      } else {
        setError('Verification failed. Please try again.');
        onVerified(false);
        recaptchaRef.current?.reset();
      }
    } catch {
      setError('Verification failed. Please try again.');
      onVerified(false);
      recaptchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  }, [onVerified]);

  const handleExpired = useCallback(() => {
    onVerified(false);
  }, [onVerified]);

  const handleError = useCallback(() => {
    setError('reCAPTCHA error. Please try again.');
    onVerified(false);
  }, [onVerified]);

  if (!siteKey) {
    return (
      <div className="flex justify-center py-2">
        <div className="text-xs text-muted-foreground">Loading CAPTCHA...</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-center transform scale-[0.85] sm:scale-90 md:scale-100 origin-center">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={siteKey}
          onChange={handleChange}
          onExpired={handleExpired}
          onErrored={handleError}
          theme={theme === 'dark' ? 'dark' : 'light'}
          size="normal"
        />
      </div>
      {error && <p className="text-xs text-center text-destructive">{error}</p>}
      {loading && <p className="text-xs text-center text-muted-foreground">Verifying...</p>}
    </div>
  );
};

export default GoogleReCaptcha;
