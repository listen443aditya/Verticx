import React, { useState, useMemo, useEffect } from "react";
import type { MonthlyDue, Student, Branch } from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { useDataRefresh } from "../../contexts/DataRefreshContext";
import { useAuth } from "../../hooks/useAuth";
import { ParentApiService, StudentApiService } from "../../services";

const parentApiService = new ParentApiService();
const studentApiService = new StudentApiService();

declare var Razorpay: any;

interface PayFeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  branch: Branch;
  parent: { name: string; email: string; phone?: string };
  // FIX: Allow previousSessionDues to be optional/undefined to match StudentDashboard types
  fees?: {
    monthlyDues: MonthlyDue[];
    previousSessionDues?: number;
    totalOutstanding: number;
  };
}

const PayFeesModal: React.FC<PayFeesModalProps> = ({
  isOpen,
  onClose,
  student,
  branch,
  parent,
  fees,
}) => {
  const { user } = useAuth();
  const { triggerRefresh } = useDataRefresh();
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");

  const [monthlyDues, setMonthlyDues] = useState<MonthlyDue[] | null>(null);
  const [previousSessionDues, setPreviousSessionDues] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setError("");

      // If fees are passed via props (Student Dashboard), use them directly.
      if (fees) {
        setMonthlyDues(fees.monthlyDues);
        // Safe fallback to 0 if undefined
        setPreviousSessionDues(fees.previousSessionDues || 0);
      }
      // Fallback: If no fees prop (Parent Portal), fetch using Parent API
      else if (user?.role === "Parent") {
        parentApiService
          .getParentDashboardData()
          .then((data) => {
            const childData = data.childrenData.find(
              (child) => child.student.id === student.id
            );
            if (childData) {
              setMonthlyDues(childData.fees.monthlyDues);
              setPreviousSessionDues(childData.fees.previousSessionDues || 0);
            } else {
              setError("Could not load fee details for this student.");
            }
          })
          .catch(() => {
            setError("Failed to fetch fee data.");
          });
      }
    }
  }, [isOpen, student.id, fees, user?.role]);

  const handleMonthToggle = (month: string) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  const { totalToPay, previousDuesToPay, unpaidDues } = useMemo(() => {
    if (!Array.isArray(monthlyDues)) {
      return { totalToPay: 0, previousDuesToPay: 0, unpaidDues: [] };
    }

    // Filter for unpaid dues that have a valid positive amount
    const validUnpaidDues = monthlyDues.filter(
      (due) =>
        due &&
        due.status !== "Paid" &&
        // Handle both 'total' (from new logic) and 'balance' (legacy) if needed
        (typeof due.total === "number" ||
          typeof (due as any).balance === "number")
    );

    const previousDues = previousSessionDues || 0;

    const selectedMonthDues = validUnpaidDues
      .filter(
        (due) =>
          due &&
          typeof due.month === "string" &&
          selectedMonths.includes(due.month)
      )
      .reduce((sum, due) => sum + (due.total || (due as any).balance || 0), 0);

    return {
      totalToPay: previousDues + selectedMonthDues,
      previousDuesToPay: previousDues,
      unpaidDues: validUnpaidDues,
    };
  }, [selectedMonths, monthlyDues, previousSessionDues]);

  const handleRazorpayPayment = () => {
    setError("");
    if (!branch.paymentGatewayPublicKey) {
      setError("Online payment is not configured. Contact administration.");
      return;
    }

    setIsPaying(true);

    const options = {
      key: branch.paymentGatewayPublicKey,
      amount: totalToPay * 100, // Amount in paise
      currency: "INR",
      name: branch.name,
      description: `Fee payment for ${student.name}`,
      handler: async (response: any) => {
        try {
          const paymentPayload = {
            razorpay_payment_id: response.razorpay_payment_id,
            notes: {
              studentId: student.id,
              amountPaid: totalToPay,
              paidMonths: selectedMonths,
              previousDuesPaid: previousDuesToPay,
            },
          };

          if (user?.role === "Student") {
            await studentApiService.recordFeePayment(paymentPayload);
          } else {
            await parentApiService.recordFeePayment(paymentPayload);
          }

          triggerRefresh();
          onClose();
          alert("Payment Successful!");
        } catch (apiError) {
          console.error(apiError);
          setError("Payment successful, but failed to record transaction.");
        } finally {
          setIsPaying(false);
        }
      },
      prefill: {
        name: parent?.name || user?.name,
        email: parent?.email || user?.email,
        contact: parent?.phone,
      },
      theme: { color: "#4F46E5" },
      modal: {
        ondismiss: () => setIsPaying(false),
      },
    };

    try {
      const rzp = new Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        setError(`Payment failed: ${response.error.description}`);
        setIsPaying(false);
      });
      rzp.open();
    } catch (e) {
      console.error(e);
      setError("Could not initiate payment. Check internet connection.");
      setIsPaying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
    >
      <Card className="w-full max-w-lg">
        <h2 className="text-2xl font-bold text-text-primary-dark mb-4">
          Pay School Fees Online
        </h2>

        {!monthlyDues ? (
          <div className="text-center py-8 text-slate-500">
            Loading fee details...
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {previousDuesToPay > 0 && (
              <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-bold text-orange-800">Previous Dues</p>
                  <p className="text-xs text-orange-600">
                    (Must be paid first)
                  </p>
                </div>
                <p className="font-semibold text-orange-800">
                  {previousDuesToPay.toLocaleString()}
                </p>
              </div>
            )}

            {unpaidDues.length > 0
              ? unpaidDues.map((due) => (
                  <label
                    key={`${due.month}-${due.year}`}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedMonths.includes(due.month)
                        ? "bg-indigo-50 border-indigo-200"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedMonths.includes(due.month)}
                        onChange={() => handleMonthToggle(due.month)}
                        className="h-5 w-5 rounded border-gray-300 text-brand-secondary focus:ring-brand-accent"
                      />
                      <div className="ml-3">
                        <p className="font-semibold text-slate-800">
                          {due.month} {due.year}
                        </p>
                        <p className="text-xs text-slate-500">Due Amount</p>
                      </div>
                    </div>
                    <p className="font-bold text-slate-700">
                      {(
                        due.total ||
                        (due as any).balance ||
                        0
                      ).toLocaleString()}
                    </p>
                  </label>
                ))
              : previousDuesToPay === 0 && (
                  <div className="text-center py-6 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-green-700 font-medium">
                      No outstanding fees! 🎉
                    </p>
                  </div>
                )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-sm text-text-secondary-dark">
            Total Amount to Pay
          </p>
          <p className="text-4xl font-extrabold text-brand-primary my-2">
            {totalToPay.toLocaleString()}
          </p>

          {error && (
            <p className="text-sm text-red-500 my-2 bg-red-50 p-2 rounded">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-4 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isPaying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRazorpayPayment}
              disabled={isPaying || totalToPay <= 0}
            >
              {isPaying
                ? "Processing..."
                : `Pay ₹${totalToPay.toLocaleString()}`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PayFeesModal;
