import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import logo from '@/assets/logo.png';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let resolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        resolved = true;
        setIsRecovery(true);
        setChecking(false);
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (type === 'recovery' && accessToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        }).then(({ error: sessionError }) => {
          if (!resolved) {
            if (!sessionError) {
              resolved = true;
              setIsRecovery(true);
            } else {
              setError('Recovery link is invalid or expired. Please request a new one.');
            }
            setChecking(false);
            window.history.replaceState(null, '', window.location.pathname);
          }
        });
        return () => subscription.unsubscribe();
      }
    }

    const timeout = setTimeout(() => {
      if (!resolved) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!resolved) {
            if (session) setIsRecovery(true);
            setChecking(false);
          }
        });
      }
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Password updated successfully! Redirecting to login...');
      await supabase.auth.signOut();
      setTimeout(() => navigate('/'), 2000);
    }
  };

  const tealGradient = 'linear-gradient(135deg, hsl(170, 55%, 45%), hsl(170, 65%, 38%))';
  const tealColor = 'hsl(170, 55%, 45%)';

  const renderContent = () => {
    if (checking) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      );
    }

    if (!isRecovery) {
      return (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">Invalid or expired reset link. Please request a new one.</p>
          <Button className="rounded-full text-white" style={{ background: tealColor }} onClick={() => navigate('/')}>
            Back to Login
          </Button>
        </div>
      );
    }

    return (
      <form onSubmit={handleResetPassword} className="space-y-3">
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter new password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            required
          />
          <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
            {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10"
            required
          />
        </div>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert><AlertDescription className="text-primary">{success}</AlertDescription></Alert>}

        <Button type="submit" className="w-full rounded-full text-white" style={{ background: tealColor }} disabled={loading}>
          {loading ? 'Updating...' : 'Save New Password'}
        </Button>

        <p className="text-center text-sm">
          <button type="button" className="font-medium hover:underline" style={{ color: tealColor }} onClick={() => navigate('/')}>
            Back to Login
          </button>
        </p>
      </form>
    );
  };

  return (
    <div className="h-[100dvh] flex items-center justify-center bg-muted p-0 md:p-4 relative overflow-hidden">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-2 right-2 md:top-4 md:right-4 bg-card/80 backdrop-blur-sm text-foreground hover:bg-card shadow-md z-50"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className="w-full h-full md:h-auto md:max-w-[900px] md:min-h-[560px] md:rounded-2xl shadow-2xl overflow-hidden flex bg-card relative">
        {/* Form Panel */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
          {/* Mobile Welcome Banner */}
          <div
            className="md:hidden w-full flex flex-col items-center justify-center py-6 px-4 relative"
            style={{ background: tealGradient }}
          >
            <div className="absolute top-3 left-4 w-6 h-6 border border-white/20 rotate-45" />
            <div className="absolute bottom-3 right-6 w-5 h-5 border border-white/15 rotate-45" />
            <img src={logo} alt="Logo" className="w-12 h-12 rounded-full object-cover mb-2 border-2 border-white/30" />
            <h2 className="text-lg font-bold text-white">Set New Password</h2>
            <p className="text-white/80 text-xs mt-1">Enter your new password below</p>
          </div>

          <div className="w-full max-w-sm flex-1 flex flex-col justify-center px-5 py-4 md:p-8">
            <div className="text-center mb-4 md:mb-6">
              <h1 className="text-xl md:text-2xl font-bold" style={{ color: tealColor }}>Set New Password</h1>
              <p className="text-sm text-muted-foreground mt-1 hidden md:block">Enter your new password below</p>
            </div>
            {renderContent()}
          </div>
        </div>

        {/* Teal Side Panel (desktop only) */}
        <div
          className="hidden md:flex absolute top-0 right-0 h-full w-1/2 flex-col items-center justify-center text-center px-10 z-20"
          style={{ background: tealGradient }}
        >
          <div className="absolute top-8 left-8 w-10 h-10 border-2 border-white/20 rotate-45" />
          <div className="absolute bottom-16 right-12 w-8 h-8 border-2 border-white/15 rotate-45" />
          <div className="absolute top-1/3 right-6 w-6 h-6 bg-white/10 rotate-45" />

          <img src={logo} alt="Logo" className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-white/30" />
          <h2 className="text-2xl font-bold text-white mb-2">Secure Reset</h2>
          <p className="text-white/80 text-sm max-w-[250px]">
            Choose a strong password to keep your account safe
          </p>
          <Button
            variant="outline"
            className="mt-6 rounded-full border-white text-white hover:bg-white/10 bg-transparent"
            onClick={() => navigate('/')}
          >
            SIGN IN
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
