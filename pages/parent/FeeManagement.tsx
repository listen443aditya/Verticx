import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { parentApiService as apiService } from '../../services';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import type { ParentDashboardData, ChildData, FeeRecord, MonthlyDue, FeeHistoryItem, FeePayment, FeeAdjustment } from '../../types.ts';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';
import PayFeesModal from '../../components/modals/PayFeesModal.tsx';
import FeeDetailsModal from '../../components/modals/FeeDetailsModal.tsx';
import FeeHistoryModal from '../../components/modals/FeeHistoryModal.tsx';
import { BanknoteIcon } from '../../components/icons/Icons.tsx';

const FeeManagement: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<ParentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedChildIndex, setSelectedChildIndex] = useState(0);
    const { refreshKey } = useDataRefresh();
    
    // Modal states
    const [isPayFeesModalOpen, setIsPayFeesModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const selectedChildData = data?.childrenData[selectedChildIndex];

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const result = await apiService.getParentDashboardData(user.id);
        setData(result);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);


    if (loading) return <div>Loading fee information...</div>;
    if (!data || !selectedChildData || !user) return <Card>No student data found.</Card>;

    const { profile, fees, feeHistory, branch } = selectedChildData;
    const { bankAccountHolderName, bankAccountNumber, bankIfscCode, bankBranchName } = branch;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-text-primary-dark">Fee Management</h1>
                 {data.childrenData.length > 1 && (
                     <div>
                        <label htmlFor="child-select" className="text-sm mr-2 text-text-secondary-dark">Viewing for:</label>
                        <select 
                            id="child-select" 
                            value={selectedChildIndex}
                            onChange={(e) => setSelectedChildIndex(parseInt(e.target.value, 10))}
                            className="bg-surface-dark border border-slate-300 rounded-md py-1 px-2"
                        >
                            {data.childrenData.map((child, index) => (
                                <option key={child.profile.id} value={index}>{child.profile.name}</option>
                            ))}
                        </select>
                     </div>
                 )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Fee Summary for {profile.name}</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-text-secondary-dark">Total Annual Fee:</span> <strong>{fees.totalAnnualFee.toLocaleString() || 'N/A'}</strong></div>
                            <div className="flex justify-between"><span className="text-text-secondary-dark">Total Paid:</span> <strong className="text-green-600">{fees.totalPaid.toLocaleString() || 'N/A'}</strong></div>
                            <div className="flex justify-between text-base pt-2 border-t mt-2"><span className="font-bold">Total Outstanding:</span> <strong className="text-red-500 text-lg">{fees.totalOutstanding.toLocaleString()}</strong></div>
                        </div>
                         <div className="space-y-2 mt-4">
                            <Button
                                className="w-full"
                                onClick={() => setIsPayFeesModalOpen(true)}
                                disabled={fees.totalOutstanding <= 0 || !user?.enabledFeatures?.online_payments_enabled}
                            >
                                {!user?.enabledFeatures?.online_payments_enabled
                                    ? 'Online Payment Disabled'
                                    : fees.totalOutstanding <= 0
                                    ? 'All Dues Cleared'
                                    : 'Pay Fees Online'}
                            </Button>
                            <Button variant="secondary" className="w-full" onClick={() => setIsDetailsModalOpen(true)}>View Monthly Breakdown</Button>
                            <Button variant="secondary" className="w-full" onClick={() => setIsHistoryModalOpen(true)}>View Payment History</Button>
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><BanknoteIcon /> School Bank Details</h2>
                        {bankAccountNumber && bankAccountHolderName ? (
                            <div className="space-y-2 text-sm bg-slate-50 p-3 rounded-lg">
                                <div className="flex justify-between"><span className="text-text-secondary-dark">Account Name:</span> <strong>{bankAccountHolderName}</strong></div>
                                <div className="flex justify-between"><span className="text-text-secondary-dark">Account Number:</span> <strong>{bankAccountNumber}</strong></div>
                                <div className="flex justify-between"><span className="text-text-secondary-dark">IFSC Code:</span> <strong>{bankIfscCode}</strong></div>
                                <div className="flex justify-between"><span className="text-text-secondary-dark">Branch Name:</span> <strong>{bankBranchName}</strong></div>
                            </div>
                        ) : (
                            <p className="text-sm text-center text-text-secondary-dark p-4">Bank details have not been configured by the school.</p>
                        )}
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Upcoming Due Payments</h2>
                        {fees.monthlyDues.filter(due => due.status !== 'Paid').length > 0 ? (
                            <div className="space-y-3">
                                {fees.monthlyDues.filter(due => due.status !== 'Paid').map(due => (
                                    <div key={due.month} className="bg-slate-50 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{due.month} {due.year}</p>
                                            <p className="text-xs text-text-secondary-dark">Total: {due.total.toLocaleString()} | Paid: {due.paid.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-red-600">{due.balance.toLocaleString()}</p>
                                            <p className="text-xs text-red-500">Balance Due</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <p className="text-center p-8 text-text-secondary-dark">No upcoming payments due.</p>
                        )}
                    </Card>
                </div>
            </div>

            {isPayFeesModalOpen && (
                 <PayFeesModal
                    isOpen={isPayFeesModalOpen}
                    onClose={() => setIsPayFeesModalOpen(false)}
                    student={selectedChildData.student}
                    branch={selectedChildData.branch}
                    parent={user}
                />
            )}

            <FeeDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                studentName={profile.name}
                fees={fees}
            />
            
            <FeeHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                studentName={profile.name}
                history={feeHistory}
            />
        </div>
    );
};

export default FeeManagement;