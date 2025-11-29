// src/pages/principal/FinancialOverview.tsx
import React, { useEffect, useState, useCallback } from "react";
import { PrincipalApiService } from "../../services/principalApiService";
import type { PrincipalFinancialsOverview } from "../../types";
import Card from "../../components/ui/Card.tsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AlertTriangleIcon } from "../../components/icons/Icons.tsx";

const apiService = new PrincipalApiService();

// --- LOCAL ICONS (To fix import errors) ---

const TrendingUpIcon: React.FC<{ className?: string }> = ({ className }) => (
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

const TrendingDownIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 5.186m0 0l-1.22 2.74m1.22-2.74l4.607 3.796"
    />
  </svg>
);

const RupeeIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M15 8.25H9m6 3H9m3 6l-3-5.156a1.5 1.5 0 00-1.529-1.094H14.25M15 8.25H9m3-6v6m-6 12l3-5.156"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5.25h9M9 8.25h6" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 18.75L13.5 11.25H9"
    />
  </svg>
);

// --- Helper Component for Stat Cards ---
const StatCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  colorClass?: string;
}> = ({ title, value, subtitle, icon, colorClass = "bg-white" }) => (
  <Card className={`${colorClass} border-l-4 border-l-brand-primary`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-text-secondary-dark">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className="p-2 bg-slate-100 rounded-lg text-brand-primary">
        {icon}
      </div>
    </div>
  </Card>
);

const FinancialOverview: React.FC = () => {
  const [data, setData] = useState<PrincipalFinancialsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.getFinancialsOverview();
      setData(result);
    } catch (error) {
      console.error("Failed to load financials:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading)
    return <div className="p-8 text-center">Loading financial data...</div>;
  if (!data)
    return <div className="p-8 text-center">No financial data available.</div>;

  const { monthly, session, summary, classFeeSummaries } = data;

  // Prepare Chart Data
  const revenueVsExpenseData = [
    { name: "Revenue", value: monthly.revenue },
    { name: "Expenses", value: monthly.expenditure },
  ];

  const PIE_COLORS = ["#10B981", "#EF4444"]; // Green, Red

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Financial Overview
      </h1>

      {/* --- Top Stats Row --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Revenue"
          value={`₹${monthly.revenue.toLocaleString()}`}
          subtitle="Tuition & Fees"
          icon={<TrendingUpIcon className="w-6 h-6" />}
        />
        <StatCard
          title="Monthly Expenses"
          value={`₹${monthly.expenditure.toLocaleString()}`}
          subtitle="Payroll & Operations"
          icon={<TrendingDownIcon className="w-6 h-6" />}
        />
        <StatCard
          title="Net Balance (Month)"
          value={`₹${monthly.net.toLocaleString()}`}
          subtitle={monthly.net >= 0 ? "Surplus" : "Deficit"}
          // FIX: Used RupeeIcon here
          icon={<RupeeIcon className="w-6 h-6" />}
          colorClass={monthly.net >= 0 ? "bg-green-50" : "bg-red-50"}
        />
        <StatCard
          title="Total Pending Fees"
          value={`₹${summary.totalPending.toLocaleString()}`}
          subtitle="Across all classes"
          icon={<AlertTriangleIcon className="w-6 h-6 text-yellow-600" />}
        />
      </div>

      {/* --- Charts Row --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Monthly Breakdown (Pie) */}
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Monthly Cash Flow</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueVsExpenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueVsExpenseData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b pb-1">
              <span className="text-slate-600">Income Sources:</span>
            </div>
            {monthly.revenueBreakdown.map((item, i) => (
              <div key={i} className="flex justify-between pl-2">
                <span>{item.name}</span>
                <span className="font-medium">
                  ₹{item.value.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-b pb-1 mt-2">
              <span className="text-slate-600">Expenditure:</span>
            </div>
            {monthly.expenditureBreakdown.map((item, i) => (
              <div key={i} className="flex justify-between pl-2">
                <span>{item.name}</span>
                <span className="font-medium">
                  ₹{item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Class Fee Collection (Bar) */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">
            Fee Collection by Class
          </h3>
          <div className="h-80">
            {classFeeSummaries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={classFeeSummaries}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="className"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => `₹${value.toLocaleString()}`}
                  />
                  <Legend verticalAlign="top" />
                  <Bar
                    dataKey="pendingAmount"
                    name="Pending"
                    fill="#EF4444"
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                No class data available
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* --- ERP Billing Status --- */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">
              Platform Billing (Verticx)
            </h3>
            <p className="text-sm text-text-secondary-dark">
              Billing Cycle:{" "}
              <span className="font-medium capitalize">
                {summary.erpBillingCycle || "N/A"}
              </span>
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <p className="text-sm text-text-secondary-dark">Next Due Date</p>
            <p className="text-xl font-bold">
              {summary.erpNextDueDate
                ? new Date(summary.erpNextDueDate).toLocaleDateString()
                : "N/A"}
            </p>
            <p
              className={`text-sm font-bold ${
                summary.isErpBillPaid ? "text-green-600" : "text-red-600"
              }`}
            >
              {summary.isErpBillPaid ? "Paid" : "Payment Due"}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <h3 className="text-2xl font-bold text-brand-primary">
              ₹{(summary.erpBillAmountForCycle || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-text-secondary-dark text-right">
              Estimated Bill
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FinancialOverview;
