import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { parentApiService as apiService } from '../../services';
import type { Student, ComplaintAboutStudent } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import { AlertTriangleIcon } from '../../components/icons/Icons.tsx';

const Complaints: React.FC = () => {
    const { user } = useAuth();
    const [children, setChildren] = useState<Student[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [complaints, setComplaints] = useState<ComplaintAboutStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [complaintsLoading, setComplaintsLoading] = useState(false);

    useEffect(() => {
        const fetchChildren = async () => {
            if (!user?.childrenIds) return;
            setLoading(true);
            const childrenPromises = user.childrenIds.map(id => apiService.getStudentProfileDetails(id).then(p => p?.student));
            const childrenData = (await Promise.all(childrenPromises)).filter((s): s is Student => s !== null && s !== undefined);
            setChildren(childrenData);
            if (childrenData.length > 0) {
                setSelectedChildId(childrenData[0].id);
            }
            setLoading(false);
        };
        fetchChildren();
    }, [user]);

    const fetchComplaints = useCallback(async () => {
        if (!selectedChildId) return;
        setComplaintsLoading(true);
        try {
            const data = await apiService.getComplaintsAboutStudent(selectedChildId);
            setComplaints(data);
        } catch (error) {
            console.error("Failed to fetch complaints", error);
        } finally {
            setComplaintsLoading(false);
        }
    }, [selectedChildId]);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Raised Complaints</h1>
            <Card>
                {loading ? <p>Loading data...</p> : (
                    <>
                        {children.length > 1 && (
                             <div className="flex items-center gap-4 mb-6">
                                <label htmlFor="child-select" className="font-medium">Viewing complaints for:</label>
                                <select 
                                    id="child-select"
                                    value={selectedChildId}
                                    onChange={(e) => setSelectedChildId(e.target.value)}
                                    className="bg-surface-dark border border-slate-300 rounded-md py-2 px-3"
                                >
                                    {children.map(child => (
                                        <option key={child.id} value={child.id}>{child.name}</option>
                                    ))}
                                </select>
                             </div>
                        )}
                        {complaintsLoading ? <p>Loading complaints...</p> : complaints.length === 0 ? (
                            <div className="text-center p-8">
                                <p className="text-text-secondary-dark">No complaints have been raised for {children.find(c=>c.id === selectedChildId)?.name}.</p>
                            </div>
                        ) : (
                             <div className="space-y-4">
                                {complaints.map(complaint => (
                                    <div key={complaint.id} className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-4">
                                        <div className="flex-shrink-0 text-red-500 mt-1">
                                            <AlertTriangleIcon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-center">
                                                <p className="font-bold text-red-800">Complaint from: {complaint.raisedByName} ({complaint.raisedByRole})</p>
                                                <p className="text-xs text-red-600">{new Date(complaint.submittedAt).toLocaleDateString()}</p>
                                            </div>
                                            <p className="mt-2 text-sm text-red-900 whitespace-pre-wrap">{complaint.complaintText}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
};

export default Complaints;