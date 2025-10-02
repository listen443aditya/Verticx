import React, { useEffect, useState, useCallback } from 'react';
import type { RegistrationRequest } from '../../types.ts';
import { AdminApiService } from '../../services';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';
import NotificationModal from '../../components/modals/NotificationModal.tsx';
import ConfirmationModal from '../../components/ui/ConfirmationModal.tsx';
const adminApiService = new AdminApiService();
const RequestDetailModal: React.FC<{ request: RegistrationRequest; onClose: () => void; }> = ({ request, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <Card className="w-full max-w-lg">
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-text-primary-dark mb-4">Registration Details</h2>
                    <button onClick={onClose} className="text-3xl font-light text-slate-500 hover:text-slate-800 leading-none">&times;</button>
                </div>
                <div className="space-y-3 mt-4">
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="font-semibold text-text-secondary-dark">School Name:</span>
                        <span className="text-text-primary-dark">{request.schoolName}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="font-semibold text-text-secondary-dark">Registration ID:</span>
                        <span className="text-text-primary-dark font-mono">{request.registrationId}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="font-semibold text-text-secondary-dark">Principal's Name:</span>
                        <span className="text-text-primary-dark">{request.principalName}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="font-semibold text-text-secondary-dark">Email:</span>
                        <span className="text-text-primary-dark">{request.email}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="font-semibold text-text-secondary-dark">Phone:</span>
                        <span className="text-text-primary-dark">{request.phone}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="font-semibold text-text-secondary-dark">Location:</span>
                        <span className="text-text-primary-dark">{request.location}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="font-semibold text-text-secondary-dark">Submitted At:</span>
                        <span className="text-text-primary-dark">{new Date(request.submittedAt).toLocaleString()}</span>
                    </div>
                </div>
                <div className="mt-6 text-right">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </Card>
        </div>
    );
};


const RegistrationRequests: React.FC = () => {
    const [requests, setRequests] = useState<RegistrationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [showNotification, setShowNotification] = useState(false);
    const [viewingRequest, setViewingRequest] = useState<RegistrationRequest | null>(null);
    const [denyingRequest, setDenyingRequest] = useState<RegistrationRequest | null>(null);
    const { refreshKey, triggerRefresh } = useDataRefresh();

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        const pendingRequests = await adminApiService.getRegistrationRequests();
        setRequests(pendingRequests);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests, refreshKey]);

    const handleApprove = async (requestId: string) => {
        setActionLoading(prev => ({ ...prev, [requestId]: true }));
        try {
            await adminApiService.approveRequest(requestId);
            triggerRefresh(); // Signal other components to update
            setShowNotification(true);
        } catch (error) {
            console.error("Failed to approve request:", error);
            // Optionally show an error message
        } finally {
            setActionLoading(prev => ({ ...prev, [requestId]: false }));
        }
    };
    
    const confirmDeny = async () => {
        if (!denyingRequest) return;
        setActionLoading(prev => ({ ...prev, [denyingRequest.id]: true }));
        try {
            await adminApiService.denyRequest(denyingRequest.id);
            triggerRefresh();
            setDenyingRequest(null);
        } catch (error) {
            console.error("Failed to deny request:", error);
        } finally {
            setActionLoading(prev => ({ ...prev, [denyingRequest.id]: false }));
        }
    };

    const handleCloseNotification = () => {
        setShowNotification(false);
    }


    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Registration Requests</h1>
            <Card>
                {loading ? (
                    <p>Loading requests...</p>
                ) : requests.length === 0 ? (
                    <p className="text-center text-text-secondary-dark p-4">No pending registration requests.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                                <tr>
                                    <th className="p-4">School Name</th>
                                    <th className="p-4">Principal Name</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Submitted At</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => (
                                    <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-4 font-medium text-text-primary-dark">{req.schoolName}</td>
                                        <td className="p-4">{req.principalName}</td>
                                        <td className="p-4">{req.email}</td>
                                        <td className="p-4">{new Date(req.submittedAt).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="secondary" 
                                                    className="!px-3 !py-1 text-xs" 
                                                    onClick={() => setViewingRequest(req)}
                                                >
                                                    View
                                                </Button>
                                                <Button 
                                                    variant="primary" 
                                                    className="!px-3 !py-1 text-xs"
                                                    onClick={() => handleApprove(req.id)}
                                                    disabled={actionLoading[req.id]}
                                                >
                                                    {actionLoading[req.id] ? 'Approving...' : 'Approve'}
                                                </Button>
                                                <Button 
                                                    variant="danger" 
                                                    className="!px-3 !py-1 text-xs"
                                                    onClick={() => setDenyingRequest(req)}
                                                    disabled={actionLoading[req.id]}
                                                >
                                                    Deny
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

            <NotificationModal
                isOpen={showNotification}
                onClose={handleCloseNotification}
                title="Approval Successful!"
                message={
                    <p>
                        The school and principal account have been created.
                        <br /><br />
                        Login credentials have been securely sent to the principal's registered email and phone number.
                    </p>
                }
            />
            {viewingRequest && (
                <RequestDetailModal request={viewingRequest} onClose={() => setViewingRequest(null)} />
            )}
            {denyingRequest && (
                <ConfirmationModal
                    isOpen={!!denyingRequest}
                    onClose={() => setDenyingRequest(null)}
                    onConfirm={confirmDeny}
                    title="Confirm Denial"
                    message={`Are you sure you want to deny the registration for ${denyingRequest.schoolName}? This action cannot be undone.`}
                    confirmText="Deny"
                    isConfirming={actionLoading[denyingRequest.id]}
                />
            )}
        </div>
    );
};

export default RegistrationRequests;
