// pages/Login.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { VerticxLogo } from "../components/icons/Icons.tsx";
import Button from "../components/ui/Button.tsx";
import Input from "../components/ui/Input.tsx";
import type { User, UserRole } from "../types.ts";

const styles = `
  @keyframes blob {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-blob {
    animation: blob 7s infinite;
  }
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  .animation-delay-4000 {
    animation-delay: 4s;
  }
  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
    opacity: 0;
  }
  .delay-100 { animation-delay: 0.1s; }
  .delay-200 { animation-delay: 0.2s; }
  .delay-300 { animation-delay: 0.3s; }
  
  /* Glassmorphism Input overrides if your Input component supports className appending */
  .glass-input input {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    color: white;
  }
  .glass-input input:focus {
    background: rgba(255, 255, 255, 0.1);
    border-color: #6366f1; /* Indigo-500 */
  }
`;

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState("VRTX-REG-001");
  const [password, setPassword] = useState("registrar123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, verifyOtpAndLogin } = useAuth();
  const navigate = useNavigate();

  // 2FA State
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [otp, setOtp] = useState("");

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
    <div className="relative min-h-screen bg-slate-900 flex items-center justify-center p-4 overflow-hidden font-sans">
      <style>{styles}</style>

      {/* --- Animated Background Blobs --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      {/* --- Glass Card Container --- */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-block p-4 rounded-full bg-white/5 backdrop-blur-sm shadow-xl ring-1 ring-white/10 mb-4 transition-transform hover:scale-105 duration-300">
            <VerticxLogo className="w-16 h-16 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200 tracking-tight">
            VERTICX
          </h1>
          <p className="text-indigo-200/60 text-sm mt-2 font-medium tracking-wide uppercase">
            School Management Ecosystem
          </p>
        </div>

        {/* The "Card" - Replaced standard Card with a custom Glass Div for this page */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8 animate-fade-in-up delay-100">
          {/* View: OTP Screen */}
          {showOtpScreen ? (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-semibold text-white text-center mb-2">
                Two-Factor Authentication
              </h2>
              <p className="text-indigo-200/70 text-center text-sm mb-6">
                Enter the 6-digit code sent to your device.
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center animate-pulse">
                    {error}
                  </div>
                )}
                <div className="glass-input">
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
                    className="text-center tracking-[0.5em] font-bold text-xl bg-black/20 border-white/10 text-white focus:ring-indigo-500 focus:border-indigo-500 placeholder-transparent"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:-translate-y-0.5"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <button
                  onClick={handleBackToLogin}
                  className="text-sm text-indigo-300 hover:text-white transition-colors"
                >
                  ← Back to login
                </button>
              </div>
            </div>
          ) : (
            /* View: Login Screen */
            <form
              onSubmit={handleLogin}
              className="space-y-5 animate-fade-in-up delay-200"
            >
              {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center animate-pulse">
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
                  className="bg-black/20 border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300"
                />
                <div className="relative">
                  <Input
                    label="Password"
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-black/20 border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300"
                  />
                  <div className="absolute right-0 top-0 mt-[-2px]">
                    {/* Optional: Add Forgot Password link here later */}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:-translate-y-0.5"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing In...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-indigo-200/50 mt-8 animate-fade-in-up delay-300">
          Need to register your institution?{" "}
          <button
            onClick={() => navigate("/landing")}
            className="font-semibold text-indigo-300 hover:text-white transition-colors hover:underline decoration-indigo-500 underline-offset-4"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
