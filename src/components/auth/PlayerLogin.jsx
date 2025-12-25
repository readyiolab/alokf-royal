const PlayerLogin = () => {
    const { login } = useAuth();
    const [step, setStep] = useState('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [otpTimer, setOtpTimer] = useState(0);
  
    useEffect(() => {
      if (otpTimer > 0) {
        const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
        return () => clearTimeout(timer);
      }
    }, [otpTimer]);
  
    const handleRequestOTP = async (e) => {
      e.preventDefault();
      if (!phoneNumber || phoneNumber.length !== 10) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }
  
      setLoading(true);
      setError('');
  
      try {
        await apiService.requestPlayerOTP(phoneNumber);
        setStep('otp');
        setOtpTimer(300);
      } catch (err) {
        setError(err.message || 'Failed to send OTP');
      } finally {
        setLoading(false);
      }
    };
  
    const handleVerifyOTP = async (e) => {
      e.preventDefault();
      if (!otp || otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP');
        return;
      }
  
      setLoading(true);
      setError('');
  
      try {
        const result = await apiService.verifyPlayerOTP(phoneNumber, otp);
        login(result.player, result.token);
      } catch (err) {
        setError(err.message || 'Invalid OTP');
      } finally {
        setLoading(false);
      }
    };
  
    const handleResendOTP = async () => {
      if (otpTimer > 0) return;
      
      setLoading(true);
      setError('');
  
      try {
        await apiService.requestPlayerOTP(phoneNumber);
        setOtpTimer(300);
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
      <Card className="w-full max-w-md">
        {step === 'phone' ? (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Player Login</CardTitle>
              <CardDescription>Enter your phone number to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      className="pl-10"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
  
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
  
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl text-center">Verify OTP</CardTitle>
              <CardDescription className="text-center">
                Enter the code sent to +91 {phoneNumber}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
  
                {otpTimer > 0 ? (
                  <p className="text-sm text-center text-muted-foreground">
                    Code expires in <span className="font-semibold">{formatTime(otpTimer)}</span>
                  </p>
                ) : (
                  <p className="text-sm text-center text-red-500">OTP expired</p>
                )}
  
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
  
                <Button type="submit" className="w-full" disabled={loading || otpTimer === 0}>
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </Button>
  
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleResendOTP}
                    disabled={loading || otpTimer > 0}
                  >
                    {otpTimer > 0 ? `Resend in ${formatTime(otpTimer)}` : 'Resend OTP'}
                  </Button>
  
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setStep('phone');
                      setOtp('');
                      setError('');
                    }}
                  >
                    ← Back to phone
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    );
  };