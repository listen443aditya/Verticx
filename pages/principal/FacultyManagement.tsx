import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { principalApiService, sharedApiService } from '../../services';
import type { Teacher, FacultyApplication, TeacherProfile, Branch, User, UserRole } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import Input from '../../components/ui/Input.tsx';
import ConfirmationModal from '../../components/ui/ConfirmationModal.tsx';
import FacultyDetailModal from '../../components/modals/FacultyDetailModal.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';

type StaffMember = User & Partial<Teacher>;

// Modal to approve a faculty application, which requires setting a salary
const ApproveApplicationModal: React.FC<{ application: FacultyApplication; onClose: () => void; onConfirm: (salary: number) => void; isConfirming: boolean }> = ({ application, onClose, onConfirm, isConfirming }) => {
    const [salary, setSalary] = useState('');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
                <h2 className="text-xl font-bold mb-2">Approve Faculty Application</h2>
                <p className="text-text-secondary-dark mb-4">You are approving <strong>{application.name}</strong>. Please set their monthly salary to complete the process.</p>
                <Input
                    label="Monthly Salary"
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g., 50000"
                    required
                />
                <div className="flex justify-end gap-4 pt-6">
                    <Button variant="secondary" onClick={onClose} disabled={isConfirming}>Cancel</Button>
                    <Button onClick={() => onConfirm(Number(salary))} disabled={isConfirming || !salary}>
                        {isConfirming ? 'Approving...' : 'Approve & Create Account'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

// Modal to add a new staff member (Registrar or Librarian)
const AddStaffModal: React.FC<{ branchId: string; onClose: () => void; onSave: (credentials: { id: string, password: string }) => void }> = ({ branchId, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<'Registrar' | 'Librarian'>('Registrar');
    const [salary, setSalary] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const result = await principalApiService.createStaffMember(branchId, { name, email, phone, role, salary: Number(salary) });
            onSave(result.credentials);
        } catch (error) {
            console.error("Failed to create staff member:", error);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Add New Staff Member</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                    <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <Input label="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
                    <Input label="Monthly Salary" type="number" value={salary} onChange={e => setSalary(e.target.value)} required />
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Role</label>
                        <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3">
                            <option value="Registrar">Registrar</option>
                            <option value="Librarian">Librarian</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create Staff Account'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

// Credentials Modal for when a new user is created
const CredentialsModal: React.FC<{ credentials: { id: string, password: string }, onClose: () => void }> = ({ credentials, onClose }) => (
     <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold text-brand-accent mb-2">Account Created Successfully!</h2>
            <p className="text-text-secondary-dark mb-4">The staff account has been created. An SMS with these credentials has been sent to their registered phone number.</p>
            <div className="space-y-3">
                <div className="bg-slate-100 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-text-secondary-dark">User ID</p>
                    <p className="text-lg font-mono tracking-wider text-text-primary-dark">{credentials.id}</p>
                </div>
                <div className="bg-slate-100 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-text-secondary-dark">Temporary Password</p>
                    <p className="text-lg font-mono tracking-wider text-text-primary-dark">{credentials.password}</p>
                </div>
            </div>
            <div className="mt-6 text-right"><Button onClick={onClose}>Close</Button></div>
        </Card>
    </div>
);


const FacultyManagement: React.FC = () => {
    const { user } = useAuth();
    const { refreshKey, triggerRefresh } = useDataRefresh();
    const [applications, setApplications] = useState<FacultyApplication[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [approvingApp, setApprovingApp] = useState<FacultyApplication | null>(null);
    const [suspendingStaff, setSuspendingStaff] = useState<StaffMember | null>(null);
    const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
    const [viewingProfile, setViewingProfile] = useState<TeacherProfile | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [newCredentials, setNewCredentials] = useState<{ id: string, password: string } | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user?.branchId) return;
        setLoading(true);
        const [apps, staffData] = await Promise.all([
            principalApiService.getFacultyApplicationsByBranch(user.branchId),
            principalApiService.getStaffByBranch(user.branchId),
        ]);
        setApplications(apps);
        setStaff(staffData);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);

    const handleApprove = async (salary: number) => {
        if (!approvingApp || !user) return;
        setIsActionLoading(true);
        try {
            const { credentials } = await principalApiService.approveFacultyApplication(approvingApp.id, salary, user.id);
            setNewCredentials(credentials);
            setApprovingApp(null);
            triggerRefresh();
        } catch (error) {
            console.error("Failed to approve application:", error);
        } finally {
            setIsActionLoading(false);
        }
    };
    
    const handleStaffSave = (credentials: { id: string, password: string }) => {
        setIsAddModalOpen(false);
        setNewCredentials(credentials);
        triggerRefresh();
    };

    const handleReject = async (applicationId: string) => {
        if (!user) return;
        setIsActionLoading(true);
        await principalApiService.rejectFacultyApplication(applicationId, user.id);
        triggerRefresh();
        setIsActionLoading(false);
    };

    const handleToggleSuspension = async () => {
        if (!suspendingStaff) return;
        setIsActionLoading(true);
        if (suspendingStaff.status === 'active') {
            await principalApiService.suspendStaff(suspendingStaff.id);
        } else {
            await principalApiService.reinstateStaff(suspendingStaff.id);
        }
        setSuspendingStaff(null);
        triggerRefresh();
        setIsActionLoading(false);
    };

    const handleDelete = async () => {
        if (!deletingStaff) return;
        setIsActionLoading(true);
        await principalApiService.deleteStaff(deletingStaff.id);
        setDeletingStaff(null);
        triggerRefresh();
        setIsActionLoading(false);
    }

    const handleViewProfile = async (teacherId: string) => {
        setDetailsLoading(true);
        const profile = await principalApiService.getTeacherProfileDetails(teacherId);
        setViewingProfile(profile);
        setDetailsLoading(false);
    };
    
    const handleResetPassword = async (teacherId: string) => {
        console.log("Resetting password for", teacherId);
        const { newPassword } = await sharedApiService.resetUserPassword(teacherId);
        setNewCredentials({ id: teacherId, password: newPassword });
        setViewingProfile(null);
    };

    const handleUpdateSalary = async (teacherId: string, newSalary: number) => {
        await principalApiService.updateTeacher(teacherId, { salary: newSalary });
        triggerRefresh();
        if (viewingProfile) {
            handleViewProfile(viewingProfile.teacher.id);
        }
    };

    const pendingApplications = useMemo(() => applications.filter(a => a.status === 'pending'), [applications]);

    const getStatusChipClass = (status: 'active' | 'suspended' | undefined) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'suspended': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-text-primary-dark">Faculty & Staff Management</h1>
                <Button onClick={() => setIsAddModalOpen(true)}>Add New Staff</Button>
            </div>
            
            <Card className="mb-6">
                <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Pending Faculty Applications</h2>
                {loading ? <p>Loading applications...</p> : pendingApplications.length === 0 ? (
                    <p className="text-center text-text-secondary-dark p-4">No pending applications to review.</p>
                ) : (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b"><tr><th className="p-2">Name</th><th className="p-2">Qualification</th><th className="p-2">Submitted By</th><th className="p-2"></th></tr></thead>
                            <tbody>
                                {pendingApplications.map(app => (
                                    <tr key={app.id} className="border-b">
                                        <td className="p-2 font-medium">{app.name}</td>
                                        <td className="p-2">{app.qualification}</td>
                                        <td className="p-2">{app.submittedBy}</td>
                                        <td className="p-2 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button onClick={() => setApprovingApp(app)} disabled={isActionLoading}>Approve</Button>
                                                <Button variant="danger" onClick={() => handleReject(app.id)} disabled={isActionLoading}>Reject</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
             <Card>
                <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Current Faculty & Staff Roster</h2>
                {loading ? <p>Loading faculty...</p> : (
                     <div className="overflow-x-auto">
                         <table className="w-full text-left">
                            <thead className="border-b"><tr>
                                <th className="p-2">Name</th>
                                <th className="p-2">Role</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Email / Phone</th>
                                <th className="p-2"></th>
                            </tr></thead>
                            <tbody>
                                {staff.map(staffMember => (
                                     <tr key={staffMember.id} className="border-b">
                                        <td className="p-2 font-medium">{staffMember.name}</td>
                                        <td className="p-2">{staffMember.role}</td>
                                        <td className="p-2">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChipClass(staffMember.status || 'active')}`}>
                                               {staffMember.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="p-2 text-sm">{staffMember.email}<br/>{staffMember.phone}</td>
                                        <td className="p-2 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => handleViewProfile(staffMember.id)} disabled={staffMember.role !== 'Teacher'}>View</Button>
                                                <Button 
                                                    variant="secondary" 
                                                    className="!px-2 !py-1 text-xs"
                                                    onClick={() => setSuspendingStaff(staffMember)}
                                                    disabled={staffMember.id === user?.id}
                                                >
                                                    {staffMember.status === 'active' ? 'Suspend' : 'Reinstate'}
                                                </Button>
                                                <Button 
                                                    variant="danger" 
                                                    className="!px-2 !py-1 text-xs"
                                                    onClick={() => setDeletingStaff(staffMember)}
                                                    disabled={staffMember.id === user?.id}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                     </tr>
                                ))}
                            </tbody>
                         </table>
                    </div>
                )}
            </Card>
            
            {isAddModalOpen && user?.branchId && <AddStaffModal branchId={user.branchId} onClose={() => setIsAddModalOpen(false)} onSave={handleStaffSave} />}
            {approvingApp && <ApproveApplicationModal application={approvingApp} onClose={() => setApprovingApp(null)} onConfirm={handleApprove} isConfirming={isActionLoading} />}
            {newCredentials && <CredentialsModal credentials={newCredentials} onClose={() => setNewCredentials(null)} />}
            {suspendingStaff && <ConfirmationModal isOpen={true} onClose={() => setSuspendingStaff(null)} onConfirm={handleToggleSuspension} title={`Confirm ${suspendingStaff.status === 'active' ? 'Suspension' : 'Reinstatement'}`} message={<>Are you sure you want to {suspendingStaff.status === 'active' ? 'suspend' : 'reinstate'} {suspendingStaff.name}?</>} isConfirming={isActionLoading} confirmText={suspendingStaff.status === 'active' ? 'Suspend' : 'Reinstate'} confirmVariant={suspendingStaff.status === 'active' ? 'danger' : 'primary'} />}
            {deletingStaff && <ConfirmationModal isOpen={true} onClose={() => setDeletingStaff(null)} onConfirm={handleDelete} title="Confirm Staff Deletion" message={<>Are you sure you want to permanently delete {deletingStaff.name}? This will remove their account and all associated data.</>} isConfirming={isActionLoading} confirmText="Delete" confirmVariant="danger" />}
            {detailsLoading && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"><p className="text-white">Loading profile...</p></div>}
            {viewingProfile && !detailsLoading && <FacultyDetailModal profile={viewingProfile} onClose={() => setViewingProfile(null)} onResetPassword={handleResetPassword} onUpdateSalary={handleUpdateSalary} />}
        </div>
    );
};

export default FacultyManagement;