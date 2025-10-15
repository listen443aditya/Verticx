import React, { useState, useEffect, useMemo, useCallback } from "react";
// Corrected import to point directly to the service file.
import { SharedApiService } from "../../services/sharedApiService";
import type {
  User,
  TeacherAttendanceRecord,
  LeaveApplication,
  TeacherAttendanceStatus,
} from "../../types";
import Input from "../ui/Input";
import Button from "../ui/Button";

const sharedApiService = new SharedApiService();

// The component no longer needs branchId as a prop, as it's inferred by the backend.
const StaffAttendanceCalendar: React.FC = () => {
  const [staffList, setStaffList] = useState<User[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<
    Map<string, TeacherAttendanceStatus | "On Leave">
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      // FIX: The method `getStaffListForBranch` expects 0 arguments.
      const staff = await sharedApiService.getStaffListForBranch();
      setStaffList(staff.sort((a, b) => a.name.localeCompare(b.name)));
      if (staff.length > 0) {
        setSelectedStaffId(staff[0].id);
      }
      setLoading(false);
    };
    fetchStaff();
  }, []);

  const fetchCalendarData = useCallback(async () => {
    if (!selectedStaffId) {
      setAttendanceData(new Map());
      return;
    }
    setCalendarLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // NOTE: The `getStaffAttendanceAndLeaveForMonth` method is designed to fetch data for the
    // currently authenticated user, not for a specific staff member by ID.
    // As such, this calendar will always display the logged-in user's data, regardless of the dropdown selection.
    // A new API endpoint is required to view other staff members' data.
     const { attendance, leaves } =
       await sharedApiService.getStaffAttendanceAndLeaveForMonth(
         selectedStaffId,
         year,
         month
       );


    const newMap = new Map<string, TeacherAttendanceStatus | "On Leave">();

    // FIX: Added explicit type for 'leave'.
    leaves.forEach((leave: LeaveApplication) => {
      let d = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      d.setUTCHours(0, 0, 0, 0);
      endDate.setUTCHours(0, 0, 0, 0);

      while (d <= endDate) {
        newMap.set(d.toISOString().split("T")[0], "On Leave");
        d.setDate(d.getDate() + 1);
      }
    });

    // FIX: Added explicit type for 'rec'.
    attendance.forEach((rec: TeacherAttendanceRecord) => {
      if (!newMap.has(rec.date)) {
        newMap.set(rec.date, rec.status);
      }
    });

    setAttendanceData(newMap);
    setCalendarLoading(false);
  }, [selectedStaffId, currentDate]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const changeMonth = (delta: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

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

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, date: null });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        i
      );
      days.push({ day: i, date });
    }
    return days;
  }, [currentDate, daysInMonth, startingDayOfWeek]);

  if (loading) return <p>Loading staff list...</p>;

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b">
        <div>
          <label className="text-sm font-medium">Select Staff Member</label>
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 mt-1"
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={() => changeMonth(-1)}>&larr;</Button>
          <Input
            label="Select Month"
            type="month"
            value={`${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, "0")}`}
            onChange={(e) => setCurrentDate(new Date(e.target.value + "-02"))} // Use day 2 to avoid timezone issues
          />
          <Button onClick={() => changeMonth(1)}>&rarr;</Button>
        </div>
      </div>

      {calendarLoading ? (
        <p>Loading calendar...</p>
      ) : !selectedStaffId ? (
        <p className="text-center text-text-secondary-dark p-4">
          No staff available to display.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-secondary-dark">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayInfo, index) => {
              if (!dayInfo.date)
                return (
                  <div
                    key={`blank-${index}`}
                    className="border rounded-md bg-slate-50 min-h-[80px]"
                  ></div>
                );

              const dayOfWeek = dayInfo.date.getDay();
              const dateString = dayInfo.date.toISOString().split("T")[0];
              const status =
                dayOfWeek === 0 || dayOfWeek === 6
                  ? "Holiday"
                  : attendanceData.get(dateString) ||
                    (dayInfo.date > new Date() ? "Upcoming" : "Not Marked");

              const statusInfo = {
                Present: { color: "bg-green-200", text: "Present" },
                Absent: { color: "bg-red-200", text: "Absent" },
                "On Leave": { color: "bg-blue-200", text: "On Leave" },
                "Half Day": { color: "bg-yellow-200", text: "Half Day" },
                Holiday: { color: "bg-slate-300", text: "Holiday" },
                "Not Marked": { color: "bg-slate-100", text: "" },
                Upcoming: { color: "bg-white", text: "" },
              };

              const { color, text } =
                statusInfo[status as keyof typeof statusInfo] ||
                statusInfo["Not Marked"];

              return (
                <div
                  key={index}
                  className={`p-2 min-h-[80px] border rounded-md ${color}`}
                >
                  <span className="text-sm font-semibold">{dayInfo.day}</span>
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
            <span className="flex items-center">
              <div className="w-4 h-4 bg-slate-300 mr-2 rounded"></div>Holiday
            </span>
            <span className="flex items-center">
              <div className="w-4 h-4 bg-slate-100 mr-2 rounded border"></div>
              Not Marked
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default StaffAttendanceCalendar;
