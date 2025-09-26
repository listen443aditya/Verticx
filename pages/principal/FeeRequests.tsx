import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { principalApiService as apiService } from '../../services';
import type { FeeRectificationRequest, FeeTemplate } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';

const FeeRequests: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<FeeRectificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    const fetchData = useCallback(async () => {
        if (!user?.branchId) return;
        setLoading(true);
        const data = await apiService.getFeeRectificationRequestsByBranch(user.branchId);
        setRequests(data);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = async (requestId: string, status: 'Approved' | 'Rejected') => {
        if (!user) return;
        setActionLoading(prev => ({ ...prev, [requestId]: true }));
        try {
            // FIX: Corrected method call to process fee rectification requests.
            await apiService.processFeeRectificationRequest(requestId, user.id, status);
            fetchData();
        } catch (error) {
            console.error("Failed to process request:", error);
        } finally {
            setActionLoading(prev => ({ ...prev, [requestId]: false }));
        }
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(r => r.status === view).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    }, [requests, view]);

    const viewButtonClasses = (isActive: boolean) =>
        `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${isActive ? 'border-b-2 border-brand-secondary text-brand-secondary' : 'text-text-secondary-dark hover:text-text-primary-dark'}`;

    const renderChangeDetails = (req: FeeRectificationRequest) => {
        const original = JSON.parse(req.originalData) as FeeTemplate;
        if (req.requestType === 'delete') {
            return (
                <div className="bg-red-50 p-2 rounded text-red-800 text-xs">
                    <p><strong>Deletion Request:</strong></p>
                    <p>Name: {original.name}</p>
                    <p>Amount: {original.amount.toLocaleString()}</p>
                    <p>Grade: {original.gradeLevel}</p>
                </div>
            );
        }

        const updated = JSON.parse(req.newData!) as Partial<FeeTemplate>;
        return (
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-100 p-2 rounded">
                    <strong>Original</strong>
                    <p>Name: {original.name}</p>
                    <p>Amount: {original.amount.toLocaleString()}</p>
                    <p>Grade: {original.gradeLevel}</p>
                </div>
                 <div className="bg-blue-50 p-2 rounded">
                    <strong>Proposed</strong>
                    <p>Name: {updated.name}</p>
                    <p>Amount: {updated.amount?.toLocaleString()}</p>
                    <p>Grade: {updated.gradeLevel}</p>
                </div>
            </div>
        );
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Fee Rectification Requests</h1>
            <Card>
                <div className="flex border-b border-slate-200 mb-4">
                    <button className={viewButtonClasses(view === 'Pending')} onClick={() => setView('Pending')}>Pending</button>
                    <button className={viewButtonClasses(view === 'Approved')} onClick={() => setView('Approved')}>Approved</button>
                    <button className={viewButtonClasses(view === 'Rejected')} onClick={() => setView('Rejected')}>Rejected</button>
                </div>
                {loading ? <p>Loading requests...</p> : (
                    filteredRequests.length === 0 ? (
                        <p className="text-center text-text-secondary-dark p-8">No {view.toLowerCase()} requests found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                                    <tr>
                                        <th className="p-4">Requested By</th>
                                        <th className="p-4">Details</th>
                                        <th className="p-4">Reason</th>
                                        <th className="p-4">{view === 'Pending' ? 'Requested At' : 'Reviewed At'}</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.map(req => (
                                        <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="p-4 font-medium">{req.registrarName}</td>
                                            <td className="p-4 w-1/3">{renderChangeDetails(req)}</td>
                                            <td className="p-4 text-sm text-text-secondary-dark max-w-xs break-words">{req.reason}</td>
                                            <td className="p-4 text-xs">{new Date(view === 'Pending' ? req.requestedAt : req.reviewedAt!).toLocaleString()}</td>
                                            <td className="p-4 text-right">
                                                {view === 'Pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="primary" className="!px-3 !py-1 text-xs" onClick={() => handleAction(req.id, 'Approved')} disabled={actionLoading[req.id]}>Approve</Button>
                                                        <Button variant="danger" className="!px-3 !py-1 text-xs" onClick={() => handleAction(req.id, 'Rejected')} disabled={actionLoading[req.id]}>Reject</Button>
                                                    </div>
                                                )}
                                                {view !== 'Pending' && <p className="text-xs font-semibold text-text-secondary-dark">Reviewed by {req.reviewedBy}</p>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </Card>
        </div>
    );
};

export default FeeRequests;