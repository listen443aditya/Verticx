import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { principalApiService } from '../../services';
import type { PayrollStaffDetails } from '../../types.ts';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Input from '../ui/Input.tsx';

interface SalaryAdjustmentModalProps {
  staff: PayrollStaffDetails;
  month: string;
  onClose: () => void;
  onSave: () => void;
}

const SalaryAdjustmentModal: React.FC<SalaryAdjustmentModalProps> = ({ staff, month, onClose, onSave }) => {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [type, setType] = useState<'bonus' | 'deduction'>('bonus');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !reason || !user) return;
        const finalAmount = type === 'bonus' ? Number(amount) : -Number(amount);
        setIsSaving(true);
        await principalApiService.addManualSalaryAdjustment(user.branchId!, staff.staffId, finalAmount, reason, user.name, month);
        setIsSaving(false);
        onSave();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-xl font-bold mb-2">Adjust Salary for {staff.staffName}</h2>
                <p className="text-sm text-text-secondary-dark mb-4">Current Net Payable: {staff.netPayable?.toLocaleString()}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium">Adjustment Type</label>
                        <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 mt-1">
                            <option value="bonus">Bonus / Addition</option>
                            <option value="deduction">Deduction</option>
                        </select>
                    </div>
                    <Input label="Amount" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} required />
                    <Input label="Reason for Adjustment" value={reason} onChange={e => setReason(e.target.value)} required />
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Apply Adjustment'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default SalaryAdjustmentModal;