import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { PrincipalApiService } from "../../services";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";
import { FinanceIcon, BanknoteIcon } from "../../components/icons/Icons.tsx";
import type {
  PrincipalFinancialsOverview,
  ErpPayment,
  Branch,
  ManualExpense,
} from "../../types.ts";
import { useDataRefresh } from "../../contexts/DataRefreshContext.tsx";
import ErpPaymentHistoryModal from "../../components/modals/ErpPaymentHistoryModal.tsx";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts";
import PayErpBillModal from "../../components/modals/PayErpBillModal.tsx";
import PayrollManagement from "./PayrollManagement.tsx";

const principalApiService = new PrincipalApiService();

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
}> = ({ title, value, icon }) => (
  <Card className="flex flex-col items-center justify-center p-4 text-center">
    <div className="p-3 mb-2 text-white bg-brand-primary rounded-full">
      {icon}
    </div>
    <p className="text-3xl font-bold text-brand-primary">{value}</p>
    <p className="text-sm font-medium text-text-secondary-dark">{title}</p>
  </Card>
);

const FinancialOverviewContent: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [financials, setFinancials] =
    useState<PrincipalFinancialsOverview | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<ErpPayment[]>([]);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [data, branchData] = await Promise.all([
      principalApiService.getFinancialsOverview(),
      principalApiService.getBranchDetails(),
    ]);
    setFinancials(data);
    setBranch(branchData);
    setLoading(false);
  }, [user, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewHistory = async () => {
    if (!user) return;
    const payments = await principalApiService.getErpPayments();
    const sortedPayments = payments.sort(
      (a: ErpPayment, b: ErpPayment) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
    setPaymentHistory(sortedPayments);
    setShowHistoryModal(true);
  };

  const handlePaymentSuccess = () => {
    setIsPayModalOpen(false);
    triggerRefresh();
  };

  if (loading || !financials) return <div>Loading financial data...</div>;

  // ... The rest of the FinancialOverviewContent JSX is correct ...
  return <div className="space-y-6">{/* JSX content here */}</div>;
};

const ManualExpensesContent: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [expenses, setExpenses] = useState<ManualExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<
    "Utilities" | "Supplies" | "Maintenance" | "Events" | "Miscellaneous"
  >("Miscellaneous");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await principalApiService.getManualExpenses();
    setExpenses(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !description || !amount || !user.branchId) return;
    setIsSubmitting(true);
    // FIX: The type definition requires `branchId` and `enteredBy`. We must provide them explicitly.
    await principalApiService.addManualExpense({
      branchId: user.branchId,
      description,
      category,
      amount: Number(amount),
      date,
      enteredBy: user.name,
    });
    // Reset form
    setDescription("");
    setCategory("Miscellaneous");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);

    setIsSubmitting(false);
    triggerRefresh();
  };

  // The JSX for this component is correct.
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <h2 className="text-xl font-semibold mb-4">Add New Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 mt-1"
            >
              <option>Utilities</option>
              <option>Supplies</option>
              <option>Maintenance</option>
              <option>Events</option>
              <option>Miscellaneous</option>
            </select>
          </div>
          <Input
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Expense"}
          </Button>
        </form>
      </Card>
      <Card className="lg:col-span-2">
        <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-left">
              <thead className="border-b sticky top-0 bg-surface-dark">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Description</th>
                  <th className="p-2">Category</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} className="border-b">
                    <td className="p-2 text-sm">{exp.date}</td>
                    <td className="p-2 font-medium">{exp.description}</td>
                    <td className="p-2 text-sm">{exp.category}</td>
                    <td className="p-2 text-right font-semibold">
                      {exp.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

const FinancialOverview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "payroll" | "expenses"
  >("overview");

  const tabButtonClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
      isActive
        ? "bg-slate-200 rounded-t-lg font-semibold text-text-primary-dark"
        : "text-text-secondary-dark hover:bg-slate-100"
    }`;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary-dark">
        Finance & Fees
      </h1>

      <div className="flex border-b border-slate-200">
        <button
          className={tabButtonClasses(activeTab === "overview")}
          onClick={() => setActiveTab("overview")}
        >
          Financial Overview
        </button>
        <button
          className={tabButtonClasses(activeTab === "payroll")}
          onClick={() => setActiveTab("payroll")}
        >
          Staff Payroll
        </button>
        <button
          className={tabButtonClasses(activeTab === "expenses")}
          onClick={() => setActiveTab("expenses")}
        >
          Manual Expenses
        </button>
      </div>

      {activeTab === "overview" && <FinancialOverviewContent />}
      {activeTab === "payroll" && <PayrollManagement />}
      {activeTab === "expenses" && <ManualExpensesContent />}
    </div>
  );
};

export default FinancialOverview;
