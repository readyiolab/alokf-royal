import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
  UserCog,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  User,
  ArrowLeft,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import authService from "../../services/auth.service";

const StaffLogin = () => {
  const navigate = useNavigate();
  const { staffLogin, verifyStaffOTP, isAuthenticated, user } = useAuth();
  const [isInView, setIsInView] = useState(false);
  const [step, setStep] = useState("login");
  const [userType, setUserType] = useState("admin");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    otp: "",
  });
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role;
      if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === "cashier") {
        navigate("/cashier/transactions", { replace: true });
      } else if (role === "floor_manager") {
        navigate("/floor-manager", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    setIsInView(true);
  }, []);

  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await staffLogin(formData.email, formData.password);

      if (result.requiresOTP) {
        setUserData({
          user_id: result.user_id,
          email: result.email || formData.email,
        });
        setStep("otp");
        setOtpTimer(300);
      } else if (result.token && result.user) {
        console.log("Login successful, redirecting...");
      }
    } catch (err) {
      setError(err.message || "Login failed");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    if (!userData || !userData.user_id) {
      setError("Session expired. Please login again.");
      setStep("login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyStaffOTP(userData.user_id, formData.otp);

      if (result.token && result.user) {
        console.log("OTP verified successfully, redirecting...");
      }
    } catch (err) {
      setError(err.message || "Invalid OTP");
      console.error("OTP verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpTimer > 0) return;

    if (!userData || !userData.user_id) {
      setError("Session expired. Please login again.");
      setStep("login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.resendOTP(userData.user_id);
      setOtpTimer(300);
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
      console.error("Resend OTP error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleKeyPress = (e, action) => {
    if (e.key === "Enter") action();
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-8 sm:py-12 px-4">
      {/* Animated Background */}
   

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="container mx-auto relative z-10 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* LEFT SIDE - IMAGE & BRANDING */}
          <div
            className={`relative transition-all duration-1000 ${
              isInView
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-12"
            } hidden lg:block`}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              
              <img
                src="/image1.webp"
                alt="Staff Portal"
                className="w-full h-auto object-cover rounded-3xl"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>

            
          </div>

          {/* RIGHT SIDE - LOGIN FORM */}
          <div
            className={`transition-all duration-1000 delay-300 ${
              isInView
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-12"
            }`}
          >
            <Card className="bg-slate-900/90 backdrop-blur-xl border-blue-500/30 shadow-2xl w-full max-w-md mx-auto">
              {step === "login" ? (
                <>
                  <CardHeader className="text-center space-y-6 px-6 pt-8 pb-6">
                    <div className="space-y-2">
                      <CardTitle className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Staff Portal
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-base">
                        Select your role to continue
                      </CardDescription>
                    </div>

                    {/* Improved Role Toggle */}
                    <div className="flex justify-center items-center p-1 shadow-inner gap-5">
                      <button
                        type="button"
                        onClick={() => setUserType("admin")}
                        className={`relative px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-300 border
    ${
      userType === "admin"
        ? "bg-white text-black border-white shadow-md"
        : "bg-transparent text-white border-white/30 hover:bg-white/10"
    }
  `}
                      >
                        <div className="flex items-center gap-2 relative z-10">
                          <Shield
                            className={`w-4 h-4 transition-transform duration-300 ${
                              userType === "admin" ? "scale-110" : ""
                            }`}
                          />
                          <span>Admin</span>
                        </div>

                        {userType === "admin" && (
                          <div className="absolute inset-0 rounded-lg ring-2 ring-white/60 animate-pulse" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserType("cashier")}
                        className={`relative px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 border
    ${
      userType === "cashier"
        ? "bg-white text-black border-white shadow-md"
        : "bg-transparent text-slate-400 border-white/20 hover:text-white hover:bg-white/10"
    }
  `}
                      >
                        <div className="flex items-center gap-2 relative z-10">
                          <User
                            className={`w-4 h-4 transition-transform duration-300 ${
                              userType === "cashier" ? "scale-110" : ""
                            }`}
                          />
                          <span>Cashier</span>
                        </div>

                        {userType === "cashier" && (
                          <div className="absolute inset-0 rounded-lg ring-2 ring-white/60 animate-pulse" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserType("floor_manager")}
                        className={`relative px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 border
    ${
      userType === "floor_manager"
        ? "bg-white text-black border-white shadow-md"
        : "bg-transparent text-slate-400 border-white/20 hover:text-white hover:bg-white/10"
    }
  `}
                      >
                        <div className="flex items-center gap-2 relative z-10">
                          <LayoutGrid
                            className={`w-4 h-4 transition-transform duration-300 ${
                              userType === "floor_manager" ? "scale-110" : ""
                            }`}
                          />
                          <span>Floor Manager</span>
                        </div>

                        {userType === "floor_manager" && (
                          <div className="absolute inset-0 rounded-lg ring-2 ring-white/60 animate-pulse" />
                        )}
                      </button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5 px-6 pb-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-slate-200 font-medium text-sm flex items-center gap-2"
                      >
                        
                        Email Address
                      </Label>
                      <div className="relative group">
                        <Input
                          id="email"
                          type="email"
                          placeholder={
                            userType === "admin"
                              ? "admin@example.com"
                              : "cashier@example.com"
                          }
                          autoComplete="email"
                          className="h-12  focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all rounded-lg"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          onKeyDown={(e) => handleKeyPress(e, handleLogin)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-slate-200 font-medium text-sm flex items-center gap-2"
                      >
                       
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••••"
                          autoComplete="current-password"
                          className="h-12 pr-12 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all rounded-lg"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          onKeyDown={(e) => handleKeyPress(e, handleLogin)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-md"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {error && (
                      <Alert
                        variant="destructive"
                        className="bg-red-500/10 border-red-500/30 animate-in fade-in slide-in-from-top-2"
                      >
                        <AlertDescription className="text-red-400 text-sm">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleLogin}
                      className={`w-full h-12 text-white font-semibold text-base shadow-lg transition-all duration-300 ${
                        userType === "admin"
                          ? "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 hover:shadow-blue-500/50"
                          : userType === "floor_manager"
                          ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-700 hover:via-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/50"
                          : "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 hover:shadow-blue-500/50"
                      }`}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Logging in...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Login as {userType === "admin" ? "Admin" : userType === "cashier" ? "Cashier" : "Floor Manager"}
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  </CardContent>

                  <CardFooter className="flex flex-col space-y-3 border-t border-slate-800 pt-6 px-6 pb-6">
                    <Button
                      variant="link"
                      className="text-sm text-slate-400 hover:text-blue-400 p-0 h-auto transition-colors"
                    >
                      Forgot password?
                    </Button>
                  </CardFooter>
                </>
              ) : (
                <>
                  <CardHeader className="text-center pb-6 space-y-3 px-6 pt-8">
                    
                    <CardTitle className="text-3xl sm:text-4xl font-bold text-white">
                      Verify OTP
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-base">
                      Enter the 6-digit code sent to
                    </CardDescription>
                    <p className="text-blue-400 font-semibold text-sm">
                      {userData?.email}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-5 px-6 pb-6">
                    <div className="space-y-6">
                      <Label
                        htmlFor="otp"
                        className="text-white font-medium text-sm"
                      >
                        OTP Code
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        autoComplete="one-time-code"
                        className="text-center text-3xl tracking-[0.5em] font-mono h-16   focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500 transition-all rounded-lg"
                        value={formData.otp}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            otp: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        onKeyDown={(e) => handleKeyPress(e, handleVerifyOTP)}
                      />
                    </div>

                    

                    {error && (
                      <Alert
                        variant="destructive"
                        className="bg-red-500/10 border-red-500/30 animate-in fade-in slide-in-from-top-2"
                      >
                        <AlertDescription className="text-red-400 text-sm">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleVerifyOTP}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 hover:shadow-blue-500/50 text-white font-semibold text-base shadow-lg hover:shadow-green-500/50 transition-all duration-300"
                      disabled={loading || otpTimer === 0}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Verifying...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          Verify & Login
                        </span>
                      )}
                    </Button>
                  </CardContent>

                  <CardFooter className="flex flex-col space-y-4 border-t border-slate-800 pt-6 px-6 pb-6">
                    <div className="text-center w-full space-y-6">
                      <p className="text-sm text-slate-400">
                        Didn't receive the code?
                      </p>
                      <Button
                        
                        onClick={handleResendOTP}
                        disabled={loading || otpTimer > 0}
                        className="w-full sm:w-auto "
                      >
                        {otpTimer > 0
                          ? `Resend in ${formatTime(otpTimer)}`
                          : "🔄 Resend OTP"}
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        setStep("login");
                        setFormData({ ...formData, otp: "" });
                        setError("");
                      }}
                      className="w-full text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    >
                      <ArrowLeft/> Back to login
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

export default StaffLogin;
