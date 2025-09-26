
import React, { useState } from 'react';
import type { SchoolClass, FeeTemplate } from '../../types.ts';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';

interface AssignFeeTemplateModalProps {
  schoolClass: SchoolClass;
  feeTemplates: FeeTemplate[];
  onClose: () => void;
  onSave: (classId: string, feeTemplateId: string | null) => Promise<void>;
}

const AssignFeeTemplateModal: React.FC<AssignFeeTemplateModalProps> = ({ schoolClass, feeTemplates, onClose, onSave }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(schoolClass.feeTemplateId || '');
    const [isSaving, setIsSaving] = useState(false);

    const relevantTemplates = feeTemplates.filter(ft => ft.gradeLevel === schoolClass.gradeLevel);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(schoolClass.id, selectedTemplateId || null);
        setIsSaving(false);
    };
    
    const handleUnassign = async () => {
        setIsSaving(true);
        await onSave(schoolClass.id, null);
        setIsSaving(false);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-xl font-bold text-text-primary-dark mb-2">Assign Fee Template</h2>
                <p className="text-text-secondary-dark mb-4">For Class: <strong>Grade {schoolClass.gradeLevel} - {schoolClass.section}</strong></p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Fee Template</label>
                        <select
                            value={selectedTemplateId}
                            onChange={e => setSelectedTemplateId(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                        >
                            <option value="">-- No Fee Template --</option>
                            {relevantTemplates.map(ft => (
                                <option key={ft.id} value={ft.id}>{ft.name} ({ft.amount.toLocaleString()})</option>
                            ))}
                        </select>
                         {relevantTemplates.length === 0 && <p className="text-xs text-slate-500 mt-1">No fee templates found for Grade {schoolClass.gradeLevel}. Please create one in the Fee Management section.</p>}
                    </div>
                </div>
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                     <Button variant="danger" onClick={handleUnassign} disabled={isSaving || !schoolClass.feeTemplateId}>
                        Unassign & Clear Fees
                    </Button>
                    <div className="flex gap-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Assignment'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AssignFeeTemplateModal;