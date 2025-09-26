import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { studentApiService as apiService } from '../../services';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Input from '../ui/Input.tsx';

interface StudentComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StudentComplaintModal: React.FC<StudentComplaintModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [subject, setSubject] = useState('');
    const [complaintText, setComplaintText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !complaintText || !user) return;
        setIsSubmitting(true);
        setStatusMessage('');

        try {
            await apiService.submitTeacherComplaint({
                studentId: user.id,
                subject,
                complaintText,
                status: 'Open',
            });
            setStatusMessage('Your complaint has been submitted to the principal.');
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            setStatusMessage('Failed to submit complaint. Please try again.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-xl font-bold mb-2">Raise a Complaint</h2>
                <p className="text-sm text-text-secondary-dark mb-4">Your complaint will be sent confidentially to the principal for review.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Subject of Complaint" value={subject} onChange={e => setSubject(e.target.value)} required />
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Details</label>
                        <textarea value={complaintText} onChange={e => setComplaintText(e.target.value)} rows={6} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3" required />
                    </div>
                    {statusMessage && <p className="text-center text-sm text-green-600">{statusMessage}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="danger" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default StudentComplaintModal;