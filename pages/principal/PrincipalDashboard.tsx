import React, { useState, useEffect, useMemo } from "react";
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
import { useAuth } from "../../hooks/useAuth";
import { PrincipalApiService } from "../../services";
import type {
  PrincipalDashboardData,
  SchoolEvent,
  ErpPayment,
} from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import {
  StudentsIcon,
  TeachersIcon,
  FinanceIcon,
  BookOpenIcon,
} from "../../components/icons/Icons.tsx";
import { useNavigate } from "react-router-dom";
import ContactCard from "../../components/shared/ContactCard.tsx";
import ErpPaymentHistoryModal from "../../components/modals/ErpPaymentHistoryModal.tsx";
import AIAssistantCard from "../../components/principal/AIAssistantCard.tsx";

const principalApiService = new PrincipalApiService();

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
}> = ({ title, value, icon }) => (
  <Card className="flex items-center p-4">
    <div className="p-3 mr-4 text-white bg-brand-primary rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-text-secondary-dark">{title}</p>
      <p className="text-2xl font-semibold text-text-primary-dark">{value}</p>
    </div>
  </Card>
);

const SchoolRankCard: React.FC<{
  rank: number;
  score: number;
  averageScore: number;
}> = ({ rank, score, averageScore }) => (
  <Card>
    <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
      School Performance Rank
    </h2>
    <div className="flex flex-col sm:flex-row items-center justify-around text-center gap-4">
      <div>
        <p className="text-5xl font-bold text-brand-primary">#{rank}</p>
        <p className="text-sm text-text-secondary-dark">Your Rank</p>
      </div>
      <div className="border-l h-16 mx-4 border-slate-200 hidden sm:block"></div>
      <div>
        <p className="text-3xl font-semibold text-brand-secondary">
          {score.toFixed(1)}
        </p>
        <p className="text-sm text-text-secondary-dark">Your Score</p>
      </div>
      <div>
        <p className="text-3xl font-semibold text-text-secondary-dark">
          {averageScore.toFixed(1)}
        </p>
        <p className="text-sm text-text-secondary-dark">System Average</p>
      </div>
    </div>
    <p className="text-xs text-center text-slate-400 mt-4">
      Rank is calculated based on academic, attendance, and financial
      performance across all schools.
    </p>
  </Card>
);

const PrincipalDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<PrincipalDashboardData | null>(null);
  type DashboardBranch = PrincipalDashboardData["branch"];
  const [branch, setBranch] = useState<DashboardBranch | null>(null);
  const [lastPayment, setLastPayment] = useState<ErpPayment | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<ErpPayment[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const eventsByDate = useMemo(() => {
    if (!data?.allEvents) {
      return new Map<string, SchoolEvent[]>();
    }
    const map = new Map<string, SchoolEvent[]>();
    data.allEvents.forEach((event) => {
      const dateKey = new Date(event.date).toISOString().split("T")[0];
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [data?.allEvents]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [result, paymentsData] = await Promise.all([
          principalApiService.getPrincipalDashboardData(),
          principalApiService.getErpPayments(),
        ]);

        setData(result);
        setBranch(result.branch || null);

        const sortedPayments = paymentsData.sort(
          (a: ErpPayment, b: ErpPayment) =>
            new Date(b.paymentDate).getTime() -
            new Date(a.paymentDate).getTime()
        );
        setPaymentHistory(sortedPayments);

        if (sortedPayments.length > 0) {
          setLastPayment(sortedPayments[0]);
        }
        if (result && result.classes.length > 0) {
          setSelectedClassId(result.classes[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <div>Loading dashboard...</div>;
  if (!data) return <div>Could not load dashboard data.</div>;

  const {
    summary,
    classPerformance,
    teacherPerformance,
    topStudents,
    syllabusProgress,
    collectionsByGrade,
    schoolRank,
    schoolScore,
    averageSchoolScore,
    classes,
    subjectPerformanceByClass,
    pendingStaffRequests,
  } = data;

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

  const changeMonth = (delta: number) => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
  };

  const getStatusColor = (status: SchoolEvent["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-400";
      case "Approved":
        return "bg-green-500";
      case "Rejected":
        return "bg-red-500";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Principal's Dashboard
      </h1>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Students"
          value={summary.totalStudents.toLocaleString()}
          icon={<StudentsIcon className="w-5 h-5" />}
        />
        <StatCard
          title="Total Teachers"
          value={summary.totalTeachers.toLocaleString()}
          icon={<TeachersIcon className="w-5 h-5" />}
        />
        <StatCard
          title="Total Classes"
          value={summary.totalClasses.toLocaleString()}
          icon={<BookOpenIcon className="w-5 h-5" />}
        />
        <StatCard
          title="Fees Collected"
          value={`₹${(summary.feesCollected / 1000).toFixed(1)}k`}
          icon={<FinanceIcon className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- MAIN CONTENT COLUMN (Wide) --- */}
        <div className="lg:col-span-2 space-y-6">
          <SchoolRankCard
            rank={schoolRank}
            score={schoolScore}
            averageScore={averageSchoolScore}
          />

          {branch?.nextDueDate && (
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-text-primary-dark">
                  ERP Subscription
                </h2>
                <Button
                  variant="secondary"
                  className="!text-xs !py-1 !px-2"
                  onClick={() => setShowHistoryModal(true)}
                >
                  View History
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="font-semibold text-text-primary-dark">
                    Last Payment
                  </p>
                  <p className="text-2xl font-bold text-brand-accent">
                    {lastPayment
                      ? new Date(lastPayment.paymentDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "N/A"}
                  </p>
                  <p className="text-xs text-text-secondary-dark">
                    Amount: ₹
                    {lastPayment ? lastPayment.amount.toLocaleString() : "N/A"}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="font-semibold text-text-primary-dark">
                    Next Bill Due Date
                  </p>
                  <p className="text-2xl font-bold text-brand-secondary">
                    {new Date(branch.nextDueDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="font-semibold text-text-primary-dark">
                    Billing Cycle
                  </p>
                  <p className="text-2xl font-bold text-text-secondary-dark capitalize">
                    {branch?.billingCycle?.replace("_", " ") || "Monthly"}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-text-primary-dark">
                  Subject Performance
                </h2>
                {classes.length > 0 && (
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="bg-surface-dark border border-slate-300 rounded-md py-1 px-2 text-xs"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={subjectPerformanceByClass[selectedClassId] || []}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subjectName" fontSize={12} />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Bar
                    dataKey="averageScore"
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-text-primary-dark mb-4">
                Class Academic Performance
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={classPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    fontSize={12}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="performance"
                    fill="#4F46E5"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card>
            <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
              Top 5 Teacher Performance
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Teacher</th>
                    <th className="p-2">Avg. Score</th>
                    <th className="p-2">Syllabus</th>
                    <th className="p-2">Performance Index</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherPerformance.map((t) => (
                    <tr
                      key={t.teacherId}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="p-2 font-medium">{t.teacherName}</td>
                      <td className="p-2">{t.avgStudentScore.toFixed(1)}%</td>
                      <td className="p-2">
                        {t.syllabusCompletion.toFixed(1)}%
                      </td>
                      <td className="p-2 font-semibold text-brand-secondary">
                        {t.performanceIndex.toFixed(1)} / 100
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* --- MOVED HERE FOR BETTER LAYOUT --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-lg font-semibold text-text-primary-dark mb-4">
                Syllabus Progress
              </h2>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {syllabusProgress.map((s) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary-dark">{s.name}</span>
                      <span className="font-semibold">
                        {s.progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-brand-accent h-2 rounded-full"
                        style={{ width: `${s.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-text-primary-dark mb-4">
                Fee Collections by Grade
              </h2>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {collectionsByGrade.map((c) => {
                  const collected = c.collected;
                  const due = c.due;
                  const percentage = due > 0 ? (collected / due) * 100 : 100;
                  return (
                    <div key={c.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-text-secondary-dark">
                          {c.name}
                        </span>
                        <span className="font-semibold">
                          ₹{collected.toLocaleString()} / ₹
                          {due.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      {due - collected > 0 && (
                        <p className="text-xs text-right text-red-500 mt-1">
                          Pending: ₹{(due - collected).toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
          {/* --- END MOVED SECTION --- */}
        </div>

        {/* --- SIDEBAR COLUMN (Narrow) --- */}
        <div className="space-y-6">
          <AIAssistantCard data={data} />

          <Card>
            <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
              Events Calendar
            </h2>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => changeMonth(-1)}>&larr;</Button>
              <h3 className="text-md font-bold">
                {currentDate.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <Button onClick={() => changeMonth(1)}>&rarr;</Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-secondary-dark">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="border rounded-md bg-slate-50 min-h-[4rem]"
                ></div>
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => {
                  const date = new Date(
                    Date.UTC(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      day
                    )
                  );
                  const dateString = date.toISOString().split("T")[0];
                  const dayEvents = eventsByDate.get(dateString) || [];
                  return (
                    <div
                      key={day}
                      className="border rounded-md p-1 min-h-[4rem] flex flex-col"
                    >
                      <span className="font-semibold text-xs">{day}</span>
                      <div className="flex-grow flex items-end justify-center">
                        <div className="flex gap-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              title={`${event.name} (${event.status})`}
                              className={`w-1.5 h-1.5 rounded-full ${getStatusColor(
                                event.status
                              )}`}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
            <div className="flex justify-center gap-3 mt-4 text-xs">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                Approved
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></span>
                Pending
              </span>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
              Staff Requests
            </h2>
            {pendingStaffRequests.leave === 0 &&
            pendingStaffRequests.attendance === 0 &&
            pendingStaffRequests.fees === 0 ? (
              <p className="text-sm text-center text-text-secondary-dark p-4">
                No pending requests.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                  <span className="font-medium text-sm">
                    Leave Applications
                  </span>
                  <span className="font-bold text-lg text-brand-secondary">
                    {pendingStaffRequests.leave}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                  <span className="font-medium text-sm">
                    Attendance Changes
                  </span>
                  <span className="font-bold text-lg text-brand-secondary">
                    {pendingStaffRequests.attendance}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                  <span className="font-medium text-sm">
                    Fee Template Changes
                  </span>
                  <span className="font-bold text-lg text-brand-secondary">
                    {pendingStaffRequests.fees}
                  </span>
                </div>
              </div>
            )}
            <Button
              className="w-full mt-4"
              variant="secondary"
              onClick={() => navigate("/principal/staff-requests")}
            >
              View All Requests
            </Button>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
              Top 5 Students
            </h2>
            <div className="space-y-3">
              {topStudents.map((student, index) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <span
                      className={`font-bold text-lg w-8 text-center ${
                        index < 3
                          ? "text-brand-accent"
                          : "text-text-secondary-dark"
                      }`}
                    >
                      #{student.rank}
                    </span>
                    <div className="ml-2">
                      <p className="font-semibold text-text-primary-dark text-sm">
                        {student.studentName}
                      </p>
                      <p className="text-xs text-text-secondary-dark">
                        {student.className}
                      </p>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </Card>

          <ContactCard
            branch={branch || undefined}
            principalName={user?.name}
          />
        </div>
      </div>

      {user && showHistoryModal && (
        <ErpPaymentHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          branchName={branch?.name || ""}
          payments={paymentHistory}
        />
      )}
    </div>
  );
};

export default PrincipalDashboard;
