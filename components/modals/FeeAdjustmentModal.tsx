import React, { useState } from 'react';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Input from '../ui/Input.tsx';
import { principalApiService as apiService } from '../../services';
import { useAuth } from '../../hooks/useAuth.ts';

interface FeeAdjustmentModalProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSave: () => void;
}

const FeeAdjustmentModal: React.FC<FeeAdjustmentModalProps> = ({ studentId, studentName, onClose, onSave }) => {
    const { user } = useAuth();
    const [type, setType] = useState<'concession' | 'charge'>('concession');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!user || user.role !== 'Principal') {
            setError('Unauthorized action.');
            return;
        }
        if (Number(amount) <= 0) {
            setError('Amount must be a positive number.');
            return;
        }
        setIsSaving(true);
        try {
            // FIX: Implemented missing API call to add a fee adjustment
            await apiService.addFeeAdjustment(studentId, type, Number(amount), reason, user.name);
            onSave();
        } catch (err) {
            console.error(err);
            setError('Failed to save adjustment. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-xl font-bold text-text-primary-dark mb-2">Adjust Fees for {studentName}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Adjustment Type</label>
                        <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3">
                            <option value="concession">Concession / Discount (-)</option>
                            <option value="charge">Miscellaneous Charge (+)</option>
                        </select>
                    </div>
                    <Input
                        label="Amount"
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        min="0.01"
                        step="0.01"
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Reason</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            rows={3}
                            className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Apply Adjustment'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default FeeAdjustmentModal;