import React from 'react';
import type { FeeHistoryItem } from '../../types.ts';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';

interface FeeHistoryTableProps {
  history: FeeHistoryItem[];
}

const FeeHistoryTable: React.FC<FeeHistoryTableProps> = ({ history }) => {
    const handleDownloadReceipt = (transactionId: string) => {
        alert(`Downloading receipt for transaction ${transactionId}... (mock action)`);
    };

    return (
        <div className="overflow-auto flex-grow pr-2">
            {history.length > 0 ? (
                 <table className="w-full text-left">
                    <thead className="sticky top-0 bg-surface-dark/90 backdrop-blur-sm">
                        <tr className="border-b">
                            <th className="p-2">Date</th>
                            <th className="p-2">Description</th>
                            <th className="p-2 text-right">Amount</th>
                            <th className="p-2 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(item => {
                            if ('transactionId' in item) { // FeePayment
                                return (
                                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 text-sm">
                                        <td className="p-2">{new Date(item.paidDate).toLocaleDateString()}</td>
                                        <td className="p-2">Payment Received</td>
                                        <td className="p-2 text-right font-semibold text-green-600">+{item.amount.toLocaleString()}</td>
                                        <td className="p-2 text-right">
                                            <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => handleDownloadReceipt(item.transactionId)}>Receipt</Button>
                                        </td>
                                    </tr>
                                );
                            } else { // FeeAdjustment
                                return (
                                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 text-sm">
                                        <td className="p-2">{new Date(item.date).toLocaleDateString()}</td>
                                        <td className="p-2">
                                            <p className="font-medium capitalize">{item.type}</p>
                                            <p className="text-xs text-text-secondary-dark italic">"{item.reason}" - {item.adjustedBy}</p>
                                        </td>
                                        <td className={`p-2 text-right font-semibold ${item.amount > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                                            {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}
                                        </td>
                                        <td className="p-2 text-right"></td>
                                    </tr>
                                );
                            }
                        })}
                    </tbody>
                </table>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-text-secondary-dark">No payment history found.</p>
                </div>
            )}
        </div>
    );
};

interface FeeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string; // Now required as this is always a modal
  history: FeeHistoryItem[];
}

const FeeHistoryModal: React.FC<FeeHistoryModalProps> = ({ isOpen, onClose, studentName, history }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <Card className="w-full max-w-2xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-text-primary-dark">Fee Payment History for {studentName}</h2>
                    <button onClick={onClose} className="text-3xl font-light text-slate-500 hover:text-slate-800 leading-none">&times;</button>
                </div>
                
                <FeeHistoryTable history={history} />

                <div className="mt-4 text-right pt-4 border-t">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </Card>
        </div>
    );
};

export default FeeHistoryModal;
