// pages/librarian/MyAttendance.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { LibrarianApiService } from "../../services";
import { SharedApiService } from "../../services";
import type {
  TeacherAttendanceRecord,
  TeacherAttendanceStatus,
  LeaveApplication,
} from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";

// const sharedApiService = new SharedApiService();
const apiService = new LibrarianApiService();

const MyAttendance: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user?.branchId) return; // Ensure branchId exists
      setLoading(true);
      const [attendanceData, leaveData] = await Promise.all([
        // FIX: Added the mandatory branchId to the call.
        apiService.getLibrarianAttendance(user.branchId),
        apiService.getMyLeaveApplications(),
      ]);
      setRecords(attendanceData);
      setLeaves(
        leaveData.filter((l: { status: string }) => l.status === "Approved")
      );
      setLoading(false);
    };
    fetchAttendance();
  }, [user]);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, TeacherAttendanceStatus | "OnLeave">();

    // Helper to get a stable YYYY-MM-DD string from a local date
    const getLocalDateString = (date: Date) => {
      return date.toLocaleDateString("en-CA"); // 'en-CA' reliably gives 'YYYY-MM-DD'
    };

    // 1. Process Leaves
    leaves.forEach((leave) => {
      // Create dates from YYYY-MM-DD strings.
      // We add 'T12:00:00Z' to treat them as UTC and avoid timezone bugs.
      let currentDate = new Date(leave.fromDate + "T12:00:00Z");
      const endDate = new Date(leave.toDate + "T12:00:00Z");

      while (currentDate <= endDate) {
        // Use the UTC date string for the key
        map.set(currentDate.toISOString().split("T")[0], "OnLeave");
        currentDate.setUTCDate(currentDate.getUTCDate() + 1); // Increment by one UTC day
      }
    });

    // 2. Process Attendance Records (overwriting leaves)
    records.forEach((rec) => {
      // rec.date is a full ISO string. new Date() will parse it.
      // We convert it to its UTC date string to match the leave keys.
      const dateKey = new Date(rec.date).toISOString().split("T")[0];
      map.set(dateKey, rec.status);
    });

    return map;
  }, [records, leaves]);

  const getDayStatus = useCallback(
    (date: Date): TeacherAttendanceStatus | "OnLeave" | "NoRecord" => {
      // 'date' is a local Date object from the calendar.
      // We must convert it to a UTC YYYY-MM-DD string to match our map.
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

            return (
              <div
                key={index}
                className={`p-2 h-20 border rounded-md ${color}`}
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
    </div>
  );
};

export default MyAttendance;
