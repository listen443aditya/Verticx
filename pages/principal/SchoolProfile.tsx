import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { principalApiService, sharedApiService } from '../../services';
import type { Branch, User } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Input from '../../components/ui/Input.tsx';
import Button from '../../components/ui/Button.tsx';
import ConfirmationModal from '../../components/ui/ConfirmationModal.tsx';

const PhotoUpload: React.FC<{ label: string; imageUrl: string; onUpload: (url: string) => void; }> = ({ label, imageUrl, onUpload }) => {
    const handleUploadClick = () => {
        const url = prompt(`Enter new image URL for ${label}:`, imageUrl);
        if (url) {
            onUpload(url);
        }
    };
    return (
        <div>
            <p className="block text-sm font-medium text-text-secondary-dark mb-2">{label}</p>
            <div className="flex items-center gap-4">
                <img src={imageUrl || 'https://via.placeholder.com/100'} alt={label} className="w-24 h-24 rounded-full object-cover bg-slate-200" />
                <Button type="button" variant="secondary" onClick={handleUploadClick}>Upload New Photo</Button>
            </div>
        </div>
    );
};

const EyeIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>);
const EyeOffIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>);


// FIX: Changed to named export
export const SchoolProfile: React.FC = () => {
    const { user } = useAuth();
    
    // 2FA State
    const [isVerified, setIsVerified] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [verificationError, setVerificationError] = useState('');
    const [verifying, setVerifying] = useState(false);

    // Profile Data State
    const [branch, setBranch] = useState<Branch | null>(null);
    const [principal, setPrincipal] = useState<User | null>(user);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [passwordError, setPasswordError] = useState('');

    const [formData, setFormData] = useState({
        schoolName: '',
        principalName: '',
        vicePrincipalName: '',
        email: '',
        helplineNumber: '',
        location: '',
        logoUrl: '',
        principalPhotoUrl: '',
        vicePrincipalPhotoUrl: '',
        bankAccountNumber: '',
        bankIfscCode: '',
        bankAccountHolderName: '',
        bankBranchName: '',
        paymentGatewayPublicKey: '',
        paymentGatewaySecretKey: '',
        paymentGatewayWebhookSecret: '',
        enabledFeatures: {} as Record<string, boolean>,
    });
    
    const [visibilities, setVisibilities] = useState({
        bankAccountNumber: false,
        bankIfscCode: false,
        paymentGatewayPublicKey: false,
        paymentGatewaySecretKey: false,
        paymentGatewayWebhookSecret: false,
    });

    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // New Academic Session State
    const [nextSessionDate, setNextSessionDate] = useState('');
    const [showSessionConfirm, setShowSessionConfirm] = useState(false);
    const [isStartingSession, setIsStartingSession] = useState(false);


    const fetchProfileData = useCallback(async () => {
        if (!user?.branchId || !user.id) return;
        setLoading(true);
        const branchData = await sharedApiService.getBranchById(user.branchId);
        setBranch(branchData);
        setPrincipal(user); // user from context is sufficient
        if (branchData) {
            setFormData({
                schoolName: branchData.name || '',
                principalName: user.name,
                vicePrincipalName: branchData.vicePrincipalName || '',
                email: branchData.email || '',
                helplineNumber: branchData.helplineNumber || '',
                location: branchData.location || '',
                logoUrl: branchData.logoUrl || '',
                principalPhotoUrl: branchData.principalPhotoUrl || '',
                vicePrincipalPhotoUrl: branchData.vicePrincipalPhotoUrl || '',
                bankAccountNumber: branchData.bankAccountNumber || '',
                bankIfscCode: branchData.bankIfscCode || '',
                bankAccountHolderName: branchData.bankAccountHolderName || '',
                bankBranchName: branchData.bankBranchName || '',
                paymentGatewayPublicKey: branchData.paymentGatewayPublicKey || '',
                paymentGatewaySecretKey: branchData.paymentGatewaySecretKey || '',
                paymentGatewayWebhookSecret: branchData.paymentGatewayWebhookSecret || '',
                enabledFeatures: branchData.enabledFeatures || {},
            });
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setNextSessionDate(branchData.academicSessionStartDate ? new Date(new Date(branchData.academicSessionStartDate).setFullYear(new Date(branchData.academicSessionStartDate).getFullYear() + 1)).toISOString().split('T')[0] : tomorrow.toISOString().split('T')[0]);
        }
        setLoading(false);
    }, [user]);
    
    useEffect(() => {
        if (sessionStorage.getItem(`profileAccessVerified_${user?.id}`)) {
            setIsVerified(true);
        }
    }, [user]);

    useEffect(() => {
        if (isVerified) {
            fetchProfileData();
        }
    }, [isVerified, fetchProfileData]);

    const handleRequestOtp = async () => {
        if (!user) return;
        setVerifying(true);
        setVerificationError('');
        try {
            await principalApiService.requestProfileAccessOtp(user.id);
            setOtpSent(true);
        } catch (error) {
            setVerificationError('Failed to send OTP. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !otp) return;
        setVerifying(true);
        setVerificationError('');
        try {
            const success = await principalApiService.verifyProfileAccessOtp(user.id, otp);
            if (success) {
                sessionStorage.setItem(`profileAccessVerified_${user.id}`, 'true');
                setIsVerified(true);
            } else {
                setVerificationError('Invalid OTP. Please try again.');
            }
        } catch (error) {
            setVerificationError('An error occurred during verification.');
        } finally {
            setVerifying(false);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFeatureToggle = (key: string) => {
        setFormData(prev => ({
            ...prev,
            enabledFeatures: {
                ...prev.enabledFeatures,
                [key]: !prev.enabledFeatures?.[key],
            },
        }));
    };
    
    const handlePhotoUpload = (field: keyof typeof formData, url: string) => {
        setFormData(prev => ({...prev, [field]: url }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    }
    
    const handleVisibilityToggle = (field: keyof typeof visibilities) => {
        setVisibilities(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branch || !principal) return;
        setSaveStatus('saving');
        
        try {
            const branchUpdates: Partial<Branch> = {
                name: formData.schoolName,
                vicePrincipalName: formData.vicePrincipalName,
                email: formData.email,
                helplineNumber: formData.helplineNumber,
                location: formData.location,
                logoUrl: formData.logoUrl,
                principalPhotoUrl: formData.principalPhotoUrl,
                vicePrincipalPhotoUrl: formData.vicePrincipalPhotoUrl,
                bankAccountNumber: formData.bankAccountNumber,
                bankIfscCode: formData.bankIfscCode,
                bankAccountHolderName: formData.bankAccountHolderName,
                bankBranchName: formData.bankBranchName,
                paymentGatewayPublicKey: formData.paymentGatewayPublicKey,
                paymentGatewaySecretKey: formData.paymentGatewaySecretKey,
                paymentGatewayWebhookSecret: formData.paymentGatewayWebhookSecret,
                enabledFeatures: formData.enabledFeatures,
            };
            const userUpdates: Partial<User> = { name: formData.principalName };
            
            await principalApiService.updateBranchDetails(branch.id, branchUpdates);
            await principalApiService.updateUser(principal.id, userUpdates);

            
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!principal) return;
        if (passwordData.new !== passwordData.confirm) {
            setPasswordError("New passwords do not match.");
            return;
        }
        if (passwordData.new.length < 6) {
            setPasswordError("New password must be at least 6 characters long.");
            return;
        }

        setPasswordStatus('saving');
        setPasswordError('');
        try {
            await sharedApiService.changePassword(principal.id, passwordData.current, passwordData.new);
            setPasswordStatus('success');
            setPasswordData({ current: '', new: '', confirm: '' });
            setTimeout(() => setPasswordStatus('idle'), 3000);
        } catch (err: any) {
            setPasswordStatus('error');
            setPasswordError(err.message || "Failed to change password.");
            setTimeout(() => setPasswordStatus('idle'), 3000);
        }
    };
    
    const handleStartNewSession = async () => {
        if (!branch) return;
        setIsStartingSession(true);
        try {
            await principalApiService.startNewAcademicSession(branch.id, nextSessionDate);
            await fetchProfileData();
        } catch (error) {
            console.error(error);
            alert("Failed to start new session.");
        }
        setIsStartingSession(false);
        setShowSessionConfirm(false);
    };

    const SecretInput: React.FC<{
        label: string;
        name: keyof typeof formData;
        value: string;
        isVisible: boolean;
        onToggle: () => void;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    }> = ({ label, name, value, isVisible, onToggle, onChange }) => (
        <div className="relative">
            <Input 
                label={label}
                name={name}
                type={isVisible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                className="pr-10"
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                aria-label={isVisible ? 'Hide' : 'Show'}
            >
                {isVisible ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
        </div>
    );

    if (!isVerified) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-2">Secure Area</h2>
                    <p className="text-text-secondary-dark mb-6">Please verify your identity to access the School Profile.</p>
                    {!otpSent ? (
                        <Button onClick={handleRequestOtp} disabled={verifying} className="w-full">
                            {verifying ? 'Sending...' : 'Send Verification Code'}
                        </Button>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <p className="text-sm text-center">A code has been sent. (Check developer console for demo).</p>
                            <Input
                                label="Verification Code"
                                id="otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                maxLength={6}
                                inputMode="numeric"
                            />
                            {verificationError && <p className="text-red-500 text-sm text-center">{verificationError}</p>}
                            <Button type="submit" className="w-full" disabled={verifying}>
                                {verifying ? 'Verifying...' : 'Verify & Access'}
                            </Button>
                        </form>
                    )}
                </Card>
            </div>
        );
    }
    
    if (loading) return <div>Loading school profile...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-primary-dark">School Profile & Settings</h1>
            
            <form onSubmit={handleProfileSave}>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <h2 className="text-xl font-semibold mb-4">School Identity</h2>
                            <div className="space-y-4">
                                <Input label="School Name" name="schoolName" value={formData.schoolName} onChange={handleFormChange} />
                                <Input label="Location" name="location" value={formData.location} onChange={handleFormChange} />
                                <PhotoUpload label="School Logo" imageUrl={formData.logoUrl} onUpload={(url) => handlePhotoUpload('logoUrl', url)} />
                            </div>
                        </Card>
                        <Card>
                             <h2 className="text-xl font-semibold mb-4">Leadership</h2>
                             <div className="space-y-4">
                                <Input label="Principal's Name" name="principalName" value={formData.principalName} onChange={handleFormChange} />
                                <PhotoUpload label="Principal's Photo" imageUrl={formData.principalPhotoUrl} onUpload={(url) => handlePhotoUpload('principalPhotoUrl', url)} />
                                <Input label="Vice Principal's Name" name="vicePrincipalName" value={formData.vicePrincipalName} onChange={handleFormChange} />
                                <PhotoUpload label="Vice Principal's Photo" imageUrl={formData.vicePrincipalPhotoUrl} onUpload={(url) => handlePhotoUpload('vicePrincipalPhotoUrl', url)} />
                             </div>
                        </Card>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <h2 className="text-xl font-semibold mb-4">Contact & Financials</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Official Email" name="email" type="email" value={formData.email} onChange={handleFormChange} />
                                <Input label="Helpline Number" name="helplineNumber" type="tel" value={formData.helplineNumber} onChange={handleFormChange} />
                                <SecretInput label="Bank Account Number" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleFormChange} isVisible={visibilities.bankAccountNumber} onToggle={() => handleVisibilityToggle('bankAccountNumber')} />
                                <SecretInput label="Bank IFSC Code" name="bankIfscCode" value={formData.bankIfscCode} onChange={handleFormChange} isVisible={visibilities.bankIfscCode} onToggle={() => handleVisibilityToggle('bankIfscCode')} />
                                <Input label="Account Holder Name" name="bankAccountHolderName" value={formData.bankAccountHolderName} onChange={handleFormChange} />
                                <Input label="Bank Branch" name="bankBranchName" value={formData.bankBranchName} onChange={handleFormChange} />
                            </div>
                        </Card>
                         <Card>
                            <h2 className="text-xl font-semibold mb-4">Payment Gateway (Razorpay)</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SecretInput label="Public Key" name="paymentGatewayPublicKey" value={formData.paymentGatewayPublicKey} onChange={handleFormChange} isVisible={visibilities.paymentGatewayPublicKey} onToggle={() => handleVisibilityToggle('paymentGatewayPublicKey')} />
                                <SecretInput label="Secret Key" name="paymentGatewaySecretKey" value={formData.paymentGatewaySecretKey} onChange={handleFormChange} isVisible={visibilities.paymentGatewaySecretKey} onToggle={() => handleVisibilityToggle('paymentGatewaySecretKey')} />
                                <SecretInput label="Webhook Secret" name="paymentGatewayWebhookSecret" value={formData.paymentGatewayWebhookSecret} onChange={handleFormChange} isVisible={visibilities.paymentGatewayWebhookSecret} onToggle={() => handleVisibilityToggle('paymentGatewayWebhookSecret')} />
                            </div>
                            <div className="mt-6 pt-6 border-t">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-md font-semibold text-text-primary-dark">Online Fee Payments</h3>
                                        <p className="text-sm text-text-secondary-dark">Allow students and parents to pay fees online through the portal.</p>
                                    </div>
                                    <label htmlFor="online-payment-toggle" className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                id="online-payment-toggle"
                                                className="sr-only peer"
                                                checked={!!formData.enabledFeatures?.online_payments_enabled}
                                                onChange={() => handleFeatureToggle('online_payments_enabled')}
                                            />
                                            <div className="block bg-slate-300 peer-checked:bg-brand-secondary w-14 h-8 rounded-full"></div>
                                            <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform peer-checked:translate-x-6"></div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={saveStatus === 'saving'}>{saveStatus === 'saving' ? 'Saving...' : 'Save All Changes'}</Button>
                            </div>
                            {saveStatus === 'success' && <p className="text-green-600 text-sm text-right mt-2">Profile updated successfully!</p>}
                            {saveStatus === 'error' && <p className="text-red-500 text-sm text-right mt-2">Failed to save profile.</p>}
                        </Card>
                    </div>
                 </div>
            </form>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <h2 className="text-xl font-semibold mb-4">Change My Password</h2>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <Input label="Current Password" name="current" type="password" value={passwordData.current} onChange={handlePasswordChange} required />
                        <Input label="New Password" name="new" type="password" value={passwordData.new} onChange={handlePasswordChange} required />
                        <Input label="Confirm New Password" name="confirm" type="password" value={passwordData.confirm} onChange={handlePasswordChange} required />
                        {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                        {passwordStatus === 'success' && <p className="text-green-600 text-sm">Password changed successfully!</p>}
                        <div className="text-right">
                             <Button type="submit" disabled={passwordStatus === 'saving'}>{passwordStatus === 'saving' ? 'Changing...' : 'Change Password'}</Button>
                        </div>
                    </form>
                </Card>
                <Card>
                    <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
                     <div className="p-4 border border-red-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-text-primary-dark">Start New Academic Session</h3>
                        <p className="text-sm text-text-secondary-dark mt-1">This is a major, irreversible action. It will archive all current student grades and attendance records. A new academic session will begin, and fee records will be reset for the new year, carrying over any outstanding balances.</p>
                        <div className="flex items-end gap-4 mt-4">
                            <Input 
                                label="Next Session Start Date" 
                                type="date" 
                                value={nextSessionDate} 
                                onChange={e => setNextSessionDate(e.target.value)} 
                            />
                            <Button variant="danger" onClick={() => setShowSessionConfirm(true)}>Start New Session</Button>
                        </div>
                    </div>
                </Card>
            </div>
            {showSessionConfirm && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setShowSessionConfirm(false)}
                    onConfirm={handleStartNewSession}
                    title="Confirm New Academic Session"
                    message="This action CANNOT be undone. All current academic records will be archived. Are you absolutely sure you want to proceed?"
                    confirmText="Yes, Start New Session"
                    isConfirming={isStartingSession}
                />
            )}
        </div>
    );
};