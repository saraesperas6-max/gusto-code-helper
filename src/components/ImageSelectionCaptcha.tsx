import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Check, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageSelectionCaptchaProps {
  onVerified: (verified: boolean) => void;
}

interface ChallengeData {
  challengeId: string;
  target: string;
  images: string[];
  token: string;
}

const ImageSelectionCaptcha: React.FC<ImageSelectionCaptchaProps> = ({ onVerified }) => {
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [showGrid, setShowGrid] = useState(false);
  const [checking, setChecking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const challengeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-captcha`;

  const fetchChallenge = useCallback(async () => {
    setLoading(true);
    setSelected([]);
    setError('');
    try {
      const res = await fetch(challengeUrl);
      const data = await res.json();
      setChallenge(data);
    } catch {
      setError('Failed to load captcha.');
    }
    setLoading(false);
  }, [challengeUrl]);

  const handleCheckboxClick = async () => {
    if (verified || checking) return;
    setChecking(true);
    // Simulate brief delay like reCAPTCHA
    await new Promise(r => setTimeout(r, 600));
    await fetchChallenge();
    setChecking(false);
    setShowGrid(true);
  };

  // Close grid on outside click
  useEffect(() => {
    if (!showGrid) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowGrid(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showGrid]);

  const toggleSelect = (index: number) => {
    if (verified || verifying) return;
    setSelected(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleVerify = async () => {
    if (!challenge || selected.length === 0) return;
    setVerifying(true);
    setError('');
    try {
      const res = await fetch(challengeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: challenge.token, selected }),
      });
      const data = await res.json();
      if (data.verified) {
        setVerified(true);
        setShowGrid(false);
        onVerified(true);
      } else {
        setError('Incorrect. Try again.');
        setSelected([]);
        setTimeout(() => fetchChallenge(), 800);
      }
    } catch {
      setError('Verification failed.');
    }
    setVerifying(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ===== Checkbox row (reCAPTCHA style) ===== */}
      <div className="w-full flex items-center justify-between rounded border border-border bg-muted/40 px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <button
            type="button"
            onClick={handleCheckboxClick}
            disabled={verified || checking}
            className={`
              w-6 h-6 rounded border-2 flex items-center justify-center transition-all shrink-0
              ${verified
                ? 'bg-green-500 border-green-500'
                : 'border-muted-foreground/40 hover:border-muted-foreground/70 bg-card'
              }
            `}
          >
            {checking && (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
            {verified && (
              <Check className="h-4 w-4 text-white" strokeWidth={3} />
            )}
          </button>
          <span className="text-sm text-foreground select-none">I'm not a robot</span>
        </div>

        {/* reCAPTCHA-style branding */}
        <div className="flex flex-col items-center gap-0 shrink-0">
          <svg className="w-6 h-6 md:w-7 md:h-7" viewBox="0 0 40 40" fill="none">
            <path d="M20 5L5 20l15 15 15-15L20 5z" fill="#4A90D9" opacity="0.2"/>
            <path d="M20 8l3 3-7 9 7 9-3 3L8 20l12-12z" fill="#4285F4"/>
            <path d="M20 8l-3 3 7 9-7 9 3 3 12-12L20 8z" fill="#357ABD"/>
          </svg>
          <span className="text-[7px] md:text-[8px] text-muted-foreground/60 leading-none">CAPTCHA</span>
        </div>
      </div>

      {/* ===== Image grid popup ===== */}
      {showGrid && !verified && (
        <div className="absolute left-0 right-0 bottom-full mb-1.5 z-50 w-full max-w-[280px] sm:max-w-[300px] mx-auto rounded-lg overflow-hidden border shadow-xl bg-card animate-scale-in">
          {/* Blue header */}
          <div className="px-3 py-2.5 text-white" style={{ background: 'linear-gradient(135deg, #4A90D9, #357ABD)' }}>
            <p className="text-[10px] opacity-80 leading-tight">Select all squares with</p>
            <p className="text-base sm:text-lg font-bold capitalize leading-tight">{challenge?.target || '...'}</p>
            <p className="text-[9px] opacity-60 leading-tight">If there are none, click skip</p>
          </div>

          {/* Image grid */}
          {loading ? (
            <div className="h-[180px] sm:h-[200px] flex items-center justify-center bg-muted/30">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[2px] p-[2px] bg-muted/40">
              {challenge?.images?.map((img, i) => (
                <button
                  key={`${challenge.challengeId}-${i}`}
                  type="button"
                  onClick={() => toggleSelect(i)}
                  className={`relative aspect-square overflow-hidden transition-all border-2 ${
                    selected.includes(i)
                      ? 'border-[#4A90D9] scale-[0.88]'
                      : 'border-transparent hover:border-muted-foreground/20'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                  {selected.includes(i) && (
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-[#4A90D9] rounded-full flex items-center justify-center shadow">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-2.5 py-2 border-t bg-card">
            <button
              type="button"
              onClick={() => { setSelected([]); fetchChallenge(); }}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              title="New challenge"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {error && <p className="text-[10px] text-destructive flex-1 text-center px-1">{error}</p>}

            <Button
              type="button"
              size="sm"
              onClick={handleVerify}
              disabled={selected.length === 0 || verifying}
              className="text-white text-xs h-7 px-4 rounded"
              style={{ background: '#4A90D9' }}
            >
              {verifying ? '...' : 'VERIFY'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSelectionCaptcha;
