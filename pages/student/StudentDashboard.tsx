import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import {
  StudentApiService,
  SharedApiService,
  RegistrarApiService,
} from "../../services";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
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
} from "../../types.ts";

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
} from "../../components/icons/Icons.tsx";

import { useNavigate } from "react-router-dom";
import TimetableModal from "../../components/modals/TimetableModal.tsx";
import StudentComplaintModal from "../../components/modals/StudentComplaintModal.tsx";
import SkillRadarChart from "../../components/charts/SkillRadarChart.tsx";
import { useDataRefresh } from "../../contexts/DataRefreshContext.tsx";
import FeeDetailsModal from "../../components/modals/FeeDetailsModal.tsx";
import PayFeesModal from "../../components/modals/PayFeesModal.tsx";
import ContactCard from "../../components/shared/ContactCard.tsx";

const apiService = new StudentApiService();
const sharedApiService = new SharedApiService();
const registrarService = new RegistrarApiService();

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
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
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isFeeDetailsOpen, setIsFeeDetailsOpen] = useState(false);
  const [isPayFeesModalOpen, setIsPayFeesModalOpen] = useState(false);
  const { triggerRefresh, refreshKey } = useDataRefresh();

  const fetchData = useCallback(async () => {
    if (!user?.branchId) return; // Guard clause
    setLoading(true);
    try {
      // 1. Fetch Dashboard Data
      const result = await apiService.getStudentDashboardData();
      setData(result);
      const branchId = user.branchId;

      // 2. Fetch Principal Data (if exists)
      let principalData = null;
      if (result.branch.principalId) {
        try {
          // Note: Students might not have permission to call registrarService.getUserById.
          // Ideally, principal name should come in the dashboard data or a public endpoint.
          // We'll try-catch this specific call to avoid breaking the whole dashboard.
          // principalData = await registrarService.getUserById(result.branch.principalId);
        } catch (e) {
          console.warn("Could not fetch principal details", e);
        }
      }

      // 3. Fetch Other Data in Parallel
      // FIX: We use the *instances* (apiService, sharedApiService) not the Class definitions.
      const [transport, teachersData, subjectsData] = await Promise.all([
        apiService.getMyTransportDetails(),
        sharedApiService.getTeachersByBranch(branchId),
        sharedApiService.getSubjectsByBranch(branchId),
      ]);

      setPrincipal(principalData);
      const studentData = result.student as any;
     if (studentData.busStop && studentData.busStop.transportRoute) {
       setTransportDetails({
         stop: studentData.busStop,
         route: studentData.busStop.transportRoute,
       });
     } else {
       setTransportDetails(null);
     }

     // 4. Extract Hostel Details
     if (studentData.room && studentData.room.hostel) {
       setAccommodationDetails({
         room: studentData.room,
         hostel: studentData.room.hostel,
       });
     } else {
       setAccommodationDetails(null);
     }
      setTeachers(teachersData || []);
      setSubjects(subjectsData || []);
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
      setData((prevData) =>
        prevData
          ? {
              ...prevData,
              profile: { ...prevData.profile, profilePictureUrl: base64Image },
            }
          : null
      );
      // Assuming updateStudent handles partial updates
      await apiService.updateStudent({ profilePictureUrl: base64Image } as any);
    };
    reader.readAsDataURL(file);
  };

  const handleComplaintModalClose = () => {
    setIsComplaintModalOpen(false);
    triggerRefresh();
  };

  if (loading)
    return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!data)
    return (
      <div className="p-8 text-center">Could not load dashboard data.</div>
    );

  const {
    student,
    branch, // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const transportFee = transportDetails?.stop.charges || 0;
  const hostelFee = accommodationDetails?.room.fee || 0;
  const totalOutstandingWithExtras =
    fees.totalOutstanding + transportFee + hostelFee;

  // FIX: Add safety checks for selfStudyProgress to prevent "undefined is not an object"
  const totalLectures = selfStudyProgress?.totalLectures || 0;
  const studentCompletedLectures =
    selfStudyProgress?.studentCompletedLectures || 0;
  const teacherCompletedLectures =
    selfStudyProgress?.teacherCompletedLectures || 0;

  const studentProgressPercent =
    totalLectures > 0 ? (studentCompletedLectures / totalLectures) * 100 : 0;
  const teacherProgressPercent =
    totalLectures > 0 ? (teacherCompletedLectures / totalLectures) * 100 : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        My Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Identity & Personal Info */}
        <div className="space-y-6">
          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="relative w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-4xl font-bold text-brand-primary mb-3 overflow-hidden">
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
                  className="absolute bottom-0 right-0 bg-brand-secondary text-white rounded-full p-1.5 hover:bg-brand-accent transition-colors"
                  aria-label="Upload profile picture"
                >
                  <UploadCloudIcon className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-bold">{profile.name}</h2>
              <p className="text-sm font-mono text-text-secondary-dark">
                {profile.userId}
              </p>
              <p className="text-text-secondary-dark">{profile.class}</p>
              <p className="text-sm font-mono text-text-secondary-dark">
                Roll No: {profile.rollNo}
              </p>
              <div className="text-center mt-2 border-t pt-2 w-full">
                <p className="text-sm text-text-secondary-dark font-semibold">
                  Mentor: {profile.mentor?.name || "Not Assigned"}
                </p>
                {profile.mentor && profile.mentor.name !== "Not Assigned" && (
                  <>
                    {profile.mentor.email && (
                      <p className="text-xs text-text-secondary-dark">
                        {profile.mentor.email}
                      </p>
                    )}
                    {(profile.mentor as any).phone && (
                      <p className="text-xs text-text-secondary-dark">
                        {(profile.mentor as any).phone}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>

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
                <span className="text-text-secondary-dark">
                  Monthly Installment:
                </span>{" "}
                <span className="font-medium">
                  {(fees.currentMonthDue || 0).toLocaleString()}
                </span>
              </div>
              {transportFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary-dark">
                    Transport Included:
                  </span>{" "}
                  <span className="font-medium text-slate-600">
                    {transportFee.toLocaleString()}
                  </span>
                </div>
              )}
              {hostelFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary-dark">
                    Hostel Included:
                  </span>{" "}
                  <span className="font-medium text-slate-600">
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
                    fees.totalOutstanding > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {fees.totalOutstanding.toLocaleString()}
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
                fees.totalOutstanding <= 0 ||
                !user?.enabledFeatures?.online_payments_enabled
              }
            >
              {!user?.enabledFeatures?.online_payments_enabled
                ? "Online Payment Disabled"
                : fees.totalOutstanding <= 0
                ? "All Fees Paid"
                : "Pay Now"}
            </Button>
          </Card>

          {transportDetails && (
            <Card>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TransportIcon className="w-5 h-5 text-brand-secondary" />
                Transport Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary-dark">Route:</span>{" "}
                  <span className="font-semibold">
                    {transportDetails.route.routeName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary-dark">Bus No:</span>{" "}
                  <span className="font-semibold">
                    {transportDetails.route.busNumber}
                  </span>
                </div>
                <div className="p-2 bg-slate-100 rounded-md mt-2">
                  <p>
                    <strong>Driver:</strong> {transportDetails.route.driverName}{" "}
                    ({transportDetails.route.driverNumber})
                  </p>
                  <p>
                    <strong>Conductor:</strong>{" "}
                    {transportDetails.route.conductorName} (
                    {transportDetails.route.conductorNumber})
                  </p>
                </div>
                <div className="p-2 bg-slate-100 rounded-md mt-2">
                  <p>
                    <strong>Your Stop:</strong> {transportDetails.stop.name}
                  </p>
                  <p>
                    <strong>Pickup:</strong> {transportDetails.stop.pickupTime}
                  </p>
                  <p>
                    <strong>Drop:</strong> {transportDetails.stop.dropTime}
                  </p>
                </div>
                <div className="flex justify-between pt-2 border-t mt-2">
                  <span className="text-text-secondary-dark font-medium">
                    Monthly Fee:
                  </span>
                  <span className="font-bold text-lg text-brand-primary">
                    {transportDetails.stop.charges.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          )}
          {accommodationDetails && (
            <Card>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <HostelIcon className="w-5 h-5 text-brand-secondary" />
                Hostel Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary-dark">Hostel Name:</span>{" "}
                  <span className="font-semibold">
                    {accommodationDetails.hostel.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary-dark">Room No:</span>{" "}
                  <span className="font-semibold">
                    {accommodationDetails.room.roomNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary-dark">Type:</span>{" "}
                  <span className="font-semibold">
                    {accommodationDetails.room.roomType}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-md mt-2 border border-slate-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Warden:</span>
                    <span className="font-medium text-slate-800">
                      {accommodationDetails.hostel.warden}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact:</span>
                    <span className="text-slate-800">
                      {accommodationDetails.hostel.wardenNumber}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}
          <Card>
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsTimetableOpen(true)}
              >
                View Timetable
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

        {/* Column 2: Academic Performance */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold mb-3 text-center">
              Key Metrics
            </h3>
            <div className="flex flex-col sm:flex-row justify-around text-center gap-4">
              <div>
                <p className="text-3xl font-bold text-brand-secondary">
                  {ranks?.class || 0}
                </p>
                <p className="text-sm text-text-secondary-dark">Class Rank</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-brand-secondary">
                  {ranks?.school || 0}
                </p>
                <p className="text-sm text-text-secondary-dark">School Rank</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-brand-secondary">
                  {overallMarksPercentage?.toFixed(1) || 0}%
                </p>
                <p className="text-sm text-text-secondary-dark">
                  Overall Marks
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
              Academic Performance
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="My Score" fill="#4F46E5" />
                <Bar dataKey="Class Average" fill="#FB923C" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">Skill Assessment</h3>
            <SkillRadarChart skills={skills || []} />
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">AI Study Suggestion</h3>
            <p className="text-sm text-center text-text-secondary-dark bg-slate-100 p-3 rounded-lg">
              "{aiSuggestion}"
            </p>
          </Card>
        </div>

        {/* Column 3: School Life & Schedule */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold mb-3 text-center">
              Session Attendance
            </h3>
            <div className="relative" style={{ height: "150px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    fill="#8884d8"
                    paddingAngle={0}
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
                        stroke={
                          ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="font-bold text-2xl text-text-primary-dark">
                  {attendance?.monthlyPercentage?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">Study Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-text-primary-dark">
                    My Progress
                  </span>
                  <span className="font-semibold text-text-primary-dark">
                    {studentProgressPercent.toFixed(0)}%
                  </span>
                </div>
                <div
                  className="w-full bg-slate-200 rounded-full h-2.5"
                  title={`${studentCompletedLectures} of ${totalLectures} topics completed`}
                >
                  <div
                    className="bg-brand-secondary h-2.5 rounded-full"
                    style={{ width: `${studentProgressPercent}%` }}
                  ></div>
                </div>
                <p className="text-xs text-text-secondary-dark text-right mt-1">
                  {studentCompletedLectures} / {totalLectures} topics completed
                </p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-text-primary-dark">
                    Class Progress (Taught)
                  </span>
                  <span className="font-semibold text-text-primary-dark">
                    {teacherProgressPercent.toFixed(0)}%
                  </span>
                </div>
                <div
                  className="w-full bg-slate-200 rounded-full h-2.5"
                  title={`${teacherCompletedLectures} of ${totalLectures} topics taught`}
                >
                  <div
                    className="bg-brand-primary h-2.5 rounded-full"
                    style={{ width: `${teacherProgressPercent}%` }}
                  ></div>
                </div>
                <p className="text-xs text-text-secondary-dark text-right mt-1">
                  {teacherCompletedLectures} / {totalLectures} topics taught
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="!text-xs !py-1 mt-4 w-full"
              onClick={() => navigate("/student/syllabus")}
            >
              Go to Syllabus
            </Button>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">
              Upcoming Examinations
            </h3>
            {examSchedule && examSchedule.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {examSchedule.map((exam) => (
                  <div
                    key={exam.id}
                    className="text-sm p-2 bg-slate-100 rounded"
                  >
                    <p className="font-bold">{exam.subjectName}</p>
                    <p className="text-xs text-text-secondary-dark">
                      {new Date(exam.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-text-secondary-dark">
                      {exam.startTime} - {exam.endTime} (Room: {exam.room})
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center text-text-secondary-dark p-4">
                No upcoming exam schedule published.
              </p>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Announcements</h3>
              <BellIcon className="w-5 h-5 text-brand-secondary" />
            </div>
            {announcements && announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-slate-50 p-3 rounded-lg">
                    <h4 className="font-bold text-sm text-text-primary-dark">
                      {ann.title}
                    </h4>
                    <p className="text-xs text-text-secondary-dark">
                      {new Date(ann.sentAt).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-xs">{ann.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center text-text-secondary-dark p-4">
                No recent announcements.
              </p>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">Library Books Issued</h3>
            {library && library.issuedBooks.length > 0 ? (
              <ul className="text-sm list-disc pl-4 space-y-1">
                {library.issuedBooks.map((b) => (
                  <li key={b.id}>
                    {b.bookTitle} (Due:{" "}
                    {new Date(b.dueDate).toLocaleDateString()})
                    <span className="text-xs text-slate-500 ml-2">
                      Fine: {b.finePerDay.toFixed(2)}/day
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-center text-text-secondary-dark">
                No books issued.
              </p>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <ContactCard branch={data.branch} principalName={principal?.name} />
      </div>

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
