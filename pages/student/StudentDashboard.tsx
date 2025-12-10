import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { StudentApiService, SharedApiService } from "../../services";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import type {
  StudentDashboardData,
  Teacher,
  TransportRoute,
  BusStop,
  Hostel,
  Room,
  User,
  Subject,
  Student,
} from "../../types";

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

import {
  BellIcon,
  UploadCloudIcon,
  TransportIcon,
  HostelIcon,
} from "../../components/icons/Icons";

import { useNavigate } from "react-router-dom";
import TimetableModal from "../../components/modals/TimetableModal";
import StudentComplaintModal from "../../components/modals/StudentComplaintModal";
import SkillRadarChart from "../../components/charts/SkillRadarChart";
import { useDataRefresh } from "../../contexts/DataRefreshContext";
import FeeDetailsModal from "../../components/modals/FeeDetailsModal";
import PayFeesModal from "../../components/modals/PayFeesModal";
import ContactCard from "../../components/shared/ContactCard";

// Initialize Services
const apiService = new StudentApiService();
const sharedApiService = new SharedApiService();

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { triggerRefresh, refreshKey } = useDataRefresh();

  // Data State
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [principal, setPrincipal] = useState<User | null>(null);
  const [transportDetails, setTransportDetails] = useState<{
    route: TransportRoute;
    stop: BusStop;
  } | null>(null);
  const [accommodationDetails, setAccommodationDetails] = useState<{
    hostel: Hostel;
    room: Room;
  } | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals State
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isFeeDetailsOpen, setIsFeeDetailsOpen] = useState(false);
  const [isPayFeesModalOpen, setIsPayFeesModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.branchId) return;
    setLoading(true);

    try {
      // 1. Fetch Main Dashboard Data
      const result = await apiService.getStudentDashboardData();
      setData(result);

      // 2. Extract Principal Data
      // (Provided by the backend inside the branch object now, avoiding extra API calls)
      if ((result.branch as any).principal) {
        setPrincipal((result.branch as any).principal);
      }

      // 3. Fetch Auxiliary Data in Parallel
      const branchId = user.branchId;
      const [transport, teachersData, subjectsData] = await Promise.all([
        apiService.getMyTransportDetails(),
        sharedApiService.getTeachersByBranch(branchId),
        sharedApiService.getSubjectsByBranch(branchId),
      ]);

      setTransportDetails(transport);
      setTeachers(teachersData || []);
      setSubjects(subjectsData || []);

      // Keep null for now as backend doesn't support accommodation yet
      setAccommodationDetails(null);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Image = e.target?.result as string;
      // Optimistic UI Update
      setData((prevData) =>
        prevData
          ? {
              ...prevData,
              profile: { ...prevData.profile, profilePictureUrl: base64Image },
            }
          : null
      );
      // API Call
      await apiService.updateStudent({ profilePictureUrl: base64Image } as any);
    };
    reader.readAsDataURL(file);
  };

  const handleComplaintModalClose = () => {
    setIsComplaintModalOpen(false);
    triggerRefresh();
  };

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500">Loading dashboard...</div>
    );
  if (!data)
    return (
      <div className="p-8 text-center text-red-500">
        Could not load dashboard data.
      </div>
    );

  // Destructure Data
  const {
    student,
    profile,
    performance,
    ranks,
    attendance,
    library,
    fees,
    announcements,
    aiSuggestion,
    timetable,
    timetableConfig,
    examSchedule,
    overallMarksPercentage,
    skills,
    monthlyFeeBreakdown,
    selfStudyProgress,
  } = data;

  // Prepare Chart Data
  const performanceChartData = performance.map((p) => ({
    subject: p.subject,
    "My Score": p.score,
    "Class Average": p.classAverage,
  }));

  const attendanceChartData = [
    { name: "Present", value: attendance.monthlyPercentage },
    { name: "Absent", value: 100 - attendance.monthlyPercentage },
  ];
  const ATTENDANCE_COLORS = ["#4F46E5", "#e2e8f0"];

  // Fee Calculations
  const transportFee = transportDetails?.stop.charges || 0;
  const hostelFee = accommodationDetails?.room.fee || 0;
  const totalOutstandingWithExtras =
    fees.totalOutstanding + transportFee + hostelFee;

  // Progress Calculations
  const totalLectures = selfStudyProgress?.totalLectures || 0;
  const studentCompleted = selfStudyProgress?.studentCompletedLectures || 0;
  const teacherCompleted = selfStudyProgress?.teacherCompletedLectures || 0;

  const studentProgressPercent =
    totalLectures > 0 ? (studentCompleted / totalLectures) * 100 : 0;
  const teacherProgressPercent =
    totalLectures > 0 ? (teacherCompleted / totalLectures) * 100 : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        My Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMN 1: Identity, Fees, Transport */}
        <div className="space-y-6">
          {/* Identity Card */}
          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="relative w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-4xl font-bold text-brand-primary mb-3 overflow-hidden border-2 border-brand-primary/20">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/png, image/jpeg"
                  style={{ display: "none" }}
                />
                {profile.profilePictureUrl ? (
                  <img
                    src={profile.profilePictureUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.name.charAt(0)
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-brand-secondary text-white rounded-full p-1.5 hover:bg-brand-accent transition-colors shadow-sm"
                  aria-label="Upload profile picture"
                >
                  <UploadCloudIcon className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                {profile.name}
              </h2>

              {/* VRTX ID Display */}
              <p className="text-sm font-mono font-medium text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded mt-1">
                {profile.userId}
              </p>

              <p className="text-text-secondary-dark mt-1">{profile.class}</p>
              <p className="text-sm text-text-secondary-dark">
                Roll No:{" "}
                <span className="font-semibold text-slate-700">
                  {profile.rollNo}
                </span>
              </p>

              <div className="text-center mt-3 border-t border-slate-100 pt-3 w-full">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                  Class Mentor
                </p>
                <p className="text-sm font-medium text-slate-700">
                  {profile.mentor?.name || "Not Assigned"}
                </p>
                {profile.mentor && profile.mentor.name !== "Not Assigned" && (
                  <div className="text-xs text-slate-500 mt-0.5 space-y-0.5">
                    {profile.mentor.email && <p>{profile.mentor.email}</p>}
                    {(profile.mentor as any).phone && (
                      <p>{(profile.mentor as any).phone}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Fee Card */}
          <Card>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Fee Details</h3>
              {monthlyFeeBreakdown && (
                <Button
                  variant="secondary"
                  className="!text-xs !py-1 !px-2"
                  onClick={() => setIsFeeDetailsOpen(true)}
                >
                  View Breakdown
                </Button>
              )}
            </div>
            <div className="space-y-2 text-sm p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex justify-between">
                <span className="text-text-secondary-dark">Tuition Due:</span>{" "}
                <span className="font-medium">
                  {(fees.currentMonthDue || 0).toLocaleString()}
                </span>
              </div>
              {transportFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary-dark">Transport:</span>{" "}
                  <span className="font-medium">
                    {transportFee.toLocaleString()}
                  </span>
                </div>
              )}
              {hostelFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary-dark">Hostel:</span>{" "}
                  <span className="font-medium">
                    {hostelFee.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 mt-2">
                <span className="font-bold text-slate-700">
                  Total Outstanding:
                </span>{" "}
                <span
                  className={`font-bold text-lg ${
                    totalOutstandingWithExtras > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {totalOutstandingWithExtras.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-text-secondary-dark">Due Date:</span>{" "}
                <span className="font-medium text-slate-700">
                  {fees.dueDate
                    ? new Date(fees.dueDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
            <Button
              className="w-full mt-3"
              onClick={() => setIsPayFeesModalOpen(true)}
              disabled={
                totalOutstandingWithExtras <= 0 ||
                !user?.enabledFeatures?.online_payments_enabled
              }
            >
              {!user?.enabledFeatures?.online_payments_enabled
                ? "Online Payment Disabled"
                : totalOutstandingWithExtras <= 0
                ? "All Fees Paid"
                : "Pay Now"}
            </Button>
          </Card>

          {/* Transport Card */}
          {transportDetails && (
            <Card>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TransportIcon className="w-5 h-5 text-brand-secondary" />
                Transport
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary-dark">Route:</span>{" "}
                  <span className="font-semibold text-slate-700">
                    {transportDetails.route.routeName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary-dark">Bus:</span>{" "}
                  <span className="font-semibold text-slate-700">
                    {transportDetails.route.busNumber}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-md mt-2 border border-slate-100 space-y-1">
                  <p className="flex justify-between">
                    <span className="text-slate-500">Stop:</span>
                    <span className="font-medium text-slate-800">
                      {transportDetails.stop.name}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Pickup:</span>
                    <span className="font-medium text-slate-800">
                      {transportDetails.stop.pickupTime}
                    </span>
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsTimetableOpen(true)}
              >
                View Weekly Timetable
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate("/student/quizzes")}
              >
                Attend Quiz
              </Button>
              <Button
                variant="danger"
                onClick={() => setIsComplaintModalOpen(true)}
              >
                Raise a Complaint
              </Button>
            </div>
          </Card>
        </div>

        {/* COLUMN 2: Academic Performance & Stats */}
        <div className="space-y-6">
          {/* Key Metrics */}
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-center">
              Performance Overview
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-100">
              <div>
                <p className="text-2xl font-bold text-brand-secondary">
                  {ranks?.class || "-"}
                </p>
                <p className="text-xs text-text-secondary-dark uppercase tracking-wide font-medium mt-1">
                  Class Rank
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-secondary">
                  {ranks?.school || "-"}
                </p>
                <p className="text-xs text-text-secondary-dark uppercase tracking-wide font-medium mt-1">
                  School Rank
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {overallMarksPercentage?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-text-secondary-dark uppercase tracking-wide font-medium mt-1">
                  Overall
                </p>
              </div>
            </div>
          </Card>

          {/* Academic Chart */}
          <Card>
            <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
              Subject Analysis
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="subject"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "10px" }}
                />
                <Bar
                  dataKey="My Score"
                  fill="#4F46E5"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
                <Bar
                  dataKey="Class Average"
                  fill="#CBD5E1"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Skills */}
          <Card>
            <h3 className="text-lg font-semibold mb-3">Skill Assessment</h3>
            <div className="h-64">
              <SkillRadarChart skills={skills || []} />
            </div>
          </Card>

          {/* AI Suggestion */}
          <Card>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a8 8 0 0 1 8 8c0 3.25-2.25 6-5.5 7.5V20a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2.5C7.25 16 5 13.25 5 10a8 8 0 0 1 7-8Z" />
                  <path d="M9 22h6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">AI Insight</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  "{aiSuggestion}"
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* COLUMN 3: Attendance, Schedule, Notices */}
        <div className="space-y-6">
          {/* Attendance */}
          <Card>
            <h3 className="text-lg font-semibold mb-3 text-center">
              Attendance
            </h3>
            <div className="relative" style={{ height: "160px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {attendanceChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]
                        }
                        stroke="none"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-bold text-3xl text-text-primary-dark">
                  {attendance?.monthlyPercentage?.toFixed(0)}%
                </span>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                  Present
                </span>
              </div>
            </div>
          </Card>

          {/* Syllabus Progress */}
          <Card>
            <h3 className="text-lg font-semibold mb-3">Syllabus Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700">
                    My Completed Topics
                  </span>
                  <span className="font-bold text-brand-secondary">
                    {studentProgressPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-brand-secondary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${studentProgressPercent}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700">
                    Class Progress
                  </span>
                  <span className="font-bold text-brand-primary">
                    {teacherProgressPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-brand-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${teacherProgressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              className="!text-xs !py-1.5 mt-4 w-full"
              onClick={() => navigate("/student/syllabus")}
            >
              View Full Syllabus
            </Button>
          </Card>

          {/* Exams */}
          <Card>
            <h3 className="text-lg font-semibold mb-3">Upcoming Exams</h3>
            {examSchedule && examSchedule.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {examSchedule.map((exam) => (
                  <div
                    key={exam.id}
                    className="text-sm p-3 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-800">
                        {exam.subjectName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(exam.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-medium text-brand-primary bg-brand-primary/5 px-1.5 py-0.5 rounded">
                        {exam.startTime}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Room {exam.room}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">No upcoming exams.</p>
              </div>
            )}
          </Card>

          {/* Announcements */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Announcements</h3>
              <BellIcon className="w-5 h-5 text-brand-secondary" />
            </div>
            {announcements && announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="bg-amber-50 border border-amber-100 p-3 rounded-lg"
                  >
                    <h4 className="font-bold text-sm text-amber-900">
                      {ann.title}
                    </h4>
                    <p className="text-xs text-amber-600/80 mb-1">
                      {new Date(ann.sentAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {ann.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center text-text-secondary-dark p-4">
                No recent announcements.
              </p>
            )}
          </Card>

          {/* Library */}
          <Card>
            <h3 className="text-lg font-semibold mb-3">Issued Books</h3>
            {library && library.issuedBooks.length > 0 ? (
              <ul className="text-sm space-y-2">
                {library.issuedBooks.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-start gap-2 p-2 bg-slate-50 rounded"
                  >
                    <span className="text-xl">📖</span>
                    <div>
                      <p className="font-medium text-slate-800">
                        {b.bookTitle}
                      </p>
                      <p className="text-xs text-slate-500">
                        Due: {new Date(b.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-center text-text-secondary-dark p-4">
                No books currently issued.
              </p>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <ContactCard branch={data.branch} principalName={principal?.name} />
      </div>

      {/* Modals */}
      {isTimetableOpen && timetableConfig && (
        <TimetableModal
          isOpen={isTimetableOpen}
          onClose={() => setIsTimetableOpen(false)}
          title="My Weekly Timetable"
          config={timetableConfig}
          timetable={timetable}
          subjects={subjects}
          teachers={teachers}
        />
      )}
      {isComplaintModalOpen && (
        <StudentComplaintModal
          teachers={teachers}
          subjects={subjects}
          onSubmit={handleComplaintModalClose}
          onClose={handleComplaintModalClose}
        />
      )}
      {isPayFeesModalOpen && user && (
        <PayFeesModal
          isOpen={isPayFeesModalOpen}
          onClose={() => setIsPayFeesModalOpen(false)}
          student={student as Student}
          branch={data.branch}
          parent={student.guardianInfo}
        />
      )}
      {isFeeDetailsOpen && (
        <FeeDetailsModal
          isOpen={isFeeDetailsOpen}
          onClose={() => setIsFeeDetailsOpen(false)}
          studentName={profile.name}
          fees={fees}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
