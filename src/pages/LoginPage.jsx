import { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const LoginPage = () => {
  const [isInView, setIsInView] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    setIsInView(true);
  }, []);

  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Simulate a login response for email: ${formData.email}. Return JSON only: {"success": true, "user": {"user_id": 1, "username": "player1", "email": "${formData.email}", "role": "player", "is_2fa_enabled": 1}, "requiresOTP": true, "message": "OTP sent to your email"}`
          }]
        })
      });

      const data = await response.json();
      const result = JSON.parse(data.content[0].text.replace(/```json|```/g, '').trim());

      if (result.success) {
        setUserData(result.user);
        if (result.requiresOTP) {
          setStep('otp');
          setOtpTimer(300);
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Simulate OTP verification for code: ${formData.otp}. Return JSON only: {"success": true, "token": "jwt_token_here", "message": "Login successful"}`
          }]
        })
      });

      const data = await response.json();
      const result = JSON.parse(data.content[0].text.replace(/```json|```/g, '').trim());

      if (result.success) {
        alert('✅ Login successful! Welcome to RoyalFlush.');
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpTimer > 0) return;
    setLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOtpTimer(300);
      alert('📧 New OTP sent to your email');
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-600/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto relative z-10 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* LEFT SIDE - IMAGE */}
          <div className={`relative transition-all duration-1000 ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 via-transparent to-transparent pointer-events-none z-10" />
              <img 
                src="/image1.webp"
                alt="Casino poker chips"
                className="w-full h-auto object-cover rounded-2xl"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-[600px] bg-zinc-800 rounded-2xl hidden items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4">♠️</div>
                  <div className="text-yellow-600 font-serif text-3xl">RoyalFlush</div>
                  <div className="text-zinc-400 mt-2">Premium Poker Experience</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -right-4 w-24 h-32 bg-red-700 rounded-lg border border-yellow-600/30 shadow-xl transform rotate-12 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">A</span>
              <span className="text-3xl">♠</span>
            </div>
          </div>

          {/* RIGHT SIDE - LOGIN FORM */}
          <div className={`transition-all duration-1000 delay-300 ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            <Card className="bg-zinc-900/60 backdrop-blur-lg border-yellow-600/20">
              
              {step === 'login' ? (
                <>
                  <CardHeader className="text-center pb-4">
                    
                    <CardTitle className="font-serif text-3xl text-white">Welcome Back</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Login to your RoyalFlush account
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <Input
                          id="email"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                          placeholder="you@example.com"
                          className="pl-11  text-white placeholder:text-zinc-500 focus-visible:ring-yellow-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                          placeholder="••••••••"
                          className="pl-11 pr-11  text-white placeholder:text-zinc-500 focus-visible:ring-yellow-600"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white h-8 w-8 p-0"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                        <AlertDescription className="text-red-400">{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleLogin}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-zinc-950 font-semibold hover:opacity-90"
                    >
                      {loading ? 'Logging in...' : 'Login'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>

                  <CardFooter className="flex flex-col space-y-3 border-t border-zinc-800 pt-6">
                    <Button variant="link" className="text-sm text-zinc-400 hover:text-yellow-600 p-0 h-auto">
                      Forgot password?
                    </Button>
                    <p className="text-sm text-zinc-400">
                      Don't have an account?{' '}
                      <Button variant="link" className="text-yellow-600 hover:underline p-0 h-auto">
                        Register now
                      </Button>
                    </p>
                  </CardFooter>
                </>
              ) : (
                <>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-zinc-950" />
                    </div>
                    <CardTitle className="font-serif text-3xl text-white">Verify OTP</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Enter the 6-digit code sent to
                    </CardDescription>
                    <p className="text-yellow-600 font-medium mt-1">{userData?.email}</p>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-white">OTP Code</Label>
                      <Input
                        id="otp"
                        type="text"
                        name="otp"
                        value={formData.otp}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                        placeholder="000000"
                        maxLength={6}
                        className="bg-zinc-800 border-zinc-700 text-white text-center text-2xl tracking-widest font-mono placeholder:text-zinc-500 focus-visible:ring-yellow-600"
                      />
                    </div>

                    <div className="text-center">
                      {otpTimer > 0 ? (
                        <p className="text-sm text-zinc-400">
                          Code expires in <span className="text-yellow-600 font-semibold">{formatTime(otpTimer)}</span>
                        </p>
                      ) : (
                        <p className="text-sm text-red-400">OTP expired</p>
                      )}
                    </div>

                    {error && (
                      <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                        <AlertDescription className="text-red-400">{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleVerifyOTP}
                      disabled={loading || otpTimer === 0}
                      className="w-full bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-zinc-950 font-semibold hover:opacity-90"
                    >
                      {loading ? 'Verifying...' : 'Verify & Login'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>

                  <CardFooter className="flex flex-col space-y-4 border-t border-zinc-800 pt-6">
                    <div className="text-center w-full">
                      <p className="text-sm text-zinc-400 mb-2">
                        Didn't receive the code?
                      </p>
                      <Button
                        variant="link"
                        onClick={handleResendOTP}
                        disabled={loading || otpTimer > 0}
                        className="text-sm text-yellow-600 hover:underline p-0 h-auto"
                      >
                        {otpTimer > 0 ? `Resend in ${formatTime(otpTimer)}` : 'Resend OTP'}
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        setStep('login');
                        setFormData({ ...formData, otp: '' });
                        setError('');
                      }}
                      className="w-full text-sm text-zinc-400 hover:text-white"
                    >
                      ← Back to login
                    </Button>
                  </CardFooter>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;