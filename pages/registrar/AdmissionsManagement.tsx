


import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import type { Application, SchoolClass, Student, Teacher, Subject } from '../../types.ts';
// FIX: Changed to named import for registrarApiService and aliased as apiService.
import { registrarApiService as apiService } from '../../services';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import Input from '../../components/ui/Input.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';

// --- MODAL COMPONENTS ---

// Modal to display newly generated credentials
const CredentialsModal: React.FC<{ credentials: { id: string, password: string }, userType: 'Student' | 'Teacher', onClose: () => void }> = ({ credentials, userType, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
                <h2 className="text-xl font-bold text-brand-accent mb-2">Admission Successful!</h2>
                <p className="text-text-secondary-dark mb-4">The {userType.toLowerCase()} has been created. Please securely share the following login credentials:</p>
                 <p className="text-sm text-green-700 bg-green-100 p-2 rounded-md mb-4 text-center">
                    An SMS with these details has been sent to their registered phone number.
                </p>
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
                <div className="mt-6 text-right">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </Card>
        </div>
    );
};


// Modal for admitting a new student directly
const AdmitStudentModal: React.FC<{ classes: SchoolClass[]; onClose: () => void; onSave: (credentials: { id: string, password: string }) => void; branchId: string }> = ({ classes, onClose, onSave, branchId }) => {
    const [formData, setFormData] = useState<Partial<Student>>({
        name: '', classId: '', dob: '', address: '', gender: 'Male',
        guardianInfo: { name: '', email: '', phone: '' }, status: 'active',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('guardian.')) {
            const guardianField = name.split('.')[1];
            setFormData(prev => ({ ...prev, guardianInfo: { ...prev.guardianInfo, [guardianField]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const selectedClass = classes.find(c => c.id === formData.classId);
        const dataToSave = {
            ...formData,
            gradeLevel: selectedClass?.gradeLevel || 0,
        };
        try {
            const { credentials } = await apiService.admitStudent(dataToSave as any, branchId);
            onSave(credentials);
        } catch (error) {
            console.error("Failed to admit student:", error);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-text-primary-dark mb-4">Admit New Student</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
                     <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Gender</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-text-primary-dark" required>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Class</label>
                        <select name="classId" value={formData.classId} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-text-primary-dark">
                            <option value="">-- Unassigned --</option>
                            {classes.sort((a, b) => a.gradeLevel - b.gradeLevel).map(c => <option key={c.id} value={c.id}>Grade {c.gradeLevel} - {c.section}</option>)}
                        </select>
                    </div>
                    <Input label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
                    <Input className="md:col-span-2" label="Address" name="address" value={formData.address} onChange={handleChange} required />
                    <h3 className="md:col-span-2 text-lg font-semibold text-text-secondary-dark border-t border-slate-200 pt-4 mt-2">Guardian Information</h3>
                    <Input label="Guardian Name" name="guardian.name" value={formData.guardianInfo?.name} onChange={handleChange} required />
                    <Input label="Guardian Email" name="guardian.email" type="email" value={formData.guardianInfo?.email} onChange={handleChange} required />
                    <Input label="Guardian Phone" name="guardian.phone" type="tel" value={formData.guardianInfo?.phone} onChange={handleChange} required />
                    <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Admitting...' : 'Admit Student'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

// Modal for admitting a new teacher directly
const AdmitTeacherModal: React.FC<{ subjects: Subject[]; onClose: () => void; onSave: () => void; branchId: string; registrarId: string }> = ({ subjects, onClose, onSave, branchId, registrarId }) => {
    const [formData, setFormData] = useState<Partial<Teacher>>({
        name: '', subjectIds: [], qualification: '', doj: new Date().toISOString().split('T')[0], gender: 'Male', email: '', phone: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

     const handleSubjectToggle = (subjectId: string) => {
        setFormData(prev => {
            const newSubjectIds = prev.subjectIds?.includes(subjectId)
                ? prev.subjectIds.filter(id => id !== subjectId)
                : [...(prev.subjectIds || []), subjectId];
            return { ...prev, subjectIds: newSubjectIds };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await apiService.submitFacultyApplication(formData as any, branchId, registrarId);
            onSave();
        } catch (error) {
            console.error("Failed to submit teacher application:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl">
                <h2 className="text-xl font-bold text-text-primary-dark mb-4">Submit Teacher for Approval</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required className="md:col-span-2"/>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Gender</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-text-primary-dark" required>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <Input label="Date of Joining" name="doj" type="date" value={formData.doj} onChange={handleChange} required/>

                    <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
                    <Input label="Phone Number" name="phone" type="tel" value={formData.phone} />
                    
                    <Input label="Qualification" name="qualification" value={formData.qualification} onChange={handleChange} required className="md:col-span-2"/>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Assign Subjects</label>
                        <div className="max-h-32 overflow-y-auto border border-slate-300 rounded-md p-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                            {subjects.map(subject => (
                                <label key={subject.id} className="flex items-center p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.subjectIds?.includes(subject.id)}
                                        onChange={() => handleSubjectToggle(subject.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-brand-secondary focus:ring-brand-accent"
                                    />
                                    <span className="ml-2 text-sm text-text-primary-dark">{subject.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Submitting...' : 'Submit for Approval'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


// --- MAIN COMPONENT ---

const AdmissionsManagement: React.FC = () => {
    const { user } = useAuth();
    const { refreshKey, triggerRefresh } = useDataRefresh();
    const [applications, setApplications] = useState<Application[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [submissionStatus, setSubmissionStatus] = useState('');
    
    // State for new admission flow
    const [modal, setModal] = useState<'student' | 'teacher' | null>(null);
    const [newCredentials, setNewCredentials] = useState<{ id: string, password: string } | null>(null);
    const [admittedUserType, setAdmittedUserType] = useState<'Student' | 'Teacher'>('Student');

    const fetchApplications = useCallback(async () => {
        if (!user?.branchId) return;
        setLoading(true);
        const [apps, classesRes, subjectsRes] = await Promise.all([
            apiService.getApplications(user.branchId),
            apiService.getSchoolClassesByBranch(user.branchId),
            apiService.getSubjectsByBranch(user.branchId)
        ]);
        setApplications(apps.filter(a => a.status === 'pending'));
        setClasses(classesRes);
        setSubjects(subjectsRes);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications, refreshKey]);

    const handleAction = async (appId: string, status: 'approved' | 'denied') => {
        setActionLoading(prev => ({ ...prev, [appId]: true }));
        try {
            await apiService.updateApplicationStatus(appId, status);
            triggerRefresh();
        } catch (error) {
            console.error(`Failed to ${status} application:`, error);
        } finally {
            setActionLoading(prev => ({ ...prev, [appId]: false }));
        }
    };
    
    const handleStudentAdmissionSave = (credentials: { id: string, password: string }) => {
        setNewCredentials(credentials);
        setModal(null);
        triggerRefresh();
    };

    const handleTeacherAdmissionSave = () => {
        setModal(null);
        setSubmissionStatus('Teacher application submitted for Principal approval.');
        setTimeout(() => setSubmissionStatus(''), 5000);
        triggerRefresh();
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Admissions Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Application Review Section */}
                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Pending Applications</h2>
                    {loading ? <p>Loading applications...</p> : applications.length === 0 ? (
                        <p className="text-center text-text-secondary-dark p-8">No pending applications to review.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b"><tr><th className="p-2">Name</th><th className="p-2">Type</th><th className="p-2">Details</th><th className="p-2"></th></tr></thead>
                                <tbody>
                                    {applications.map(app => (
                                        <tr key={app.id} className="border-b">
                                            <td className="p-2 font-medium">{app.applicantName}</td>
                                            <td className="p-2">{app.type}</td>
                                            <td className="p-2">{app.type === 'Student' ? `Grade ${app.grade}` : app.subject}</td>
                                            <td className="p-2 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button onClick={() => handleAction(app.id, 'approved')} disabled={actionLoading[app.id]}>Approve</Button>
                                                    <Button variant="danger" onClick={() => handleAction(app.id, 'denied')} disabled={actionLoading[app.id]}>Deny</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Direct Admission Section */}
                <Card>
                    <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Direct Admission</h2>
                    <p className="text-sm text-text-secondary-dark mb-4">For walk-in admissions, you can directly add students or submit teacher applications here.</p>
                    <div className="space-y-3">
                        <Button className="w-full" onClick={() => setModal('student')}>Admit Student</Button>
                        <Button className="w-full" onClick={() => setModal('teacher')}>Add Teacher</Button>
                    </div>
                     {submissionStatus && <p className="text-center text-green-600 mt-4 text-sm">{submissionStatus}</p>}
                </Card>
            </div>

            {/* Modals */}
            {modal === 'student' && user?.branchId && <AdmitStudentModal classes={classes} onClose={() => setModal(null)} onSave={handleStudentAdmissionSave} branchId={user.branchId} />}
            {modal === 'teacher' && user?.branchId && <AdmitTeacherModal subjects={subjects} onClose={() => setModal(null)} onSave={handleTeacherAdmissionSave} branchId={user.branchId} registrarId={user.id} />}
            {newCredentials && <CredentialsModal credentials={newCredentials} userType={admittedUserType} onClose={() => setNewCredentials(null)} />}

        </div>
    );
};

export default AdmissionsManagement;