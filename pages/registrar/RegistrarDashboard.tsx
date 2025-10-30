import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
// FIX: Corrected imports to use the service classes directly from their files and created instances.
import { RegistrarApiService } from "../../services/registrarApiService";
import { SharedApiService } from "../../services/sharedApiService";
import type { RegistrarDashboardData, Branch, User } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import {
  StudentsIcon,
  TeachersIcon,
  AdmissionsIcon,
  FeesIcon,
  RequestsIcon,
} from "../../components/icons/Icons";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useDataRefresh } from "../../contexts/DataRefreshContext";
import ContactCard from "../../components/shared/ContactCard";

const apiService = new RegistrarApiService();
const sharedApiService = new SharedApiService();

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
}> = ({ title, value, icon }) => (
  <Card className="flex items-center p-4">
    <div className="p-3 mr-4 text-brand-accent bg-brand-primary rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-text-secondary-dark">{title}</p>
      <p className="text-2xl font-semibold text-text-primary-dark">{value}</p>
    </div>
  </Card>
);

const RegistrarDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<RegistrarDashboardData | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [principal, setPrincipal] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { triggerRefresh, refreshKey } = useDataRefresh();
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.branchId) return;
      setLoading(true);
      // FIX: Re-added the mandatory branchId to the API calls that require it.
      const [result, branchData] = await Promise.all([
        apiService.getRegistrarDashboardData(), // This specific call may not need it if the backend uses JWT
        sharedApiService.getBranchById(user.branchId),
      ]);
      setData(result);
      setBranch(branchData);
      if (branchData?.principalId) {
        const principalData = await apiService.getUserById(
          branchData.principalId
        );
        setPrincipal(principalData || null);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, refreshKey]);

  const handleApplicationAction = async (
    appId: string,
    status: "approved" | "denied"
  ) => {
    setActionLoading((prev) => ({ ...prev, [appId]: true }));
    try {
      await apiService.updateApplicationStatus(appId, status);
      triggerRefresh();
    } catch (error) {
      console.error(`Failed to ${status} application:`, error);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;
  if (!data) return <div>Could not load dashboard data.</div>;

  const {
    summary,
    admissionRequests,
    feeOverview,
    pendingEvents,
    classFeeSummaries,
    teacherAttendanceStatus,
    academicRequests,
  } = data;

  const feeChartData = feeOverview.map((item) => ({
    month: item.month,
    Paid: item.paid,
    Pending: item.pending,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Registrar Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <StatCard
          title="Pending Admissions"
          value={summary.pendingAdmissions.toLocaleString()}
          icon={<AdmissionsIcon />}
        />
        <StatCard
          title="Pending Academic Requests"
          value={summary.pendingAcademicRequests.toLocaleString()}
          icon={<RequestsIcon />}
        />
        <StatCard
          title="Fees Pending"
          value={`${(summary.feesPending / 1000).toFixed(1)}k`}
          icon={<FeesIcon />}
        />
        <StatCard
          title="Unassigned Faculty"
          value={summary.unassignedFaculty.toLocaleString()}
          icon={<TeachersIcon />}
        />
        <StatCard
          title="Pending Events"
          value={pendingEvents.length.toLocaleString()}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 2v4" />
              <path d="M16 2v4" />
              <rect width="18" height="18" x="3" y="4" rx="2" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
              New Admission Requests
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {admissionRequests.length > 0 ? (
                admissionRequests.map((app) => (
                  <div
                    key={app.id}
                    className="flex justify-between items-center p-2 bg-slate-100 rounded"
                  >
                    <div>
                      <p className="font-medium text-sm">{app.applicantName}</p>
                      <p className="text-xs text-text-secondary-dark">
                        {app.type} -{" "}
                        {app.type === "Student"
                          ? `Grade ${app.grade}`
                          : app.subject}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        className="!px-2 !py-1 text-xs"
                        onClick={() =>
                          handleApplicationAction(app.id, "approved")
                        }
                        disabled={actionLoading[app.id]}
                      >
                        ✔
                      </Button>
                      <Button
                        variant="danger"
                        className="!px-2 !py-1 text-xs"
                        onClick={() =>
                          handleApplicationAction(app.id, "denied")
                        }
                        disabled={actionLoading[app.id]}
                      >
                        ✖
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center text-text-secondary-dark p-4">
                  No pending admissions.
                </p>
              )}
            </div>
            <Button
              className="w-full mt-4"
              onClick={() => navigate("/registrar/admissions")}
            >
              Manage Admissions
            </Button>
          </Card>
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-text-primary-dark">
                Academic Requests
              </h2>
              <span className="font-bold text-lg bg-red-100 text-red-700 px-3 py-1 rounded-full">
                {academicRequests.count}
              </span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {academicRequests.requests.length > 0 ? (
                academicRequests.requests.map((req) => (
                  <div key={req.id} className="p-2 bg-slate-100 rounded">
                    <p className="font-medium text-sm">{req.type}</p>
                    <p className="text-xs text-text-secondary-dark">
                      {req.description}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center text-text-secondary-dark p-4">
                  No pending academic requests.
                </p>
              )}
            </div>
            <Button
              className="w-full mt-4"
              onClick={() => navigate("/registrar/academic-requests")}
            >
              Manage Requests
            </Button>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate("/registrar/admissions")}
              >
                Add Student
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate("/registrar/faculty")}
              >
                Add Faculty
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate("/registrar/reports")}
              >
                Generate Report
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate("/registrar/events")}
              >
                Approve Events
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
              Fee Collection Overview (Monthly)
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={feeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="Paid" stackId="a" fill="#4F46E5" />
                <Bar dataKey="Pending" stackId="a" fill="#F97316" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">Class-wise Fee Status</h2>
                <Button
                  variant="secondary"
                  className="!text-xs !py-1 !px-2"
                  onClick={() => navigate("/registrar/fees")}
                >
                  View Details
                </Button>
              </div>
              <ul className="text-sm space-y-2 max-h-40 overflow-y-auto pr-2">
                {classFeeSummaries.map((s) => (
                  <li
                    key={s.classId}
                    className="flex justify-between items-center p-2 bg-slate-50 rounded-md"
                  >
                    <span className="font-medium">{s.className}</span>
                    <div>
                      <span className="font-semibold text-red-500">
                        {s.pendingAmount.toLocaleString()}
                      </span>
                      <span className="text-xs text-text-secondary-dark ml-2">
                        ({s.defaulterCount} defaulters)
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold mb-3">
                Today's Attendance Issues
              </h2>
              <ul className="text-sm space-y-1 max-h-40 overflow-y-auto pr-2">
                {teacherAttendanceStatus.map((t) => (
                  <li key={t.teacherId} className="flex justify-between">
                    <span>{t.teacherName}</span>
                    <span
                      className={`font-semibold ${
                        t.status === "Absent"
                          ? "text-red-500"
                          : "text-yellow-500"
                      }`}
                    >
                      {t.status}
                    </span>
                  </li>
                ))}
                {teacherAttendanceStatus.length === 0 && (
                  <p className="text-xs text-center text-text-secondary-dark p-4">
                    All staff attendance marked and present.
                  </p>
                )}
              </ul>
            </Card>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <ContactCard
          branch={branch || undefined}
          principalName={principal?.name}
        />
      </div>
    </div>
  );
};

export default RegistrarDashboard;
