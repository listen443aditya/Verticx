import React, { useState, useMemo, useCallback } from "react";
import type {
  StudentProfile,
  AttendanceRecord,
  FeeHistoryItem,
} from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ConfirmationModal from "../ui/ConfirmationModal";
import { useAuth } from "../../hooks/useAuth";
import FeeHistoryModal from "./FeeHistoryModal";
import FeeAdjustmentModal from "./FeeAdjustmentModal";
import SkillRadarChart from "../charts/SkillRadarChart";
import SkillAssessor from "../teacher/SkillAssessor";

const AttendanceCalendar: React.FC<{ records: AttendanceRecord[] }> = ({
  records,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 3, 1)); // Default to April 2024 for mock data

  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    records.forEach((rec) => {
      const dateKey = rec.date;
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(rec);
    });
    return map;
  }, [records]);

  const getDayStatus = useCallback(
    (date: Date) => {
      const dateString = date.toISOString().split("T")[0];
      const dayRecords = recordsByDate.get(dateString);
      if (!dayRecords || dayRecords.length === 0) return "NoRecord";
      if (dayRecords.some((r) => r.status === "Absent")) return "Absent";
      if (dayRecords.some((r) => r.status === "Tardy")) return "Tardy";
      return "Present";
    },
    [recordsByDate]
  );

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (
      let i = 0;
      i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);
      i++
    ) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const changeMonth = (delta: number) => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => changeMonth(-1)}>&larr;</Button>
        <h3 className="text-xl font-bold">
          {currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <Button onClick={() => changeMonth(1)}>&rarr;</Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((day) => (
          <div
            key={day}
            className="text-center font-bold text-text-secondary-dark text-sm"
          >
            {day}
          </div>
        ))}
        {calendarDays.map((day, index) => {
          if (!day)
            return (
              <div
                key={`blank-${index}`}
                className="border rounded-md border-slate-100 h-16"
              ></div>
            );
          const status = getDayStatus(day);
          const statusColor = {
            Present: "bg-green-200",
            Absent: "bg-red-200",
            Tardy: "bg-yellow-200",
            NoRecord: "bg-slate-100",
          }[status];
          return (
            <div
              key={index}
              className={`p-2 h-16 text-center border rounded-md ${statusColor}`}
            >
              <span className="text-sm">{day.getDate()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FeeHistoryTable: React.FC<{ history: FeeHistoryItem[] }> = ({
  history,
}) => {
  const handleDownloadReceipt = (transactionId: string) => {
    alert(
      `Downloading receipt for transaction ${transactionId}... (mock action)`
    );
  };

  return (
    <div className="overflow-auto flex-grow pr-2">
      {history.length > 0 ? (
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-surface-dark/90 backdrop-blur-sm">
            <tr className="border-b">
              <th className="p-2">Date</th>
              <th className="p-2">Description</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => {
              if ("transactionId" in item) {
                // FeePayment
                return (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50 text-sm"
                  >
                    <td className="p-2">
                      {new Date(item.paidDate).toLocaleDateString()}
                    </td>
                    <td className="p-2">Payment Received</td>
                    <td className="p-2 text-right font-semibold text-green-600">
                      +{item.amount.toLocaleString()}
                    </td>
                    <td className="p-2 text-right">
                      <Button
                        variant="secondary"
                        className="!px-2 !py-1 text-xs"
                        onClick={() =>
                          handleDownloadReceipt(item.transactionId)
                        }
                      >
                        Receipt
                      </Button>
                    </td>
                  </tr>
                );
              } else {
                // FeeAdjustment
                return (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50 text-sm"
                  >
                    <td className="p-2">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      <p className="font-medium capitalize">{item.type}</p>
                      <p className="text-xs text-text-secondary-dark italic">
                        "{item.reason}" - {item.adjustedBy}
                      </p>
                    </td>
                    <td
                      className={`p-2 text-right font-semibold ${
                        item.amount > 0 ? "text-orange-600" : "text-blue-600"
                      }`}
                    >
                      {item.amount > 0 ? "+" : ""}
                      {item.amount.toLocaleString()}
                    </td>
                    <td className="p-2 text-right"></td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-text-secondary-dark">No payment history found.</p>
        </div>
      )}
    </div>
  );
};

interface StudentDetailModalProps {
  profile: StudentProfile;
  onClose: () => void;
  onResetPasswords?: (studentId: string) => void;
  onDataRefresh?: () => void;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  profile,
  onClose,
  onResetPasswords,
  onDataRefresh,
}) => {
  const {
    student,
    grades = [], // Default to empty array
    attendance, // Keep as is, it's an object now
    attendanceHistory = [], // Default to empty array
    classInfo, // Keep as is, it's a string
    feeStatus, // Keep as is, it's an object
    feeHistory = [], // Default to empty array
    rank = { class: "N/A", school: "N/A" }, // Default rank object
    skills = [], // Default to empty array
  } = profile || {};

  const { user } = useAuth();
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "attendance" | "fees" | "skills"
  >("overview");
  const [isAdjustFeeModalOpen, setIsAdjustFeeModalOpen] = useState(false);

  const handleFeeAdjustmentSave = () => {
    setIsAdjustFeeModalOpen(false);
    if (onDataRefresh) {
      onDataRefresh();
    }
  };

 const performanceData = (grades || []).map((g) => ({
   // Add || [] here too
   name:
     g.courseName.length > 15
       ? g.courseName.substring(0, 15) + "..."
       : g.courseName,
   Score: g.score,
 }));

  const attendancePercentage =
    attendance?.total > 0 // Use optional chaining (?.)
      ? ((attendance.present / attendance.total) * 100).toFixed(1)
      : "100.0";

  const tabButtonClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium focus:outline-none transition-colors ${
      isActive
        ? "border-b-2 border-brand-primary text-brand-primary"
        : "text-slate-500 hover:text-slate-700"
    }`;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
    >
      <Card className="w-full max-w-6xl h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-brand-primary">
              {student.profilePictureUrl ? (
                <img
                  src={student.profilePictureUrl}
                  alt={student.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                student.name.charAt(0)
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-text-primary-dark">
                {student.name}
              </h2>
              <p className="text-text-secondary-dark font-mono">
                {student.id} | {classInfo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-3xl font-light text-slate-500 hover:text-slate-800 leading-none"
          >
            &times;
          </button>
        </div>

        <div className="border-b border-slate-200 mb-4">
          <button
            className={tabButtonClasses(activeTab === "overview")}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={tabButtonClasses(activeTab === "skills")}
            onClick={() => setActiveTab("skills")}
          >
            Skills
          </button>
          <button
            className={tabButtonClasses(activeTab === "attendance")}
            onClick={() => setActiveTab("attendance")}
          >
            Attendance
          </button>
          {user?.role !== "Teacher" && (
            <button
              className={tabButtonClasses(activeTab === "fees")}
              onClick={() => setActiveTab("fees")}
            >
              Fee & Payment History
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto pr-2">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <h3 className="text-lg font-semibold mb-3">
                    Key Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-text-secondary-dark">
                        Date of Birth:
                      </span>{" "}
                      <span>{student.dob}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-text-secondary-dark">
                        Gender:
                      </span>{" "}
                      <span>{student.gender || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-text-secondary-dark">
                        Address:
                      </span>{" "}
                      <span>{student.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-text-secondary-dark">
                        Guardian:
                      </span>{" "}
                      <span>{profile.parent?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-text-secondary-dark">
                        Guardian Phone:
                      </span>{" "}
                      <span>{profile.parent?.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-text-secondary-dark">
                        Guardian Email:
                      </span>{" "}
                      <span>{profile.parent?.email}</span>
                    </div>
                  </div>
                </Card>
                {onResetPasswords && (
                  <Card>
                    <h3 className="text-lg font-semibold mb-3">
                      Credentials & Security
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-text-secondary-dark">
                          Student User ID:
                        </span>
                        <span className="font-mono bg-slate-100 p-1 rounded">
                          {student.id}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-text-secondary-dark">
                          Parent User ID:
                        </span>
                        <span className="font-mono bg-slate-100 p-1 rounded">
                          {student.parentId || "N/A"}
                        </span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-100">
                        <Button
                          variant="danger"
                          className="w-full"
                          onClick={() => setConfirmReset(true)}
                        >
                          Reset Student & Parent Passwords
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <h3 className="text-lg font-semibold mb-3">
                    Academic Performance
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={performanceData}
                      margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Score" fill="#4F46E5" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <h3 className="text-lg font-semibold mb-3">Ranking</h3>
                    <div className="flex justify-around text-center">
                      <div>
                        <p className="text-3xl font-bold text-brand-secondary">
                          {rank.class}
                        </p>
                        <p className="text-sm text-text-secondary-dark">
                          In Class
                        </p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-brand-secondary">
                          {rank.school}
                        </p>
                        <p className="text-sm text-text-secondary-dark">
                          In School
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <h3 className="text-lg font-semibold mb-3">
                      Overall Attendance
                    </h3>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-brand-secondary">
                        {attendancePercentage}%
                      </p>
                      <p className="text-sm text-text-secondary-dark">
                        ({attendance.present}/{attendance.total} days present)
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}
          {activeTab === "skills" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold mb-3">
                  Average Skill Assessment
                </h3>
                <SkillRadarChart skills={skills} />
              </Card>
              {user?.role === "Teacher" && onDataRefresh && (
                <Card>
                  <h3 className="text-lg font-semibold mb-3">My Assessment</h3>
                  {/* FIX: The 'teacherId' prop is no longer needed for SkillAssessor. */}
                  <SkillAssessor
                    studentId={student.id}
                    onSave={onDataRefresh}
                  />
                </Card>
              )}
            </div>
          )}
          {activeTab === "attendance" && (
            <Card>
              <AttendanceCalendar records={attendanceHistory || []} />
            </Card>
          )}
          {activeTab === "fees" && user?.role !== "Teacher" && (
            <div>
              <Card>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Fee Summary</h3>
                  {user?.role === "Principal" && (
                    <Button onClick={() => setIsAdjustFeeModalOpen(true)}>
                      Adjust Fee
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-100 p-3 rounded-lg">
                    <p className="text-sm text-text-secondary-dark">
                      Total Fee
                    </p>
                    <p className="text-2xl font-bold">
                      {feeStatus.total.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-100 p-3 rounded-lg">
                    <p className="text-sm text-text-secondary-dark">
                      Amount Paid
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {feeStatus.paid.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-100 p-3 rounded-lg">
                    <p className="text-sm text-text-secondary-dark">
                      Outstanding Dues
                    </p>
                    <p className="text-2xl font-bold text-red-500">
                      {(feeStatus.total - feeStatus.paid).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="mt-6">
                <h3 className="text-lg font-semibold mb-3">
                  Payment & Adjustment History
                </h3>
                <FeeHistoryTable history={feeHistory || []} />
              </Card>
            </div>
          )}
        </div>
        {confirmReset && onResetPasswords && (
          <ConfirmationModal
            isOpen={true}
            onClose={() => setConfirmReset(false)}
            onConfirm={() => {
              onResetPasswords(student.id);
              setConfirmReset(false);
            }}
            title="Confirm Password Reset"
            message={
              <>
                Are you sure you want to reset the passwords for both{" "}
                <strong>{student.name}</strong> and their parent? New temporary
                passwords will be sent via SMS.
              </>
            }
            confirmText="Reset Passwords"
            confirmVariant="danger"
          />
        )}
      </Card>
      {isAdjustFeeModalOpen && user?.role === "Principal" && onDataRefresh && (
        <FeeAdjustmentModal
          studentId={student.id}
          studentName={student.name}
          onClose={() => setIsAdjustFeeModalOpen(false)}
          onSave={handleFeeAdjustmentSave}
        />
      )}
    </div>
  );
};
export default StudentDetailModal;
