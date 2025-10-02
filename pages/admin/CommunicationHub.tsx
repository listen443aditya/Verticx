import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { AdminApiService } from '../../services';
// FIX: Added CommunicationTarget to imports
import type { UserRole, Branch, AdminSms, AdminEmail, AdminNotification, CommunicationTarget } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import Input from '../../components/ui/Input.tsx';
import { XIcon } from '../../components/icons/Icons.tsx';
const adminApiService = new AdminApiService();

const CommunicationHub: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'sms' | 'email' | 'notification'>('sms');
    const [historyTab, setHistoryTab] = useState<'sms' | 'email' | 'notification'>('sms');
    const [branches, setBranches] = useState<Branch[]>([]);
    const [history, setHistory] = useState<{ sms: AdminSms[], email: AdminEmail[], notification: AdminNotification[] }>({ sms: [], email: [], notification: [] });
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // Form state
    const [selectionMode, setSelectionMode] = useState<'all' | 'specific'>('all');
    const [selectedBranches, setSelectedBranches] = useState<Branch[]>([]);
    const [schoolSearchTerm, setSchoolSearchTerm] = useState('');
    const [targetRole, setTargetRole] = useState<UserRole | 'all'>('all');
    const [smsMessage, setSmsMessage] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    
    const ROLES: UserRole[] = ['Principal', 'Registrar', 'Teacher', 'Student', 'Parent'];
    const MAX_SMS_CHARS = 160;

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [branchesData, historyData] = await Promise.all([
            adminApiService.getBranches('active'),
            adminApiService.getAdminCommunicationHistory()
        ]);
        setBranches(branchesData);
        setHistory(historyData);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const schoolSearchResults = useMemo(() => {
        if (schoolSearchTerm.length < 2) return [];
        const lowercasedQuery = schoolSearchTerm.toLowerCase();
        const selectedIds = new Set(selectedBranches.map(b => b.id));
        return branches.filter(branch => 
            !selectedIds.has(branch.id) &&
            (branch.name.toLowerCase().includes(lowercasedQuery) ||
            branch.location.toLowerCase().includes(lowercasedQuery))
        ).slice(0, 5);
    }, [schoolSearchTerm, branches, selectedBranches]);
    
    const handleSelectBranch = (branch: Branch) => {
        setSelectedBranches(prev => [...prev, branch]);
        setSchoolSearchTerm('');
    };

    const handleRemoveBranch = (branchId: string) => {
        setSelectedBranches(prev => prev.filter(b => b.id !== branchId));
    };


    const handleSend = async () => {
        if (!user) return;

        const isTargetValid = selectionMode === 'all' || (selectionMode === 'specific' && selectedBranches.length > 0);
        if (!isTargetValid) {
            setStatusMessage('Please select at least one school.');
            setTimeout(() => setStatusMessage(''), 3000);
            return;
        }

        setIsSending(true);
        setStatusMessage('');

        // FIX: Explicitly type the target object to match the CommunicationTarget interface.
        const target: CommunicationTarget = {
            branchId: selectionMode === 'all' ? 'all' : selectedBranches.map(b => b.id),
            role: targetRole,
        };

        let success = false;

        try {
            if (activeTab === 'sms' && smsMessage) {
                await adminApiService.sendBulkSms(target, smsMessage, user.name);
                success = true;
            } else if (activeTab === 'email' && emailSubject && emailBody) {
                await adminApiService.sendBulkEmail(target, emailSubject, emailBody, user.name);
                success = true;
            } else if (activeTab === 'notification' && notificationTitle && notificationMessage) {
                await adminApiService.sendBulkNotification(target, notificationTitle, notificationMessage, user.name);
                success = true;
            }
            
            if (success) {
                setStatusMessage('Message sent successfully!');
                // Reset form
                setSmsMessage('');
                setEmailSubject('');
                setEmailBody('');
                setNotificationTitle('');
                setNotificationMessage('');
                setSelectedBranches([]);
                fetchData(); // Refresh history
            } else {
                 setStatusMessage('Message content cannot be empty.');
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            setStatusMessage('An error occurred. Please try again.');
        }

        setIsSending(false);
        setTimeout(() => setStatusMessage(''), 5000);
    };
    
    const getTargetDescription = (target: { branchId: 'all' | string[], role: string }) => {
        let branchName;
        if (target.branchId === 'all') {
            branchName = 'All Schools';
        } else if (Array.isArray(target.branchId)) {
            if (target.branchId.length > 2) {
                branchName = `${target.branchId.length} Selected Schools`;
            } else {
                branchName = target.branchId.map(id => branches.find(b => b.id === id)?.name || 'Unknown').join(', ');
            }
        } else {
            // Fallback for old data structure if any
            branchName = branches.find(b => b.id === target.branchId)?.name || 'Unknown School';
        }
        
        const roleName = target.role === 'all' ? 'All Roles' : target.role;
        return `${roleName} at ${branchName}`;
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Communication Hub</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Compose Message</h2>
                    <div className="flex border-b mb-4">
                        <button onClick={() => setActiveTab('sms')} className={`flex-1 py-2 ${activeTab === 'sms' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-slate-500'}`}>SMS</button>
                        <button onClick={() => setActiveTab('email')} className={`flex-1 py-2 ${activeTab === 'email' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-slate-500'}`}>Email</button>
                        <button onClick={() => setActiveTab('notification')} className={`flex-1 py-2 ${activeTab === 'notification' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-slate-500'}`}>Notification</button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">To:</label>
                            <div className="flex items-center gap-4 mt-1">
                                <label className="flex items-center"><input type="radio" name="selectionMode" value="all" checked={selectionMode === 'all'} onChange={() => setSelectionMode('all')} className="mr-1"/> All Schools</label>
                                <label className="flex items-center"><input type="radio" name="selectionMode" value="specific" checked={selectionMode === 'specific'} onChange={() => setSelectionMode('specific')} className="mr-1"/> Specific Schools</label>
                            </div>
                        </div>

                        {selectionMode === 'specific' && (
                            <div className="relative">
                                <Input 
                                    label="Search & Select Schools"
                                    value={schoolSearchTerm}
                                    onChange={e => setSchoolSearchTerm(e.target.value)}
                                    placeholder="Type to search..."
                                    autoComplete="off"
                                />
                                {schoolSearchResults.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                                        {schoolSearchResults.map(branch => (
                                            <li key={branch.id} onClick={() => handleSelectBranch(branch)} className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm">
                                                {branch.name} <span className="text-xs text-slate-500">({branch.location})</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {selectedBranches.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2 p-2 border rounded-md">
                                        {selectedBranches.map(branch => (
                                            <span key={branch.id} className="bg-brand-primary text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                                                {branch.name}
                                                <button type="button" onClick={() => handleRemoveBranch(branch.id)} className="ml-2 text-white hover:text-brand-accent">
                                                    <XIcon className="w-3 h-3"/>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div>
                            <label className="text-sm font-medium">To Role:</label>
                            <select value={targetRole} onChange={e => setTargetRole(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 mt-1">
                                <option value="all">All Roles</option>
                                {ROLES.map(r => <option key={r} value={r}>{r}s</option>)}
                            </select>
                        </div>

                        {activeTab === 'sms' && (
                            <div>
                                <textarea value={smsMessage} onChange={e => setSmsMessage(e.target.value)} maxLength={MAX_SMS_CHARS} rows={5} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3" placeholder="SMS message..."/>
                                <p className="text-right text-xs text-slate-500">{smsMessage.length} / {MAX_SMS_CHARS}</p>
                            </div>
                        )}
                        {activeTab === 'email' && (
                            <div className="space-y-4">
                                <Input label="Subject" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
                                <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={8} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3" placeholder="Email body..."/>
                            </div>
                        )}
                        {activeTab === 'notification' && (
                            <div className="space-y-4">
                                <Input label="Notification Title" value={notificationTitle} onChange={e => setNotificationTitle(e.target.value)} />
                                <textarea value={notificationMessage} onChange={e => setNotificationMessage(e.target.value)} rows={5} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3" placeholder="Notification message..."/>
                            </div>
                        )}
                        
                        {statusMessage && <p className="text-sm text-center text-green-600">{statusMessage}</p>}
                        <Button onClick={handleSend} disabled={isSending} className="w-full">{isSending ? 'Sending...' : 'Send Message'}</Button>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Communication History</h2>
                    <div className="flex border-b mb-4">
                         <button onClick={() => setHistoryTab('sms')} className={`flex-1 py-2 ${historyTab === 'sms' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-slate-500'}`}>SMS</button>
                        <button onClick={() => setHistoryTab('email')} className={`flex-1 py-2 ${historyTab === 'email' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-slate-500'}`}>Email</button>
                        <button onClick={() => setHistoryTab('notification')} className={`flex-1 py-2 ${historyTab === 'notification' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-slate-500'}`}>Notification</button>
                    </div>
                     <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {loading ? <p>Loading history...</p> : (
                            historyTab === 'sms' ? history.sms.map(item => (
                                <div key={item.id} className="bg-slate-50 p-3 rounded-lg text-sm">
                                    <p className="font-semibold">To: {getTargetDescription(item.target)}</p>
                                    <p className="text-xs text-slate-500">{new Date(item.sentAt).toLocaleString()}</p>
                                    <p className="mt-2 whitespace-pre-wrap">{item.message}</p>
                                </div>
                            )) :
                            historyTab === 'email' ? history.email.map(item => (
                                <div key={item.id} className="bg-slate-50 p-3 rounded-lg text-sm">
                                    <p className="font-semibold">To: {getTargetDescription(item.target)}</p>
                                     <p className="text-xs text-slate-500">{new Date(item.sentAt).toLocaleString()}</p>
                                    <p className="mt-2 font-bold">{item.subject}</p>
                                    <p className="mt-1 whitespace-pre-wrap">{item.body}</p>
                                </div>
                            )) :
                            history.notification.map(item => (
                                <div key={item.id} className="bg-slate-50 p-3 rounded-lg text-sm">
                                     <p className="font-semibold">To: {getTargetDescription(item.target)}</p>
                                     <p className="text-xs text-slate-500">{new Date(item.sentAt).toLocaleString()}</p>
                                    <p className="mt-2 font-bold">{item.title}</p>
                                    <p className="mt-1 whitespace-pre-wrap">{item.message}</p>
                                </div>
                            ))
                        )}
                        {!loading && history[historyTab].length === 0 && <p className="text-center text-slate-500 p-8">No {historyTab} history found.</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
};
export default CommunicationHub;
