import React, { useState, useMemo } from 'react';
// FIX: Changed User import to only what's needed, improving type safety.
import type { MonthlyDue, Student, Branch } from '../../types.ts';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';
// FIX: Switched to studentApiService to directly fetch student fee data.
import { studentApiService } from '../../services';

// This lets TypeScript know that the Razorpay object will be available on the window object
// because it's included via a <script> tag in index.html.
declare var Razorpay: any;

interface PayFeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  branch: Branch;
  // FIX: Changed prop from User to a more generic object for flexibility.
  parent: { name: string; email: string; phone?: string; };
}

const PayFeesModal: React.FC<PayFeesModalProps> = ({ isOpen, onClose, student, branch, parent }) => {
    const { triggerRefresh } = useDataRefresh();
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [isPaying, setIsPaying] = useState(false);
    const [error, setError] = useState('');
    
    // This is a new, local fetch within the modal to ensure it always has the freshest fee data.
    const [monthlyDues, setMonthlyDues] = useState<MonthlyDue[] | null>(null);
    const [previousSessionDues, setPreviousSessionDues] = useState<number | undefined>(undefined);

    React.useEffect(() => {
        if (isOpen) {
            // FIX: Corrected API service and method to fetch student-specific dashboard data.
            studentApiService.getStudentDashboardData(student.id).then(data => {
                setMonthlyDues(data.fees.monthlyDues);
                setPreviousSessionDues(data.fees.previousSessionDues);
            });
        }
    }, [isOpen, student.id]);

    const handleMonthToggle = (month: string) => {
        setSelectedMonths(prev => 
            prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
        );
    };

    const { totalToPay, previousDuesToPay, unpaidDues } = useMemo(() => {
        if (!Array.isArray(monthlyDues)) {
            return { totalToPay: 0, previousDuesToPay: 0, unpaidDues: [] };
        }
        
        const validUnpaidDues = monthlyDues.filter(due => due && due.status !== 'Paid' && typeof due.balance === 'number' && due.balance > 0);
        const previousDues = previousSessionDues || 0;
        
        const selectedMonthDues = validUnpaidDues
            .filter(due => due && typeof due.month === 'string' && selectedMonths.includes(due.month))
            .reduce((sum, due) => sum + (due.balance || 0), 0);
        
        return {
            totalToPay: previousDues + selectedMonthDues,
            previousDuesToPay: previousDues,
            unpaidDues: validUnpaidDues,
        };
    }, [selectedMonths, monthlyDues, previousSessionDues]);


    const handleRazorpayPayment = () => {
        setError('');
        if (!branch.paymentGatewayPublicKey) {
            setError("Online payment is not configured for this branch. Please contact administration.");
            return;
        }

        setIsPaying(true);

        const options = {
            key: branch.paymentGatewayPublicKey,
            amount: totalToPay * 100, // Amount in the smallest currency unit (paise for INR)
            currency: "INR",
            name: branch.name,
            description: `Fee payment for ${student.name}`,
            handler: async (response: any) => {
                // This function is called on successful payment
                try {
                    // FIX: Changed from parentApiService to studentApiService for consistency, though it's a shared method.
                    await studentApiService.recordFeePayment({
                        razorpay_payment_id: response.razorpay_payment_id,
                        notes: {
                            studentId: student.id,
                            amountPaid: totalToPay,
                            paidMonths: selectedMonths,
                            previousDuesPaid: previousDuesToPay,
                        }
                    });
                    triggerRefresh();
                    onClose();
                } catch (apiError) {
                    setError("Payment successful, but failed to record transaction. Please contact the school.");
                } finally {
                    setIsPaying(false);
                }
            },
            prefill: {
                name: parent.name,
                email: parent.email,
                contact: parent.phone || student.guardianInfo.phone,
            },
            notes: {
                student_id: student.id,
                student_name: student.name,
                branch_id: branch.id,
                paid_months: selectedMonths.join(', '),
                previous_dues_paid: previousDuesToPay,
                amount_in_paise: totalToPay * 100,
            },
            theme: {
                color: "#4F46E5",
            },
            modal: {
                ondismiss: () => {
                    setIsPaying(false); // Re-enable button if user closes the modal
                }
            }
        };

        try {
            const rzp = new Razorpay(options);
            rzp.on('payment.failed', (response: any) => {
                setError(`Payment failed: ${response.error.description}`);
                setIsPaying(false);
            });
            rzp.open();
        } catch (e) {
            console.error(e);
            setError("Could not initiate payment. Please ensure you are connected to the internet.");
            setIsPaying(false);
        }
    };
    

    if (!isOpen) return null;

    if (!Array.isArray(monthlyDues)) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md text-center">
                    <p>Loading fee details...</p>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <Card className="w-full max-w-lg">
                <h2 className="text-2xl font-bold text-text-primary-dark mb-4">Pay School Fees Online</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {previousDuesToPay > 0 && (
                        <div className="bg-orange-100 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold text-orange-800">Previous Session Dues</p>
                                <p className="text-xs text-orange-700">(Automatically included in total)</p>
                            </div>
                            <p className="font-semibold text-orange-800">{previousDuesToPay.toLocaleString()}</p>
                        </div>
                    )}
                    {unpaidDues.map(due => {
                         if (!due || typeof due.month !== 'string' || typeof due.year !== 'number') {
                             return null;
                         }
                         return (
                             <label key={due.month} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedMonths.includes(due.month)}
                                        onChange={() => handleMonthToggle(due.month)}
                                        className="h-5 w-5 rounded border-gray-300 text-brand-secondary focus:ring-brand-accent"
                                    />
                                    <div className="ml-3">
                                        <p className="font-semibold">{due.month} {due.year}</p>
                                        <p className="text-xs text-text-secondary-dark">Balance Due</p>
                                    </div>
                                </div>
                                <p className="font-bold text-red-600">{due.balance.toLocaleString()}</p>
                            </label>
                         );
                    })}
                </div>

                 <div className="mt-6 pt-4 border-t text-center">
                    <p className="text-sm text-text-secondary-dark">Total Amount to Pay</p>
                    <p className="text-4xl font-extrabold text-brand-primary my-2">{totalToPay.toLocaleString()}</p>
                    {error && <p className="text-sm text-red-500 my-2">{error}</p>}
                    <div className="flex justify-end gap-4 mt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isPaying}>
                            Cancel
                        </Button>
                        <Button onClick={handleRazorpayPayment} disabled={isPaying || totalToPay <= 0}>
                            {isPaying ? 'Processing...' : `Pay ${totalToPay.toLocaleString()} with Razorpay`}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PayFeesModal;
