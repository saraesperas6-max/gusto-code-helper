import React, { useState } from 'react';
import { Mail, Lock, User, Phone, MapPin, Hash, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import GoogleReCaptcha from '@/components/GoogleReCaptcha';
import logo from '@/assets/logo.png';

const LoginPage: React.FC = () => {
  const { login, registerResident } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!captchaVerified) {
      setError('Please verify the captcha first.');
      return;
    }
    setLoading(true);
    const { error } = await login(email, password);
    setLoading(false);
    if (error) setError(error);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!firstName || !lastName || !age || !address || !contact || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (parseInt(age) > 120 || parseInt(age) < 1) {
      setError('Age must be between 1 and 120.');
      return;
    }
    if (contact.length !== 11) {
      setError('Contact number must be exactly 11 digits.');
      return;
    }
    setLoading(true);
    const { error } = await registerResident({
      firstName, lastName, middleName, age: parseInt(age), address, contact, email, password,
    });
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSuccess('Account created! Please check your email to verify your account, then log in.');
      setIsSignUp(false);
      setFirstName(''); setLastName(''); setMiddleName(''); setAge('');
      setAddress(''); setContact(''); setPassword(''); setConfirmPassword('');
    }
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!forgotEmail) { setError('Please enter your email address.'); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) { setError(error.message); } else {
      setSuccess('A password reset link has been sent to your email.');
      setForgotSent(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) setError('Google sign-in failed. Please try again.');
  };

  const resetForm = () => {
    setError(''); setSuccess(''); setEmail(''); setPassword('');
    setFirstName(''); setLastName(''); setMiddleName(''); setAge('');
    setAddress(''); setContact(''); setShowForgotPassword(false);
    setCaptchaVerified(false); setForgotSent(false); setForgotEmail('');
    setConfirmPassword('');
  };

  const switchToSignUp = () => { setIsSignUp(true); resetForm(); };
  const switchToLogin = () => { setIsSignUp(false); resetForm(); };

  return (
    <div className="h-[100dvh] flex items-center justify-center bg-muted p-0 md:p-4 relative overflow-hidden overflow-y-auto">

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

        {/* ===== FORM PANELS CONTAINER ===== */}
        <div className="w-full flex relative overflow-hidden">

          {/* ===== LOGIN FORM (left side) ===== */}
          <div
            className={`
              w-full md:w-1/2 flex flex-col items-center justify-center
              transition-all duration-500 ease-in-out
              ${isSignUp
                ? 'hidden md:flex md:opacity-0 md:pointer-events-none'
                : 'opacity-100'}
            `}
          >
            {/* Mobile Welcome Banner */}
            <div
              className="md:hidden w-full flex flex-col items-center justify-center py-6 px-4 relative"
              style={{ background: 'linear-gradient(135deg, hsl(170, 55%, 45%), hsl(170, 65%, 38%))' }}
            >
              <div className="absolute top-3 left-4 w-6 h-6 border border-white/20 rotate-45" />
              <div className="absolute bottom-3 right-6 w-5 h-5 border border-white/15 rotate-45" />
              <img src={logo} alt="Logo" className="w-12 h-12 rounded-full object-cover mb-2 border-2 border-white/30" />
              <h2 className="text-lg font-bold text-white">Welcome!</h2>
              <p className="text-white/80 text-xs mt-1">Barangay Palma-Urbano</p>
            </div>

            <div className="w-full max-w-sm flex-1 flex flex-col justify-center px-5 py-4 md:p-8">
              <div className="text-center mb-4 md:mb-6">
                <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'hsl(170, 55%, 45%)' }}>Sign in</h1>
              </div>

              {showForgotPassword ? (
                <form onSubmit={handleSendResetLink} className="space-y-3">
                  <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="Email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="pl-10" required />
                  </div>
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  {success && <Alert><AlertDescription className="text-primary">{success}</AlertDescription></Alert>}
                  {!forgotSent ? (
                    <Button type="submit" className="w-full rounded-full" style={{ background: 'hsl(170, 55%, 45%)' }} disabled={forgotLoading}>{forgotLoading ? 'Sending...' : 'Send Reset Link'}</Button>
                  ) : (
                    <Button type="button" variant="outline" className="w-full rounded-full" onClick={() => { setForgotSent(false); setSuccess(''); }}>Send Again</Button>
                  )}
                  <p className="text-center text-sm">
                    <button type="button" className="font-medium hover:underline" style={{ color: 'hsl(170, 55%, 45%)' }} onClick={() => { setShowForgotPassword(false); setError(''); setSuccess(''); }}>Back to Login</button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required />
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <button type="button" className="text-xs hover:underline" style={{ color: 'hsl(170, 55%, 45%)' }} onClick={() => { setShowForgotPassword(true); setError(''); setSuccess(''); }}>Forgot Password?</button>
                  </div>

                  <GoogleReCaptcha onVerified={setCaptchaVerified} />

                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  {success && <Alert><AlertDescription className="text-primary">{success}</AlertDescription></Alert>}

                  <Button type="submit" className="w-full rounded-full text-white" style={{ background: 'hsl(170, 55%, 45%)' }} disabled={loading}>{loading ? 'Signing in...' : 'SIGN IN'}</Button>

                  <div className="relative my-1">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
                  </div>

                  <Button type="button" variant="outline" className="w-full rounded-full" onClick={handleGoogleSignIn}>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Sign in with Google
                  </Button>

                  {/* Mobile toggle */}
                  <p className="text-center text-sm text-muted-foreground md:hidden mt-2">
                    Don't have an account?{' '}
                    <button type="button" className="font-medium hover:underline" style={{ color: 'hsl(170, 55%, 45%)' }} onClick={switchToSignUp}>Sign Up</button>
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* ===== SIGN UP FORM (right side) ===== */}
          <div
            className={`
              w-full md:w-1/2 flex flex-col items-center md:justify-center
              transition-all duration-500 ease-in-out
              ${isSignUp
                ? 'opacity-100 relative'
                : 'hidden md:flex md:opacity-0 md:pointer-events-none'}
            `}
          >
            {/* Mobile Welcome Back Banner */}
            <div
              className="md:hidden w-full flex flex-col items-center justify-center py-5 px-4 relative shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(170, 55%, 45%), hsl(170, 65%, 38%))' }}
            >
              <div className="absolute top-3 left-4 w-6 h-6 border border-white/20 rotate-45" />
              <div className="absolute bottom-3 right-6 w-5 h-5 border border-white/15 rotate-45" />
              <img src={logo} alt="Logo" className="w-12 h-12 rounded-full object-cover mb-2 border-2 border-white/30" />
              <h2 className="text-lg font-bold text-white">Welcome Back!</h2>
              <p className="text-white/80 text-xs mt-1">Already have an account?{' '}
                <button type="button" className="font-semibold text-white underline" onClick={switchToLogin}>Sign In</button>
              </p>
            </div>

            <div className="w-full max-w-sm flex-1 flex flex-col justify-start md:justify-center px-5 py-3 md:p-8 overflow-y-auto">
              <div className="text-center mb-2 md:mb-4">
                <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'hsl(170, 55%, 45%)' }}>Create Account</h1>
                <p className="text-xs text-muted-foreground mt-0.5 hidden md:block">Barangay Palma-Urbano</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-2 md:space-y-3">
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="First Name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-10" required />
                  </div>
                  <Input placeholder="Last Name *" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
                <Input placeholder="Middle Name (optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Age *" value={age} onChange={(e) => { const v = e.target.value; if (v === '' || (/^\d+$/.test(v) && parseInt(v) <= 120)) setAge(v); }} className="pl-10" required maxLength={3} />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Contact # *" value={contact} onChange={(e) => { const v = e.target.value; if (v === '' || (/^\d+$/.test(v) && v.length <= 11)) setContact(v); }} className="pl-10" required maxLength={11} />
                  </div>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Address *" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10" required />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type={showPassword ? 'text' : 'password'} placeholder="Password * (min. 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type={showPassword ? 'text' : 'password'} placeholder="Confirm Password *" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" required />
                </div>

                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                {success && <Alert><AlertDescription className="text-primary">{success}</AlertDescription></Alert>}

                <Button type="submit" className="w-full rounded-full text-white" style={{ background: 'hsl(170, 55%, 45%)' }} disabled={loading}>{loading ? 'Creating account...' : 'SIGN UP'}</Button>

                {/* Mobile toggle */}
                <p className="text-center text-sm text-muted-foreground md:hidden mt-1">
                  Already have an account?{' '}
                  <button type="button" className="font-medium hover:underline" style={{ color: 'hsl(170, 55%, 45%)' }} onClick={switchToLogin}>Sign In</button>
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* ===== SLIDING OVERLAY PANEL (desktop only) ===== */}
        <div
          className={`
            hidden md:flex absolute top-0 h-full w-1/2 flex-col items-center justify-center text-center px-10 z-20
            transition-transform duration-700 ease-in-out
          `}
          style={{
            background: 'linear-gradient(135deg, hsl(170, 55%, 45%), hsl(170, 65%, 38%))',
            transform: isSignUp ? 'translateX(0%)' : 'translateX(100%)',
          }}
        >
          <div className="absolute top-8 left-8 w-10 h-10 border-2 border-white/20 rotate-45" />
          <div className="absolute bottom-16 right-12 w-8 h-8 border-2 border-white/15 rotate-45" />
          <div className="absolute top-1/3 right-6 w-6 h-6 bg-white/10 rotate-45" />

          <img src={logo} alt="Barangay Logo" className="w-16 h-16 rounded-full object-cover mb-4 border-2 border-white/30" />
          {isSignUp ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
              <p className="text-white/80 text-sm mb-6">
                To keep connected with us please login with your personal info
              </p>
              <Button
                variant="outline"
                className="border-white/50 text-white bg-transparent hover:bg-white/10 rounded-full px-8"
                onClick={switchToLogin}
              >
                SIGN IN
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Hello, Friend!</h2>
              <p className="text-white/80 text-sm mb-6">
                Enter your personal details and start your journey with us
              </p>
              <Button
                variant="outline"
                className="border-white/50 text-white bg-transparent hover:bg-white/10 rounded-full px-8"
                onClick={switchToSignUp}
              >
                SIGN UP
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
