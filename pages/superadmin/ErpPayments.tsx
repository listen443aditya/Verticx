import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminApiService } from '../../services';
import type { ErpPayment, Branch, SystemSettings } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Input from '../../components/ui/Input.tsx';
import Button from '../../components/ui/Button.tsx';
import ErpPaymentHistoryModal from '../../components/modals/ErpPaymentHistoryModal.tsx';
import { useAuth } from '../../hooks/useAuth.ts';

const adminApiService = new AdminApiService();
interface BillingRecord {
    branchId: string;
    branchName: string;
    registrationId: string;
    branchStatus: Branch['status'];
    cumulativeBalance: number;
    cumulativePaymentStatus: 'paid' | 'due' | 'partially paid' | 'not applicable';
    periodAmountPaid: number;
    lastPaymentDate?: string;
    defaultDays: number;
    upcomingPaymentDate: string;
}


interface MarkAsPaidModalProps {
    record: BillingRecord;
    branch: Branch;
    settings: SystemSettings;
    onClose: () => void;
    onSave: () => void;
}

const MarkAsPaidModal: React.FC<MarkAsPaidModalProps> = ({ record, branch, settings, onClose, onSave }) => {
    const { user } = useAuth();
    const today = new Date().toISOString().split('T')[0];
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(today);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const calculatedAmountDue = useMemo(() => {
        if (!periodStart || !periodEnd) return 0;

        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        if (start > end) return 0;

        const countMonths = (s: Date, e: Date) => {
            let months = (e.getFullYear() - s.getFullYear()) * 12;
            months -= s.getMonth();
            months += e.getMonth();
            return months < 0 ? 0 : months + 1;
        };
        const months = countMonths(start, end);

        const price = branch.erpPricePerStudent ?? settings.defaultErpPrice;
        const concession = branch.erpConcessionPercentage || 0;
        const discountFactor = 1 - (concession / 100);
        const studentCount = branch.stats.students;

        return months * studentCount * price * discountFactor;
    }, [periodStart, periodEnd, branch, settings]);

    useEffect(() => {
        setAmount(calculatedAmountDue.toFixed(2));
    }, [calculatedAmountDue]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (!user) {
                alert("Authentication error. Please log in again.");
                setIsSaving(false);
                return;
            }
            await adminApiService.recordManualErpPayment(branch.id, {
                amount: Number(amount),
                paymentDate,
                notes,
                periodEndDate: periodEnd,
            }, user.id);
            onSave();
        } catch (error) {
            console.error(error);
            alert('Failed to record payment.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Mark Offline Payment for {record.branchName}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Billing Period Start" type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required />
                        <Input label="Billing Period End" type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} min={periodStart} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Amount Due (Calculated)</label>
                        <p className="mt-1 p-2 bg-slate-200 rounded font-semibold">{calculatedAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <Input label="Amount Paid" type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
                    <Input label="Payment Date" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required max={today} />
                    <Input label="Notes (e.g., Cheque No.)" value={notes} onChange={e => setNotes(e.target.value)} />
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Confirm Payment'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


const ErpPayments: React.FC = () => {
    const [allBranches, setAllBranches] = useState<Branch[]>([]);
    const [allPayments, setAllPayments] = useState<ErpPayment[]>([]);
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterSchoolStatus, setFilterSchoolStatus] = useState<'all' | Branch['status']>('all');
    const [filterPaymentStatus, setFilterPaymentStatus] = useState<'all' | 'paid' | 'due' | 'partially paid'>('all');

    const [viewingHistoryFor, setViewingHistoryFor] = useState<BillingRecord | null>(null);
    const [markingPaymentFor, setMarkingPaymentFor] = useState<BillingRecord | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [branches, payments, systemSettings] = await Promise.all([
            adminApiService.getBranches(),
            adminApiService.getErpPayments(),
            adminApiService.getSystemSettings(),
        ]);
        setAllBranches(branches);
        setAllPayments(payments);
        setSettings(systemSettings);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const billingData = useMemo((): BillingRecord[] => {
        if (!allBranches.length || !settings) return [];

        const today = new Date();
        const defaultStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const defaultEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const periodStart = startDate ? new Date(startDate) : defaultStartDate;
        const periodEnd = endDate ? new Date(endDate) : defaultEndDate;
        periodStart.setHours(0, 0, 0, 0);
        periodEnd.setHours(23, 59, 59, 999);

        const countMonths = (start: Date, end: Date) => {
            let months = (end.getFullYear() - start.getFullYear()) * 12;
            months -= start.getMonth();
            months += end.getMonth();
            return months < 0 ? 0 : months + 1;
        };

        return allBranches.map(branch => {
            if (branch.status === 'pending') {
                return {
                    branchId: branch.id, branchName: branch.name, branchStatus: branch.status, registrationId: branch.registrationId,
                    cumulativeBalance: 0, cumulativePaymentStatus: 'not applicable', periodAmountPaid: 0,
                    upcomingPaymentDate: 'N/A', defaultDays: 0
                };
            }

            const price = branch.erpPricePerStudent ?? settings.defaultErpPrice;
            const concession = branch.erpConcessionPercentage || 0;
            const discountFactor = 1 - (concession / 100);
            const studentCount = branch.stats.students;
            const monthlyBill = studentCount * price * discountFactor;

            // CUMULATIVE CALCULATION
            const sessionStart = branch.academicSessionStartDate ? new Date(branch.academicSessionStartDate) : new Date(today.getFullYear(), 3, 1);
            const monthsPassed = countMonths(sessionStart, today);
            const cumulativeAmountDue = monthlyBill * monthsPassed;
            const allPaymentsForBranch = allPayments.filter(p => p.branchId === branch.id);
            const cumulativeAmountPaid = allPaymentsForBranch.reduce((sum, p) => sum + p.amount, 0);
            const cumulativeBalance = cumulativeAmountDue - cumulativeAmountPaid;
            let cumulativePaymentStatus: BillingRecord['cumulativePaymentStatus'] = 'not applicable';
            if (cumulativeAmountDue > 0) {
                if (cumulativeBalance <= 0) {
                    cumulativePaymentStatus = 'paid';
                } else if (cumulativeAmountPaid > 0) {
                    cumulativePaymentStatus = 'partially paid';
                } else {
                    cumulativePaymentStatus = 'due';
                }
            }
            
            // PERIOD CALCULATION (for summary card)
            const paymentsInPeriod = allPaymentsForBranch.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= periodStart && paymentDate <= periodEnd;
            });
            const periodAmountPaid = paymentsInPeriod.reduce((sum, p) => sum + p.amount, 0);

            const lastPaymentDate = allPaymentsForBranch.length > 0 ? allPaymentsForBranch.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0].paymentDate : undefined;

            const upcomingPaymentDate = branch.nextDueDate || 'Not Set';
            let defaultDays = 0;
            if (upcomingPaymentDate !== 'Not Set') {
                const dueDate = new Date(upcomingPaymentDate);
                if (today > dueDate) {
                    const diffTime = today.getTime() - dueDate.getTime();
                    defaultDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }
            }

            return {
                branchId: branch.id, branchName: branch.name, branchStatus: branch.status, registrationId: branch.registrationId,
                cumulativeBalance: Math.max(0, cumulativeBalance),
                cumulativePaymentStatus,
                periodAmountPaid,
                lastPaymentDate,
                upcomingPaymentDate,
                defaultDays,
            };
        });
    }, [allBranches, allPayments, settings, startDate, endDate]);

    const filteredBillingData = useMemo(() => {
        return billingData.filter(record => {
            const matchesSchoolStatus = filterSchoolStatus === 'all' || record.branchStatus === filterSchoolStatus;
            const matchesPaymentStatus = filterPaymentStatus === 'all' || record.cumulativePaymentStatus === filterPaymentStatus;

            const lowerSearchTerm = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === '' ||
                record.branchName.toLowerCase().includes(lowerSearchTerm) ||
                (record.registrationId && record.registrationId.toLowerCase().includes(lowerSearchTerm));

            return matchesSchoolStatus && matchesPaymentStatus && matchesSearch;
        });
    }, [billingData, filterSchoolStatus, filterPaymentStatus, searchTerm]);

    const totalRevenueFiltered = useMemo(() => {
        return filteredBillingData.reduce((sum, p) => sum + p.periodAmountPaid, 0);
    }, [filteredBillingData]);

    const totalUnpaidBills = useMemo(() => {
        return billingData.reduce((sum, p) => sum + p.cumulativeBalance, 0);
    }, [billingData]);


    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        setFilterSchoolStatus('all');
        setFilterPaymentStatus('all');
        setSearchTerm('');
    };

    const getStatusChipClass = (status: Branch['status']) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'suspended': return 'bg-orange-100 text-orange-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

     const getPaymentStatusChipClass = (status: BillingRecord['cumulativePaymentStatus']) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'partially paid': return 'bg-yellow-100 text-yellow-800';
            case 'due': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const filteredPaymentsForModal = useMemo(() => {
        if (!viewingHistoryFor) return [];
        return allPayments
            .filter(p => p.branchId === viewingHistoryFor.branchId)
            .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    }, [viewingHistoryFor, allPayments]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">ERP Billings & Payments</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                    <p className="text-sm text-blue-700">Total Revenue (Filtered Period)</p>
                    <p className="text-3xl font-bold text-blue-600">{totalRevenueFiltered.toLocaleString()}</p>
                </Card>
                <Card>
                    <p className="text-sm text-red-700">Total Unpaid Bills (System-wide, All Time)</p>
                    <p className="text-3xl font-bold text-red-600">{totalUnpaidBills.toLocaleString()}</p>
                </Card>
            </div>
            
            <Card>
                <div className="space-y-4 mb-4 pb-4 border-b">
                    <Input
                        placeholder="Search by School Name or Registration ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <Input label="From Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <Input label="To Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} />
                        <div>
                            <label className="block text-sm font-medium">School Status</label>
                            <select value={filterSchoolStatus} onChange={e => setFilterSchoolStatus(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 mt-1">
                                <option value="all">All</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Payment Status</label>
                            <select value={filterPaymentStatus} onChange={e => setFilterPaymentStatus(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 mt-1">
                                <option value="all">All</option>
                                <option value="paid">Paid</option>
                                <option value="partially paid">Partially Paid</option>
                                <option value="due">Due</option>
                                <option value="not applicable">Not Applicable</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <Button variant="secondary" onClick={handleClearFilters} className="w-full">Clear Filters</Button>
                        </div>
                    </div>
                </div>


                {loading ? <p>Loading payment records...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b">
                                <tr>
                                    <th className="p-4">School</th>
                                    <th className="p-4 text-center">School Status</th>
                                    <th className="p-4 text-right">Balance (Cumulative)</th>
                                    <th className="p-4 text-center">Last Payment</th>
                                    <th className="p-4 text-center">Next Due</th>
                                    <th className="p-4 text-center">Days Overdue</th>
                                    <th className="p-4 text-center">Payment Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBillingData.map(record => (
                                    <tr key={record.branchId} className="border-b hover:bg-slate-50">
                                        <td className="p-4">
                                            <p className="font-medium">{record.branchName}</p>
                                            <p className="text-xs font-mono text-text-secondary-dark">{record.registrationId}</p>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChipClass(record.branchStatus)}`}>
                                                {record.branchStatus}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-semibold text-red-700">{record.cumulativeBalance.toLocaleString()}</td>
                                        <td className="p-4 text-center text-sm">
                                            {record.lastPaymentDate ? (() => {
                                                const [year, month, day] = record.lastPaymentDate.split('-').map(Number);
                                                return new Date(year, month - 1, day).toLocaleDateString();
                                            })() : 'N/A'}
                                        </td>
                                        <td className="p-4 text-center text-sm">
                                            {(() => {
                                                if (record.upcomingPaymentDate === 'Not Set') return 'Not Set';
                                                const [year, month, day] = record.upcomingPaymentDate.split('-').map(Number);
                                                return new Date(year, month - 1, day).toLocaleDateString();
                                            })()}
                                        </td>
                                        <td className={`p-4 text-center font-bold ${record.defaultDays > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {record.defaultDays > 0 ? `${record.defaultDays} days` : 'On Time'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusChipClass(record.cumulativePaymentStatus)}`}>
                                                {record.cumulativePaymentStatus.charAt(0).toUpperCase() + record.cumulativePaymentStatus.slice(1)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <Button
                                                    variant="primary"
                                                    className="!px-3 !py-1 text-xs"
                                                    onClick={() => setMarkingPaymentFor(record)}
                                                >
                                                    Mark as Paid
                                                </Button>
                                                <Button 
                                                    variant="secondary" 
                                                    className="!px-3 !py-1 text-xs"
                                                    onClick={() => setViewingHistoryFor(record)}
                                                >
                                                    View History
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredBillingData.length === 0 && <p className="text-center p-8 text-text-secondary-dark">No records found for the selected criteria.</p>}
                    </div>
                )}
            </Card>

            {viewingHistoryFor && (
                <ErpPaymentHistoryModal
                    isOpen={!!viewingHistoryFor}
                    onClose={() => setViewingHistoryFor(null)}
                    branchName={viewingHistoryFor.branchName}
                    payments={filteredPaymentsForModal}
                />
            )}
             {markingPaymentFor && settings && (
                <MarkAsPaidModal
                    record={markingPaymentFor}
                    branch={allBranches.find(b => b.id === markingPaymentFor.branchId)!}
                    settings={settings}
                    onClose={() => setMarkingPaymentFor(null)}
                    onSave={() => {
                        setMarkingPaymentFor(null);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
};

export default ErpPayments;