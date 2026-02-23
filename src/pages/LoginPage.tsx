import React, { useState } from 'react';
import { Mail, Lock, User, Phone, MapPin, Hash, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import Captcha from '@/components/Captcha';
import logo from '@/assets/logo.png';
import barangayHall from '@/assets/barangay-hall.jpg';

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

  // Sign up fields
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
      setError('Please solve the captcha correctly.');
      return;
    }

    setLoading(true);
    const { error } = await login(email, password);
    setLoading(false);

    if (error) {
      setError(error);
    }
    // Navigation happens automatically via App.tsx route guards
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

    setLoading(true);
    const { error } = await registerResident({
      firstName,
      lastName,
      middleName,
      age: parseInt(age),
      address,
      contact,
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setSuccess('Account created! Please check your email to verify your account, then log in.');
      setIsSignUp(false);
      setFirstName('');
      setLastName('');
      setMiddleName('');
      setAge('');
      setAddress('');
      setContact('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!forgotEmail) {
      setError('Please enter your email address.');
      return;
    }
    setForgotLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setForgotLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('A password reset link has been sent to your email. Please check your inbox and click the link to set a new password.');
      setForgotSent(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) {
      setError('Google sign-in failed. Please try again.');
    }
  };

  const resetForm = () => {
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setMiddleName('');
    setAge('');
    setAddress('');
    setContact('');
    setShowForgotPassword(false);
    setCaptchaVerified(false);
    setForgotSent(false);
    setForgotEmail('');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${barangayHall})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Theme Toggle */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleTheme} 
        className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm text-foreground hover:bg-card shadow-md"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
      <Card className="w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center pb-2">
          <img src={logo} alt="Barangay Logo" className="w-20 h-20 mx-auto mb-4 rounded-full object-cover" />
          <h1 className="text-xl font-bold text-foreground">Barangay Palma-Urbano</h1>
          <p className="text-muted-foreground">{isSignUp ? 'Create an Account' : 'Log In'}</p>
        </CardHeader>
        <CardContent>
          {showForgotPassword ? (
            <form onSubmit={handleSendResetLink} className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter your email and we'll send you a link to reset your password.</p>
              <div className="space-y-2">
                <Label htmlFor="forgotEmail">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="forgotEmail" type="email" placeholder="Enter your email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              {success && <Alert><AlertDescription className="text-primary">{success}</AlertDescription></Alert>}
              {!forgotSent && (
                <Button type="submit" className="w-full" disabled={forgotLoading}>{forgotLoading ? 'Sending...' : 'Send Reset Link'}</Button>
              )}
              {forgotSent && (
                <Button type="button" className="w-full" variant="outline" onClick={() => { setForgotSent(false); setSuccess(''); }}>Send Again</Button>
              )}
              <p className="text-center text-sm text-muted-foreground">
                <button type="button" className="text-primary font-medium hover:underline" onClick={() => { setShowForgotPassword(false); setForgotSent(false); setError(''); setSuccess(''); }}>Back to Login</button>
              </p>
            </form>
          ) : !isSignUp ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required />
                  <button type="button" onClick={() => setShowPassword(prev => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground focus:outline-none" tabIndex={-1}>
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" className="text-xs text-primary hover:underline" onClick={() => { setShowForgotPassword(true); setError(''); setSuccess(''); }}>Forgot Password?</button>
              </div>

              <Captcha onVerified={setCaptchaVerified} />

              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              {success && <Alert><AlertDescription className="text-primary">{success}</AlertDescription></Alert>}

              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
              </div>

              <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Sign in with Google
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName">First Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="firstName" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input id="middleName" placeholder="Middle name (optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="age">Age *</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="age" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Age" value={age} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) setAge(v); }} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contact">Contact # *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="contact" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="09XX..." value={contact} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) setContact(v); }} className="pl-10" required />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="address" placeholder="Complete address" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="signupEmail">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="signupEmail" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="signupPassword">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="signupPassword" type={showPassword ? 'text' : 'password'} placeholder="Create a password (min. 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required />
                  <button type="button" onClick={() => setShowPassword(prev => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground focus:outline-none" tabIndex={-1}>
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 pr-10" required />
                </div>
              </div>

              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              {success && <Alert><AlertDescription className="text-primary">{success}</AlertDescription></Alert>}

              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating account...' : 'Sign Up'}</Button>
            </form>
          )}

          {!showForgotPassword && (
            <>
              <hr className="my-4" />
              <p className="text-center text-sm text-muted-foreground">
                {isSignUp ? (
                  <>Already have an account?{' '}<button type="button" className="text-primary font-medium hover:underline" onClick={() => { setIsSignUp(false); resetForm(); }}>Log In</button></>
                ) : (
                  <>Don't have an account?{' '}<button type="button" className="text-primary font-medium hover:underline" onClick={() => { setIsSignUp(true); resetForm(); }}>Sign Up</button></>
                )}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
