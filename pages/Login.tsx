// pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { VerticxLogo } from "../components/icons/Icons.tsx";
import Button from "../components/ui/Button.tsx";
import Input from "../components/ui/Input.tsx";
import type { User, UserRole } from "../types.ts";

// CSS for the Solar System Animation
const styles = `
  @keyframes orbit-spin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
  
  .orbit-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px dashed rgba(203, 213, 225, 0.6); /* Slate-300 transparent */
    pointer-events: none; /* Let clicks pass through to the form */
  }

  .planet {
    position: absolute;
    top: -6px; /* Offset to sit on the line */
    left: 50%;
    transform: translateX(-50%);
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
  }

  .orbit-1 { width: 300px; height: 300px; animation: orbit-spin 20s linear infinite; }
  .orbit-2 { width: 500px; height: 500px; animation: orbit-spin 35s linear infinite reverse; }
  .orbit-3 { width: 700px; height: 700px; animation: orbit-spin 50s linear infinite; }
  .orbit-4 { width: 950px; height: 950px; animation: orbit-spin 70s linear infinite reverse; }

  /* Entry Animation */
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-enter {
    animation: fadeInUp 0.6s ease-out forwards;
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
    <div className="relative min-h-screen bg-slate-50 flex items-center justify-center p-4 overflow-hidden font-sans text-slate-800">
      <style>{styles}</style>

      {/* --- Solar System Background --- */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Sun (Center Glow) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

        {/* Orbit 1 (Smallest) - Mercury */}
        <div className="orbit-container orbit-1">
          <div className="planet w-3 h-3 bg-indigo-500"></div>
        </div>

        {/* Orbit 2 - Venus */}
        <div className="orbit-container orbit-2">
          <div className="planet w-4 h-4 bg-purple-500"></div>
        </div>

        {/* Orbit 3 - Earth */}
        <div className="orbit-container orbit-3">
          <div className="planet w-5 h-5 bg-blue-500"></div>
        </div>

        {/* Orbit 4 (Largest) - Mars */}
        <div className="orbit-container orbit-4">
          <div className="planet w-6 h-6 bg-orange-400"></div>
        </div>
      </div>

      {/* --- Login Card --- */}
      <div className="relative z-10 w-full max-w-md animate-enter">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-xl shadow-md mb-4 ring-1 ring-slate-100">
            <VerticxLogo className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Welcome to VERTICX
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            School Management System
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/80 backdrop-blur-md border border-white/50 shadow-xl rounded-2xl p-8 ring-1 ring-slate-200/50">
          {/* View: OTP Screen */}
          {showOtpScreen ? (
            <div className="animate-enter">
              <h2 className="text-xl font-semibold text-slate-800 text-center mb-2">
                Two-Factor Authentication
              </h2>
              <p className="text-slate-500 text-center text-sm mb-6">
                Enter the 6-digit code sent to your device.
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center border border-red-100">
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
                  className="text-center tracking-[0.5em] font-bold text-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md shadow-indigo-200 transition-all"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <button
                  onClick={handleBackToLogin}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  ← Back to login
                </button>
              </div>
            </div>
          ) : (
            /* View: Login Screen */
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center border border-red-100">
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
                  className="bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <div className="relative">
                  <Input
                    label="Password"
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
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
        <p className="text-center text-sm text-slate-500 mt-8">
          Need to register your institution?{" "}
          <button
            onClick={() => navigate("/landing")}
            className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
