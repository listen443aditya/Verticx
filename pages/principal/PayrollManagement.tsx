import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { principalApiService } from '../../services';
import type { PayrollStaffDetails } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import Input from '../../components/ui/Input.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';
import ConfirmationModal from '../../components/ui/ConfirmationModal.tsx';
import SalaryAdjustmentModal from '../../components/modals/SalaryAdjustmentModal.tsx';


const PayrollManagement: React.FC = () => {
    const { user } = useAuth();
    const { refreshKey, triggerRefresh } = useDataRefresh();
    const [payrollData, setPayrollData] = useState<PayrollStaffDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
    
    const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
    const [adjustingStaff, setAdjustingStaff] = useState<PayrollStaffDetails | null>(null);
    const [confirmingPayment, setConfirmingPayment] = useState<PayrollStaffDetails[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const monthString = useMemo(() => {
        if (!selectedMonth) return '';
        const [year, month] = selectedMonth.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }, [selectedMonth]);


    const fetchData = useCallback(async () => {
        if (!user?.branchId) return;
        setLoading(true);
        const data = await principalApiService.getStaffPayrollForMonth(user.branchId, selectedMonth);
        setPayrollData(data);
        setLoading(false);
    }, [user, refreshKey, selectedMonth]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const pendingIds = payrollData.filter(p => p.status === 'Pending').map(p => p.staffId);
            setSelectedStaffIds(new Set(pendingIds));
        } else {
            setSelectedStaffIds(new Set());
        }
    };
    
    const handleSelectOne = (staffId: string) => {
        setSelectedStaffIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(staffId)) {
                newSet.delete(staffId);
            } else {
                newSet.add(staffId);
            }
            return newSet;
        });
    };
    
    const handleProcessPayment = async () => {
        if (!user || confirmingPayment.length === 0) return;
        setIsProcessing(true);
        await principalApiService.processPayroll(confirmingPayment, user.name);
        setIsProcessing(false);
        setConfirmingPayment([]);
        setSelectedStaffIds(new Set());
        triggerRefresh();
    };

    const handleGenerateReport = () => {
        alert(`Generating payroll report for ${monthString}... (mock action)`);
        console.log("Payroll Data:", payrollData);
    };
    
    const isAllSelected = payrollData.filter(p => p.status === 'Pending').length > 0 && selectedStaffIds.size === payrollData.filter(p => p.status === 'Pending').length;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary-dark mb-1">Staff Payroll</h1>
                    <p className="text-text-secondary-dark">Payroll calculation for {monthString}</p>
                </div>
                <div className="w-48">
                    <Input 
                        label="Select Month"
                        type="month"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => {
                                const toPay = payrollData.filter(p => selectedStaffIds.has(p.staffId));
                                setConfirmingPayment(toPay);
                            }}
                            disabled={selectedStaffIds.size === 0}
                        >
                            Mark {selectedStaffIds.size} Selected as Paid
                        </Button>
                    </div>
                    <Button variant="secondary" onClick={handleGenerateReport}>Generate Report</Button>
                </div>

                {loading ? <p>Calculating payroll...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b">
                                <tr>
                                    <th className="p-2"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
                                    <th className="p-2">Staff Member</th>
                                    <th className="p-2 text-right">Base Salary</th>
                                    <th className="p-2 text-right">Unpaid Leaves</th>
                                    <th className="p-2 text-right">Leave Deductions</th>
                                    <th className="p-2 text-right">Adjustments</th>
                                    <th className="p-2 text-right">Net Payable</th>
                                    <th className="p-2 text-center">Status</th>
                                    <th className="p-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrollData.map(staff => (
                                    <tr key={staff.staffId} className="border-b">
                                        <td className="p-2">
                                            {staff.status === 'Pending' && <input type="checkbox" checked={selectedStaffIds.has(staff.staffId)} onChange={() => handleSelectOne(staff.staffId)}/>}
                                        </td>
                                        <td className="p-2 font-medium">{staff.staffName} <span className="text-xs text-slate-500">({staff.staffRole})</span></td>
                                        <td className="p-2 text-right">{staff.baseSalary !== null ? staff.baseSalary.toLocaleString() : 'N/A'}</td>
                                        <td className="p-2 text-right text-orange-600">{staff.unpaidLeaveDays}</td>
                                        <td className="p-2 text-right text-red-600">{staff.leaveDeductions !== null ? `-${staff.leaveDeductions.toLocaleString()}` : 'N/A'}</td>
                                        <td className="p-2 text-right text-blue-600">{staff.manualAdjustmentsTotal.toLocaleString()}</td>
                                        <td className="p-2 text-right font-bold text-lg text-green-700">{staff.netPayable !== null ? staff.netPayable.toLocaleString() : 'N/A'}</td>
                                        <td className="p-2 text-center">
                                            {staff.status === 'Paid' ? (
                                                <span className="text-xs text-green-600">Paid on {new Date(staff.paidAt!).toLocaleDateString()}</span>
                                            ) : staff.status === 'Salary Not Set' ? (
                                                <span className="text-xs text-red-600 font-semibold">Salary Not Set</span>
                                            ) : (
                                                 <span className="text-xs text-yellow-600">Pending</span>
                                            )}
                                        </td>
                                        <td className="p-2 text-right">
                                            {staff.status === 'Pending' && (
                                                <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => setAdjustingStaff(staff)}>Adjust</Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {adjustingStaff && (
                <SalaryAdjustmentModal
                    staff={adjustingStaff}
                    month={selectedMonth}
                    onClose={() => setAdjustingStaff(null)}
                    onSave={() => { setAdjustingStaff(null); triggerRefresh(); }}
                />
            )}
            {confirmingPayment.length > 0 && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setConfirmingPayment([])}
                    onConfirm={handleProcessPayment}
                    isConfirming={isProcessing}
                    title={`Confirm Payment for ${confirmingPayment.length} Staff`}
                    message={
                        <div>
                            <p>You are about to mark the following salaries as paid for {monthString}. This will create a permanent financial record.</p>
                            <ul className="text-sm list-disc pl-5 mt-2 max-h-40 overflow-y-auto">
                                {confirmingPayment.map(p => <li key={p.staffId}>{p.staffName}: <strong>{p.netPayable?.toLocaleString() || 'N/A'}</strong></li>)}
                            </ul>
                        </div>
                    }
                    confirmText="Confirm & Pay"
                    confirmVariant="primary"
                />
            )}
        </div>
    );
};

export default PayrollManagement;