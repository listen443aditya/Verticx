// pages/Login.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { VerticxLogo } from "../components/icons/Icons.tsx";
import Button from "../components/ui/Button.tsx";
import Input from "../components/ui/Input.tsx";
import type { User, UserRole } from "../types.ts";

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
  // --- CANVAS ANIMATION REF ---
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form State
  const [identifier, setIdentifier] = useState("VRTX-REG-001");
  const [password, setPassword] = useState("registrar123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auth & Nav
  const { login, verifyOtpAndLogin } = useAuth();
  const navigate = useNavigate();
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [otp, setOtp] = useState("");

  // --- CUSTOM ANIMATION LOGIC: VERTICX NETWORK ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    // Configuration
    const particleCount = 70; // Number of dots
    const connectionDistance = 140; // Max distance to draw lines
    const mouseDistance = 200; // Interaction radius

    // Particle Class
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;

      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        // Random velocity
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
      }

      update(mouse: { x: number; y: number }) {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;

        // Mouse Interaction (Gentle repulsion)
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseDistance) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouseDistance - distance) / mouseDistance;
          // Push away slightly
          this.vx -= forceDirectionX * force * 0.05;
          this.vy -= forceDirectionY * force * 0.05;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = "#4f46e5"; // Indigo-600
        ctx.fill();
      }
    }

    // Initialize Particles
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let mouse = { x: -1000, y: -1000 };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      // Draw connecting lines first (behind dots)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            const opacity = 1 - distance / connectionDistance;
            ctx.strokeStyle = `rgba(79, 70, 229, ${opacity * 0.4})`; // Indigo lines
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      particles.forEach((p) => {
        p.update(mouse);
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Event Listeners
    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden font-sans text-slate-800 bg-slate-50">
      {/* --- CUSTOM CANVAS BACKGROUND --- */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-0"
        style={{
          background: "linear-gradient(to bottom right, #f8fafc, #e0e7ff)",
        }}
      />

      {/* Login Card (Glassmorphism) */}
      <div className="relative z-10 w-full max-w-md animate-[fadeInUp_0.6s_ease-out_forwards]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-md mb-4 ring-1 ring-slate-200">
            <VerticxLogo className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome to VERTICX
          </h1>
          <p className="text-slate-600 font-medium mt-2 text-sm">
            School Management Ecosystem
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/60 shadow-2xl rounded-2xl p-8 ring-1 ring-white/50">
          {showOtpScreen ? (
            <div className="animate-pulse-fade-in">
              <h2 className="text-xl font-semibold text-slate-900 text-center mb-2">
                Two-Factor Authentication
              </h2>
              <p className="text-slate-600 text-center text-sm mb-6">
                Enter the 6-digit code sent to your device.
              </p>
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 text-sm text-center font-medium">
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
                  className="text-center tracking-[0.5em] font-bold text-xl bg-white/70 border-slate-300 text-slate-900 focus:ring-indigo-600 focus:border-indigo-600"
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
                  className="text-sm text-indigo-700 hover:text-indigo-900 font-semibold transition-colors"
                >
                  ← Back to login
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 text-sm text-center font-medium">
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
                  className="bg-white/70 border-slate-300 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
                />
                <div className="relative">
                  <Input
                    label="Password"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/70 border-slate-300 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all pr-10 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-slate-400 hover:text-indigo-600 transition-colors duration-200 focus:outline-none"
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

        <p className="text-center text-sm text-slate-600 font-medium mt-8">
          Need to register your institution?{" "}
          <button
            onClick={() => navigate("/landing")}
            className="font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
