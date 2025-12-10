import React from "react";
import type { StudentDashboardData } from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";

interface FeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  fees: StudentDashboardData["fees"];
}

// Internal Table Component
const FeeDetailsTable: React.FC<{ fees: StudentDashboardData["fees"] }> = ({
  fees,
}) => {
  const { monthlyDues, previousSessionDues, previousSessionDuesPaid } = fees;

  // FIX: Define safe local variables with defaults to prevent "undefined" errors
  const safePrevDues = previousSessionDues || 0;
  const safePrevPaid = previousSessionDuesPaid || 0;
  const prevOutstanding = safePrevDues - safePrevPaid;

  if (!Array.isArray(monthlyDues)) {
    return (
      <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
        <p>Detailed breakdown is not available.</p>
      </div>
    );
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead className="sticky top-0 bg-white z-10 shadow-sm">
        <tr className="border-b border-slate-200 bg-slate-50">
          <th className="p-3 text-sm font-bold text-slate-600">Month</th>
          <th className="p-3 text-sm font-bold text-slate-600 text-right">
            Fee Amount
          </th>
          <th className="p-3 text-sm font-bold text-slate-600 text-right">
            Paid
          </th>
          <th className="p-3 text-sm font-bold text-slate-600 text-center">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {/* Previous Dues Row */}
        {safePrevDues > 0 && (
          <tr className="border-b border-slate-100 text-sm bg-orange-50/50">
            <td className="p-3 font-semibold text-orange-800">
              Previous Session Dues
            </td>
            <td className="p-3 text-right font-medium text-slate-700">
              {safePrevDues.toLocaleString()}
            </td>
            <td className="p-3 text-right font-bold text-green-700">
              {safePrevPaid.toLocaleString()}
            </td>
            <td className="p-3 text-center">
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                  prevOutstanding <= 0
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-red-100 text-red-700 border-red-200"
                }`}
              >
                {prevOutstanding <= 0 ? "Paid" : "Due"}
              </span>
            </td>
          </tr>
        )}

        {/* Monthly Rows */}
        {monthlyDues.map((due, index) => {
          if (!due) return null;

          // Safe Status Check
          const status = due.status || "Due";
          let statusClass = "bg-slate-100 text-slate-600 border-slate-200";

          if (status === "Paid")
            statusClass = "bg-green-100 text-green-700 border-green-200";
          else if (status === "Partially Paid")
            statusClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
          else if (status === "Due")
            statusClass = "bg-red-100 text-red-700 border-red-200";

          return (
            <tr
              key={index}
              className="border-b border-slate-100 text-sm hover:bg-slate-50 transition-colors"
            >
              <td className="p-3 font-medium text-slate-700">
                {due.month} {due.year}
              </td>
              <td className="p-3 text-right text-slate-600">
                {(Number(due.total) || 0).toLocaleString()}
              </td>
              <td className="p-3 text-right font-semibold text-slate-800">
                {(Number(due.paid) || 0) > 0
                  ? (Number(due.paid) || 0).toLocaleString()
                  : "-"}
              </td>
              <td className="p-3 text-center">
                <span
                  className={`px-2.5 py-0.5 text-[11px] uppercase tracking-wide font-bold rounded-full border ${statusClass}`}
                >
                  {status}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const FeeDetailsModal: React.FC<FeeDetailsModalProps> = ({
  isOpen,
  onClose,
  studentName,
  fees,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      <Card className="w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Fee Breakdown</h2>
            <p className="text-sm text-slate-500 mt-1">
              Student:{" "}
              <span className="font-semibold text-brand-primary">
                {studentName}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto">
          <FeeDetailsTable fees={fees} />
        </div>

        {/* Footer Summary */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                Total Annual Fee
              </p>
              <p className="text-lg font-semibold text-slate-800">
                {fees.totalAnnualFee.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                Total Paid
              </p>
              <p className="text-lg font-semibold text-green-600">
                {fees.totalPaid.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                Outstanding
              </p>
              <p className="text-lg font-bold text-red-600">
                {fees.totalOutstanding.toLocaleString()}
              </p>
            </div>
          </div>
          <Button onClick={onClose} className="px-6">
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default FeeDetailsModal;
