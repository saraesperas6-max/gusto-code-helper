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
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    setCode(generateCode());
    setInput('');
    setError('');
    onVerified(false);
  }, [onVerified]);

  useEffect(() => {
    onVerified(false);
  }, []);

  const handleVerify = () => {
    if (input === code) {
      setError('');
      onVerified(true);
    } else {
      setError('Code does not match. Try again.');
      onVerified(false);
      refresh();
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
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleVerify())}
        className="text-center tracking-widest"
      />
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleVerify}>
        Verify
      </Button>
      {error && <p className="text-xs text-center text-destructive">{error}</p>}
    </div>
  );
};

export default AlphanumericCaptcha;
