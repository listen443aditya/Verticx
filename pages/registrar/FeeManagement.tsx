import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { RegistrarApiService } from "../../services/registrarApiService";
import { SharedApiService } from "../../services/sharedApiService";
import type {
  FeeTemplate,
  ClassFeeSummary,
  SchoolClass, // Added this
} from "../../types";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import ClassFeeDetailModal from "../../components/modals/ClassFeeDetailModal";
import { useDataRefresh } from "../../contexts/DataRefreshContext";
import { AlertTriangleIcon } from "../../components/icons/Icons";
import ConfirmationModal from "../../components/ui/ConfirmationModal";

const apiService = new RegistrarApiService();
const sharedApiService = new SharedApiService();

const ACADEMIC_MONTHS = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
];

interface FeeCollectionRow {
  studentId: string;
  userId: string;
  name: string;
  className: string; // e.g. "Grade 10-A"
  classId?: string; // Added for filtering logic (backend should send this ideally, or we parse className)
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  lastPaidDate: string | null;
  dueDate: string;
  status: "Paid" | "Due";
}

// ... (FeeTemplateFormModal and DeleteRequestModal remain unchanged) ...
// ... (Keep your existing FeeTemplateFormModal code here) ...
const FeeTemplateFormModal: React.FC<{
  templateToEdit?: FeeTemplate | null;
  onClose: () => void;
  onSave: (message: string) => void;
}> = ({ templateToEdit, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<FeeTemplate>>(() => {
    const base = { name: "", gradeLevel: 1, ...templateToEdit };
    if (!base.monthlyBreakdown || base.monthlyBreakdown.length !== 12) {
      base.monthlyBreakdown = ACADEMIC_MONTHS.map((m) => ({
        month: m,
        total: 0,
        breakdown: [],
      }));
    }
    return base;
  });
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!templateToEdit;

  const totalAnnualAmount = useMemo(() => {
    return (
      formData.monthlyBreakdown?.reduce((total, month) => {
        const monthTotal = month.breakdown.reduce(
          (sum, comp) => sum + (Number(comp.amount) || 0),
          0
        );
        return total + monthTotal;
      }, 0) || 0
    );
  }, [formData.monthlyBreakdown]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, amount: totalAnnualAmount }));
  }, [totalAnnualAmount]);

  const handleMainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "gradeLevel" ? Number(value) : value,
    }));
  };

  const handleComponentChange = (
    monthIndex: number,
    compIndex: number,
    field: "component" | "amount",
    value: string
  ) => {
    setFormData((prev) => {
      if (!prev || !prev.monthlyBreakdown) return prev;

      const newMonthlyBreakdown = prev.monthlyBreakdown.map((month, mIndex) => {
        if (mIndex !== monthIndex) return month;

        const newBreakdownComponents = month.breakdown.map((comp, cIndex) => {
          if (cIndex !== compIndex) return comp;
          return {
            ...comp,
            [field]: field === "amount" ? Number(value) || 0 : value,
          };
        });

        return { ...month, breakdown: newBreakdownComponents };
      });

      return { ...prev, monthlyBreakdown: newMonthlyBreakdown };
    });
  };

  const addComponent = (monthIndex: number) => {
    const newBreakdown = [...(formData.monthlyBreakdown || [])];
    newBreakdown[monthIndex].breakdown.push({ component: "", amount: 0 });
    setFormData((prev) => ({ ...prev, monthlyBreakdown: newBreakdown }));
  };

  const removeComponent = (monthIndex: number, compIndex: number) => {
    const newBreakdown = [...(formData.monthlyBreakdown || [])];
    newBreakdown[monthIndex].breakdown.splice(compIndex, 1);
    setFormData((prev) => ({ ...prev, monthlyBreakdown: newBreakdown }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    if (isEditMode) {
      await apiService.requestFeeTemplateUpdate(
        templateToEdit!.id,
        formData,
        reason
      );
      onSave("Update request sent to principal for approval.");
    } else {
      await apiService.createFeeTemplate(formData as Omit<FeeTemplate, "id">);
      onSave("New fee template created successfully.");
    }
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold text-text-primary-dark mb-4">
          {isEditMode ? "Request Fee Template Update" : "Create Fee Template"}
        </h2>
        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
          <form
            id="fee-template-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sticky top-0 bg-surface-dark py-2">
              <Input
                label="Template Name"
                name="name"
                value={formData.name}
                onChange={handleMainChange}
                placeholder="e.g., Grade 10 Standard Fees"
                required
              />
              <Input
                label="Grade Level"
                name="gradeLevel"
                type="number"
                value={formData.gradeLevel}
                onChange={handleMainChange}
                required
              />
            </div>
            <div className="p-3 bg-slate-100 rounded-lg text-center">
              <p className="text-sm font-medium text-text-secondary-dark">
                Total Annual Fee
              </p>
              <p className="text-2xl font-bold text-brand-primary">
                {totalAnnualAmount.toLocaleString()}
              </p>
            </div>
            <div className="space-y-4">
              {formData.monthlyBreakdown?.map((monthData, monthIndex) => {
                const monthTotal = monthData.breakdown.reduce(
                  (sum, comp) => sum + (Number(comp.amount) || 0),
                  0
                );
                return (
                  <details
                    key={monthIndex}
                    className="bg-slate-50 p-3 rounded-lg"
                  >
                    <summary className="cursor-pointer font-semibold flex justify-between">
                      <span>{monthData.month}</span>
                      <span>Total: {monthTotal.toLocaleString()}</span>
                    </summary>
                    <div className="mt-2 pt-2 border-t space-y-2">
                      {monthData.breakdown.map((comp, compIndex) => (
                        <div
                          key={compIndex}
                          className="flex items-center gap-2"
                        >
                          <Input
                            placeholder="Component Name"
                            value={comp.component}
                            onChange={(e) =>
                              handleComponentChange(
                                monthIndex,
                                compIndex,
                                "component",
                                e.target.value
                              )
                            }
                            className="flex-grow"
                          />
                          <Input
                            placeholder="Amount"
                            type="number"
                            value={comp.amount || ""}
                            onChange={(e) =>
                              handleComponentChange(
                                monthIndex,
                                compIndex,
                                "amount",
                                e.target.value
                              )
                            }
                            className="w-28"
                          />
                          <Button
                            type="button"
                            variant="danger"
                            className="!p-2"
                            onClick={() =>
                              removeComponent(monthIndex, compIndex)
                            }
                          >
                            &times;
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="secondary"
                        className="!text-xs !py-1 !px-2"
                        onClick={() => addComponent(monthIndex)}
                      >
                        + Add Component
                      </Button>
                    </div>
                  </details>
                );
              })}
            </div>
            {isEditMode && (
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                  Reason for Change
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                  required
                />
              </div>
            )}
          </form>
        </div>
        <div className="flex justify-end gap-4 pt-4 border-t mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            form="fee-template-form"
            type="submit"
            disabled={isSaving || (isEditMode && !reason)}
          >
            {isSaving
              ? "Submitting..."
              : isEditMode
              ? "Submit Request"
              : "Create Template"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const DeleteRequestModal: React.FC<{
  template: FeeTemplate;
  onClose: () => void;
  onSave: (message: string) => void;
}> = ({ template, onClose, onSave }) => {
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await apiService.requestFeeTemplateDeletion(template.id, reason);
    onSave("Deletion request sent to principal for approval.");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-bold text-red-600 mb-2">
          Request Template Deletion
        </h2>
        <p className="text-text-secondary-dark mb-4">
          You are requesting to delete the template:{" "}
          <strong>{template.name}</strong>.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Reason for Deletion
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
              required
            />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={isSaving || !reason}
            >
              {isSaving ? "Submitting..." : "Request Deletion"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const PayFeeModal: React.FC<{
  student: FeeCollectionRow;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ student, onClose, onSuccess }) => {
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [feeStructure, setFeeStructure] = useState<{
    monthlyAmount: number;
    breakdown: { month: string; amount: number }[];
    adjustments: { type: string; amount: number; reason: string }[];
  } | null>(null);

  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const profile = await apiService.getStudentProfileDetails(
          student.studentId
        );
        if (profile) {
          // Use the Total Fee calculated by backend (includes template + adjustments)
          // Note: In a perfect world, we'd fetch the specific template breakdown.
          // Here we distribute the Base Fee across 12 months for the visual timeline.
          const baseTotal = profile.feeStatus.total;
          const monthly = baseTotal > 0 ? Math.ceil(baseTotal / 12) : 0;

          const adjustments = profile.feeHistory
            .filter((h: any) => h.itemType === "adjustment")
            .map((adj: any) => ({
              type: adj.type,
              amount: adj.amount,
              reason: adj.reason,
            }));

          setFeeStructure({
            monthlyAmount: monthly,
            // Create a breakdown array where each month has its specific amount
            breakdown: ACADEMIC_MONTHS.map((m) => ({
              month: m,
              amount: monthly,
            })),
            adjustments,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [student]);

  // Logic to determine how many months are fully covered by what has been paid so far
  const paidMonthsCount = useMemo(() => {
    if (!feeStructure || feeStructure.monthlyAmount <= 0) return 0;
    let effectivePaid = student.paidAmount;
    // Simple logic: Paid amount / Monthly rate = Number of months cleared
    return Math.min(12, Math.floor(effectivePaid / feeStructure.monthlyAmount));
  }, [student.paidAmount, feeStructure]);

  const handleMonthToggle = (index: number) => {
    if (index < paidMonthsCount) return; // Cannot toggle already paid months

    if (selectedMonths.includes(index)) {
      // Deselecting: Remove this and any subsequent months (enforce sequence)
      setSelectedMonths((prev) => prev.filter((i) => i < index));
    } else {
      // Selecting: Auto-select all gaps between the last paid month and this one
      const newSelection = [];
      // Start from the first unpaid month
      for (let i = paidMonthsCount; i <= index; i++) {
        newSelection.push(i);
      }
      setSelectedMonths(newSelection);
    }
    // Clear custom amount so the calculated amount takes over
    setCustomAmount("");
  };

  // Calculate total based on selected months
  const calculatedAmount = useMemo(() => {
    // If user typed a custom amount, use that.
    if (customAmount) return Number(customAmount);

    // Otherwise, sum the amounts of the selected months
    if (!feeStructure) return 0;
    return selectedMonths.reduce((sum, index) => {
      return sum + (feeStructure.breakdown[index]?.amount || 0);
    }, 0);
  }, [selectedMonths, feeStructure, customAmount]);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      await apiService.collectFeePayment({
        studentId: student.studentId,
        amount: calculatedAmount,
        remarks: remarks || `Fee for ${selectedMonths.length} months`,
      });
      onSuccess();
      onClose();
    } catch (e) {
      alert("Payment Failed");
    } finally {
      setIsProcessing(false);
      setIsConfirming(false);
    }
  };

  if (loadingDetails)
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <Card>Loading fee structure...</Card>
      </div>
    );

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary-dark">
              Collect Fee
            </h2>
            <p className="text-text-secondary-dark">
              {student.name}{" "}
              <span className="font-mono text-xs bg-slate-100 px-1 rounded">
                {student.userId}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="text-2xl font-light">
            &times;
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-6">
          {/* Fiscal Timeline */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-sm font-semibold text-text-secondary-dark uppercase tracking-wide">
                Academic Session Timeline
              </h3>
              <span className="text-xs font-medium text-slate-500">
                Base Monthly Fee: ₹
                {feeStructure?.monthlyAmount.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {ACADEMIC_MONTHS.map((month, index) => {
                const isPaid = index < paidMonthsCount;
                const isSelected = selectedMonths.includes(index);
                const amount = feeStructure?.breakdown[index]?.amount || 0;

                return (
                  <button
                    key={month}
                    disabled={isPaid}
                    onClick={() => handleMonthToggle(index)}
                    className={`
                        relative p-2 rounded-lg border transition-all flex flex-col items-center justify-center h-14
                        ${
                          isPaid
                            ? "bg-green-50 border-green-200 text-green-800 cursor-not-allowed opacity-80"
                            : isSelected
                            ? "bg-brand-primary border-brand-primary text-white shadow-md transform scale-105 z-10"
                            : "bg-white border-slate-200 text-slate-600 hover:border-brand-secondary hover:shadow-sm"
                        }
                    `}
                  >
                    <span className="text-xs font-bold">{month}</span>
                    {/* Show amount inside the button */}
                    <span
                      className={`text-[10px] ${
                        isSelected ? "text-blue-100" : "text-slate-400"
                      }`}
                    >
                      ₹{amount.toLocaleString()}
                    </span>

                    {isPaid && (
                      <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-sm">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>{" "}
                Paid
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-brand-primary rounded"></div>{" "}
                Selected
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white border border-slate-200 rounded"></div>{" "}
                Due
              </span>
            </div>
          </div>

          {/* Financial Summary & Adjustments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-slate-100 bg-white">
                <span className="text-xs text-slate-500">Total Fee (Year)</span>
                <p className="text-lg font-semibold">
                  ₹{student.totalFee.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-white">
                <span className="text-xs text-slate-500">Already Paid</span>
                <p className="text-lg font-semibold text-green-600">
                  ₹{student.paidAmount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 h-full">
              <h4 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertTriangleIcon className="w-4 h-4" /> Principal Adjustments
              </h4>
              {feeStructure?.adjustments &&
              feeStructure.adjustments.length > 0 ? (
                <ul className="space-y-1 overflow-y-auto max-h-24 pr-1">
                  {feeStructure.adjustments.map((adj, i) => (
                    <li
                      key={i}
                      className="flex justify-between text-xs border-b border-yellow-200/50 pb-1 last:border-0"
                    >
                      <span>{adj.reason}</span>
                      <span
                        className={
                          adj.type === "charge"
                            ? "text-red-600 font-bold"
                            : "text-green-600 font-bold"
                        }
                      >
                        {adj.type === "charge" ? "+" : "-"}₹{adj.amount}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-yellow-700/70 italic">
                  No adjustments applied.
                </p>
              )}
            </div>
          </div>

          {/* Payment Input Area */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
              <div className="w-full md:w-1/2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={
                      customAmount
                        ? customAmount
                        : calculatedAmount > 0
                        ? calculatedAmount
                        : ""
                    }
                    onChange={(e) => {
                      setSelectedMonths([]); // Clear selection if typing manually
                      setCustomAmount(e.target.value);
                    }}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 text-2xl font-bold text-brand-primary border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>
              </div>
              <div className="text-right pb-2">
                <p className="text-xs text-slate-500">
                  Remaining Due After Payment
                </p>
                <p
                  className={`font-mono text-lg ${
                    student.pendingAmount -
                      Number(customAmount || calculatedAmount) <
                    0
                      ? "text-green-600"
                      : "text-slate-800"
                  }`}
                >
                  ₹
                  {(
                    student.pendingAmount -
                    Number(customAmount || calculatedAmount)
                  ).toLocaleString()}
                </p>
              </div>
            </div>
            <Input
              label="Remarks / Reference No."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Cash payment by Guardian, UPI Ref..."
              required
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => setIsConfirming(true)}
            disabled={
              (!calculatedAmount && !customAmount) ||
              Number(customAmount || calculatedAmount) <= 0
            }
          >
            Record Payment of ₹
            {(Number(customAmount) || calculatedAmount).toLocaleString()}
          </Button>
        </div>

        {/* Confirmation Overlay */}
        {isConfirming && (
          <ConfirmationModal
            isOpen={true}
            onClose={() => setIsConfirming(false)}
            onConfirm={handlePay}
            title="Confirm Fee Payment"
            message={
              <>
                Confirm recording a payment of{" "}
                <span className="text-lg font-bold text-brand-primary">
                  ₹{(Number(customAmount) || calculatedAmount).toLocaleString()}
                </span>{" "}
                for <strong>{student.name}</strong>?
                <br />
                <br />
                <div className="bg-amber-50 border-l-4 border-amber-500 p-3 text-xs text-amber-800">
                  <strong>Warning:</strong> This action updates the financial
                  ledger permanently. Please verify the amount received.
                </div>
              </>
            }
            confirmText="Confirm & Record"
            isConfirming={isProcessing}
          />
        )}
      </Card>
    </div>
  );
};

const ClassFeeStatus: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey } = useDataRefresh();
  const [summaries, setSummaries] = useState<ClassFeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingClass, setViewingClass] = useState<ClassFeeSummary | null>(
    null
  );

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiService.getClassFeeSummaries();
      setSummaries(
        data.sort((a: ClassFeeSummary, b: ClassFeeSummary) =>
          a.className.localeCompare(b.className)
        )
      );
    } catch (error) {
      console.error("Failed to fetch class fee summaries:", error);
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  }, [user, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
              <tr>
                <th className="p-4">Class Name</th>
                <th className="p-4 text-center">Total Students</th>
                <th className="p-4 text-center">Defaulters</th>
                <th className="p-4 text-right">Total Pending</th>
              </tr>
            </thead>
            <tbody>
              {summaries.filter(Boolean).map((summary) => (
                <tr
                  key={summary?.classId}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setViewingClass(summary)}
                >
                  <td className="p-4 font-medium">{summary?.className}</td>
                  <td className="p-4 text-center">{summary?.studentCount}</td>
                  <td className="p-4 text-center text-orange-600">
                    {summary?.defaulterCount}
                  </td>
                  <td className="p-4 text-right font-semibold text-red-600">
                    {(summary?.pendingAmount ?? 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {viewingClass && (
        <ClassFeeDetailModal
          isOpen={!!viewingClass}
          onClose={() => setViewingClass(null)}
          classId={viewingClass.classId}
          className={viewingClass.className}
        />
      )}
    </div>
  );
};

const FeeTemplates: React.FC<{ onSave: (message: string) => void }> = ({
  onSave,
}) => {
  const { user } = useAuth();
  const { refreshKey } = useDataRefresh();
  const [templates, setTemplates] = useState<FeeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<FeeTemplate | null>(
    null
  );

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await apiService.getFeeTemplates();
    setTemplates(data);
    setLoading(false);
  }, [user, refreshKey]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSaveAndRefresh = (message: string) => {
    setModal(null);
    setSelectedTemplate(null);
    onSave(message);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Fee Templates</h2>
        <Button onClick={() => setModal("create")}>Create New Template</Button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
              <tr>
                <th className="p-4">Template Name</th>
                <th className="p-4">Grade Level</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr
                  key={template.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="p-4 font-medium">{template.name}</td>
                  <td className="p-4">{template.gradeLevel}</td>
                  <td className="p-4 text-right font-semibold">
                    {template.amount.toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        className="!px-3 !py-1 text-xs"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setModal("edit");
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        className="!px-3 !py-1 text-xs"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setModal("delete");
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {user && (modal === "create" || modal === "edit") && (
        <FeeTemplateFormModal
          templateToEdit={modal === "edit" ? selectedTemplate : null}
          onClose={() => setModal(null)}
          onSave={handleSaveAndRefresh}
        />
      )}
      {user && modal === "delete" && selectedTemplate && (
        <DeleteRequestModal
          template={selectedTemplate}
          onClose={() => setModal(null)}
          onSave={handleSaveAndRefresh}
        />
      )}
    </div>
  );
};

const FeeManagement: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey } = useDataRefresh();
  const [activeTab, setActiveTab] = useState<
    "templates" | "status" | "collection"
  >("collection");

  const [collectionData, setCollectionData] = useState<FeeCollectionRow[]>([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] =
    useState<FeeCollectionRow | null>(null);

  const [classes, setClasses] = useState<SchoolClass[]>([]); // List of classes for filter
  const [filterClass, setFilterClass] = useState("all"); // Filter state
  const [sortBy, setSortBy] = useState("name"); // Sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const handleSave = (message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(""), 5000);
  };

  const tabButtonClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
      isActive
        ? "bg-slate-200 rounded-t-lg font-semibold"
        : "text-text-secondary-dark hover:bg-slate-100"
    }`;

  // FIX: Fetch classes for the dropdown
  const fetchClasses = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiService.getSchoolClasses();
      setClasses(data);
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const fetchCollectionData = useCallback(async () => {
    setCollectionLoading(true);
    try {
      const data = await apiService.getFeeCollectionOverview();
      // Note: The backend might return data where className is "Grade X-Y", we can parse this for filtering if needed
      setCollectionData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCollectionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user, fetchClasses]);

  useEffect(() => {
    if (activeTab === "collection") {
      fetchCollectionData();
    }
  }, [activeTab, refreshKey, fetchCollectionData]);

  const handlePaymentSuccess = () => {
    setSelectedStudentForPayment(null);
    setStatusMessage("Payment recorded successfully!");
    setTimeout(() => setStatusMessage(""), 4000);
    fetchCollectionData();
  };

  // FIX: Robust filtering and sorting logic
  const filteredCollection = useMemo(() => {
    let data = [...collectionData];

    // 1. Filter by Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (row) =>
          row.name.toLowerCase().includes(term) ||
          row.userId.toLowerCase().includes(term) ||
          row.className.toLowerCase().includes(term)
      );
    }

    // 2. Filter by Class
    if (filterClass !== "all") {
      // Row has 'className' like "Grade 10-A".
      // We need to match it against the selected class ID.
      // Ideally backend sends classId. If not, we can try to match string or update backend.
      // Assuming 'filterClass' holds the class ID, we need to find that class name to compare.
      const selectedClassObj = classes.find((c) => c.id === filterClass);
      if (selectedClassObj) {
        const targetName = `Grade ${selectedClassObj.gradeLevel}-${selectedClassObj.section}`;
        data = data.filter((row) => row.className === targetName);
      }
    }

    // 3. Sort
    data.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "id") return a.userId.localeCompare(b.userId);
      if (sortBy === "due_desc") return b.pendingAmount - a.pendingAmount;
      return 0;
    });

    return data;
  }, [collectionData, searchTerm, filterClass, sortBy, classes]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Fees & Finance
      </h1>
      {statusMessage && (
        <div className="mb-4 text-center p-3 bg-green-100 text-green-800 rounded-lg">
          {statusMessage}
        </div>
      )}

      <div className="mb-4 border-b border-slate-200">
        <div className="flex gap-2">
          <button
            className={tabButtonClasses(activeTab === "collection")}
            onClick={() => setActiveTab("collection")}
          >
            Fee Payments (Counter)
          </button>
          <button
            className={tabButtonClasses(activeTab === "status")}
            onClick={() => setActiveTab("status")}
          >
            Class Status
          </button>
          <button
            className={tabButtonClasses(activeTab === "templates")}
            onClick={() => setActiveTab("templates")}
          >
            Fee Templates
          </button>
        </div>
      </div>

      <Card>
        {activeTab === "collection" && (
          <div>
            {/* --- Top Toolbar: Search & Filter --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
              {/* Search */}
              <div className="md:col-span-1">
                <Input
                  placeholder="Search Student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* Class Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Filter by Class
                </label>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                >
                  <option value="all">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Grade {c.gradeLevel} - {c.section}
                    </option>
                  ))}
                </select>
              </div>
              {/* Sort */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="id">Student ID</option>
                  <option value="due_desc">Highest Dues First</option>
                </select>
              </div>
            </div>

            {collectionLoading ? (
              <p>Loading...</p>
            ) : (
              <div className="overflow-x-auto max-h-[70vh]">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b sticky top-0">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Class</th>
                      <th className="p-3 text-right">Total Fee</th>
                      <th className="p-3 text-right">Paid</th>
                      <th className="p-3 text-right">Due</th>
                      <th className="p-3">Last Paid</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCollection.map((row) => (
                      <tr
                        key={row.studentId}
                        className="border-b hover:bg-slate-50"
                      >
                        <td className="p-3 font-mono text-xs text-text-secondary-dark">
                          {row.userId}
                        </td>
                        <td className="p-3 font-medium">{row.name}</td>
                        <td className="p-3 text-sm">{row.className}</td>
                        <td className="p-3 text-right text-sm">
                          ₹{row.totalFee.toLocaleString()}
                        </td>
                        <td className="p-3 text-right text-sm text-green-600">
                          ₹{row.paidAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-bold text-red-500">
                          ₹{row.pendingAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-xs text-slate-500">
                          {row.lastPaidDate
                            ? new Date(row.lastPaidDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            className="!py-1 !px-3 text-xs"
                            disabled={row.pendingAmount <= 0}
                            onClick={() => setSelectedStudentForPayment(row)}
                          >
                            {row.pendingAmount <= 0
                              ? "Fully Paid"
                              : "Collect Fee"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCollection.length === 0 && (
                  <p className="text-center p-8 text-slate-500">
                    No students found.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "templates" && <FeeTemplates onSave={handleSave} />}
        {activeTab === "status" && <ClassFeeStatus />}
      </Card>

      {selectedStudentForPayment && (
        <PayFeeModal
          student={selectedStudentForPayment}
          onClose={() => setSelectedStudentForPayment(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default FeeManagement;
