// pages/Login.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { VerticxLogo } from "../components/icons/Icons.tsx";
import Button from "../components/ui/Button.tsx";
import Input from "../components/ui/Input.tsx";
import type { User, UserRole } from "../types.ts";

// --- Types for Vanta (to satisfy TypeScript) ---
declare global {
  interface Window {
    VANTA: any;
    THREE: any;
  }
}

// --- Icons ---
const EyeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const LoginPage: React.FC = () => {
  // Refs for Vanta
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  // Form State
  const [identifier, setIdentifier] = useState("VRTX-REG-001");
  const [password, setPassword] = useState("registrar123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, verifyOtpAndLogin } = useAuth();
  const navigate = useNavigate();

  // 2FA State
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [otp, setOtp] = useState("");

  // --- SENIOR DEV LOGIC: Vanta Effect Initialization ---
  useEffect(() => {
    // 1. Helper to load scripts sequentially
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(true); // Already loaded
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    // 2. Load Three.js first, then Vanta
    const initVanta = async () => {
      try {
        // Load Three.js (Must be r134 or similar for Vanta)
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
        );
        // Load Vanta Globe
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.globe.min.js"
        );

        // 3. Initialize Effect on the Ref
        if (!vantaEffect && vantaRef.current && window.VANTA) {
          setVantaEffect(
            window.VANTA.GLOBE({
              el: vantaRef.current,
              mouseControls: true,
              touchControls: true,
              gyroControls: false,
              minHeight: 200.0,
              minWidth: 200.0,
              scale: 1.0,
              scaleMobile: 1.0,
              // YOUR CUSTOM COLORS
              color: 0x1c231a, // Dark Greenish
              color2: 0x612525, // Dark Reddish
              backgroundColor: 0xa7a7c2, // Light Grey-Purple
            })
          );
        }
      } catch (error) {
        console.error("Failed to load Vanta scripts", error);
      }
    };

    initVanta();

    // 4. Cleanup: Destroy effect when component unmounts
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  const navigateToPortal = (userRole: UserRole) => {
    switch (userRole) {
      case "SuperAdmin":
        navigate("/superadmin/dashboard");
        break;
      case "Admin":
        navigate("/admin/dashboard");
        break;
      case "Principal":
        navigate("/principal/dashboard");
        break;
      case "Registrar":
        navigate("/registrar/dashboard");
        break;
      case "Teacher":
        navigate("/teacher/dashboard");
        break;
      case "Student":
        navigate("/student/dashboard");
        break;
      case "Parent":
        navigate("/parent/dashboard");
        break;
      case "Librarian":
        navigate("/librarian/dashboard");
        break;
      default:
        navigate("/login");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user, otpRequired } = await login(identifier, password);
      if (otpRequired && user) {
        setPendingUser(user);
        setShowOtpScreen(true);
      } else if (user) {
        navigateToPortal(user.role);
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser || !otp) return;
    setError("");
    setLoading(true);
    try {
      const user = await verifyOtpAndLogin(pendingUser.id, otp);
      if (user) {
        navigateToPortal(user.role);
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during OTP verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowOtpScreen(false);
    setPendingUser(null);
    setOtp("");
    setError("");
  };

  return (
    // Attach the Ref here for the Background
    <div
      ref={vantaRef}
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden font-sans text-slate-800"
    >
      {/* --- Login Card (Glassmorphism to see the Globe) --- */}
      <div className="relative z-10 w-full max-w-md animate-enter">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-md mb-4 ring-1 ring-slate-100">
            <VerticxLogo className="w-12 h-12 text-indigo-900" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome to VERTICX
          </h1>
          <p className="text-slate-700 font-medium mt-2 text-sm">
            School Management System
          </p>
        </div>

        {/* Increased opacity on card background to ensure readability over the dynamic globe */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl p-8 ring-1 ring-white/50">
          {showOtpScreen ? (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-semibold text-slate-900 text-center mb-2">
                Two-Factor Authentication
              </h2>
              <p className="text-slate-700 text-center text-sm mb-6">
                Enter the 6-digit code sent to your device.
              </p>
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-900 text-sm text-center font-medium">
                    {error}
                  </div>
                )}
                <Input
                  label="Verification Code"
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  required
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="text-center tracking-[0.5em] font-bold text-xl bg-white/80 border-slate-300 text-slate-900 focus:ring-indigo-900 focus:border-indigo-900"
                />
                <Button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl shadow-lg transition-all"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <button
                  onClick={handleBackToLogin}
                  className="text-sm text-slate-800 hover:text-black font-semibold transition-colors"
                >
                  ← Back to login
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-900 text-sm text-center font-medium">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <Input
                  label="User ID or Email"
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="bg-white/80 border-slate-300 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900 transition-all font-medium"
                />

                {/* Password with Eye Icon */}
                <div className="relative">
                  <Input
                    label="Password"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/80 border-slate-300 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900 transition-all pr-10 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-slate-500 hover:text-indigo-900 transition-colors duration-200 focus:outline-none"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg transition-all hover:-translate-y-0.5"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-800 font-medium mt-8 drop-shadow-sm">
          Need to register your institution?{" "}
          <button
            onClick={() => navigate("/landing")}
            className="font-bold text-indigo-900 hover:text-black hover:underline"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
