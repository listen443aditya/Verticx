import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { TeacherApiService } from "../../services";
import type {
  TeacherAttendanceRecord,
  TeacherAttendanceStatus,
  LeaveApplication,
} from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";

const apiService = new TeacherApiService();

const StatBox: React.FC<{ label: string; value: string | number; color: string; }> = ({
  label,
  value,
  color,
}) => (
  <div className="bg-slate-50 p-4 rounded-lg text-center">
    <div className={`text-3xl font-bold ${color}`}>{value}</div>
    <div className="text-sm font-medium text-text-secondary-dark mt-1">
      {label}
    </div>
  </div>
);

const MyAttendance: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [attendanceData, leaveData] = await Promise.all([
          apiService.getTeacherAttendance(user.id),
          apiService.getLeaveApplicationsForUser(user.id),
        ]);
        setRecords(attendanceData);
        setLeaves(
          leaveData.filter((l: LeaveApplication) => l.status === "Approved")
        );
      } catch (error) {
        console.error("Failed to fetch attendance data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [user, currentDate]);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, TeacherAttendanceStatus | "OnLeave">();

    // 1. Process Leaves (Highest Priority)
    leaves.forEach((leave) => {
      let currentDate = new Date(leave.fromDate + "T12:00:00Z");
      const endDate = new Date(leave.toDate + "T12:00:00Z");

      while (currentDate <= endDate) {
        map.set(currentDate.toISOString().split("T")[0], "OnLeave");
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    });

    // 2. Process Attendance Records
    records.forEach((rec) => {
      const dateKey = new Date(rec.date).toISOString().split("T")[0];
      
      // --- THIS IS THE FIX ---
      // Only set the status if a leave is NOT already on this day.
      // This ensures "OnLeave" has priority over "Absent".
      if (!map.has(dateKey)) {
        map.set(dateKey, rec.status);
      }
      // --- END FIX ---
    });

    return map;
  }, [records, leaves]);

  const attendanceSummary = useMemo(() => {
    const summary = {
      totalPresents: 0,
      totalAbsents: 0,
      totalLeaves: 0,
      totalHalfDays: 0,
      totalMarkedDays: 0,
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    recordsByDate.forEach((status, dateString) => {
      const date = new Date(dateString + "T12:00:00Z");

      if (date.getUTCFullYear() === year && date.getUTCMonth() === month) {
        summary.totalMarkedDays++;

        switch (status) {
          case "Present":
            summary.totalPresents++;
            break;
          case "HalfDay":
            summary.totalHalfDays++;
            break;
          case "Absent":
            summary.totalAbsents++;
            break;
          case "OnLeave":
            summary.totalLeaves++;
            break;
        }
      }
    });

    return summary;
  }, [currentDate, recordsByDate]);

  const getDayStatus = useCallback(
    (date: Date): TeacherAttendanceStatus | "OnLeave" | "NoRecord" => {
      const dateString = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      )
        .toISOString()
        .split("T")[0];

      return recordsByDate.get(dateString) || "NoRecord";
    },
    [recordsByDate]
  );

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    for (let i = 0; i < startOffset; i++) {
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
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  if (loading)
    return (
      <Card>
        <p>Loading your attendance history...</p>
      </Card>
    );

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        My Attendance
      </h1>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Button onClick={() => changeMonth(-1)}>&larr;</Button>
          <h2 className="text-xl font-bold">
            {currentDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h2>
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
                  className="border rounded-md border-slate-100 h-20"
                ></div>
              );

            const status = getDayStatus(day);
            const statusInfo: {
              [key in TeacherAttendanceStatus | "OnLeave" | "NoRecord"]: {
                color: string;
                text: string;
              };
            } = {
              Present: { color: "bg-green-200", text: "Present" },
              Absent: { color: "bg-red-200", text: "Absent" },
              OnLeave: { color: "bg-blue-200", text: "On Leave" },
              HalfDay: { color: "bg-yellow-200", text: "Half Day" },
              NoRecord: { color: "bg-slate-100", text: "" },
            };

            const { color, text } = statusInfo[status];
            const isToday =
              day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`p-2 h-20 border rounded-md ${color} ${
                  isToday ? "ring-2 ring-brand-primary" : "border-slate-100"
                }`}
              >
                <span className="text-sm font-semibold">{day.getDate()}</span>
                <p className="text-xs mt-2">{text}</p>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center flex-wrap gap-4 mt-6 text-sm">
          <span className="flex items-center">
            <div className="w-4 h-4 bg-green-200 mr-2 rounded"></div>Present
          </span>
          <span className="flex items-center">
            <div className="w-4 h-4 bg-yellow-200 mr-2 rounded"></div>Half Day
          </span>
          <span className="flex items-center">
            <div className="w-4 h-4 bg-blue-200 mr-2 rounded"></div>On Leave
          </span>
          <span className="flex items-center">
            <div className="w-4 h-4 bg-red-200 mr-2 rounded"></div>Absent
          </span>
        </div>
      </Card>

      <Card className="mt-6">
        <h3 className="text-xl font-semibold mb-4 text-text-primary-dark">
          Month Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatBox
            label="Total Marked Days"
            value={attendanceSummary.totalMarkedDays}
            color="text-brand-primary"
          />
          <StatBox
            label="Total Present"
            value={attendanceSummary.totalPresents}
            color="text-green-600"
          />
          <StatBox
            label="Total Half Days"
            value={attendanceSummary.totalHalfDays}
            color="text-yellow-600"
          />
          <StatBox
            label="Total Absent"
            value={attendanceSummary.totalAbsents}
            color="text-red-600"
          />
          <StatBox
            label="Total Leave"
            value={attendanceSummary.totalLeaves}
            color="text-blue-600"
          />
        </div>
      </Card>
    </div>
  );
};

export default MyAttendance;