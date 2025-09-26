import React from 'react';
import type { StudentDashboardData } from '../../types.ts';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';

interface FeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  fees: StudentDashboardData['fees'];
}

// This is the core table logic, kept internal to avoid changing file structure.
const FeeDetailsTable: React.FC<{ fees: StudentDashboardData['fees'] }> = ({ fees }) => {
    const { monthlyDues, previousSessionDues, previousSessionDuesPaid } = fees;

    // Robustness check for data
    if (!Array.isArray(monthlyDues)) {
        return (
            <div className="text-center p-4 text-red-500">
                Error: Fee details are currently unavailable due to a data issue.
            </div>
        );
    }

    return (
        <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface-dark/90 backdrop-blur-sm">
                <tr className="border-b">
                    <th className="p-2 w-1/4">Month / Item</th>
                    <th className="p-2 w-1/4">Amount Due</th>
                    <th className="p-2 w-1/4 text-right">Amount Paid</th>
                    <th className="p-2 w-1/4 text-center">Status</th>
                </tr>
            </thead>
            <tbody>
                {previousSessionDues && previousSessionDues > 0 && (
                     <tr className="border-b border-slate-100 text-sm bg-orange-50">
                         <td className="p-2 font-semibold align-top">Previous Dues</td>
                         <td className="p-2 font-bold align-top">{previousSessionDues.toLocaleString()}</td>
                         <td className="p-2 text-right font-bold align-top text-green-700">{(previousSessionDuesPaid || 0).toLocaleString()}</td>
                         <td className="p-2 text-center align-top">
                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${previousSessionDues - (previousSessionDuesPaid || 0) > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {previousSessionDues - (previousSessionDuesPaid || 0) > 0 ? 'Due' : 'Paid'}
                             </span>
                         </td>
                     </tr>
                )}
                {monthlyDues.map((due, index) => {
                    // Defensive check for each item in the array
                    if (!due || typeof due.month !== 'string' || typeof due.year !== 'number') {
                        return null; // Skip rendering invalid entries
                    }
                    const statusChip = {
                        'Paid': 'bg-green-100 text-green-800',
                        'Partially Paid': 'bg-yellow-100 text-yellow-800',
                        'Due': 'bg-red-100 text-red-800'
                    }[due.status];
                    
                    return (
                        <tr key={index} className="border-b border-slate-100 text-sm">
                            <td className="p-2 font-semibold align-top">{due.month} {due.year}</td>
                            <td className="p-2 align-top font-bold">{(Number(due.total) || 0).toLocaleString()}</td>
                            <td className="p-2 text-right align-top font-semibold text-green-700">{(Number(due.paid) || 0).toLocaleString()}</td>
                            <td className="p-2 text-center align-top">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusChip}`}>{due.status}</span>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};


const FeeDetailsModal: React.FC<FeeDetailsModalProps> = ({ isOpen, onClose, studentName, fees }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary-dark">Fee Structure &amp; Status</h2>
                        <p className="text-text-secondary-dark">For: {studentName}</p>
                    </div>
                    <button onClick={onClose} className="text-3xl font-light text-slate-500 hover:text-slate-800 leading-none">&times;</button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2">
                    <FeeDetailsTable fees={fees} />
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="text-sm">
                        <p><strong>Total Annual Fee:</strong> {fees.totalAnnualFee.toLocaleString()}</p>
                        <p><strong>Total Paid:</strong> {fees.totalPaid.toLocaleString()}</p>
                        <p className="font-bold"><strong>Total Outstanding:</strong> {fees.totalOutstanding.toLocaleString()}</p>
                    </div>
                    <Button onClick={onClose}>Close</Button>
                </div>
            </Card>
        </div>
    );
};

export default FeeDetailsModal;