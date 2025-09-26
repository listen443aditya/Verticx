import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { teacherApiService as apiService } from '../../services';
import type { Student } from '../../types.ts';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';

interface RaiseComplaintModalProps {
  student: Student;
  onClose: () => void;
  onSubmit: () => void;
}

const RaiseComplaintModal: React.FC<RaiseComplaintModalProps> = ({ student, onClose, onSubmit }) => {
    const { user } = useAuth();
    const [complaintText, setComplaintText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!complaintText.trim() || !user) return;

        setIsSubmitting(true);
        try {
            // FIX: Implemented missing API call to submit a complaint.
            await apiService.raiseComplaintAboutStudent({
                studentId: student.id,
                studentName: student.name,
                branchId: student.branchId,
                raisedById: user.id,
                raisedByName: user.name,
                raisedByRole: 'Teacher',
                complaintText: complaintText,
            });
            onSubmit();
        } catch (error) {
            console.error("Failed to submit complaint:", error);
            alert("An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-xl font-bold mb-2">Raise Complaint Against {student.name}</h2>
                <p className="text-sm text-text-secondary-dark mb-4">This complaint will be logged and visible to the principal, the student, and their parent.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Complaint Details</label>
                        <textarea 
                            value={complaintText} 
                            onChange={e => setComplaintText(e.target.value)}
                            rows={6}
                            className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="danger" disabled={isSubmitting || !complaintText.trim()}>
                            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default RaiseComplaintModal;
