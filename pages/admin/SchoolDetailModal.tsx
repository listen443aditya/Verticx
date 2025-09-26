import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import type { Branch, SchoolDetails, SystemSettings, ErpPayment } from '../../types.ts';
import { adminApiService } from '../../services';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import Input from '../../components/ui/Input.tsx';
import ConfirmationModal from '../../components/ui/ConfirmationModal.tsx';
import { StudentsIcon, TeachersIcon, AcademicsIcon, BusIcon, HostelIcon, InventoryIcon, LibraryIcon } from '../../components/icons/Icons.tsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-100 p-4 rounded-lg text-center">
        <div className="text-brand-secondary mx-auto w-10 h-10 mb-2 flex items-center justify-center">{icon}</div>
        <p className="text-2xl font-bold text-text-primary-dark">{value}</p>
        <p className="text-sm text-text-secondary-dark">{title}</p>
    </div>
);

const CredentialsModal: React.FC<{ title: string; credentials: { id: string, password: string }, userType: string, onClose: () => void }> = ({ title, credentials, userType, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] p-4">
        <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold text-brand-accent mb-2">{title}</h2>
            <p className="text-text-secondary-dark mb-4">Please securely share the following login credentials with the {userType}:</p>
            <div className="space-y-3">
                <div className="bg-slate-100 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-text-secondary-dark">User ID</p>
                    <p className="text-lg font-mono tracking-wider text-text-primary-dark">{credentials.id}</p>
                </div>
                <div className="bg-slate-100 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-text-secondary-dark">New Password</p>
                    <p className="text-lg font-mono tracking-wider text-text-primary-dark">{credentials.password}</p>
                </div>
            </div>
            <div className="mt-6 text-right"><Button onClick={onClose}>Close</Button></div>
        </Card>
    </div>
);

const featureConfig = {
    'Principal Portal': {
        principal_students: 'Student Management',
        principal_faculty: 'Faculty Management',
        principal_classes: 'Class View',
        principal_finance: 'Financial Overview',
        principal_attendance: 'Attendance Overview',
        principal_results: 'Examination Results',
        principal_staff_requests: 'Staff Requests',
        principal_grievances: 'Grievance Log',
        principal_complaints: 'Raise Complaint',
        principal_events: 'Event Management',
        principal_communication: 'Communication',
        principal_reports: 'Reports',
        principal_profile: 'School Profile',
    },
    'Registrar Portal': {
        registrar_admissions: 'Admissions',
        registrar_academic_requests: 'Academic Requests',
        registrar_students: 'Student Information System',
        registrar_faculty: 'Faculty Information System',
        registrar_classes: 'Class Management',
        registrar_fees: 'Fees & Finance',
        registrar_attendance: 'Attendance Monitoring',
        registrar_timetable: 'Timetable Management',
        registrar_library: 'Library',
        registrar_hostel: 'Hostel',
        registrar_transport: 'Transport',
        registrar_inventory: 'Inventory',
        registrar_documents: 'Documents',
        registrar_events: 'Events',
        registrar_reports: 'Reports',
        registrar_communication: 'Communication',
        registrar_bulk_movement: 'Bulk Student Movement'
    },
    'Teacher Portal': {
        teacher_attendance: 'Attendance Management',
        teacher_gradebook: 'Gradebook',
        teacher_quizzes: 'Quizzes',
        teacher_syllabus: 'Syllabus Planning',
        teacher_content: 'Course Content Upload'
    },
    'Student Portal': {
        student_syllabus: 'Syllabus View',
        student_content: 'Course Content View',
        student_assignments: 'Assignments & Homework',
        student_grades: 'My Grades',
        student_attendance: 'My Attendance',
        student_feedback: 'Teacher Feedback',
        student_complaints: 'View Raised Complaints'
    },
    'Parent Portal': {
        parent_academics: "Child's Academics",
        parent_fees: 'Fee Payments',
        parent_complaints: 'View Raised Complaints',
        parent_contact_teacher: 'Contact Teacher'
    },
    'Financial Features': {
        online_payments_enabled: 'Online Fee Payments',
        erp_billing_enabled: 'ERP Bill Payments (Principal)',
    },
};

