import React, { useState } from 'react';
// FIX: Corrected react-router-dom import for v6+
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.ts';
import { VerticxLogo } from '../components/icons/Icons.tsx';
import Button from '../components/ui/Button.tsx';
import Card from '../components/ui/Card.tsx';
import Input from '../components/ui/Input.tsx';
import type { User, UserRole } from '../types.ts';

const LoginPage: React.FC = () => {
    const [identifier, setIdentifier] = useState('VRTX-REG-001'); // Default for demo
    const [password, setPassword] = useState('registrar123'); // Default for demo
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, verifyOtpAndLogin } = useAuth();
    const navigate = useNavigate();

    // 2FA State
    const [showOtpScreen, setShowOtpScreen] = useState(true);
    const [pendingUser, setPendingUser] = useState<User | null>(null);
    const [otp, setOtp] = useState('');

    const navigateToPortal = (userRole: UserRole) => {
        switch (userRole) {
            case 'SuperAdmin': navigate('/superadmin/dashboard'); break;
            case 'Admin': navigate('/admin/dashboard'); break;
            case 'Principal': navigate('/principal/dashboard'); break;
            case 'Registrar': navigate('/registrar/dashboard'); break;
            case 'Teacher': navigate('/teacher/dashboard'); break;
            case 'Student': navigate('/student/dashboard'); break;
            case 'Parent': navigate('/parent/dashboard'); break;
            case 'Librarian': navigate('/librarian/dashboard'); break;
            default: navigate('/login');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { user, otpRequired } = await login(identifier, password);
            if (otpRequired && user) {
                setPendingUser(user);
                setShowOtpScreen(true);
            } else if (user) {
                navigateToPortal(user.role);
            } else {
                setError('Invalid credentials. Please try again.');
            }
        } catch (err) {
            setError('An error occurred during login.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pendingUser || !otp) return;
        setError('');
        setLoading(true);
        try {
            const user = await verifyOtpAndLogin(pendingUser.id, otp);
            if (user) {
                navigateToPortal(user.role);
            } else {
                setError('Invalid OTP. Please try again.');
            }
        } catch (err) {
            setError('An error occurred during OTP verification.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleBackToLogin = () => {
        setShowOtpScreen(false);
        setPendingUser(null);
        setOtp('');
        setError('');
    };

    // Quick login buttons for demo purposes
    const quickLogin = (e: string, p: string) => {
        setIdentifier(e);
        setPassword(p);
    }

    if (showOtpScreen) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
                 <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                         <VerticxLogo className="w-20 h-20 mx-auto" />
                         <h1 className="text-3xl font-bold text-text-primary-dark mt-4">Two-Factor Authentication</h1>
                         <p className="text-text-secondary-dark">A verification code has been sent to your registered contact method. <br/> (Check the developer console for the OTP).</p>
                    </div>
                    <Card>
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            {error && <p className="text-red-400 text-center">{error}</p>}
                            <Input
                                label="6-Digit Verification Code"
                                id="otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                required
                                maxLength={6}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                className="text-center tracking-[0.5em] font-bold text-lg"
                            />
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify & Sign In'}
                            </Button>
                        </form>
                    </Card>
                    <p className="text-center text-sm text-text-secondary-dark mt-6">
                        <button onClick={handleBackToLogin} className="font-semibold text-brand-accent hover:underline">
                            Back to login
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
             <div className="w-full max-w-md">
                <div className="text-center mb-8">
                     <VerticxLogo className="w-20 h-20 mx-auto" />
                     <h1 className="text-3xl font-bold text-text-primary-dark mt-4">VERTICX</h1>
                     <p className="text-text-secondary-dark">Sign in to continue</p>
                </div>
                <Card>
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && <p className="text-red-400 text-center">{error}</p>}
                        <Input
                            label="User ID or Email"
                            id="identifier"
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                        />
                        <Input
                            label="Password"
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>
                </Card>
                 <div className="mt-4 text-center">
                    <p className="text-sm text-text-secondary-dark mb-2">Quick Logins (Demo)</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        <Button variant="secondary" className="text-xs !px-2 !py-1" onClick={() => quickLogin('superadmin@verticx.com', 'superadmin123')}>Super Admin</Button>
                        <Button variant="secondary" className="text-xs !px-2 !py-1" onClick={() => quickLogin('admin@verticx.com', 'admin123')}>Admin</Button>
                        <Button variant="secondary" className="text-xs !px-2 !py-1" onClick={() => quickLogin('principal.north@verticx.com', 'principal123')}>Principal</Button>
                        <Button variant="secondary" className="text-xs !px-2 !py-1" onClick={() => quickLogin('VRTX-REG-001', 'registrar123')}>Registrar</Button>
                        <Button variant="secondary" className="text-xs !px-2 !py-1" onClick={() => quickLogin('VRTX-TCH-001', 'teacher123')}>Teacher</Button>
                        <Button variant="secondary" className="text-xs !px-2 !py-1" onClick={() => quickLogin('VRTX-LIB-001', 'librarian123')}>Librarian</Button>
                        <Button variant="secondary" className="text-xs !px-2 !py-1" onClick={() => quickLogin('VRTX-STU-0001', 'student123')}>Student</Button>
                        <Button variant="secondary" className="text-xs !px-2 !py-1" onClick={() => quickLogin('parent.sarah@verticx.com', 'parent123')}>Parent</Button>
                    </div>
                </div>
                <p className="text-center text-sm text-text-secondary-dark mt-6">
                    Need to register your institution?{' '}
                    <button onClick={() => navigate('/landing')} className="font-semibold text-brand-accent hover:underline">
                        Register here
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
