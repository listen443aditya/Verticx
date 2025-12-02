import React, { useState } from "react";
import { PrincipalApiService } from "../../services/principalApiService";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";

const apiService = new PrincipalApiService();

interface FeeAdjustmentModalProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSave: () => void;
}

const FeeAdjustmentModal: React.FC<FeeAdjustmentModalProps> = ({
  studentId,
  studentName,
  onClose,
  onSave,
}) => {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"concession" | "charge">("concession");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !reason) return;

    setIsSubmitting(true);
    try {
      // FIX: Send the complete object, not just the ID
      await apiService.addFeeAdjustment({
        studentId: studentId,
        type: type,
        amount: Number(amount),
        reason: reason,
      });

      onSave(); // Trigger refresh in parent
      onClose();
    } catch (error) {
      console.error("Failed to add fee adjustment:", error);
      alert("Failed to add adjustment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] p-4">
      <Card className="w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary-dark">
            Adjust Fee for {studentName}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl font-light text-slate-500"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Adjustment Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={type === "concession"}
                  onChange={() => setType("concession")}
                  className="mr-2 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-green-700">
                  Concession (Discount)
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={type === "charge"}
                  onChange={() => setType("charge")}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-red-700">
                  Extra Charge (Fine)
                </span>
              </label>
            </div>
          </div>

          <Input
            label="Amount (INR)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 500"
            required
            min="0"
          />

          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-accent"
              rows={3}
              placeholder={
                type === "concession"
                  ? "e.g., Merit Scholarship, Sibling Discount"
                  : "e.g., Late Fee, Damaged Library Book"
              }
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !amount || !reason}
              variant={type === "concession" ? "primary" : "danger"}
            >
              {isSubmitting ? "Saving..." : "Save Adjustment"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default FeeAdjustmentModal;
