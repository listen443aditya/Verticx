import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
// FIX: Correctly import the service class and create an instance.
import { RegistrarApiService } from "../../services/registrarApiService";
import { SharedApiService } from "../../services/sharedApiService";
import type {
  FeeTemplate,
  ClassFeeSummary,
  MonthlyFee,
  FeeComponent,
} from "../../types";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import ClassFeeDetailModal from "../../components/modals/ClassFeeDetailModal";
import { useDataRefresh } from "../../contexts/DataRefreshContext";
import { BanknoteIcon, AlertTriangleIcon } from "../../components/icons/Icons";
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
  className: string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  lastPaidDate: string | null;
  dueDate: string;
  status: "Paid" | "Due";
}

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
      // FIX: Removed registrarId from the call.
      await apiService.requestFeeTemplateUpdate(
        templateToEdit!.id,
        formData,
        reason
      );
      onSave("Update request sent to principal for approval.");
    } else {
      // FIX: Removed branchId from the call.
      await apiService.createFeeTemplate(formData as Omit<FeeTemplate, "id">);
      onSave("New fee template created successfully.");
    }
    setIsSaving(false);
    onClose(); // Close modal on save
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

            <h3 className="text-lg font-semibold text-text-secondary-dark border-t pt-4">
              Monthly Fee Breakdown
            </h3>

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

  // Fetch detailed breakdown
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const profile = await apiService.getStudentProfileDetails(
          student.studentId
        );
        if (profile) {
          const baseTotal = profile.feeStatus.total;
          const adjustments = profile.feeHistory
            .filter((h: any) => h.itemType === "adjustment")
            .map((adj: any) => ({
              type: adj.type,
              amount: adj.amount,
              reason: adj.reason,
            }));

          setFeeStructure({
            monthlyAmount: baseTotal / 12, 
            breakdown: ACADEMIC_MONTHS.map((m) => ({
              month: m,
              amount: baseTotal / 12,
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

  const paidMonthsCount = useMemo(() => {
    if (!feeStructure) return 0;
    let effectivePaid = student.paidAmount;
    return Math.floor(effectivePaid / feeStructure.monthlyAmount);
  }, [student.paidAmount, feeStructure]);

  const handleMonthToggle = (index: number) => {
    if (index < paidMonthsCount) return; // Cannot toggle already paid

    // Auto-select previous months if clicking a future one
    // This enforces sequential payment
    if (selectedMonths.includes(index)) {
      // Deselecting: remove this and all future selected
      setSelectedMonths((prev) => prev.filter((i) => i < index));
    } else {
      // Selecting: select this and all gaps between paid and this
      const newSelection = [];
      for (let i = paidMonthsCount; i <= index; i++) {
        newSelection.push(i);
      }
      setSelectedMonths(newSelection);
    }
    setCustomAmount(""); // Reset custom if using checkboxes
  };

  const calculatedAmount = useMemo(() => {
    if (customAmount) return Number(customAmount);
    if (!feeStructure) return 0;
    return selectedMonths.length * feeStructure.monthlyAmount;
  }, [selectedMonths, feeStructure, customAmount]);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      await apiService.collectFeePayment({
        studentId: student.studentId,
        amount: calculatedAmount,
        remarks: remarks,
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
        <Card>Loading...</Card>
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
              {student.name} ({student.userId})
            </p>
          </div>
          <button onClick={onClose} className="text-2xl font-light">
            &times;
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-6">
          {/* Fiscal Timeline */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-semibold text-text-secondary-dark mb-3 uppercase tracking-wide">
              Academic Session Timeline
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {ACADEMIC_MONTHS.map((month, index) => {
                const isPaid = index < paidMonthsCount;
                const isSelected = selectedMonths.includes(index);

                return (
                  <button
                    key={month}
                    disabled={isPaid}
                    onClick={() => handleMonthToggle(index)}
                    className={`
                                    relative p-2 rounded-lg text-xs font-medium border transition-all
                                    ${
                                      isPaid
                                        ? "bg-green-100 border-green-200 text-green-700 cursor-not-allowed"
                                        : isSelected
                                        ? "bg-brand-primary text-white border-brand-primary shadow-md transform scale-105"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-brand-secondary"
                                    }
                                `}
                  >
                    {month}
                    {isPaid && (
                      <span className="absolute top-0 right-1 text-[8px]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>{" "}
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

          {/* Financial Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500">Total Fee (Year)</span>
              <p className="text-lg font-semibold">
                ₹{student.totalFee.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500">Already Paid</span>
              <p className="text-lg font-semibold text-green-600">
                ₹{student.paidAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Adjustments Section */}
          {feeStructure?.adjustments && feeStructure.adjustments.length > 0 && (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
              <h4 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertTriangleIcon className="w-4 h-4" /> Principal Adjustments
              </h4>
              <ul className="space-y-1">
                {feeStructure.adjustments.map((adj, i) => (
                  <li key={i} className="flex justify-between text-xs">
                    <span>
                      {adj.reason} ({adj.type})
                    </span>
                    <span
                      className={
                        adj.type === "charge"
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {adj.type === "charge" ? "+" : "-"}₹{adj.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Payment Input */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-end">
              <div className="w-1/2">
                <Input
                  label="Payment Amount (INR)"
                  type="number"
                  value={calculatedAmount || customAmount}
                  onChange={(e) => {
                    setSelectedMonths([]);
                    setCustomAmount(e.target.value);
                  }}
                  className="text-xl font-bold text-brand-primary"
                />
              </div>
              <div className="text-right pb-2">
                <p className="text-xs text-slate-500">Remaining Due</p>
                <p className="font-mono">
                  ₹
                  {(
                    student.pendingAmount -
                    Number(calculatedAmount || customAmount)
                  ).toLocaleString()}
                </p>
              </div>
            </div>
            <Input
              label="Remarks / Reference No."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Cash payment, Check #123"
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
            disabled={!calculatedAmount && !customAmount}
          >
            Proceed to Pay ₹
            {(calculatedAmount || Number(customAmount)).toLocaleString()}
          </Button>
        </div>

        {/* Confirmation Overlay */}
        {isConfirming && (
          <ConfirmationModal
            isOpen={true}
            onClose={() => setIsConfirming(false)}
            onConfirm={handlePay}
            title="Confirm Payment"
            message={
              <>
                Are you sure you want to record a payment of{" "}
                <strong>
                  ₹{(calculatedAmount || Number(customAmount)).toLocaleString()}
                </strong>{" "}
                for {student.name}?
                <br />
                <br />
                <span className="text-red-600 text-sm">
                  This action creates a permanent financial record and cannot be
                  undone easily.
                </span>
              </>
            }
            confirmText="Yes, Record Payment"
            isConfirming={isProcessing}
          />
        )}
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
    // FIX: Removed registrarId from the call.
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
      // <-- ADD TRY
      const data = await apiService.getClassFeeSummaries();
      setSummaries(
        data.sort((a: ClassFeeSummary, b: ClassFeeSummary) =>
          a.className.localeCompare(b.className)
        )
      );
    } catch (error) {
      // <-- ADD CATCH
      console.error("Failed to fetch class fee summaries:", error);
      setSummaries([]); // Set to an empty array on error to prevent crash
    } finally {
      setLoading(false); // <-- ADD FINALLY
    }
  }, [user, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      {loading ? (
        <p>Loading class fee status...</p>
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
                  key={summary?.classId} // Use optional chaining
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setViewingClass(summary)}
                >
                  <td className="p-4 font-medium text-text-primary-dark">
                    {summary?.className || "Unknown Class"}
                  </td>
                  <td className="p-4 text-center">
                    {summary?.studentCount ?? 0}
                  </td>
                  <td className="p-4 text-center font-semibold text-orange-600">
                    {summary?.defaulterCount ?? 0}
                  </td>
                  <td className="p-4 text-right font-semibold text-red-600">
                    {/* Use fallback '0' and optional chaining */}
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
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [templates, setTemplates] = useState<FeeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<FeeTemplate | null>(
    null
  );

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // FIX: Removed branchId from API call.
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
    triggerRefresh();
    onSave(message);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-text-primary-dark">
          Fee Templates
        </h2>
        <Button onClick={() => setModal("create")}>Create New Template</Button>
      </div>
      {loading ? (
        <p>Loading templates...</p>
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
                  <td className="p-4 font-medium text-text-primary-dark">
                    {template.name}
                  </td>
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
  // const [activeTab, setActiveTab] = useState<"templates" | "status">(
  //   "templates"
  // );
  const [statusMessage, setStatusMessage] = useState("");
const { user } = useAuth();
const { refreshKey } = useDataRefresh();
const [activeTab, setActiveTab] = useState<
  "templates" | "status" | "collection"
>("collection");

const [collectionData, setCollectionData] = useState<FeeCollectionRow[]>([]);
const [collectionLoading, setCollectionLoading] = useState(false);
const [selectedStudentForPayment, setSelectedStudentForPayment] =
  useState<FeeCollectionRow | null>(null);

const [searchTerm, setSearchTerm] = useState("");
const [templates, setTemplates] = useState<FeeTemplate[]>([]);
const [summaries, setSummaries] = useState<ClassFeeSummary[]>([]);
const [loading, setLoading] = useState(true);


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

  const fetchCollectionData = useCallback(async () => {
    setCollectionLoading(true);
    try {
      const data = await apiService.getFeeCollectionOverview();
      setCollectionData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCollectionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "collection") {
      fetchCollectionData();
    }
  }, [activeTab, refreshKey]);

  const handlePaymentSuccess = () => {
    setSelectedStudentForPayment(null);
    setStatusMessage("Payment recorded successfully!");
    setTimeout(() => setStatusMessage(""), 4000);
    fetchCollectionData(); // Refresh table
  };

  const filteredCollection = useMemo(() => {
    return collectionData.filter(
      (row) =>
        row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.className.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [collectionData, searchTerm]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Fees & Finance
      </h1>

      {statusMessage && (
        <div className="mb-4 text-center p-3 bg-green-100 text-green-800 rounded-lg border border-green-200 animate-fade-in">
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Student Fee Counter</h2>
              <Input
                placeholder="Search Student by Name, ID or Class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-96"
              />
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

        {statusMessage && (
          <div className="mb-4 text-center p-2 bg-green-100 text-green-800 rounded-lg text-sm transition-opacity duration-300">
            {statusMessage}
          </div>
        )}
        {activeTab === "templates" ? (
          <FeeTemplates onSave={handleSave} />
        ) : (
          <ClassFeeStatus />
        )}
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
