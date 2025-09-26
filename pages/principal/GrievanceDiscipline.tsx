import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { principalApiService as apiService } from '../../services';
import type { Student } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import Input from '../../components/ui/Input.tsx';

const RaiseComplaintModalPrincipal: React.FC<{ student: Student; onClose: () => void; onSubmit: () => void; }> = ({ student, onClose, onSubmit }) => {
    const { user } = useAuth();
    const [complaintText, setComplaintText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!complaintText.trim() || !user) return;
        setIsSubmitting(true);
        try {
            await apiService.raiseComplaintAboutStudent({
                studentId: student.id,
                studentName: student.name,
                branchId: student.branchId,
                raisedById: user.id,
                raisedByName: user.name,
                raisedByRole: 'Principal',
                complaintText: complaintText,
            });
            onSubmit();
        } catch (error) {
            console.error("Failed to submit complaint:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-xl font-bold mb-2">Raise Complaint Against {student.name}</h2>
                <p className="text-sm text-text-secondary-dark mb-4">This complaint will be logged and visible to the student and their parent.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Complaint Details</label>
                        <textarea 
                            value={complaintText} 
                            onChange={e => setComplaintText(e.target.value)}
                            rows={6}
                            className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="danger" disabled={isSubmitting || !complaintText.trim()}>
                            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


const GrievanceDiscipline: React.FC = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [complainingAbout, setComplainingAbout] = useState<Student | null>(null);
    const [complaintStatus, setComplaintStatus] = useState('');

    const fetchData = useCallback(async () => {
        if (!user?.branchId) return;
        setLoading(true);
        const studentData = await apiService.getStudentsByBranch(user.branchId);
        setStudents(studentData);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleComplaintSubmit = () => {
        setComplainingAbout(null);
        setComplaintStatus('Complaint logged successfully. The student and their parent will be notified.');
        setTimeout(() => setComplaintStatus(''), 5000);
    };
    
    const filteredStudents = useMemo(() => {
        if (!searchTerm) return students;
        const lowercasedTerm = searchTerm.toLowerCase();
        return students.filter(s => 
            s.name.toLowerCase().includes(lowercasedTerm) ||
            s.id.toLowerCase().includes(lowercasedTerm)
        );
    }, [students, searchTerm]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Raise a Disciplinary Complaint</h1>
            <Card>
                <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Raise Complaint</h2>
                <p className="text-sm text-text-secondary-dark mb-4">Select a student to raise a formal complaint regarding discipline or other issues. This will be logged and made visible to the student and their parent.</p>
                <Input 
                    placeholder="Search for a student by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4"
                />
                {complaintStatus && <p className="text-center text-green-600 mb-4">{complaintStatus}</p>}
                {loading ? <p>Loading students...</p> : (
                    <div className="overflow-y-auto max-h-96">
                        <table className="w-full text-left">
                            <thead className="border-b sticky top-0 bg-surface-dark">
                                <tr>
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Class</th>
                                    <th className="p-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(student => {
                                    const studentClass = apiService.getClassById(student.classId!);
                                    return (
                                        <tr key={student.id} className="border-b hover:bg-slate-50">
                                            <td className="p-2 font-medium">{student.name}</td>
                                            <td className="p-2">{studentClass ? `Grade ${studentClass.gradeLevel} - ${studentClass.section}` : 'N/A'}</td>
                                            <td className="p-2 text-right">
                                                <Button variant="danger" className="!px-2 !py-1 text-xs" onClick={() => setComplainingAbout(student)}>Raise Complaint</Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
            {complainingAbout && (
                <RaiseComplaintModalPrincipal 
                    student={complainingAbout}
                    onClose={() => setComplainingAbout(null)}
                    onSubmit={handleComplaintSubmit}
                />
            )}
        </div>
    );
};

export default GrievanceDiscipline;