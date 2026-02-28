import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface AlphanumericCaptchaProps {
  onVerified: (verified: boolean) => void;
}

const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const AlphanumericCaptcha: React.FC<AlphanumericCaptchaProps> = ({ onVerified }) => {
  const [code, setCode] = useState(generateCode);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const refresh = useCallback(() => {
    setCode(generateCode());
    setInput('');
    setStatus('idle');
    onVerified(false);
  }, [onVerified]);

  useEffect(() => {
    onVerified(false);
  }, []);

  const handleVerify = () => {
    if (input === code) {
      setStatus('success');
      onVerified(true);
    } else {
      setStatus('error');
      onVerified(false);
      setTimeout(() => {
        refresh();
      }, 800);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div
          className="flex-1 select-none rounded-md bg-muted px-4 py-2 text-center tracking-[0.35em] font-mono text-lg font-bold text-foreground"
          style={{
            letterSpacing: '0.35em',
            background: `repeating-linear-gradient(
              45deg,
              hsl(var(--muted)),
              hsl(var(--muted)) 10px,
              hsl(var(--muted) / 0.7) 10px,
              hsl(var(--muted) / 0.7) 20px
            )`,
            textDecoration: 'line-through',
            textDecorationColor: 'hsl(var(--muted-foreground) / 0.3)',
          }}
        >
          {code}
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={refresh} className="shrink-0" title="Refresh code">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Input
        placeholder="Enter the code above"
        value={input}
        onChange={(e) => { setInput(e.target.value); if (status !== 'idle') setStatus('idle'); }}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleVerify())}
        className={`text-center tracking-widest transition-colors ${
          status === 'success'
            ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 focus-visible:ring-green-500'
            : status === 'error'
            ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 focus-visible:ring-red-500'
            : ''
        }`}
      />
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleVerify}>
        Verify
      </Button>
      {status === 'error' && <p className="text-xs text-center text-destructive">Code does not match. Try again.</p>}
      {status === 'success' && <p className="text-xs text-center text-green-600 dark:text-green-400">Verified successfully!</p>}
    </div>
  );
};

export default AlphanumericCaptcha;
