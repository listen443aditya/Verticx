import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
// FIX: Correctly import the service class from its file and create an instance.
import { PrincipalApiService } from "../../services/principalApiService";
import Card from "../../components/ui/Card";
import { RegistrarApiService } from "../../services/registrarApiService";

import {
  AttendanceIcon,
  UsersIcon,
  StudentsIcon,
} from "../../components/icons/Icons";
import type {
  TeacherAttendanceStatus,
  PrincipalAttendanceOverview,
} from "../../types";
import StaffAttendanceCalendar from "../../components/shared/StaffAttendanceCalendar";

const principalApiService = new PrincipalApiService();
const apiService = new RegistrarApiService();

const StatCard: React.FC<{
  title: string;
  value: string;
  total: string;
  icon: React.ReactNode;
}> = ({ title, value, total, icon }) => (
  <Card className="flex items-center p-4">
    <div className="p-3 mr-4 text-brand-secondary bg-brand-primary/10 rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-text-secondary-dark">{title}</p>
      <p className="text-2xl font-semibold text-text-primary-dark">
        {value}{" "}
        <span className="text-lg text-text-secondary-dark">/ {total}</span>
      </p>
    </div>
  </Card>
);

const AttendanceOverview: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<PrincipalAttendanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "calendar">(
    "overview"
  );

  const fetchData = useCallback(async () => {
    if (!user?.branchId) return;
    setLoading(true);
    // This API call correctly uses branchId as per the service definition.
    const result = await principalApiService.getAttendanceOverview();
    setData(result);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (activeTab === "overview") {
      fetchData();
    }
  }, [fetchData, activeTab]);

  const tabButtonClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
      isActive
        ? "bg-slate-200 rounded-t-lg font-semibold text-text-primary-dark"
        : "text-text-secondary-dark hover:bg-slate-100"
    }`;

  const renderOverviewTab = () => {
    if (loading) return <div>Loading attendance overview...</div>;
    if (!data) return <div>Could not load data.</div>;

    const { summary, classAttendance, staffAttendance } = data;
    const studentAttendancePercent =
      summary.studentsTotal > 0
        ? ((summary.studentsPresent / summary.studentsTotal) * 100).toFixed(1)
        : "100";
    const staffAttendancePercent =
      summary.staffTotal > 0
        ? ((summary.staffPresent / summary.staffTotal) * 100).toFixed(1)
        : "100";

    const getStatusColor = (status: TeacherAttendanceStatus | "Not Marked") => {
      switch (status) {
        case "Present":
          return "bg-green-100 text-green-800";
        case "Absent":
          return "bg-red-100 text-red-800";
        case "On Leave":
          return "bg-blue-100 text-blue-800";
        case "Half Day":
          return "bg-yellow-100 text-yellow-800";
        default:
          return "bg-slate-100 text-slate-800";
      }
    };

    const staffAbsentees = staffAttendance.filter(
      (s) => s.status === "Absent" || s.status === "Not Marked"
    );

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Student Attendance"
            value={summary.studentsPresent.toString()}
            total={summary.studentsTotal.toString()}
            icon={<StudentsIcon className="w-5 h-5" />}
          />
          <StatCard
            title="Staff Attendance"
            value={summary.staffPresent.toString()}
            total={summary.staffTotal.toString()}
            icon={<UsersIcon className="w-5 h-5" />}
          />
          <Card className="flex items-center p-4">
            <div className="p-3 mr-4 text-brand-secondary bg-brand-primary/10 rounded-full">
              <AttendanceIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary-dark">
                Student Attendance %
              </p>
              <p className="text-2xl font-semibold text-text-primary-dark">
                {studentAttendancePercent}%
              </p>
            </div>
          </Card>
          <Card className="flex items-center p-4">
            <div className="p-3 mr-4 text-brand-secondary bg-brand-primary/10 rounded-full">
              <AttendanceIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary-dark">
                Staff Attendance %
              </p>
              <p className="text-2xl font-semibold text-text-primary-dark">
                {staffAttendancePercent}%
              </p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
              Class-wise Student Attendance
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b">
                  <tr>
                    <th className="p-2">Class</th>
                    <th className="p-2">Attendance</th>
                    <th className="p-2">Absentees</th>
                  </tr>
                </thead>
                <tbody>
                  {classAttendance.map((c) => {
                    const percentage =
                      c.total > 0 ? (c.present / c.total) * 100 : 100;
                    return (
                      <tr key={c.classId} className="border-b">
                        <td className="p-2 font-medium">{c.className}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                              <div
                                className="bg-brand-secondary h-2.5 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          <span className="text-xs text-text-secondary-dark">
                            ({c.present}/{c.total} Present)
                          </span>
                        </td>
                        <td className="p-2 text-xs text-red-600">
                          {c.absentees.length > 0
                            ? c.absentees.map((a) => a.name).join(", ")
                            : "None"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
              Staff Absentees & Not Marked
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {staffAbsentees.length > 0 ? (
                staffAbsentees.map((s) => (
                  <div
                    key={s.teacherId}
                    className="flex justify-between items-center p-2 bg-slate-50 rounded"
                  >
                    <span className="font-medium text-sm">{s.teacherName}</span>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        s.status
                      )}`}
                    >
                      {s.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center p-4 text-text-secondary-dark">
                  All staff are present or on leave.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Attendance
      </h1>
      <div className="flex border-b border-slate-200 mb-6">
        <button
          className={tabButtonClasses(activeTab === "overview")}
          onClick={() => setActiveTab("overview")}
        >
          Today's Overview
        </button>
        <button
          className={tabButtonClasses(activeTab === "calendar")}
          onClick={() => setActiveTab("calendar")}
        >
          Staff Calendar
        </button>
      </div>

      {activeTab === "overview" && renderOverviewTab()}
      {/* FIX: The StaffAttendanceCalendar component no longer accepts a `branchId` prop. */}
      {activeTab === "calendar" && (
        <Card>
          <StaffAttendanceCalendar apiService={apiService} />
        </Card>
      )}
    </div>
  );
};

export default AttendanceOverview;
