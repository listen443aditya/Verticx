import React, { useState } from "react";
import type { Branch, User } from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { PrincipalApiService } from "../../services/principalApiService";

declare var Razorpay: any;
const principalApiService = new PrincipalApiService();

interface PayErpBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  branch: Branch;
  principal: User;
}

const PayErpBillModal: React.FC<PayErpBillModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  branch,
  principal,
}) => {
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = () => {
    setError("");
    if (!branch.paymentGatewayPublicKey) {
      setError("Online payment is not configured for this school.");
      return;
    }
    setIsPaying(true);

    const options = {
      key: branch.paymentGatewayPublicKey,
      amount: amount * 100,
      currency: "INR",
      name: branch.name,
      description: "ERP Subscription Bill Payment",
      handler: async (response: any) => {
        try {
          // FIX: The `payErpBill` method in the new service expects only two arguments.
          // The branch is inferred by the backend from the user's session.
          await principalApiService.payErpBill(
            amount,
            response.razorpay_payment_id
          );
          onSuccess();
        } catch (apiError) {
          setError(
            "Payment successful, but failed to record. Please contact support."
          );
        } finally {
          setIsPaying(false);
        }
      },
      prefill: {
        name: principal.name,
        email: principal.email,
        contact: principal.phone,
      },
      notes: {
        branch_id: branch.id,
        principal_id: principal.id,
      },
      theme: {
        color: "#4F46E5",
      },
      modal: {
        ondismiss: () => {
          setIsPaying(false);
        },
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
      setError("Could not initiate payment gateway.");
      setIsPaying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Pay ERP Bill</h2>
        <div className="bg-slate-50 p-4 rounded-lg text-center">
          <p className="text-sm text-text-secondary-dark">Amount Due</p>
          <p className="text-4xl font-extrabold text-brand-primary">
            {amount.toLocaleString()}
          </p>
        </div>
        {error && (
          <p className="text-sm text-red-500 text-center my-4">{error}</p>
        )}
        <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isPaying}
          >
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isPaying || amount <= 0}>
            {isPaying ? "Processing..." : `Pay with Razorpay`}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PayErpBillModal;
