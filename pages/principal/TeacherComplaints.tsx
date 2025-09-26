import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { principalApiService as apiService } from '../../services';
import type { TeacherComplaint } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';

const TeacherComplaints: React.FC = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState<TeacherComplaint[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user?.branchId) return;
        setLoading(true);
        const data = await apiService.getComplaintsForBranch(user.branchId);
        setComplaints(data);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getStatusChip = (status: 'Open' | 'Resolved by Student') => {
        return status === 'Open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Student Complaints</h1>
            <Card>
                <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
                    Submitted Complaints
                </h2>
                {loading ? (
                    <p>Loading complaints...</p>
                ) : complaints.length === 0 ? (
                    <p className="text-center text-text-secondary-dark p-8">
                        There are no complaints to review at this time.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {complaints.map((complaint) => (
                            <details key={complaint.id} className="bg-slate-50 p-4 rounded-lg" open>
                                <summary className="cursor-pointer font-semibold text-text-primary-dark flex justify-between items-center">
                                    <div>
                                        {complaint.subject} - 
                                        {complaint.teacherName ? (
                                            <>
                                                <span className="font-normal"> against </span> {complaint.teacherName}
                                            </>
                                        ) : (
                                            <span className="font-normal"> (General Complaint)</span>
                                        )}
                                        <span className="font-normal"> by </span> {complaint.studentName}
                                    </div>
                                    <div className="flex items-center gap-4">
                                         <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(complaint.status)}`}>
                                            {complaint.status}
                                        </span>
                                        <span className="text-sm font-normal text-text-secondary-dark">
                                            {new Date(complaint.submittedAt).toLocaleString()}
                                        </span>
                                    </div>
                                </summary>
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <p className="text-sm text-text-primary-dark whitespace-pre-wrap">{complaint.complaintText}</p>
                                </div>
                            </details>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default TeacherComplaints;