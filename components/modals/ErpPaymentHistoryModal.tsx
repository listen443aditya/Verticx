import React from 'react';
import type { ErpPayment } from '../../types.ts';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';

interface ErpPaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchName: string;
  payments: ErpPayment[];
}

const ErpPaymentHistoryModal: React.FC<ErpPaymentHistoryModalProps> = ({ isOpen, onClose, branchName, payments }) => {
    if (!isOpen) return null;

    const handleDownloadReceipt = (transactionId: string) => {
        alert(`Downloading receipt for transaction ${transactionId}... (mock action)`);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <Card className="w-full max-w-2xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary-dark">ERP Payment History</h2>
                        <p className="text-text-secondary-dark">For: {branchName}</p>
                    </div>
                    <button onClick={onClose} className="text-3xl font-light text-slate-500 hover:text-slate-800 leading-none">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    {payments.length === 0 ? (
                        <p className="text-center p-8 text-text-secondary-dark">No payment history found for this school.</p>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-200 text-sm text-text-secondary-dark sticky top-0 bg-surface-dark">
                                <tr>
                                    <th className="p-4">Payment Date</th>
                                    <th className="p-4">Transaction ID</th>
                                    <th className="p-4 text-right">Amount Paid</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(payment => (
                                    <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-4 font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                        <td className="p-4 font-mono text-xs">{payment.transactionId}</td>
                                        <td className="p-4 text-right font-semibold text-green-600">{payment.amount.toLocaleString()}</td>
                                        <td className="p-4 text-right">
                                            <Button variant="secondary" className="!px-3 !py-1 text-xs" onClick={() => handleDownloadReceipt(payment.transactionId)}>
                                                Receipt
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="mt-4 pt-4 border-t text-right">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </Card>
        </div>
    );
};

export default ErpPaymentHistoryModal;
