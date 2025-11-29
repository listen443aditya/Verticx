import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { PrincipalApiService, SharedApiService } from "../../services";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";
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
const sharedApiService = new SharedApiService();

// --- LOCAL ICONS (To fix import errors) ---
const FinanceIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
    />
  </svg>
);

const BanknoteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
    />
  </svg>
);

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
    if (!user?.branchId) return;
    setLoading(true);
    try {
      const [data, branchData] = await Promise.all([
        principalApiService.getFinancialsOverview(), // No argument needed, handled by controller
        sharedApiService.getBranchById(user.branchId),
      ]);
      setFinancials(data);
      setBranch(branchData);
    } catch (error) {
      console.error("Failed to load financials:", error);
    } finally {
      setLoading(false);
    }
  }, [user, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewHistory = async () => {
    if (!user?.branchId) return;
    const payments = await principalApiService.getErpPaymentsForBranch(
      user.branchId
    );
    const sortedPayments = payments.sort(
      (a, b) =>
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

  const { monthly, session, summary, classFeeSummaries } = financials;
  const REVENUE_COLORS = ["#4F46E5", "#F97316", "#38BDF8"];
  const EXPENSE_COLORS = ["#EF4444", "#F59E0B"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="This Month's Revenue"
          value={monthly.revenue.toLocaleString()}
          icon={<BanknoteIcon className="w-6 h-6" />}
        />
        <StatCard
          title="This Month's Expenses"
          value={monthly.expenditure.toLocaleString()}
          icon={<FinanceIcon className="w-6 h-6" />}
        />
        <StatCard
          title="This Month's Net"
          value={monthly.net.toLocaleString()}
          icon={<FinanceIcon className="w-6 h-6" />}
        />
        <Card className="flex flex-col items-center justify-center p-4 text-center">
          <div className="p-3 mb-2 text-white bg-brand-primary rounded-full">
            <BanknoteIcon className="w-6 h-6" />
          </div>
          <p className="text-3xl font-bold text-brand-primary">
            {(summary.erpBillAmountForCycle || 0).toLocaleString()}
          </p>
          <h3 className="text-sm font-medium text-text-secondary-dark capitalize">
            {summary.erpBillingCycle} ERP Bill
          </h3>

          {summary.isErpBillPaid ? (
            <div className="mt-2">
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Paid
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Next bill due on{" "}
                {summary.erpNextDueDate
                  ? new Date(summary.erpNextDueDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          ) : (
            <div className="mt-2">
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                Due
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Due on{" "}
                {summary.erpNextDueDate
                  ? new Date(summary.erpNextDueDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          )}

          <div className="flex gap-2 mt-auto pt-2">
            <Button
              variant="secondary"
              className="!text-xs !py-1 !px-2"
              onClick={handleViewHistory}
            >
              View History
            </Button>
            <Button
              className="!text-xs !py-1 !px-2"
              onClick={() => setIsPayModalOpen(true)}
              disabled={
                summary.isErpBillPaid ||
                !branch?.paymentGatewayPublicKey ||
                (user?.enabledFeatures &&
                  user.enabledFeatures["erp_billing_enabled"] === false)
              }
              title={
                user?.enabledFeatures &&
                user.enabledFeatures["erp_billing_enabled"] === false
                  ? "ERP billing is currently disabled by the administration."
                  : !branch?.paymentGatewayPublicKey
                  ? "Online payments not configured for this branch"
                  : summary.isErpBillPaid
                  ? "Current bill is paid"
                  : "Pay ERP Bill"
              }
            >
              Pay Now
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-text-primary-dark mb-4 text-center">
          Current Academic Session Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-700">Total Session Revenue</p>
            <p className="text-3xl font-bold text-green-600">
              {session.revenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-700">Total Session Expenditure</p>
            <p className="text-3xl font-bold text-red-500">
              {session.expenditure.toLocaleString()}
            </p>
          </div>
          <div
            className={`p-4 rounded-lg ${
              session.net >= 0 ? "bg-blue-50" : "bg-orange-50"
            }`}
          >
            <p
              className={`text-sm ${
                session.net >= 0 ? "text-blue-700" : "text-orange-700"
              }`}
            >
              Net Session Profit / Loss
            </p>
            <p
              className={`text-3xl font-bold ${
                session.net >= 0 ? "text-blue-600" : "text-orange-600"
              }`}
            >
              {session.net.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
            This Month's Revenue Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={monthly.revenueBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {monthly.revenueBreakdown.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={REVENUE_COLORS[index % REVENUE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => value.toLocaleString()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
            This Month's Expense Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={monthly.expenditureBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#82ca9d"
                label
              >
                {monthly.expenditureBreakdown.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => value.toLocaleString()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
          Class-wise Fee Status (All-Time Pending)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b">
              <tr>
                <th className="p-2">Class</th>
                <th className="p-2">Students</th>
                <th className="p-2">Defaulters</th>
                <th className="p-2">Pending Amount</th>
              </tr>
            </thead>
            <tbody>
              {classFeeSummaries.map((summary) => (
                <tr key={summary.classId} className="border-b">
                  <td className="p-2 font-medium">{summary.className}</td>
                  <td className="p-2">{summary.studentCount}</td>
                  <td className="p-2 text-red-600 font-semibold">
                    {summary.defaulterCount}
                  </td>
                  <td className="p-2 text-red-600 font-semibold">
                    {summary.pendingAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {user && showHistoryModal && (
        <ErpPaymentHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          // FIX: 'schoolName' property might not exist on User type, using optional chaining
          branchName={(user as any).schoolName || ""}
          payments={paymentHistory}
        />
      )}

      {isPayModalOpen && branch && user && (
        <PayErpBillModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          onSuccess={handlePaymentSuccess}
          amount={financials.summary.erpBillAmountForCycle || 0}
          branch={branch}
          principal={user}
        />
      )}
    </div>
  );
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
    if (!user?.branchId) return;
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
    if (!user || !description || !amount) return;
    setIsSubmitting(true);
    await principalApiService.addManualExpense({
      branchId: user.branchId!,
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