const FeatureManagement: React.FC<{ initialFeatures: Record<string, boolean>, globalFeatures: Record<string, boolean>, onSave: (newFeatures: Record<string, boolean>) => Promise<void> }> = ({ initialFeatures, globalFeatures, onSave }) => {
    const [features, setFeatures] = useState(initialFeatures);
    const [isSaving, setIsSaving] = useState(false);

    const handleFeatureChange = (key: string) => {
        setFeatures(prev => ({...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(features);
        setIsSaving(false);
    };

    return (
        <div className="space-y-4">
            {Object.entries(featureConfig).map(([portalName, portalFeatures]) => (
                <div key={portalName}>
                    <h4 className="text-md font-semibold text-text-secondary-dark border-b pb-2 mb-2">{portalName}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(portalFeatures).map(([key, label]) => {
                            const isGloballyEnabled = globalFeatures[key] !== false;
                            return (
                                <div key={key} title={!isGloballyEnabled ? 'This feature has been disabled system-wide by the Super Admin and cannot be changed here.' : ''}>
                                    <label className={`flex items-center space-x-2 p-2 rounded ${isGloballyEnabled ? 'hover:bg-slate-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                                        <input type="checkbox" checked={!!(features[key] && isGloballyEnabled)} disabled={!isGloballyEnabled} onChange={() => handleFeatureChange(key)} className="h-4 w-4 rounded border-gray-300 text-brand-secondary focus:ring-brand-accent"/>
                                        <span className={`text-sm ${!isGloballyEnabled ? 'text-slate-400 line-through' : ''}`}>{label}</span>
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
            <div className="text-right mt-4 pt-4 border-t">
                <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Feature Settings'}</Button>
            </div>
        </div>
    );
};


const SchoolDetailModal: React.FC<{ branch: Branch; onClose: () => void }> = ({ branch, onClose }) => {
    const { user } = useAuth();
    const [details, setDetails] = useState<SchoolDetails | null>(null);
    const [globalSettings, setGlobalSettings] = useState<SystemSettings | null>(null);
    const [lastPayment, setLastPayment] = useState<ErpPayment | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<ErpPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'performance' | 'financials' | 'assets' | 'features' | 'erp_payments'>('details');
    const [selectedClassId, setSelectedClassId] = useState('overall');

    const [confirmReset, setConfirmReset] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [newPasswordInfo, setNewPasswordInfo] = useState<{ id: string, password: string } | null>(null);
    const [erpPrice, setErpPrice] = useState<string>('0');
    const [erpConcessionPercentage, setErpConcessionPercentage] = useState<string>('0');
    const [isSavingPrice, setIsSavingPrice] = useState(false);
    const [billingCycle, setBillingCycle] = useState<Branch['billingCycle']>('monthly');
    const [displayDueDate, setDisplayDueDate] = useState('');

    const fetchDetails = useCallback(async () => {
        setLoading(true);
        const [data, settingsData, allPayments] = await Promise.all([
            adminApiService.getSchoolDetails(branch.id),
            adminApiService.getSystemSettings(),
            adminApiService.getErpPayments(),
        ]);
        setDetails(data);
        setGlobalSettings(settingsData);
        
        const branchPayments = allPayments.filter(p => p.branchId === branch.id)
            .sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
        setPaymentHistory(branchPayments);
        if (branchPayments.length > 0) {
            setLastPayment(branchPayments[0]);
        }

        setErpPrice(data?.branch.erpPricePerStudent?.toString() || settingsData.defaultErpPrice.toString() || '0');
        setErpConcessionPercentage(data?.branch.erpConcessionPercentage?.toString() || '0');
        setBillingCycle(data?.branch.billingCycle || 'monthly');
        setLoading(false);
    }, [branch.id]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleResetPassword = async () => {
        if (!details?.principal) return;
        setIsResetting(true);
        try {
            const { newPassword } = await adminApiService.resetUserPassword(details.principal.id);
            setNewPasswordInfo({ id: details.principal.id, password: newPassword });
        } catch (error) {
            console.error("Failed to reset password", error);
            alert("Could not reset password.");
        } finally {
            setIsResetting(false);
            setConfirmReset(false);
        }
    };

    const calculateNextDueDate = (cycle: Branch['billingCycle']): string => {
        const today = new Date();
        const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-11
        let dueDate: Date;
    
        switch (cycle) {
            case 'monthly':
                dueDate = new Date(currentYear, currentMonth + 1, 10);
                break;
                
            case 'quarterly':
                const currentQuarter = Math.floor(currentMonth / 3);
                const nextQuarterStartMonth = (currentQuarter + 1) * 3;
                dueDate = new Date(currentYear, nextQuarterStartMonth, 10);
                break;
    
            case 'half_yearly':
                const july10 = new Date(currentYear, 6, 10); // Month 6 is July
                if (todayAtMidnight < july10) {
                    dueDate = july10;
                } else {
                    dueDate = new Date(currentYear + 1, 0, 10);
                }
                break;
    
            case 'yearly':
                let dueYear = currentYear;
                const thisYearsDueDate = new Date(currentYear, 0, 10);
                if (todayAtMidnight >= thisYearsDueDate) {
                    dueYear++;
                }
                dueDate = new Date(dueYear, 0, 10);
                break;
        }
    
        const y = dueDate.getFullYear();
        const m = String(dueDate.getMonth() + 1).padStart(2, '0');
        const d = String(dueDate.getDate()).padStart(2, '0');
        
        return `${y}-${m}-${d}`;
    };

    useEffect(() => {
        if (billingCycle) {
            const dueDateString = calculateNextDueDate(billingCycle);
            const [year, month, day] = dueDateString.split('-').map(Number);
            const formattedDate = new Date(year, month - 1, day).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            setDisplayDueDate(formattedDate);
        }
    }, [billingCycle]);


    const handleSaveBillingConfig = async () => {
        if (!details) return;
        setIsSavingPrice(true);
        const nextDueDate = calculateNextDueDate(billingCycle);
        await adminApiService.updateBranchDetails(details.branch.id, { 
            erpPricePerStudent: Number(erpPrice),
            erpConcessionPercentage: Number(erpConcessionPercentage),
            billingCycle: billingCycle,
            nextDueDate: nextDueDate
        });
        await fetchDetails();
        setIsSavingPrice(false);
    };
    
    const handleSaveFeatures = async (newFeatures: Record<string, boolean>) => {
         if (!details) return;
         await adminApiService.updateBranchDetails(details.branch.id, { enabledFeatures: newFeatures });
         await fetchDetails();
    };
    
    const tabButtonClasses = (isActive: boolean) => 
        `px-4 py-2 text-sm font-medium focus:outline-none transition-colors ${
        isActive ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-slate-500 hover:text-slate-700'
        }`;
    
    const estimatedBill = useMemo(() => {
        const price = Number(erpPrice) || 0;
        const students = details?.students.length || 0;
        const concession = Number(erpConcessionPercentage) || 0;
        const discountFactor = 1 - (concession / 100);
        const monthlyBill = price * students * discountFactor;
        switch (billingCycle) {
            case 'quarterly':
                return monthlyBill * 3;
            case 'half_yearly':
                return monthlyBill * 6;
            case 'yearly':
                return monthlyBill * 12;
            default:
                return monthlyBill;
        }
    }, [erpPrice, erpConcessionPercentage, details, billingCycle]);

    const renderContent = () => {
        if (loading || !details || !globalSettings) {
            return <div className="flex items-center justify-center h-full"><p>Loading details...</p></div>;
        }

        switch (activeTab) {
            case 'details':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                            <Card>
                                <h3 className="text-lg font-semibold mb-3">Principal Details</h3>
                                <div className="flex items-center gap-4">
                                    <img src={details.branch.principalPhotoUrl || 'https://via.placeholder.com/80'} alt="Principal" className="w-20 h-20 rounded-full object-cover bg-slate-200" />
                                    <div>
                                        <p className="font-bold text-text-primary-dark">{details.principal?.name}</p>
                                        <p className="text-sm text-text-secondary-dark">{details.principal?.email}</p>
                                        <Button variant="danger" className="!px-2 !py-1 text-xs mt-2" onClick={() => setConfirmReset(true)}>Reset Password</Button>
                                    </div>
                                </div>
                            </Card>
                             <Card>
                                <h3 className="text-lg font-semibold mb-3">Key Statistics</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <StatCard title="Students" value={details.students.length.toString()} icon={<StudentsIcon className="w-8 h-8"/>} />
                                    <StatCard title="Teachers" value={details.teachers.length.toString()} icon={<TeachersIcon className="w-8 h-8"/>} />
                                    <StatCard title="Classes" value={details.classes.length.toString()} icon={<AcademicsIcon className="w-8 h-8"/>} />
                                </div>
                            </Card>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                             <Card>
                                <h3 className="text-lg font-semibold mb-3">Contact & Account Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-medium text-text-secondary-dark">Principal Contact</p>
                                        <p>{details.principal?.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-text-secondary-dark">Helpline Number</p>
                                        <p>{details.branch.helplineNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-text-secondary-dark">Vice Principal</p>
                                        <p>{details.branch.vicePrincipalName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-text-secondary-dark">Account Holder</p>
                                        <p>{details.branch.bankAccountHolderName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-text-secondary-dark">Account Number</p>
                                        <p className="font-mono">{details.branch.bankAccountNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-text-secondary-dark">IFSC Code</p>
                                        <p className="font-mono">{details.branch.bankIfscCode || 'N/A'}</p>
                                    </div>
                                </div>
                            </Card>
                             {user?.role === 'SuperAdmin' && (
                                <Card>
                                    <h3 className="text-lg font-semibold mb-3">ERP Billing Configuration</h3>
                                    <div className={`grid grid-cols-1 md:grid-cols-2 ${user?.role === 'SuperAdmin' ? 'lg:grid-cols-3' : ''} gap-4 items-end`}>
                                        <Input label="Price Per Student" type="number" value={erpPrice} onChange={(e) => setErpPrice(e.target.value)} />
                                        {user?.role === 'SuperAdmin' && (
                                            <Input
                                                label="Concession (%)"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={erpConcessionPercentage}
                                                onChange={(e) => setErpConcessionPercentage(e.target.value)}
                                            />
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary-dark mb-1">Billing Cycle</label>
                                            <select
                                                value={billingCycle}
                                                onChange={e => setBillingCycle(e.target.value as Branch['billingCycle'])}
                                                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                                            >
                                                <option value="monthly">Monthly</option>
                                                <option value="quarterly">Quarterly</option>
                                                <option value="half_yearly">Half Yearly</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                                        <div className="bg-slate-50 p-3 rounded-lg">
                                            <p className="text-sm text-text-secondary-dark">Last Payment</p>
                                            <p className="text-lg font-bold">{
                                                lastPayment ? (() => {
                                                    const [year, month, day] = lastPayment.paymentDate.split('-').map(Number);
                                                    return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                })() : 'N/A'
                                            }</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg">
                                            <p className="text-sm text-text-secondary-dark">Estimated Bill</p>
                                            <p className="text-xl font-bold">{estimatedBill.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                        <p className="text-sm text-text-secondary-dark">Next due date will be: <strong>{displayDueDate}</strong></p>
                                        <Button onClick={handleSaveBillingConfig} disabled={isSavingPrice}>{isSavingPrice ? 'Saving...' : 'Save Config'}</Button>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                );
            case 'performance':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <h3 className="text-lg font-semibold mb-3">Class Performance (Avg. Score)</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={details.classPerformance}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                                    <Tooltip />
                                    <Bar dataKey="performance" fill="#4F46E5" name="Avg. Performance"/>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                        <Card>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold">Subject Performance</h3>
                                <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="bg-surface-dark border border-slate-300 rounded-md py-1 px-2 text-sm">
                                    <option value="overall">Overall School</option>
                                    {details.classes.map(c => <option key={c.id} value={c.id}>Grade {c.gradeLevel}-{c.section}</option>)}
                                </select>
                            </div>
                             <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={details.subjectPerformanceByClass?.[selectedClassId] || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="subjectName" />
                                    <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                                    <Tooltip />
                                    <Bar dataKey="averageScore" fill="#8B5CF6" name="Avg. Score"/>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                         <Card className="lg:col-span-1">
                            <h3 className="text-lg font-semibold mb-3">Top 5 Teacher Performance Index</h3>
                            <table className="w-full text-left text-sm">
                                <thead><tr className="border-b"><th className="p-2">Teacher</th><th className="p-2 text-right">Performance Index</th></tr></thead>
                                <tbody>
                                    {details.teacherPerformance?.map(t => (
                                        <tr key={t.teacherId} className="border-b last:border-0 hover:bg-slate-50"><td className="p-2 font-medium">{t.teacherName}</td><td className="p-2 text-right font-semibold text-brand-secondary">{t.performanceIndex.toFixed(1)} / 100</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                         <Card className="lg:col-span-1">
                            <h3 className="text-lg font-semibold mb-3">Top 5 Students</h3>
                            <div className="space-y-2">
                                {details.topStudents?.map((student) => (
                                    <div key={student.studentId} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                        <div className="flex items-center">
                                            <span className={`font-bold text-lg w-8 text-center text-brand-accent`}>#{student.rank}</span>
                                            <div>
                                                <p className="font-semibold text-text-primary-dark">{student.studentName}</p>
                                                <p className="text-xs text-text-secondary-dark">{student.className}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                );
            case 'financials':
                 return (
                    <Card>
                        <h3 className="text-lg font-semibold mb-3">Class & Fee Details</h3>
                        <div className="overflow-auto max-h-[75vh]">
                            <table className="w-full text-left text-sm">
                                <thead className="sticky top-0 bg-surface-dark/90 backdrop-blur-sm">
                                    <tr className="border-b"><th className="p-2">Class</th><th className="p-2 text-center">Students</th><th className="p-2 text-right">Total Fees</th><th className="p-2 text-right">Pending Fees</th><th className="p-2 text-center">Defaulters</th></tr>
                                </thead>
                                <tbody>
                                    {details.classFeeDetails.map(c => (
                                        <tr key={c.className} className="border-b last:border-0 hover:bg-slate-50"><td className="p-2 font-medium">{c.className}</td><td className="p-2 text-center">{c.studentCount}</td><td className="p-2 text-right">{c.totalFees.toLocaleString()}</td><td className="p-2 text-right font-semibold text-red-500">{c.pendingFees.toLocaleString()}</td><td className="p-2 text-center font-semibold text-red-500">{c.defaulters}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                );
             case 'assets':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                             <h3 className="text-lg font-semibold mb-3">Infrastructure Summary</h3>
                             <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-baseline"><span className="font-medium flex items-center gap-2"><BusIcon /> Transport</span> <span>{details.infrastructureSummary?.transportOccupancy}/{details.infrastructureSummary?.transportCapacity}</span></div>
                                    <div className="w-full bg-slate-200 rounded-full h-2.5"><div className="bg-brand-secondary h-2.5 rounded-full" style={{width: `${(details.infrastructureSummary?.transportOccupancy || 0) / (details.infrastructureSummary?.transportCapacity || 1) * 100}%`}}></div></div>
                                </div>
                                <div>
                                     <div className="flex justify-between items-baseline"><span className="font-medium flex items-center gap-2"><HostelIcon /> Hostel</span> <span>{details.infrastructureSummary?.hostelOccupancy}/{details.infrastructureSummary?.hostelCapacity}</span></div>
                                    <div className="w-full bg-slate-200 rounded-full h-2.5"><div className="bg-brand-primary h-2.5 rounded-full" style={{width: `${(details.infrastructureSummary?.hostelOccupancy || 0) / (details.infrastructureSummary?.hostelCapacity || 1) * 100}%`}}></div></div>
                                </div>
                             </div>
                        </Card>
                        <Card>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><InventoryIcon /> Inventory Summary</h3>
                            <div className="flex justify-around text-center">
                                <div><p className="text-3xl font-bold">{details.inventorySummary?.totalItems.toLocaleString()}</p><p>Total Unique Items</p></div>
                                <div><p className="text-3xl font-bold">{details.inventorySummary?.totalQuantity.toLocaleString()}</p><p>Total Quantity</p></div>
                            </div>
                        </Card>
                        <Card>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><LibraryIcon /> Library Summary</h3>
                            <div className="text-center">
                                <p className="text-4xl font-bold">{details.infrastructureSummary?.totalLibraryBooks.toLocaleString()}</p>
                                <p>Total Books</p>
                            </div>
                        </Card>
                    </div>
                );
            case 'features':
                return <FeatureManagement initialFeatures={details.branch.enabledFeatures || {}} globalFeatures={globalSettings.globalFeatureToggles} onSave={handleSaveFeatures}/>;
            case 'erp_payments':
                return (
                    <Card>
                        <h3 className="text-lg font-semibold mb-3">ERP Payment History</h3>
                        {paymentHistory.length === 0 ? (
                            <p className="text-center p-8 text-text-secondary-dark">No payment history found for this school.</p>
                        ) : (
                            <div className="overflow-auto max-h-[75vh]">
                                <table className="w-full text-left text-sm">
                                    <thead className="sticky top-0 bg-surface-dark/90 backdrop-blur-sm">
                                        <tr className="border-b">
                                            <th className="p-2">Payment Date</th>
                                            <th className="p-2">Transaction ID</th>
                                            <th className="p-2 text-right">Amount Paid</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentHistory.map(payment => (
                                            <tr key={payment.id} className="border-b last:border-0 hover:bg-slate-50">
                                                <td className="p-2 font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                                <td className="p-2 font-mono text-xs">{payment.transactionId}</td>
                                                <td className="p-2 text-right font-semibold text-green-600">{payment.amount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <Card className="w-full max-w-6xl h-[95vh] flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="font-mono text-sm text-text-secondary-dark bg-slate-100 px-2 py-1 rounded inline-block">{branch.registrationId || 'N/A'}</p>
                        <h2 className="text-3xl font-bold text-text-primary-dark mt-1">{branch.name}</h2>
                        <p className="text-text-secondary-dark">{branch.location}</p>
                    </div>
                    <button onClick={onClose} className="text-3xl font-light text-slate-500 hover:text-slate-800 leading-none">&times;</button>
                </div>
                
                <div className="border-b border-slate-200 mb-4">
                    <button className={tabButtonClasses(activeTab === 'details')} onClick={() => setActiveTab('details')}>Details</button>
                    <button className={tabButtonClasses(activeTab === 'performance')} onClick={() => setActiveTab('performance')}>Performance</button>
                    <button className={tabButtonClasses(activeTab === 'financials')} onClick={() => setActiveTab('financials')}>Financials</button>
                    <button className={tabButtonClasses(activeTab === 'assets')} onClick={() => setActiveTab('assets')}>Assets</button>
                    <button className={tabButtonClasses(activeTab === 'features')} onClick={() => setActiveTab('features')}>Features</button>
                    <button className={tabButtonClasses(activeTab === 'erp_payments')} onClick={() => setActiveTab('erp_payments')}>ERP Payments</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    {renderContent()}
                </div>
                {confirmReset && details?.principal && (
                    <ConfirmationModal isOpen={true} onClose={() => setConfirmReset(false)} onConfirm={handleResetPassword} title="Confirm Principal Password Reset" message={<>Are you sure you want to reset the password for <strong>{details.principal.name}</strong>? A new temporary password will be generated.</>} confirmText="Reset" confirmVariant="danger" isConfirming={isResetting}/>
                )}
                {newPasswordInfo && (
                    <CredentialsModal title="Password Reset Successful" userType="principal" credentials={newPasswordInfo} onClose={() => setNewPasswordInfo(null)}/>
                )}
            </Card>
        </div>
    );
};

export default SchoolDetailModal;