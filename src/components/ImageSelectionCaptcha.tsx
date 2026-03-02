import React, { useState, useEffect, useCallback } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  const challengeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-captcha`;

  const fetchChallenge = useCallback(async () => {
    setLoading(true);
    setSelected([]);
    setVerified(false);
    setError('');
    onVerified(false);
    try {
      const res = await fetch(challengeUrl);
      const data = await res.json();
      setChallenge(data);
    } catch {
      setError('Failed to load captcha.');
    }
    setLoading(false);
  }, [challengeUrl, onVerified]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

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
        onVerified(true);
      } else {
        setError('Incorrect. Please try again.');
        setTimeout(() => fetchChallenge(), 1200);
      }
    } catch {
      setError('Verification failed.');
    }
    setVerifying(false);
  };

  if (verified) {
    return (
      <div className="flex items-center justify-center gap-2 p-3 rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
        <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
        <span className="text-sm font-medium text-green-700 dark:text-green-400">Verification complete</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[300px] mx-auto rounded-lg overflow-hidden border shadow-md bg-card">
      {/* Blue header */}
      <div className="px-4 py-3 text-white" style={{ background: 'linear-gradient(135deg, #4A90D9, #357ABD)' }}>
        <p className="text-[11px] opacity-80">Select all squares with</p>
        <p className="text-xl font-bold capitalize leading-tight">{challenge?.target || '...'}</p>
        <p className="text-[11px] opacity-65 mt-0.5">If there are none, click skip</p>
      </div>

      {/* Image grid */}
      {loading ? (
        <div className="h-[240px] flex items-center justify-center bg-muted/30">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
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
                  ? 'border-[#4A90D9] scale-[0.92]'
                  : 'border-transparent hover:border-muted-foreground/20'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
              {selected.includes(i) && (
                <div className="absolute top-1 left-1 w-6 h-6 bg-[#4A90D9] rounded-full flex items-center justify-center shadow">
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2.5 border-t bg-card">
        <button
          type="button"
          onClick={fetchChallenge}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md transition-colors"
          title="New challenge"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {error && <p className="text-[11px] text-destructive flex-1 text-center px-1">{error}</p>}

        <Button
          type="button"
          size="sm"
          onClick={handleVerify}
          disabled={selected.length === 0 || verifying}
          className="text-white text-xs px-5 rounded"
          style={{ background: '#4A90D9' }}
        >
          {verifying ? 'Checking...' : 'VERIFY'}
        </Button>
      </div>
    </div>
  );
};

export default ImageSelectionCaptcha;
